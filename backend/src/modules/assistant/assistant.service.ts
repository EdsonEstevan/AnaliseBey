import { AssistantMission, Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import {
  AssistantContextPayload,
  AssistantMessagePayload,
  AssistantMissionStatus,
  AssistantSessionPayload,
} from '../../types/dto';
import { badRequest, notFound } from '../../utils/apiError';
import { assistantMissionStatuses } from './assistant.schema';
import { lookupPartInsight, PartInsight } from './partInsights';

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
  guide?: AssistantMissionGuide | null;
};

export type AssistantMissionGuide = {
  ctaLabel: string;
  route: string;
  surface?: string | null;
  anchor?: string | null;
  steps: string[];
};

export type ComboLeader = {
  id: string;
  name: string;
  archetype: string | null;
  winRate: number;
  battles: number;
  lastBattleAt: Date | null;
  bladeName?: string | null;
  bitName?: string | null;
  bitType?: string | null;
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
  comboTestQueue: ComboTestTarget[];
  comboCatalog: ComboCatalogEntry[];
};

export type ComboCatalogEntry = {
  id: string;
  name: string;
  archetype: string | null;
  bladeName?: string | null;
  bitName?: string | null;
  bitType?: string | null;
  lastBattleAt: Date | null;
};

export type ComboTestTarget = {
  id: string;
  name: string;
  archetype: string | null;
  bladeName?: string | null;
  battles: number;
  lastBattleAt: Date | null;
  reason: 'NO_BATTLES' | 'STALE' | 'LOW_SAMPLE';
};

type MissionContextPayload = {
  guide?: AssistantMissionGuide;
  targetCombo?: ComboTestTarget;
};

type MissionTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  eligibility: (stats: WorkspaceStats, context?: AssistantContextPayload | null) => boolean;
  guide?: AssistantMissionGuide;
  repeatable?: boolean;
  dynamicPayload?: (stats: WorkspaceStats, context?: AssistantContextPayload | null) => MissionDetails | null;
};

type MissionDetails = {
  title?: string;
  description?: string;
  guide?: AssistantMissionGuide | null;
  context?: MissionContextPayload | null;
};

