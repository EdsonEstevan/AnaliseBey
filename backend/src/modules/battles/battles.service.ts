import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { badRequest, notFound } from '../../utils/apiError';
import { BattlePayload } from '../../types/dto';
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
};

type BattleWithRelations = Prisma.BattleGetPayload<{ include: typeof battleInclude }>;

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

  const battle = await prisma.battle.create({
    data: {
      comboAId: comboA.id,
      comboBId: comboB.id,
      result: payload.result,
      score: payload.score,
      victoryType: payload.victoryType,
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

  const battle = await prisma.battle.update({
    where: { id },
    data: {
      comboAId: payload.comboAId ?? existing.comboAId,
      comboBId: payload.comboBId ?? existing.comboBId,
      result: payload.result ?? existing.result,
      score: payload.score ?? existing.score,
      victoryType: payload.victoryType ?? existing.victoryType,
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
