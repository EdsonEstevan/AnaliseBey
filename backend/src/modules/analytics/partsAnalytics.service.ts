import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';

const comboPartsInclude = {
  blade: true,
  ratchet: true,
  bit: true,
  assistBlade: true,
  lockChip: true,
} satisfies Prisma.ComboInclude;

const battleInclude = {
  comboA: {
    include: comboPartsInclude,
  },
  comboB: {
    include: comboPartsInclude,
  },
  arena: true,
} satisfies Prisma.BattleInclude;

export type PartsAnalyticsFilters = {
  minBattles: number;
  mode: 'all' | 'likely';
};

export type PartnerSnapshot = {
  id: string;
  name: string;
  type: string;
  battles: number;
  wins: number;
  winRate: number;
};

export type ArenaSnapshot = {
  id: string;
  name: string;
  battles: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

export type PartAnalyticsSnapshot = {
  id: string;
  name: string;
  type: string;
  archetype: string | null;
  variant: string | null;
  weight: number | null;
  battles: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  comboCount: number;
  averageTurns: number;
  roles: Record<string, number>;
  victoryTypes: Array<{ label: string; count: number; percent: number }>;
  arenas: ArenaSnapshot[];
  partners: {
    assists: PartnerSnapshot[];
    lockChips: PartnerSnapshot[];
    blades: PartnerSnapshot[];
  };
};

export type PartsAnalyticsResponse = {
  generatedAt: string;
  filters: PartsAnalyticsFilters;
  summary: {
    totalParts: number;
    partsWithData: number;
    hiddenForSample: number;
    totalBattles: number;
    totalCombos: number;
  };
  archetypeSummary: Array<{
    archetype: string;
    battles: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  }>;
  parts: PartAnalyticsSnapshot[];
};

type ComboWithParts = Prisma.ComboGetPayload<{ include: typeof comboPartsInclude }>;
type BattleWithContext = Prisma.BattleGetPayload<{ include: typeof battleInclude }>;

type PartRole = 'blade' | 'ratchet' | 'bit' | 'assist' | 'lock';

type PartInfo = {
  id: string;
  name: string;
  type: string;
  archetype: string | null;
  variant: string | null;
  weight: number | null;
};

type PartnerAccumulator = {
  id: string;
  name: string;
  type: string;
  battles: number;
  wins: number;
};

type ArenaAccumulator = {
  id: string;
  name: string;
  battles: number;
  wins: number;
  losses: number;
  draws: number;
};

type PartAccumulator = {
  part: PartInfo;
  battles: number;
  wins: number;
  losses: number;
  draws: number;
  comboCount: number;
  turnsTotal: number;
  roles: Record<PartRole, number>;
  victoryTypes: Record<string, number>;
  arenaStats: Map<string, ArenaAccumulator>;
  partners: {
    assists: Map<string, PartnerAccumulator>;
    lockChips: Map<string, PartnerAccumulator>;
    blades: Map<string, PartnerAccumulator>;
  };
};

type PartParticipation = {
  role: PartRole;
  part: PartInfo;
};

const DEFAULT_VICTORY_LABEL = 'Sem registro';
const DRAW_LABEL = 'Empate';

function toPartInfo(part: ComboWithParts['blade'] | null | undefined): PartInfo | null {
  if (!part) return null;
  return {
    id: part.id,
    name: part.name,
    type: part.type,
    archetype: part.archetype ?? null,
    variant: part.variant ?? null,
    weight: part.weight ?? null,
  };
}

function collectComboParts(combo?: ComboWithParts | null): PartParticipation[] {
  if (!combo) return [];
  const entries: Array<{ role: PartRole; info: PartInfo | null }> = [
    { role: 'blade', info: toPartInfo(combo.blade) },
    { role: 'ratchet', info: toPartInfo(combo.ratchet) },
    { role: 'bit', info: toPartInfo(combo.bit) },
    { role: 'assist', info: toPartInfo(combo.assistBlade) },
    { role: 'lock', info: toPartInfo(combo.lockChip) },
  ];
  return entries
    .filter((entry): entry is { role: PartRole; info: PartInfo } => Boolean(entry.info))
    .map((entry) => ({ role: entry.role, part: entry.info }));
}

function countBattleTurns(turns: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(turns)) return 0;
  return turns.filter((entry) => entry && typeof entry === 'object' && 'winner' in entry).length;
}

