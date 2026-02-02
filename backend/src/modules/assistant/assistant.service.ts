import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import {
  AssistantContextPayload,
  AssistantMessagePayload,
  AssistantMissionStatus,
  AssistantSessionPayload,
} from '../../types/dto';
import { badRequest, notFound } from '../../utils/apiError';
import { assistantMissionStatuses } from './assistant.schema';

const MAX_HISTORY_ITEMS = 30;

export type AssistantMessageDTO = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  context?: Prisma.JsonValue | null;
};

export type AssistantMissionDTO = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: AssistantMissionStatus;
  blockingReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export type WorkspaceStats = {
  battlesTotal: number;
  battlesLast7: number;
  combosActive: number;
  decksTotal: number;
  decksNeedingUpgrade: number;
  partsCatalog: number;
  lastBattleAt?: Date | null;
};

type MissionTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  eligibility: (stats: WorkspaceStats, context?: AssistantContextPayload | null) => boolean;
};

const DAYS = 24 * 60 * 60 * 1000;

const missionTemplates: MissionTemplate[] = [
  {
    id: 'series-upgrade',
    title: 'Configurar série até 7 turnos',
    description: 'Use o seletor do console multiplos para liberar até 7 turnos e garantir que alguém alcance 4 pontos.',
    category: 'battles',
    eligibility: (stats, context) => {
      const currentLength = Number((context?.summary as Record<string, unknown>)?.seriesLength ?? 3);
      return stats.decksNeedingUpgrade > 0 || currentLength < 7;
    },
  },
  {
    id: 'parts-analytics',
    title: 'Rodar relatório Inteligência de Peças',
    description:
      'Abra a nova aba "Inteligência de desempenho" no dashboard para comparar winrate, arenas e sinergias por peça.',
    category: 'analytics',
    eligibility: (stats) => stats.battlesTotal >= 15,
  },
  {
    id: 'mode-dashboard',
    title: 'Salvar um preset personalizado',
    description: 'Na área Mode Dashboard, ajuste filtros e salve um preset para compartilhar com a equipe.',
    category: 'dashboard',
    eligibility: (_stats, context) => {
      const summary = (context?.summary ?? {}) as Record<string, unknown>;
      const hasCustom = Boolean(summary?.customPresets);
      return !hasCustom;
    },
  },
];

function missionStatusIsValid(status: string): status is AssistantMissionStatus {
  return (assistantMissionStatuses as ReadonlyArray<string>).includes(status);
}

function summarizeRoute(context?: AssistantContextPayload | null) {
  if (!context?.route) return null;
  if (context.route.includes('battle')) return 'composer';
  if (context.route.includes('deck')) return 'decks';
  if (context.route.includes('analysis')) return 'analysis';
  if (context.route === '/' || context.route.includes('dashboard')) return 'dashboard';
  return context.route;
}

async function fetchWorkspaceStats(): Promise<WorkspaceStats> {
  const since7d = new Date(Date.now() - 7 * DAYS);
  const [battlesTotal, battlesLast7, combosActive, decksTotal, decksNeedingUpgrade, partsCatalog, lastBattle] =
    await prisma.$transaction([
      prisma.battle.count(),
      prisma.battle.count({ where: { occurredAt: { gte: since7d } } }),
      prisma.combo.count({ where: { status: 'ACTIVE' } }),
      prisma.deck.count(),
      prisma.deck.count({ where: { maxTurns: { lt: 7 } } }),
      prisma.part.count({ where: { archived: false } }),
      prisma.battle.findFirst({ orderBy: { occurredAt: 'desc' }, select: { occurredAt: true } }),
    ]);

  return {
    battlesTotal,
    battlesLast7,
    combosActive,
    decksTotal,
    decksNeedingUpgrade,
    partsCatalog,
    lastBattleAt: lastBattle?.occurredAt ?? null,
  };
}

async function ensureSession(payload: AssistantSessionPayload) {
  if (payload.sessionId) {
    const session = await prisma.assistantSession.findUnique({ where: { id: payload.sessionId } });
    if (!session) {
      throw notFound('Sessão da assistente não encontrada. Abra uma nova conversa.');
    }
    if (payload.context) {
      await prisma.assistantSession.update({
        where: { id: session.id },
        data: {
          context: payload.context as Prisma.InputJsonValue,
          lastRoute: summarizeRoute(payload.context) ?? session.lastRoute,
        },
      });
    }
    return session;
  }

  const session = await prisma.assistantSession.create({
    data: {
      label: 'workspace-default',
      context: payload.context as Prisma.InputJsonValue,
      lastRoute: summarizeRoute(payload.context),
    },
  });
  return session;
}

function mapMessage(entry: AssistantMessageDTO) {
  return {
    id: entry.id,
    role: entry.role,
    content: entry.content,
    createdAt: entry.createdAt,
    context: entry.context ?? null,
  };
}

