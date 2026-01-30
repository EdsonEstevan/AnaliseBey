import { Arena } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { notFound } from '../../utils/apiError';
import { ensureStringArray, toJsonArray } from '../../utils/json';
import { ArenaPayload } from '../../types/dto';

const serializeArena = (arena: Arena) => ({
  ...arena,
  tags: ensureStringArray(arena.tags as unknown),
});

export async function listArenas() {
  const arenas = await prisma.arena.findMany({ orderBy: { name: 'asc' } });
  return arenas.map(serializeArena);
}

export async function createArena(payload: ArenaPayload) {
  const arena = await prisma.arena.create({
    data: {
      name: payload.name,
      model: payload.model,
      tags: toJsonArray(payload.tags),
      notes: payload.notes,
    },
  });
  return serializeArena(arena);
}

export async function updateArena(id: string, payload: Partial<ArenaPayload>) {
  const existing = await prisma.arena.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('Arena não encontrada.');
  }

  const updated = await prisma.arena.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      model: payload.model ?? existing.model,
      tags: payload.tags ? toJsonArray(payload.tags) : existing.tags,
      notes: payload.notes ?? existing.notes,
    },
  });

  return serializeArena(updated);
}

export async function getArena(id: string) {
  const arena = await prisma.arena.findUnique({ where: { id } });
  if (!arena) {
    throw notFound('Arena não encontrada.');
  }
  return serializeArena(arena);
}

export async function deleteArena(id: string) {
  await prisma.battle.updateMany({
    where: { arenaId: id },
    data: { arenaId: null },
  });
  await prisma.arena.delete({ where: { id } });
}