type MissionResolvedDetails = {
  title: string;
  description: string;
  guide?: AssistantMissionGuide | null;
  context?: MissionContextPayload | null;
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
const COMBO_TEST_MIN_BATTLES = 3;
const COMBO_TEST_STALE_DAYS = 21;

type ComboMeta = {
  id: string;
  name: string;
  archetype: string | null;
  blade?: { id: string; name: string; archetype: string | null } | null;
  bit?: { id: string; name: string; type: string | null } | null;
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

type ComboActivity = {
  id: string;
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
      bitName: meta.bit?.name ?? null,
      bitType: meta.bit?.type ?? null,
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
    comboActivity: [...comboStats.values()].map((entry) => ({
      id: entry.id,
      battles: entry.battles,
      lastBattleAt: entry.lastBattleAt,
    } satisfies ComboActivity)),
  };
}

function buildComboTestQueue(comboMeta: ComboMeta[], activity: ComboActivity[]): ComboTestTarget[] {
  const staleCutoff = new Date(Date.now() - COMBO_TEST_STALE_DAYS * DAYS);
  const activityMap = new Map(activity.map((entry) => [entry.id, entry]));
  const targets: ComboTestTarget[] = [];

  comboMeta.forEach((combo) => {
    const snapshot = activityMap.get(combo.id);
    const battles = snapshot?.battles ?? 0;
    const lastBattleAt = snapshot?.lastBattleAt ?? null;

    let reason: ComboTestTarget['reason'] | null = null;
    if (battles === 0) {
      reason = 'NO_BATTLES';
    } else if (!lastBattleAt || lastBattleAt < staleCutoff) {
      reason = 'STALE';
    } else if (battles < COMBO_TEST_MIN_BATTLES) {
      reason = 'LOW_SAMPLE';
    }

    if (!reason) return;

    targets.push({
      id: combo.id,
      name: combo.name,
      archetype: combo.archetype ?? null,
      bladeName: combo.blade?.name ?? null,
      battles,
      lastBattleAt,
      reason,
    });
  });

  const priority: Record<ComboTestTarget['reason'], number> = {
    NO_BATTLES: 0,
    STALE: 1,
    LOW_SAMPLE: 2,
  };

  return targets
    .sort((a, b) => {
      if (priority[a.reason] !== priority[b.reason]) {
        return priority[a.reason] - priority[b.reason];
      }
      if (a.battles !== b.battles) {
        return a.battles - b.battles;
      }
      const aTime = a.lastBattleAt ? a.lastBattleAt.getTime() : 0;
      const bTime = b.lastBattleAt ? b.lastBattleAt.getTime() : 0;
      return aTime - bTime;
    })
    .slice(0, 3);
}

function describeComboTestReason(target: ComboTestTarget) {
  switch (target.reason) {
    case 'NO_BATTLES':
      return 'Ainda não possui batalhas registradas';
    case 'STALE':
      return 'Está mais de 3 semanas sem registro';
    default:
      return 'Tem poucas batalhas registradas';
  }
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
    guide: {
      ctaLabel: 'Ir concluir',
      route: '/battles/new',
      surface: 'Composer de batalhas',
      steps: [
        'Abra Batalhas → Nova série para montar o confronto.',
        'Use o seletor “Série” do console lateral e aumente para 7 turnos e meta de 4 pontos.',
        'Registre o placar automático turno a turno e salve quando a série fechar.',
      ],
    },
  },
  {
    id: 'parts-analytics',
    title: 'Rodar relatório Inteligência de Peças',
    description:
      'Abra a nova aba "Inteligência de desempenho" no dashboard para comparar winrate, arenas e sinergias por peça.',
    category: 'analytics',
    eligibility: (stats) => stats.battlesTotal >= 15,
    guide: {
      ctaLabel: 'Abrir inteligência',
      route: '/analysis',
      surface: 'Inteligência de desempenho',
      steps: [
        'Entre no Dashboard e abra o bloco “Inteligência de desempenho”.',
        'Selecione a aba “Inteligência de peças” para comparar winrate, arenas e parceiros.',
        'Aplique filtros, exporte ou compartilhe o insight com o time.',
      ],
    },
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
    guide: {
      ctaLabel: 'Ver dashboard',
      route: '/',
      surface: 'Mode Dashboard',
      steps: [
        'No Dashboard, localize o bloco “Mode Dashboard”.',
        'Ative filtros para Oficial 3on3, Torneio Regional ou Treino Longo conforme a série.',
        'Clique em “Salvar preset”, nomeie e compartilhe com a equipe.',
      ],
    },
  },
  {
    id: 'combo-lab',
    title: 'Rodar testes solo para combos parados',
    description: 'Escolha um combo sem amostra recente e registre uma bateria de simulações.',
    category: 'combos',
    eligibility: (stats) => stats.comboTestQueue.length > 0,
    repeatable: true,
    dynamicPayload: (stats) => {
      const target = stats.comboTestQueue[0];
      if (!target) return null;
      const reason = describeComboTestReason(target);
      const guide: AssistantMissionGuide = {
        ctaLabel: 'Ir concluir',
        route: `/combos/${target.id}`,
        surface: 'Detalhe do combo',
        steps: [
          `Abra Combos → ${target.name} para revisar o setup atual.`,
          'Use “Enviar para simulador” e monte um duelo solo para medir resistência e pontos.',
          'Registre ao menos 3 batalhas novas e salve o resultado com notas.',
        ],
      };
      const archetype = target.archetype ? `${target.archetype}` : 'sem arquétipo';
      return {
        title: `Testar combo ${target.name} sozinho`,
        description: `${target.name} (${archetype}) precisa de atenção: ${reason}. Execute uma bateria e marque os resultados.`,
        guide,
        context: { guide, targetCombo: target },
      } satisfies MissionDetails;
    },
  },
];

const missionTemplateIndex = new Map(missionTemplates.map((template) => [template.id, template]));

function buildMissionDetails(
  template: MissionTemplate,
  stats: WorkspaceStats,
  context?: AssistantContextPayload | null,
): MissionResolvedDetails | null {
  const resolved: MissionResolvedDetails = {
    title: template.title,
    description: template.description,
    guide: template.guide ?? null,
    context: template.guide ? { guide: template.guide } : null,
  };

  if (!template.dynamicPayload) {
    return resolved;
  }

  const dynamic = template.dynamicPayload(stats, context);
  if (!dynamic) {
    return null;
  }

  if (dynamic.title) {
    resolved.title = dynamic.title;
  }
  if (dynamic.description) {
    resolved.description = dynamic.description;
  }
  if (typeof dynamic.guide !== 'undefined') {
    resolved.guide = dynamic.guide;
  }
  if (dynamic.context) {
    resolved.context = dynamic.context;
  } else if (!resolved.context && resolved.guide) {
    resolved.context = { guide: resolved.guide };
  }

  return resolved;
}

