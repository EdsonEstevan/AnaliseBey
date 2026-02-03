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

export type ComboLeader = {
  id: string;
  name: string;
  archetype: string | null;
  winRate: number;
  battles: number;
  lastBattleAt: Date | null;
  bladeName?: string | null;
};

export type BladeLeader = {
  id: string;
  name: string;
  archetype: string | null;
  winRate: number;
  battles: number;
};

export type WorkspaceStats = {
  battlesTotal: number;
  battlesLast7: number;
  combosActive: number;
  decksTotal: number;
  decksNeedingUpgrade: number;
  partsCatalog: number;
  lastBattleAt?: Date | null;
  comboLeaders: ComboLeader[];
  bladeLeaders: BladeLeader[];
};

type MissionTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  eligibility: (stats: WorkspaceStats, context?: AssistantContextPayload | null) => boolean;
};

type AssistantIntent =
  | 'HELLO'
  | 'BLOCKED'
  | 'COMPLETE'
  | 'REPORT'
  | 'REGISTER'
  | 'HELP'
  | 'SMALLTALK'
  | 'COMBO_ADVICE'
  | 'BEST_PERFORMER';

const DAYS = 24 * 60 * 60 * 1000;

type ComboMeta = {
  id: string;
  name: string;
  archetype: string | null;
  blade?: { id: string; name: string; archetype: string | null } | null;
};

type BattleSnapshot = {
  comboAId: string;
  comboBId: string;
  result: string;
  occurredAt: Date | null;
};

type ComboAccumulator = {
  id: string;
  wins: number;
  losses: number;
  draws: number;
  battles: number;
  lastBattleAt: Date | null;
};

type BladeAccumulator = {
  id: string;
  name: string;
  archetype: string | null;
  wins: number;
  losses: number;
  draws: number;
  battles: number;
};

function ensureComboAccumulator(map: Map<string, ComboAccumulator>, comboId: string): ComboAccumulator {
  const existing = map.get(comboId);
  if (existing) return existing;
  const created: ComboAccumulator = {
    id: comboId,
    wins: 0,
    losses: 0,
    draws: 0,
    battles: 0,
    lastBattleAt: null,
  };
  map.set(comboId, created);
  return created;
}

function ensureBladeAccumulator(
  map: Map<string, BladeAccumulator>,
  blade: NonNullable<ComboMeta['blade']>,
): BladeAccumulator {
  const existing = map.get(blade.id);
  if (existing) return existing;
  const created: BladeAccumulator = {
    id: blade.id,
    name: blade.name,
    archetype: blade.archetype ?? null,
    wins: 0,
    losses: 0,
    draws: 0,
    battles: 0,
  };
  map.set(blade.id, created);
  return created;
}

function mostRecentDate(a: Date | null, b?: Date | null): Date | null {
  if (!b) return a;
  if (!a) return b;
  return a > b ? a : b;
}

function summarizeComboLeaders(comboStats: Map<string, ComboAccumulator>, comboMap: Map<string, ComboMeta>) {
  const leaders: ComboLeader[] = [];
  comboStats.forEach((entry) => {
    const meta = comboMap.get(entry.id);
    if (!meta) return;
    if (entry.battles === 0) return;
    const decisive = entry.wins + entry.losses;
    const winRate = decisive ? entry.wins / decisive : 0;
    leaders.push({
      id: entry.id,
      name: meta.name,
      archetype: meta.archetype ?? null,
      winRate,
      battles: entry.battles,
      lastBattleAt: entry.lastBattleAt,
      bladeName: meta.blade?.name ?? null,
    });
  });

  return leaders
    .filter((leader) => leader.battles >= 2)
    .sort((a, b) => {
      if (b.winRate === a.winRate) return b.battles - a.battles;
      return b.winRate - a.winRate;
    })
    .slice(0, 3);
}

function summarizeBladeLeaders(
  comboStats: Map<string, ComboAccumulator>,
  comboMap: Map<string, ComboMeta>,
): BladeLeader[] {
  const bladeStats = new Map<string, BladeAccumulator>();

  comboStats.forEach((entry, comboId) => {
    const meta = comboMap.get(comboId);
    if (!meta?.blade) return;
    const current = ensureBladeAccumulator(bladeStats, meta.blade);
    current.wins += entry.wins;
    current.losses += entry.losses;
    current.draws += entry.draws;
    current.battles += entry.battles;
  });

  return [...bladeStats.values()]
    .filter((blade) => blade.battles >= 3)
    .map((blade) => {
      const decisive = blade.wins + blade.losses;
      return {
        id: blade.id,
        name: blade.name,
        archetype: blade.archetype ?? null,
        winRate: decisive ? blade.wins / decisive : 0,
        battles: blade.battles,
      } satisfies BladeLeader;
    })
    .sort((a, b) => {
      if (b.winRate === a.winRate) return b.battles - a.battles;
      return b.winRate - a.winRate;
    })
    .slice(0, 3);
}

