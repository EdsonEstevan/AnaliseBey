import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { badRequest, notFound } from '../../utils/apiError';
import { BattlePayload, BattleTurnPayload } from '../../types/dto';
import { ensureStringArray } from '../../utils/json';
import { BattleOutcome } from '../../types/enums';

const battleInclude = {
  comboA: {
    include: {
      blade: true,
      ratchet: true,
      bit: true,
    },
  },
  comboB: {
    include: {
      blade: true,
      ratchet: true,
      bit: true,
    },
  },
  arena: true,
} satisfies Prisma.BattleInclude;

type BattleWithRelations = Prisma.BattleGetPayload<{ include: typeof battleInclude }>;

type BattleTurn = {
  winner: BattleOutcome;
  victoryType?: string | null;
  notes?: string | null;
};

const victoryPoints = new Map<string, number>([
  ['overfinish', 2],
  ['burstfinish', 2],
  ['knockout', 2],
  ['spinfinish', 1],
  ['equalizacao', 1],
  ['extremefinish', 3],
]);

function normalizeVictoryKey(value?: string | null) {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

function pointsForVictory(value?: string | null) {
  const key = normalizeVictoryKey(value);
  if (!key) return 1;
  return victoryPoints.get(key) ?? 1;
}

function sanitizeTurns(turns?: BattleTurnPayload[] | null): BattleTurn[] {
  if (!turns?.length) return [];
  return turns
    .filter((turn) => Boolean(turn?.winner))
    .map((turn) => ({
      winner: turn.winner,
      victoryType: turn.victoryType?.trim() || null,
      notes: turn.notes?.trim() || null,
    }));
}

function parseBattleTurns(value: Prisma.JsonValue | null | undefined): BattleTurn[] {
  if (!value || !Array.isArray(value)) return [];
  return value
    .map((entry) => entry as Partial<BattleTurn>)
    .filter((entry): entry is BattleTurn =>
      entry !== null &&
      typeof entry === 'object' &&
      entry.winner !== undefined &&
      (entry.winner === 'COMBO_A' || entry.winner === 'COMBO_B' || entry.winner === 'DRAW'),
    )
    .map((entry) => ({
      winner: entry.winner,
      victoryType: entry.victoryType ?? null,
      notes: entry.notes ?? null,
    }));
}

function summarizeVictoryType(turns: BattleTurn[]) {
  if (!turns.length) return null;
  const tally = turns
    .map((turn) => turn.victoryType?.trim())
    .filter((value): value is string => Boolean(value))
    .reduce<Record<string, number>>((acc, key) => {
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  const [top] = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return top?.[0] ?? null;
}

function computeScoreFromTurns(turns: BattleTurn[]) {
  if (!turns.length) return null;
  let comboAPoints = 0;
  let comboBPoints = 0;

  turns.forEach((turn) => {
    const value = pointsForVictory(turn.victoryType);
    if (turn.winner === 'COMBO_A') comboAPoints += value;
    if (turn.winner === 'COMBO_B') comboBPoints += value;
  });

  if (comboAPoints === 0 && comboBPoints === 0) {
    return null;
  }

  const result: BattleOutcome =
    comboAPoints === comboBPoints
      ? 'DRAW'
      : comboAPoints > comboBPoints
        ? 'COMBO_A'
        : 'COMBO_B';

  return {
    score: `${comboAPoints}-${comboBPoints}`,
    result,
    victoryType: summarizeVictoryType(turns),
  };
}

function serializeCombo(combo: BattleWithRelations['comboA']) {
  return {
    ...combo,
    tags: ensureStringArray(combo.tags as unknown),
    blade: { ...combo.blade, tags: ensureStringArray(combo.blade.tags as unknown) },
    ratchet: { ...combo.ratchet, tags: ensureStringArray(combo.ratchet.tags as unknown) },
    bit: { ...combo.bit, tags: ensureStringArray(combo.bit.tags as unknown) },
  };
}

const serializeBattle = (battle: BattleWithRelations) => ({
  ...battle,
  comboA: serializeCombo(battle.comboA),
  comboB: serializeCombo(battle.comboB),
  arena: battle.arena
    ? { ...battle.arena, tags: ensureStringArray(battle.arena.tags as unknown) }
    : null,
  turns: parseBattleTurns(battle.turns as Prisma.JsonValue),
});

async function ensureCombo(id: string) {
  const combo = await prisma.combo.findUnique({ where: { id } });
  if (!combo) {
    throw badRequest(`Combo ${id} não existe.`);
  }
  return combo;
}

export type BattleFilters = {
  comboId?: string;
  arenaId?: string;
  result?: BattleOutcome;
  limit?: number;
};

export async function listBattles(filters: BattleFilters = {}) {
  const where: Prisma.BattleWhereInput = {
    arenaId: filters.arenaId,
    result: filters.result,
    ...(filters.comboId
      ? {
          OR: [{ comboAId: filters.comboId }, { comboBId: filters.comboId }],
        }
      : {}),
  };
  const battles = await prisma.battle.findMany({
    where,
    include: battleInclude,
    orderBy: { occurredAt: 'desc' },
    take: filters.limit ?? 50,
  });
  return battles.map(serializeBattle);
}

export async function getBattle(id: string) {
  const battle = await prisma.battle.findUnique({
    where: { id },
    include: battleInclude,
  });
  if (!battle) {
    throw notFound('Batalha não encontrada.');
  }
  return serializeBattle(battle);
}

export async function createBattle(payload: BattlePayload) {
  if (payload.comboAId === payload.comboBId) {
    throw badRequest('Uma batalha precisa de dois combos diferentes.');
  }
  const [comboA, comboB] = await Promise.all([
    ensureCombo(payload.comboAId),
    ensureCombo(payload.comboBId),
  ]);

  const turns = sanitizeTurns(payload.turns);
  const summary = computeScoreFromTurns(turns);

  const battle = await prisma.battle.create({
    data: {
      comboAId: comboA.id,
      comboBId: comboB.id,
      result: summary?.result ?? payload.result,
      score: summary?.score ?? payload.score,
      victoryType: payload.victoryType ?? summary?.victoryType ?? null,
      turns: turns.length ? (turns as unknown as Prisma.InputJsonValue) : undefined,
      arenaId: payload.arenaId,
      notes: payload.notes,
      occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
    },
    include: battleInclude,
  });
  return serializeBattle(battle);
}

export async function updateBattle(id: string, payload: Partial<BattlePayload>) {
  const existing = await prisma.battle.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('Batalha não encontrada.');
  }

  if (payload.comboAId) {
    await ensureCombo(payload.comboAId);
  }
  if (payload.comboBId) {
    await ensureCombo(payload.comboBId);
  }

  const turnsProvided = payload.turns !== undefined;
  const turns = turnsProvided ? sanitizeTurns(payload.turns ?? []) : parseBattleTurns(existing.turns as Prisma.JsonValue);
  const summary = turnsProvided ? computeScoreFromTurns(turns) : null;

  const battle = await prisma.battle.update({
    where: { id },
    data: {
      comboAId: payload.comboAId ?? existing.comboAId,
      comboBId: payload.comboBId ?? existing.comboBId,
      result: summary?.result ?? payload.result ?? existing.result,
      score: summary?.score ?? payload.score ?? existing.score,
      victoryType: payload.victoryType ?? summary?.victoryType ?? existing.victoryType,
      turns: turnsProvided
        ? turns.length
          ? (turns as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull
        : undefined,
      arenaId: payload.arenaId ?? existing.arenaId,
      notes: payload.notes ?? existing.notes,
      occurredAt: payload.occurredAt
        ? new Date(payload.occurredAt)
        : existing.occurredAt,
    },
    include: battleInclude,
  });
  return serializeBattle(battle);
}

export async function bulkCreateBattles(items: BattlePayload[]) {
  if (items.length === 0) {
    throw badRequest('Nenhuma batalha informada.');
  }
  const created = [];
  for (const payload of items) {
    const battle = await createBattle(payload);
    created.push(battle);
  }
  return created;
}

export async function deleteBattle(id: string) {
  try {
    await prisma.battle.delete({ where: { id } });
  } catch (err) {
    throw notFound('Batalha não encontrada.');
  }
}