function ensureAccumulator(map: Map<string, PartAccumulator>, info: PartInfo): PartAccumulator {
  const existing = map.get(info.id);
  if (existing) return existing;
  const created: PartAccumulator = {
    part: info,
    battles: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    comboCount: 0,
    turnsTotal: 0,
    roles: {
      blade: 0,
      ratchet: 0,
      bit: 0,
      assist: 0,
      lock: 0,
    },
    victoryTypes: {},
    arenaStats: new Map(),
    partners: {
      assists: new Map(),
      lockChips: new Map(),
      blades: new Map(),
    },
  };
  map.set(info.id, created);
  return created;
}

function registerPartner(
  bucket: Map<string, PartnerAccumulator>,
  partner: PartInfo,
  isWinner: boolean,
  isDraw: boolean,
) {
  if (!partner) return;
  const current = bucket.get(partner.id) ?? {
    id: partner.id,
    name: partner.name,
    type: partner.type,
    battles: 0,
    wins: 0,
  };
  current.battles += 1;
  if (!isDraw && isWinner) current.wins += 1;
  bucket.set(partner.id, current);
}

function registerSynergy(
  stats: PartAccumulator,
  current: PartParticipation,
  comboParts: PartParticipation[],
  isWinner: boolean,
  isDraw: boolean,
) {
  if (current.part.type === 'BLADE') {
    const assist = comboParts.find((entry) => entry.role === 'assist');
    if (assist) registerPartner(stats.partners.assists, assist.part, isWinner, isDraw);
    const lock = comboParts.find((entry) => entry.role === 'lock');
    if (lock) registerPartner(stats.partners.lockChips, lock.part, isWinner, isDraw);
  }
  if (current.part.type === 'ASSIST' || current.part.type === 'LOCK_CHIP') {
    const blade = comboParts.find((entry) => entry.role === 'blade');
    if (blade) registerPartner(stats.partners.blades, blade.part, isWinner, isDraw);
  }
}

function registerArena(
  stats: PartAccumulator,
  arena: NonNullable<BattleWithContext['arena']>,
  isWinner: boolean,
  isDraw: boolean,
) {
  const current =
    stats.arenaStats.get(arena.id) ?? ({
      id: arena.id,
      name: arena.name,
      battles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    } as ArenaAccumulator);
  current.battles += 1;
  if (isDraw) current.draws += 1;
  else if (isWinner) current.wins += 1;
  else current.losses += 1;
  stats.arenaStats.set(arena.id, current);
}

function toVictoryLabel(result: string, victoryType?: string | null) {
  if (result === 'DRAW') return DRAW_LABEL;
  return victoryType?.trim() || DEFAULT_VICTORY_LABEL;
}

function serializePartners(bucket: Map<string, PartnerAccumulator>, limit = 6): PartnerSnapshot[] {
  return [...bucket.values()]
    .map((entry) => ({
      ...entry,
      winRate: entry.battles ? entry.wins / entry.battles : 0,
    }))
    .sort((a, b) => (b.winRate === a.winRate ? b.battles - a.battles : b.winRate - a.winRate))
    .slice(0, limit);
}

function serializeArenas(bucket: Map<string, ArenaAccumulator>, limit = 8): ArenaSnapshot[] {
  return [...bucket.values()]
    .map((entry) => ({
      ...entry,
      winRate: entry.wins + entry.losses ? entry.wins / (entry.wins + entry.losses) : 0,
    }))
    .sort((a, b) => b.battles - a.battles)
    .slice(0, limit);
}