function derivePerformanceHighlights(comboMeta: ComboMeta[], battleHistory: BattleSnapshot[]) {
  const comboMap = new Map(comboMeta.map((combo) => [combo.id, combo]));
  const comboStats = new Map<string, ComboAccumulator>();

  battleHistory.forEach((battle) => {
    if (!battle.comboAId || !battle.comboBId) return;
    const comboA = ensureComboAccumulator(comboStats, battle.comboAId);
    const comboB = ensureComboAccumulator(comboStats, battle.comboBId);
    comboA.battles += 1;
    comboB.battles += 1;
    comboA.lastBattleAt = mostRecentDate(comboA.lastBattleAt, battle.occurredAt ?? null);
    comboB.lastBattleAt = mostRecentDate(comboB.lastBattleAt, battle.occurredAt ?? null);

    switch (battle.result) {
      case 'COMBO_A':
        comboA.wins += 1;
        comboB.losses += 1;
        break;
      case 'COMBO_B':
        comboB.wins += 1;
        comboA.losses += 1;
        break;
      default:
        comboA.draws += 1;
        comboB.draws += 1;
        break;
    }
  });

  return {
    comboLeaders: summarizeComboLeaders(comboStats, comboMap),
    bladeLeaders: summarizeBladeLeaders(comboStats, comboMap),
  };
}

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

  const [comboMeta, battleHistory] = await Promise.all([
    prisma.combo.findMany({
      select: {
        id: true,
        name: true,
        archetype: true,
        blade: { select: { id: true, name: true, archetype: true } },
      },
    }),
    prisma.battle.findMany({
      select: {
        comboAId: true,
        comboBId: true,
        result: true,
        occurredAt: true,
      },
    }),
  ]);

  const highlights = derivePerformanceHighlights(comboMeta, battleHistory);

  return {
    battlesTotal,
    battlesLast7,
    combosActive,
    decksTotal,
    decksNeedingUpgrade,
    partsCatalog,
    lastBattleAt: lastBattle?.occurredAt ?? null,
    comboLeaders: highlights.comboLeaders,
    bladeLeaders: highlights.bladeLeaders,
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

function normalizeMessage(message: string) {
  return message
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/[\u007f-\u009f]/g, ' ')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function detectIntent(message: string): AssistantIntent {
  const normalized = normalizeMessage(message);
  if (!normalized) return 'HELLO';

  const mentionsCombo = /combo|deck|bey/.test(normalized);
  const asksForRecommendation = /qual|testar|usar|montar|suger|recom/.test(normalized);

  if (mentionsCombo && normalized.includes('melhor')) {
    return 'BEST_PERFORMER';
  }
  if (mentionsCombo && asksForRecommendation) {
    return 'COMBO_ADVICE';
  }

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

function formatWinPercent(value: number) {
  const percent = Math.round(value * 100);
  return `${percent}%`;
}

function buildComboAdvice(stats: WorkspaceStats) {
  if (!stats.comboLeaders.length) {
    return 'Ainda não consigo apontar favoritos: registre mais batalhas ou marque as séries recentes para eu saber quais combos estão performando melhor.';
  }
  const summary = stats.comboLeaders
    .map((leader, index) => {
      const archetypeTag = leader.archetype ? ` · ${leader.archetype}` : '';
      const bladeLabel = leader.bladeName ? ` com ${leader.bladeName}` : '';
      return `${index + 1}. ${leader.name}${archetypeTag}${bladeLabel} — ${formatWinPercent(leader.winRate)} em ${leader.battles} batalhas`;
    })
    .join('\n');
  return `Top combos agora:\n${summary}\nAbra Combos → Detalhes para revisar turnos, arenas e montar uma variação.`;
}

function describeBestBeys(stats: WorkspaceStats) {
  if (!stats.bladeLeaders.length) {
    return 'Ainda preciso de pelo menos três batalhas por blade para apontar quem domina o laboratório.';
  }
  const summary = stats.bladeLeaders
    .map((blade, index) => {
      const archetypeTag = blade.archetype ? ` · ${blade.archetype}` : '';
      return `${index + 1}. ${blade.name}${archetypeTag} — ${formatWinPercent(blade.winRate)} em ${blade.battles} batalhas`;
    })
    .join('\n');
  return `Os blades que mais venceram até agora:\n${summary}`;
}

function collectRouteHints(context?: AssistantContextPayload | null) {
  const hints: string[] = [];
  if (!context?.route) return hints;
  if (context.route.includes('battle')) {
    hints.push(
      'No Composer use o seletor “Série” acima do console para alternar entre 3 e 7 turnos e deixar o placar automático cuidar dos 4 pontos.',
    );
  }
  if (context.route.includes('deck')) {
    hints.push('Em Decks, mova o controle “Turnos na série” para desbloquear até 7 slots e armazenar novas sequências.');
  }
  if (context.route === '/' || context.route.includes('dashboard')) {
    hints.push(
      'No dashboard, abra o bloco “Mode Dashboard” para comparar Oficial 3on3, Torneio Regional e Treino Longo e salvar um preset próprio.',
    );
  }
  return hints;
}

function buildAssistantReply(
  message: string,
  intent: AssistantIntent,
  stats: WorkspaceStats,
  missions: AssistantMissionDTO[],
  context?: AssistantContextPayload | null,
) {
  const normalized = normalizeMessage(message);
  const gratitude = normalized.includes('obrigado') || normalized.includes('valeu');
  const lines: string[] = [];
  const activeMission = missions.find((mission) => mission.status === 'ACTIVE');
  const usageSummary = `Você está com ${stats.battlesTotal} batalhas registradas (${stats.battlesLast7} na última semana) e ${stats.decksTotal} decks ativos.`;
  const lastBattleLine = stats.lastBattleAt
    ? `${usageSummary} Último registro: ${formatDate(stats.lastBattleAt)}.`
    : `${usageSummary} Ainda falta registrar a próxima batalha para eu ter base fresca.`;

  switch (intent) {
    case 'HELLO':
      lines.push(
        'Oi! Eu assumo a central de bordo do laboratório: acompanho missões, decks 7 turnos e relatórios. Me conta o que está montando que eu já preparo a próxima ação.',
      );
      lines.push(buildComboAdvice(stats));
      break;
    case 'COMBO_ADVICE':
      lines.push(buildComboAdvice(stats));
      break;
    case 'BEST_PERFORMER':
      lines.push(describeBestBeys(stats));
      if (stats.comboLeaders.length) {
        lines.push(
          `No painel de Combos, abra o líder ${stats.comboLeaders[0].name} para ver turnos e vitórias por arena antes de testar uma variação.`,
        );
      }
      break;
    case 'REPORT':
      lines.push(
        'Abra o dashboard → Inteligência de desempenho para comparar winrate, arenas e parceiros de cada peça. O bloco Mode Dashboard continua guardando presets lado a lado.',
      );
      break;
    case 'REGISTER':
      lines.push(
        'Para cadastros longos: escolha o deck, ajuste “Turnos na série” até 7 e use o placar automático. Eu marco missão como concluída quando a série de 4 pontos estiver rodando.',
      );
      break;
    case 'HELP':
      lines.push('Posso sugerir combos, revisar missões ou apontar onde encontrar relatórios. É só dizer o foco.');
      break;
    default:
      if (gratitude) {
        lines.push('Tamo junto! Posso mostrar outra missão, sugerir combos ou abrir um relatório, é só pedir.');
      } else {
        lines.push('Anotei! Já registrei o pedido e ajusto os próximos alertas com isso.');
        if (stats.comboLeaders.length) {
          const leader = stats.comboLeaders[0];
          lines.push(
            `Enquanto isso ${leader.name} segura ${formatWinPercent(leader.winRate)} em ${leader.battles} batalhas — vale conferir na aba Combos.`,
          );
        }
      }
      break;
  }

  collectRouteHints(context).forEach((hint) => lines.push(hint));

  if (activeMission) {
    lines.push(`Missão em foco: ${activeMission.title} — ${activeMission.description}`);
  }

  lines.push(lastBattleLine);

  return lines.join('\n\n');
}

export async function bootstrapAssistant(payload: AssistantSessionPayload) {
  const session = await ensureSession(payload);
  const stats = await fetchWorkspaceStats();
  const missions = await syncMissions(session.id, stats, payload.context);
  const history = await listMessages(session.id);

  if (history.length === 0) {
    const intro = buildAssistantReply('', 'HELLO', stats, missions, payload.context);
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
  const reply = buildAssistantReply(payload.message, intent, stats, missions, payload.context);
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