async function listMessages(sessionId: string) {
  const messages = await prisma.assistantMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: MAX_HISTORY_ITEMS,
  });
  return messages.map(mapMessage);
}

async function recordMessage(
  sessionId: string,
  role: 'USER' | 'ASSISTANT',
  content: string,
  context?: AssistantContextPayload,
) {
  const entry = await prisma.assistantMessage.create({
    data: {
      sessionId,
      role,
      content,
      context: context as Prisma.InputJsonValue,
    },
  });
  return mapMessage(entry);
}

async function syncMissions(sessionId: string, stats: WorkspaceStats, context?: AssistantContextPayload | null) {
  const existing = await prisma.assistantMission.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  const existingByCategory = new Map(existing.map((mission) => [mission.category ?? mission.id, mission]));
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  missionTemplates.forEach((template) => {
    const key = template.id;
    const match = existingByCategory.get(key);
    const eligible = template.eligibility(stats, context);
    if (eligible && !match) {
      ops.push(
        prisma.assistantMission.create({
          data: {
            sessionId,
            category: key,
            title: template.title,
            description: template.description,
            status: 'ACTIVE',
          },
        }),
      );
    }
    if (eligible && match && match.status === 'PENDING') {
      ops.push(
        prisma.assistantMission.update({
          where: { id: match.id },
          data: { status: 'ACTIVE' },
        }),
      );
    }
    if (!eligible && match && match.status !== 'COMPLETED') {
      ops.push(
        prisma.assistantMission.update({
          where: { id: match.id },
          data: { status: 'COMPLETED', completedAt: new Date(), blockingReason: null },
        }),
      );
    }
  });

  if (ops.length) {
    await prisma.$transaction(ops);
  }

  const missions = await prisma.assistantMission.findMany({
    where: { sessionId },
    orderBy: { updatedAt: 'desc' },
  });
  return missions as AssistantMissionDTO[];
}

function detectIntent(message: string) {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return 'HELLO';
  if (normalized.includes('nao tenho') || normalized.includes('não tenho') || normalized.includes('sem a peça')) {
    return 'BLOCKED';
  }
  if (normalized.includes('aguardar') || normalized.includes('esperar torneio')) {
    return 'BLOCKED';
  }
  if (normalized.includes('missao conclu') || normalized.includes('missão conclu')) {
    return 'COMPLETE';
  }
  if (normalized.includes('relatorio') || normalized.includes('relatório') || normalized.includes('dashboard')) {
    return 'REPORT';
  }
  if (normalized.includes('cadastro') || normalized.includes('registrar') || normalized.includes('cadastrar')) {
    return 'REGISTER';
  }
  if (normalized.includes('ajuda') || normalized.includes('como usar')) {
    return 'HELP';
  }
  return 'SMALLTALK';
}

async function blockMissionDueToUser(sessionId: string, reason: string) {
  const target = await prisma.assistantMission.findFirst({
    where: { sessionId, status: { in: ['PENDING', 'ACTIVE'] } },
    orderBy: { updatedAt: 'asc' },
  });
  if (!target) return null;
  return prisma.assistantMission.update({
    where: { id: target.id },
    data: { status: 'BLOCKED', blockingReason: reason.slice(0, 200) },
  });
}

async function markMissionCompleted(sessionId: string) {
  const target = await prisma.assistantMission.findFirst({
    where: { sessionId, status: { in: ['ACTIVE', 'BLOCKED'] } },
    orderBy: { updatedAt: 'desc' },
  });
  if (!target) return null;
  return prisma.assistantMission.update({
    where: { id: target.id },
    data: { status: 'COMPLETED', completedAt: new Date(), blockingReason: null },
  });
}

