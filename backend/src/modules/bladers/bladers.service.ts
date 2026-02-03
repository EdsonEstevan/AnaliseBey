import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { badRequest, notFound } from '../../utils/apiError';
import { BladerPayload } from '../../types/dto';

const bladerInclude = {
  decks: {
    select: {
      id: true,
      name: true,
      side: true,
    },
  },
  battlesAsA: {
    include: {
      comboA: {
        select: {
          id: true,
          name: true,
        },
      },
      comboB: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  battlesAsB: {
    include: {
      comboA: {
        select: {
          id: true,
          name: true,
        },
      },
      comboB: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BladerInclude;

type BladerWithRelations = Prisma.BladerGetPayload<{ include: typeof bladerInclude }>;

type ComboUsage = {
  id: string;
  name: string;
  count: number;
};

function normalizePayload(payload: Partial<BladerPayload> & { name: string }) {
  return {
    name: payload.name.trim(),
    nickname: payload.nickname?.trim() || null,
    age: typeof payload.age === 'number' && Number.isFinite(payload.age) ? payload.age : null,
    country: payload.country?.trim() || null,
    team: payload.team?.trim() || null,
    notes: payload.notes?.trim() || null,
  } satisfies BladerPayload;
}

function aggregateUsage(blader: BladerWithRelations) {
  const battles = [...blader.battlesAsA, ...blader.battlesAsB];
  const stats = { total: battles.length, wins: 0, losses: 0, draws: 0 };
  const comboMap = new Map<string, ComboUsage>();
  let lastBattleAt: Date | null = null;

  battles.forEach((battle) => {
    const isA = battle.bladerAId === blader.id;
    const combo = isA ? battle.comboA : battle.comboB;
    if (combo) {
      const entry = comboMap.get(combo.id) ?? { id: combo.id, name: combo.name, count: 0 };
      entry.count += 1;
      comboMap.set(combo.id, entry);
    }

    if (battle.result === 'DRAW') {
      stats.draws += 1;
    } else if ((battle.result === 'COMBO_A' && isA) || (battle.result === 'COMBO_B' && !isA)) {
      stats.wins += 1;
    } else {
      stats.losses += 1;
    }

    if (battle.occurredAt) {
      const occurredAt = new Date(battle.occurredAt);
      if (!lastBattleAt || occurredAt > lastBattleAt) {
        lastBattleAt = occurredAt;
      }
    }
  });

  const decisive = stats.total - stats.draws;
  const winrate = decisive > 0 ? Number(((stats.wins / decisive) * 100).toFixed(1)) : 0;

  return {
    stats: { ...stats, winrate },
    combosUsed: Array.from(comboMap.values()).sort((a, b) => b.count - a.count).slice(0, 5),
    lastBattleAt,
  };
}

function serializeBlader(blader: BladerWithRelations) {
  const summary = aggregateUsage(blader);
  return {
    id: blader.id,
    name: blader.name,
    nickname: blader.nickname,
    age: blader.age,
    country: blader.country,
    team: blader.team,
    notes: blader.notes,
    createdAt: blader.createdAt,
    updatedAt: blader.updatedAt,
    decks: blader.decks,
    deckCount: blader.decks.length,
    stats: summary.stats,
    combosUsed: summary.combosUsed,
    lastBattleAt: summary.lastBattleAt,
  };
}

async function ensureBlader(userId: string, id: string) {
  const blader = await prisma.blader.findFirst({ where: { id, userId }, include: bladerInclude });
  if (!blader) {
    throw notFound('Blader não encontrado.');
  }
  return blader;
}

export async function listBladers(userId: string) {
  const bladers = await prisma.blader.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: bladerInclude,
  });
  return bladers.map(serializeBlader);
}

export async function getBlader(userId: string, id: string) {
  const blader = await ensureBlader(userId, id);
  return serializeBlader(blader);
}

export async function createBlader(userId: string, payload: BladerPayload) {
  const data = normalizePayload(payload);
  if (!data.name) {
    throw badRequest('Nome é obrigatório.');
  }
  const blader = await prisma.blader.create({
    data: {
      ...data,
      userId,
    },
    include: bladerInclude,
  });
  return serializeBlader(blader);
}

export async function updateBlader(userId: string, id: string, payload: Partial<BladerPayload>) {
  const existing = await prisma.blader.findFirst({ where: { id, userId } });
  if (!existing) {
    throw notFound('Blader não encontrado.');
  }
  const data = normalizePayload({
    name: payload.name ?? existing.name,
    nickname: payload.nickname ?? existing.nickname ?? undefined,
    age: payload.age ?? existing.age ?? undefined,
    country: payload.country ?? existing.country ?? undefined,
    team: payload.team ?? existing.team ?? undefined,
    notes: payload.notes ?? existing.notes ?? undefined,
  });
  const blader = await prisma.blader.update({
    where: { id },
    data,
    include: bladerInclude,
  });
  return serializeBlader(blader);
}

export async function deleteBlader(userId: string, id: string) {
  const [deckCount, battleCount] = await Promise.all([
    prisma.deck.count({ where: { bladerId: id, userId } }),
    prisma.battle.count({ where: { userId, OR: [{ bladerAId: id }, { bladerBId: id }] } }),
  ]);
  if (deckCount > 0 || battleCount > 0) {
    throw badRequest('Não é possível remover um blader vinculado a decks ou batalhas.');
  }
  await ensureBlader(userId, id);
  await prisma.blader.delete({ where: { id } });
}
