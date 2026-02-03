import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { badRequest, notFound } from '../../utils/apiError';
import { BattlePayload, BattleTurnPayload } from '../../types/dto';
import { ensureStringArray } from '../../utils/json';
import { BattleMode, BattleOutcome } from '../../types/enums';

const battleInclude = {
  comboA: {
    include: {
      blade: true,
      ratchet: true,
      bit: true,
      assistBlade: true,
      lockChip: true,
    },
  },
  comboB: {
    include: {
      blade: true,
      ratchet: true,
      bit: true,
      assistBlade: true,
      lockChip: true,
    },
  },
  bladerA: true,
  bladerB: true,
  arena: true,
} satisfies Prisma.BattleInclude;

type BattleWithRelations = Prisma.BattleGetPayload<{ include: typeof battleInclude }>;

type BattleTurn = {
  winner: BattleOutcome;
  victoryType?: string | null;
  notes?: string | null;
};

const DEFAULT_BATTLE_MODE: BattleMode = 'OFFICIAL_3ON3';

const victoryPoints = new Map<string, number>([
  ['burstfinish', 2],
  ['spinfinish', 1],
  ['overfinish', 2],
  ['xtremefinish', 3],
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

function normalizeBladerId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
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
    assistBlade: combo.assistBlade
      ? { ...combo.assistBlade, tags: ensureStringArray(combo.assistBlade.tags as unknown) }
      : null,
    lockChip: combo.lockChip
      ? { ...combo.lockChip, tags: ensureStringArray(combo.lockChip.tags as unknown) }
      : null,
  };
}

const serializeBattle = (battle: BattleWithRelations) => ({
  ...battle,
  comboA: serializeCombo(battle.comboA),
  comboB: serializeCombo(battle.comboB),
  bladerA: battle.bladerA
    ? {
        id: battle.bladerA.id,
        name: battle.bladerA.name,
        nickname: battle.bladerA.nickname,
      }
    : null,
  bladerB: battle.bladerB
    ? {
        id: battle.bladerB.id,
        name: battle.bladerB.name,
        nickname: battle.bladerB.nickname,
      }
    : null,
  arena: battle.arena
    ? { ...battle.arena, tags: ensureStringArray(battle.arena.tags as unknown) }
    : null,
  turns: parseBattleTurns(battle.turns as Prisma.JsonValue),
});

async function ensureCombo(userId: string, id: string) {
  const combo = await prisma.combo.findFirst({ where: { id, userId } });
  if (!combo) {
    throw badRequest(`Combo ${id} não existe.`);
  }
  return combo;
}

async function ensureBlader(userId: string, id: string) {
  const blader = await prisma.blader.findFirst({ where: { id, userId } });
  if (!blader) {
    throw badRequest(`Blader ${id} não existe.`);
  }
  return blader;
}

export type BattleFilters = {
  comboId?: string;
  arenaId?: string;
  bladerId?: string;
  result?: BattleOutcome;
  mode?: BattleMode;
  limit?: number;
};

export async function listBattles(userId: string, filters: BattleFilters = {}) {
  const where: Prisma.BattleWhereInput = {
    userId,
    arenaId: filters.arenaId,
    result: filters.result,
    mode: filters.mode,
  };
  const appendCondition = (condition: Prisma.BattleWhereInput) => {
    const current = where.AND;
    const normalized = Array.isArray(current)
      ? current
      : current
        ? [current]
        : [];
    where.AND = [...normalized, condition];
  };
  if (filters.comboId) {
    appendCondition({
      OR: [{ comboAId: filters.comboId }, { comboBId: filters.comboId }],
    });
  }
  if (filters.bladerId) {
    appendCondition({
      OR: [{ bladerAId: filters.bladerId }, { bladerBId: filters.bladerId }],
    });
  }
  const battles = await prisma.battle.findMany({
    where,
    include: battleInclude,
    orderBy: { occurredAt: 'desc' },
    take: filters.limit ?? 50,
  });
  return battles.map(serializeBattle);
}

export async function getBattle(userId: string, id: string) {
  const battle = await prisma.battle.findFirst({
    where: { id, userId },
    include: battleInclude,
  });
  if (!battle) {
    throw notFound('Batalha não encontrada.');
  }
  return serializeBattle(battle);
}

export async function createBattle(userId: string, payload: BattlePayload) {
  if (payload.comboAId === payload.comboBId) {
    throw badRequest('Uma batalha precisa de dois combos diferentes.');
  }
  const [comboA, comboB] = await Promise.all([
    ensureCombo(userId, payload.comboAId),
    ensureCombo(userId, payload.comboBId),
  ]);
  const [bladerAId, bladerBId] = [normalizeBladerId(payload.bladerAId), normalizeBladerId(payload.bladerBId)];
  await Promise.all([
    bladerAId ? ensureBlader(userId, bladerAId) : null,
    bladerBId ? ensureBlader(userId, bladerBId) : null,
  ]);

  const turns = sanitizeTurns(payload.turns);
  const summary = computeScoreFromTurns(turns);

  const battle = await prisma.battle.create({
    data: {
      userId,
      comboAId: comboA.id,
      comboBId: comboB.id,
      bladerAId,
      bladerBId,
      result: summary?.result ?? payload.result,
      mode: payload.mode ?? DEFAULT_BATTLE_MODE,
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

export async function updateBattle(userId: string, id: string, payload: Partial<BattlePayload>) {
  const existing = await prisma.battle.findFirst({ where: { id, userId } });
  if (!existing) {
    throw notFound('Batalha não encontrada.');
  }

  if (payload.comboAId) {
    await ensureCombo(userId, payload.comboAId);
  }
  if (payload.comboBId) {
    await ensureCombo(userId, payload.comboBId);
  }
  const normalizedBladerAId =
    payload.bladerAId !== undefined ? normalizeBladerId(payload.bladerAId) : undefined;
  const normalizedBladerBId =
    payload.bladerBId !== undefined ? normalizeBladerId(payload.bladerBId) : undefined;

  await Promise.all([
    normalizedBladerAId ? ensureBlader(userId, normalizedBladerAId) : null,
    normalizedBladerBId ? ensureBlader(userId, normalizedBladerBId) : null,
  ]);

  const turnsProvided = payload.turns !== undefined;
  const turns = turnsProvided ? sanitizeTurns(payload.turns ?? []) : parseBattleTurns(existing.turns as Prisma.JsonValue);
  const summary = turnsProvided ? computeScoreFromTurns(turns) : null;

  const battle = await prisma.battle.update({
    where: { id },
    data: {
      comboAId: payload.comboAId ?? existing.comboAId,
      comboBId: payload.comboBId ?? existing.comboBId,
      bladerAId: normalizedBladerAId !== undefined ? normalizedBladerAId : existing.bladerAId,
      bladerBId: normalizedBladerBId !== undefined ? normalizedBladerBId : existing.bladerBId,
      result: summary?.result ?? payload.result ?? existing.result,
      mode: payload.mode ?? existing.mode,
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

export async function bulkCreateBattles(userId: string, items: BattlePayload[]) {
  if (items.length === 0) {
    throw badRequest('Nenhuma batalha informada.');
  }
  const created = [];
  for (const payload of items) {
    const battle = await createBattle(userId, payload);
    created.push(battle);
  }
  return created;
}

export async function deleteBattle(userId: string, id: string) {
  await getBattle(userId, id);
  await prisma.battle.delete({ where: { id } });
}