function parseMissionContext(mission: AssistantMission): MissionContextPayload | null {
  if (!mission.context) return null;
  return mission.context as MissionContextPayload;
}

function resolveMissionGuide(mission: AssistantMission) {
  const contextPayload = parseMissionContext(mission);
  if (contextPayload?.guide) {
    return contextPayload.guide;
  }
  const template = missionTemplateIndex.get(mission.category ?? mission.id);
  return template?.guide ?? null;
}

function decorateMission(mission: AssistantMission): AssistantMissionDTO {
  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    category: mission.category,
    status: mission.status as AssistantMissionStatus,
    blockingReason: mission.blockingReason,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
    completedAt: mission.completedAt,
    guide: resolveMissionGuide(mission),
  };
}

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
        bit: { select: { id: true, name: true, type: true } },
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
  const comboTestQueue = buildComboTestQueue(comboMeta, highlights.comboActivity);
  const activityMap = new Map(highlights.comboActivity.map((entry) => [entry.id, entry]));
  const comboCatalog: ComboCatalogEntry[] = comboMeta.map((combo) => {
    const activity = activityMap.get(combo.id);
    return {
      id: combo.id,
      name: combo.name,
      archetype: combo.archetype ?? null,
      bladeName: combo.blade?.name ?? null,
      bitName: combo.bit?.name ?? null,
      bitType: combo.bit?.type ?? null,
      lastBattleAt: activity?.lastBattleAt ?? null,
    } satisfies ComboCatalogEntry;
  });

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
    comboTestQueue,
    comboCatalog,
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
      const details = buildMissionDetails(template, stats, context);
      if (!details) {
        return;
      }
      ops.push(
        prisma.assistantMission.create({
          data: {
            sessionId,
            category: key,
            title: details.title,
            description: details.description,
            context: (details.context ?? undefined) as Prisma.InputJsonValue,
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
    if (eligible && match && template.repeatable && match.status === 'COMPLETED') {
      const details = buildMissionDetails(template, stats, context);
      if (!details) {
        return;
      }
      ops.push(
        prisma.assistantMission.create({
          data: {
            sessionId,
            category: key,
            title: details.title,
            description: details.description,
            context: (details.context ?? undefined) as Prisma.InputJsonValue,
            status: 'ACTIVE',
          },
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
  return missions.map(decorateMission);
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

function normalizeKeyword(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type QuestionFocus =
  | { kind: 'BEST_BLADE' }
  | { kind: 'BIT_ADVICE'; bitQuery: string }
  | null;

const BIT_KEYWORDS = ['bit flat', 'bit needle', 'bit ball', 'bit drift', 'flat', 'needle', 'drift', 'orb', 'ball'];

function detectBitQuery(normalized: string) {
  for (const keyword of BIT_KEYWORDS) {
    if (normalized.includes(keyword)) {
      if (keyword.startsWith('bit ')) {
        return keyword;
      }
      return `bit ${keyword}`.trim();
    }
  }
  const match = normalized.match(/bit\s+([a-z0-9]+)/);
  if (match?.[1]) {
    return `bit ${match[1]}`;
  }
  return null;
}

function extractQuestionFocus(message: string): QuestionFocus {
  const normalized = normalizeKeyword(message);
  if (!normalized) return null;
  if (/(melhor|top).*(bey|blade)/.test(normalized)) {
    return { kind: 'BEST_BLADE' };
  }
  const bitQuery = detectBitQuery(normalized);
  if (bitQuery) {
    return { kind: 'BIT_ADVICE', bitQuery };
  }
  return null;
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
      const bitTag = leader.bitName ? ` + ${leader.bitName}` : '';
      return `${index + 1}. ${leader.name}${archetypeTag}${bladeLabel}${bitTag} — ${formatWinPercent(leader.winRate)} em ${leader.battles} batalhas`;
    })
    .join('\n');
  return `Top combos agora:\n${summary}\nQuer que eu abra um deles por arena, bit ou rival? Só me dizer o recorte.`;
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

function matchesBitLabel(query: string, bitName?: string | null, bitType?: string | null) {
  if (!bitName && !bitType) return false;
  const label = normalizeKeyword(`${bitName ?? ''} ${bitType ?? ''}`.trim());
  if (!label) return false;
  if (label.includes(query) || query.includes(label)) return true;
  const tokens = label.split(' ').filter((token) => token.length > 2);
  return tokens.some((token) => query.includes(token));
}

type BitMatchResult = {
  leaders: ComboLeader[];
  backlog: ComboCatalogEntry[];
};

function findCombosForBit(bitQuery: string, stats: WorkspaceStats): BitMatchResult {
  const normalized = normalizeKeyword(bitQuery);
  if (!normalized) {
    return { leaders: [], backlog: [] };
  }
  const leaders = stats.comboLeaders.filter((leader) => matchesBitLabel(normalized, leader.bitName, leader.bitType));
  const backlog = stats.comboCatalog.filter((combo) => matchesBitLabel(normalized, combo.bitName, combo.bitType));
  return { leaders, backlog };
}

function formatComboLine(leader: ComboLeader) {
  const archetypeTag = leader.archetype ? ` · ${leader.archetype}` : '';
  const bladeTag = leader.bladeName ? ` com ${leader.bladeName}` : '';
  const bitTag = leader.bitName ? ` + ${leader.bitName}` : '';
  return `${leader.name}${archetypeTag}${bladeTag}${bitTag} — ${formatWinPercent(leader.winRate)} em ${leader.battles} batalhas`;
}

function buildBestBladeAnswer(stats: WorkspaceStats) {
  if (!stats.bladeLeaders.length) {
    return 'Ainda não tenho amostras suficientes de blades para bater o martelo. Me conta quais séries você rodou e em qual arena quer focar que eu recalculo.';
  }
  const blade = stats.bladeLeaders[0];
  const combos = stats.comboLeaders.filter((leader) => {
    if (!leader.bladeName) return false;
    return normalizeKeyword(leader.bladeName) === normalizeKeyword(blade.name);
  });
  const insight = lookupPartInsight(blade.name);
  const lines = [
    `Tecnicamente o bey mais consistente agora é ${blade.name}${blade.archetype ? ` (${blade.archetype})` : ''}, segurando ${formatWinPercent(blade.winRate)} em ${blade.battles} batalhas registradas.`,
  ];
  if (combos.length) {
    lines.push('Combos que estão convertendo com ele:');
    combos.forEach((leader, index) => {
      lines.push(`${index + 1}. ${formatComboLine(leader)}`);
    });
  }
  if (insight) {
    lines.push(`Porque funciona: ${insight.summary} ${insight.mechanics}`);
    if (insight.statAngles.length) {
      lines.push(`O que monitorar: ${insight.statAngles[0]}`);
    }
  }
  lines.push('Se quiser focar em outro formato, me diz arena alvo, bit ou adversário e eu cruzo outra visão.');
  return lines.join('\n');
}

function buildHypothesisLine(bitQuery: string, stats: WorkspaceStats, insight?: PartInsight | null) {
  const leader = stats.comboLeaders[0];
  if (!insight) {
    return `Ainda não registrei dados de ${bitQuery}, mas posso pilotar testes usando ${leader ? leader.name : 'o combo líder atual'} como base. Me conta arena e objetivo que eu priorizo.`;
  }
  return `Sem logs recentes dessa peça, então seguimos pela teoria: ${insight.summary}. Posso montar uma bateria usando ${leader ? leader.name : 'seu combo ativo'} para validar. Me descreve arena ou adversário e eu ajusto.`;
}

function buildBitAdviceReply(bitQuery: string, stats: WorkspaceStats) {
  const insight = lookupPartInsight(bitQuery);
  const matches = findCombosForBit(bitQuery, stats);
  const backlogIds = new Set(matches.leaders.map((leader) => leader.id));
  const backlog = matches.backlog.filter((combo) => !backlogIds.has(combo.id));
  const label = insight?.label ?? bitQuery;
  const lines = [`Focando na ${label}: ${insight ? insight.summary : 'vou cruzar os dados que tenho sobre ela.'}`];
  if (insight) {
    lines.push(`Comportamento: ${insight.mechanics}`);
  }
  if (matches.leaders.length) {
    lines.push('Dados de campo:');
    matches.leaders.forEach((leader, index) => {
      lines.push(`${index + 1}. ${formatComboLine(leader)}`);
    });
  } else if (backlog.length) {
    const preview = backlog.slice(0, 3).map((combo) => combo.name).join(', ');
    lines.push(
      `Tenho combos cadastrados com essa peça (${preview}), mas precisamos registrar batalhas recentes para validar. Que tal rodar 3 partidas rápidas e me mandar o placar?`,
    );
  } else {
    lines.push(buildHypothesisLine(label, stats, insight));
  }
  lines.push('Se puder, me diga arena, meta desejado ou o rival direto — com esses parâmetros eu gero simulações mais precisas.');
  return lines.join('\n');
}

function formatMissionHint(mission?: AssistantMissionDTO | null) {
  if (!mission || mission.status !== 'ACTIVE') return null;
  return `Missão de laboratório em aberto: ${mission.title} — ${mission.description ?? 'siga o guia e me marque quando finalizar.'}`;
}

function buildLabTelemetry(stats: WorkspaceStats) {
  const usageSummary = `${stats.battlesTotal} batalhas totais (${stats.battlesLast7} nos últimos 7 dias) e ${stats.decksTotal} decks prontos.`;
  const lastSeen = stats.lastBattleAt ? `Último registro em ${formatDate(stats.lastBattleAt)}.` : 'Ainda falta registrar a próxima batalha.';
  return `Telemetria do laboratório: ${usageSummary} ${lastSeen}`;
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
  const telemetryLine = buildLabTelemetry(stats);
  const questionFocus = extractQuestionFocus(message);

  if (questionFocus?.kind === 'BEST_BLADE') {
    lines.push(buildBestBladeAnswer(stats));
  } else if (questionFocus?.kind === 'BIT_ADVICE') {
    lines.push(buildBitAdviceReply(questionFocus.bitQuery, stats));
  } else {
    switch (intent) {
      case 'HELLO':
        lines.push(
          'Bem-vindo de volta ao laboratório. Estou acompanhando decks de 7 turnos, missões e telemetria das batalhas — me diz o próximo experimento e eu já encaixo.',
        );
        lines.push(buildComboAdvice(stats));
        break;
      case 'COMBO_ADVICE':
        lines.push(buildComboAdvice(stats));
        lines.push('Se tiver arena, bit ou rival específico, manda ver que eu filtro a recomendação.');
        break;
      case 'BEST_PERFORMER':
        lines.push(describeBestBeys(stats));
        if (stats.comboLeaders.length) {
          lines.push(
            `O combo mais quente continua sendo ${stats.comboLeaders[0].name}; se quiser eu comparo contra o meta ou ajusto para outra bit, é só pedir.`,
          );
        }
        break;
      case 'REPORT':
        lines.push(
          'Os relatórios avançados estão no dashboard → Inteligência de desempenho. Posso destacar peças por winrate, arena ou parceiro — me fala o recorte que precisa.',
        );
        break;
      case 'REGISTER':
        lines.push(
          'Para registrar séries longas, abre o Composer, sobe “Turnos na série” para 7 e deixa o placar automático marcar os 4 pontos. Assim eu consigo cruzar performance sem lacunas.',
        );
        break;
      case 'HELP':
        lines.push('Posso sugerir combos, revisar missões, explicar peças ou rodar hipóteses. Qual parte do setup está travando?');
        break;
      default:
        if (gratitude) {
          lines.push('Valeu! Continuo por aqui de olho nos logs. Se quiser outro recorte ou missão, é só chamar.');
        } else {
          lines.push('Anotei. Estou cruzando o histórico recente para ajustar alertas e sugestões do laboratório.');
          if (stats.comboLeaders.length) {
            const leader = stats.comboLeaders[0];
            lines.push(
              `${leader.name} está segurando ${formatWinPercent(leader.winRate)} em ${leader.battles} batalhas — podemos usar ele como baseline para novos testes se fizer sentido.`,
            );
          }
        }
        break;
    }
  }

  if (!questionFocus) {
    collectRouteHints(context).forEach((hint) => lines.push(hint));
  }

  const missionHint = formatMissionHint(activeMission);
  if (missionHint) {
    lines.push(missionHint);
  }

  lines.push(telemetryLine);

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
  return missions.map(decorateMission);
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
  return decorateMission(updated);
}