function formatDate(date?: Date | null) {
  if (!date) return 'nunca';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function buildAssistantReply(
  message: string,
  stats: WorkspaceStats,
  missions: AssistantMissionDTO[],
  context?: AssistantContextPayload | null,
) {
  const normalized = message.trim().toLowerCase();
  const lines: string[] = [];
  const activeMission = missions.find((mission) => mission.status === 'ACTIVE');
  const recentStats = `Você está com ${stats.battlesTotal} batalhas registradas (${stats.battlesLast7} na última semana) e ${stats.decksTotal} decks ativos.`;

  if (!normalized) {
    lines.push(
      'Oi! Eu assumo a central de bordo: ajudo com cadastros, missões, presets e até com o novo console de série 7 turnos. É só me dizer o que está fazendo agora.',
    );
  } else if (normalized.includes('relatorio') || normalized.includes('relatório')) {
    lines.push(
      'Lembra que o dashboard agora tem dois blocos extras: o painel de presets (Mode Dashboard) e a Inteligência de desempenho das peças. Dá para alternar modos oficiais, salvar seu preset e exportar um snapshot.',
    );
  } else if (normalized.includes('cadastro') || normalized.includes('registrar')) {
    lines.push(
      'Pra registrar batalhas com série longa, use o seletor de turnos até 7 e acompanha quem chega a 4 pontos. O deck novo também aceita esses slots extras — se faltar peça eu marco a missão como pendente.',
    );
  } else if (normalized.includes('obrigado') || normalized.includes('valeu')) {
    lines.push('Tamo junto! Se quiser eu já te passo a próxima missão ou resumo algum relatório.');
  } else {
    lines.push('Anotei! Já considero isso nos próximos alertas e missões.');
  }

  if (context?.route?.includes('battle')) {
    lines.push(
      'No Composer você encontra o seletor "Série" logo acima do console 3on3. Ajuste para 7 para desbloquear o placar automático de 4 pontos e gerar decks completos.',
    );
  }
  if (context?.route?.includes('deck')) {
    lines.push(
      'Na aba de Decks agora dá pra definir até 7 slots: basta mover o controle de turnos e preencher os combos extras para cada posição.',
    );
  }
  if (context?.route === '/' || context?.route?.includes('dashboard')) {
    lines.push(
      'Visite o bloco "Mode Dashboard" para alternar entre Oficial 3on3, Torneio regional e Treino longo, comparar dois modos lado a lado e baixar um resumo em PDF/print.',
    );
  }

  if (activeMission) {
    lines.push(`Missão em foco: ${activeMission.title} — ${activeMission.description}`);
  }

  if (stats.lastBattleAt) {
    lines.push(`${recentStats} Último registro aconteceu em ${formatDate(stats.lastBattleAt)}.`);
  } else {
    lines.push(`${recentStats} Ainda não encontrei batalhas recentes, bora registrar as primeiras.`);
  }

  return lines.join('\n\n');
}

export async function bootstrapAssistant(payload: AssistantSessionPayload) {
  const session = await ensureSession(payload);
  const stats = await fetchWorkspaceStats();
  const missions = await syncMissions(session.id, stats, payload.context);
  const history = await listMessages(session.id);

  if (history.length === 0) {
    const intro = buildAssistantReply('', stats, missions, payload.context);
    await recordMessage(session.id, 'ASSISTANT', intro, payload.context);
    const freshHistory = await listMessages(session.id);
    return { sessionId: session.id, message: intro, missions, history: freshHistory };
  }

  return { sessionId: session.id, message: null, missions, history };
}

export async function processAssistantMessage(payload: AssistantMessagePayload) {
  const session = await ensureSession(payload);
  const intent = detectIntent(payload.message);
  if (intent === 'BLOCKED') {
    await blockMissionDueToUser(session.id, payload.message);
  }
  if (intent === 'COMPLETE') {
    await markMissionCompleted(session.id);
  }
  await recordMessage(session.id, 'USER', payload.message, payload.context);
  const stats = await fetchWorkspaceStats();
  const missions = await syncMissions(session.id, stats, payload.context);
  const reply = buildAssistantReply(payload.message, stats, missions, payload.context);
  const assistantEntry = await recordMessage(session.id, 'ASSISTANT', reply, payload.context);
  const history = await listMessages(session.id);
  return { sessionId: session.id, reply: assistantEntry.content, missions, history };
}

export async function updateAssistantContext(payload: AssistantSessionPayload) {
  const session = await ensureSession(payload);
  const stats = await fetchWorkspaceStats();
  const missions = await syncMissions(session.id, stats, payload.context);
  return { sessionId: session.id, missions };
}

export async function listAssistantMissions(sessionId: string) {
  const session = await prisma.assistantSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw notFound('Sessão não encontrada.');
  }
  const missions = await prisma.assistantMission.findMany({ where: { sessionId }, orderBy: { updatedAt: 'desc' } });
  return missions as AssistantMissionDTO[];
}

export async function updateAssistantMission(
  sessionId: string,
  missionId: string,
  status: AssistantMissionStatus,
  note?: string,
) {
  if (!missionStatusIsValid(status)) {
    throw badRequest('Status de missão inválido.');
  }
  const mission = await prisma.assistantMission.findUnique({ where: { id: missionId } });
  if (!mission || mission.sessionId !== sessionId) {
    throw notFound('Missão não encontrada para esta sessão.');
  }

  const update: Prisma.AssistantMissionUpdateInput = {
    status,
    blockingReason: status === 'BLOCKED' ? note ?? mission.blockingReason : null,
    completedAt: status === 'COMPLETED' ? new Date() : mission.completedAt,
  };
  const updated = await prisma.assistantMission.update({ where: { id: mission.id }, data: update });
  return updated as AssistantMissionDTO;
}