function serializeVictoryTypes(map: Record<string, number>, battles: number) {
  return Object.entries(map)
    .map(([label, count]) => ({
      label,
      count,
      percent: battles ? Math.round((count / battles) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function serializePart(stats: PartAccumulator): PartAnalyticsSnapshot {
  const decisive = stats.wins + stats.losses;
  const averageTurns = stats.battles ? Number((stats.turnsTotal / stats.battles).toFixed(2)) : 0;
  return {
    id: stats.part.id,
    name: stats.part.name,
    type: stats.part.type,
    archetype: stats.part.archetype,
    variant: stats.part.variant,
    weight: stats.part.weight,
    battles: stats.battles,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    winRate: decisive ? stats.wins / decisive : 0,
    comboCount: stats.comboCount,
    averageTurns,
    roles: stats.roles,
    victoryTypes: serializeVictoryTypes(stats.victoryTypes, stats.battles),
    arenas: serializeArenas(stats.arenaStats),
    partners: {
      assists: serializePartners(stats.partners.assists),
      lockChips: serializePartners(stats.partners.lockChips),
      blades: serializePartners(stats.partners.blades),
    },
  };
}

function computeArchetypeSummary(values: PartAccumulator[]) {
  const map = new Map<string, { wins: number; losses: number; draws: number; battles: number }>();
  values.forEach((stats) => {
    const key = stats.part.archetype ?? 'INDEFINIDO';
    const current = map.get(key) ?? { wins: 0, losses: 0, draws: 0, battles: 0 };
    current.wins += stats.wins;
    current.losses += stats.losses;
    current.draws += stats.draws;
    current.battles += stats.battles;
    map.set(key, current);
  });
  return [...map.entries()].map(([archetype, entry]) => ({
    archetype,
    battles: entry.battles,
    wins: entry.wins,
    losses: entry.losses,
    draws: entry.draws,
    winRate: entry.wins + entry.losses ? entry.wins / (entry.wins + entry.losses) : 0,
  }));
}

export async function getPartsAnalytics(filters: PartsAnalyticsFilters): Promise<PartsAnalyticsResponse> {
  const [parts, combos, battles] = await Promise.all([
    prisma.part.findMany({
      select: { id: true, name: true, type: true, archetype: true, variant: true, weight: true },
    }),
    prisma.combo.findMany({ include: comboPartsInclude }),
    prisma.battle.findMany({ include: battleInclude }),
  ]);

  const partLookup = new Map<string, PartInfo>(
    parts.map((part) => [part.id, { ...part, archetype: part.archetype ?? null, variant: part.variant ?? null, weight: part.weight ?? null }]),
  );

  const statsMap = new Map<string, PartAccumulator>();

  combos.forEach((combo) => {
    collectComboParts(combo).forEach((participation) => {
      const baseInfo = partLookup.get(participation.part.id) ?? participation.part;
      const stats = ensureAccumulator(statsMap, baseInfo);
      stats.comboCount += 1;
    });
  });

  battles.forEach((battle) => {
    const turnCount = countBattleTurns(battle.turns as Prisma.JsonValue);
    const victoryLabel = toVictoryLabel(battle.result, battle.victoryType);
    const comboA = collectComboParts(battle.comboA);
    const comboB = collectComboParts(battle.comboB);
    const isDraw = battle.result === 'DRAW';

    [
      { parts: comboA, won: battle.result === 'COMBO_A' },
      { parts: comboB, won: battle.result === 'COMBO_B' },
    ].forEach((group) => {
      group.parts.forEach((participation) => {
        const baseInfo = partLookup.get(participation.part.id) ?? participation.part;
        const stats = ensureAccumulator(statsMap, baseInfo);
        stats.battles += 1;
        stats.turnsTotal += turnCount;
        stats.roles[participation.role] = (stats.roles[participation.role] ?? 0) + 1;
        if (isDraw) stats.draws += 1;
        else if (group.won) stats.wins += 1;
        else stats.losses += 1;
        stats.victoryTypes[victoryLabel] = (stats.victoryTypes[victoryLabel] ?? 0) + 1;
        if (battle.arena) {
          registerArena(stats, battle.arena, group.won, isDraw);
        }
        registerSynergy(stats, participation, group.parts, group.won, isDraw);
      });
    });
  });

  const allStats = [...statsMap.values()];
  const filteredStats = allStats.filter((entry) => entry.battles >= filters.minBattles);
  const serialized = filteredStats
    .map((entry) => serializePart(entry))
    .sort((a, b) => (b.battles === a.battles ? b.winRate - a.winRate : b.battles - a.battles));

  return {
    generatedAt: new Date().toISOString(),
    filters,
    summary: {
      totalParts: statsMap.size,
      partsWithData: serialized.length,
      hiddenForSample: statsMap.size - serialized.length,
      totalBattles: battles.length,
      totalCombos: combos.length,
    },
    archetypeSummary: computeArchetypeSummary(allStats),
    parts: serialized,
  };
}
