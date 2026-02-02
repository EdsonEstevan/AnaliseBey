import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { badRequest, notFound } from '../../utils/apiError';
import { ensureStringArray } from '../../utils/json';
import { DeckPayload } from '../../types/dto';

const deckInclude = {
  slots: {
    orderBy: { position: 'asc' },
    include: {
      combo: {
        select: {
          id: true,
          name: true,
          tags: true,
          archetype: true,
          status: true,
          imageUrl: true,
        },
      },
    },
  },
  blader: {
    select: {
      id: true,
      name: true,
      nickname: true,
    },
  },
} satisfies Prisma.DeckInclude;

type DeckWithRelations = Prisma.DeckGetPayload<{ include: typeof deckInclude }>;

type DeckSlotDTO = {
  position: number;
  comboId: string;
  combo: {
    id: string;
    name: string;
    tags: string[];
    archetype: string;
    status: string;
    imageUrl: string | null;
  } | null;
};

const serializeDeck = (deck: DeckWithRelations) => ({
  id: deck.id,
  name: deck.name,
  side: deck.side,
  notes: deck.notes,
  blader: deck.blader
    ? {
        id: deck.blader.id,
        name: deck.blader.name,
        nickname: deck.blader.nickname,
      }
    : null,
  createdAt: deck.createdAt,
  updatedAt: deck.updatedAt,
  slots: deck.slots.map<DeckSlotDTO>((slot) => ({
    position: slot.position,
    comboId: slot.comboId,
    combo: slot.combo
      ? {
          ...slot.combo,
          tags: ensureStringArray(slot.combo.tags as unknown),
        }
      : null,
  })),
});

async function ensureDeck(id: string) {
  const deck = await prisma.deck.findUnique({ where: { id }, include: deckInclude });
  if (!deck) {
    throw notFound('Deck não encontrado.');
  }
  return deck;
}

async function ensureComboExists(id: string) {
  const combo = await prisma.combo.findUnique({ where: { id } });
  if (!combo) {
    throw badRequest(`Combo ${id} não existe.`);
  }
  if (combo.status === 'ARCHIVED') {
    throw badRequest(`Combo ${combo.name} está arquivado.`);
  }
  return combo.id;
}

async function ensureBladerExists(id: string) {
  const blader = await prisma.blader.findUnique({ where: { id } });
  if (!blader) {
    throw badRequest(`Blader ${id} não existe.`);
  }
  return blader.id;
}

function assertUniqueComboIds(comboIds: string[]) {
  const seen = new Set<string>();
  comboIds.forEach((comboId) => {
    if (seen.has(comboId)) {
      throw badRequest('Os slots do deck precisam conter combos diferentes.');
    }
    seen.add(comboId);
  });
}

export async function listDecks() {
  const decks = await prisma.deck.findMany({
    orderBy: { updatedAt: 'desc' },
    include: deckInclude,
  });
  return decks.map(serializeDeck);
}

export async function getDeck(id: string) {
  const deck = await ensureDeck(id);
  return serializeDeck(deck);
}

export async function createDeck(payload: DeckPayload) {
  const comboIds = payload.comboIds.map((comboId) => comboId.trim()).filter(Boolean);
  assertUniqueComboIds(comboIds);
  await Promise.all(comboIds.map((comboId) => ensureComboExists(comboId)));
  const bladerId = payload.bladerId?.trim() || null;
  if (bladerId) {
    await ensureBladerExists(bladerId);
  }

  const deck = await prisma.deck.create({
    data: {
      name: payload.name,
      side: payload.side ?? null,
      notes: payload.notes ?? null,
      bladerId,
      slots: {
        create: comboIds.map((comboId, index) => ({
          comboId,
          position: index + 1,
        })),
      },
    },
    include: deckInclude,
  });

  return serializeDeck(deck);
}

export async function updateDeck(id: string, payload: Partial<DeckPayload>) {
  const existing = await ensureDeck(id);

  const data: Prisma.DeckUpdateInput = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.side !== undefined) data.side = payload.side ?? null;
  if (payload.notes !== undefined) data.notes = payload.notes ?? null;
  if (payload.bladerId !== undefined) {
    const bladerId = payload.bladerId?.trim() || null;
    if (bladerId) {
      await ensureBladerExists(bladerId);
    }
    data.blader = bladerId
      ? { connect: { id: bladerId } }
      : { disconnect: true };
  }

  const comboIds = payload.comboIds?.map((comboId) => comboId.trim()).filter(Boolean);
  if (comboIds && comboIds.length > 0) {
    assertUniqueComboIds(comboIds);
    await Promise.all(comboIds.map((comboId) => ensureComboExists(comboId)));

    await prisma.$transaction(async (tx) => {
      await tx.deckSlot.deleteMany({ where: { deckId: id } });
      await tx.deckSlot.createMany({
        data: comboIds.map((comboId, index) => ({
          deckId: id,
          comboId,
          position: index + 1,
        })),
      });
      await tx.deck.update({ where: { id }, data });
    });

    const refreshed = await ensureDeck(id);
    return serializeDeck(refreshed);
  }

  const updated = await prisma.deck.update({ where: { id: existing.id }, data, include: deckInclude });
  return serializeDeck(updated);
}

export async function deleteDeck(id: string) {
  try {
    await prisma.deck.delete({ where: { id } });
  } catch (err) {
    throw notFound('Deck não encontrado.');
  }
}
