import { Part } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { badRequest, notFound } from '../../utils/apiError';
import { ensureStringArray, toJsonArray } from '../../utils/json';
import { PartPayload } from '../../types/dto';
import { Archetype, PartType } from '../../types/enums';

export type PartFilters = {
  search?: string;
  type?: PartType;
  archetype?: Archetype;
  includeArchived?: boolean;
};

const serializePart = (part: Part) => ({
  ...part,
  tags: ensureStringArray(part.tags as unknown),
});

export async function listParts(userId: string, filters: PartFilters = {}) {
  const { includeArchived = false, search, type, archetype } = filters;

  const where = {
    userId,
    archived: includeArchived ? undefined : false,
    type,
    archetype,
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              tags: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };

  const parts = await prisma.part.findMany({ where, orderBy: { updatedAt: 'desc' } });

  return parts.map(serializePart);
}

export async function getPartById(userId: string, id: string) {
  const part = await prisma.part.findFirst({ where: { id, userId } });
  if (!part) {
    throw notFound('Peça não encontrada.');
  }
  return serializePart(part);
}

export async function createPart(userId: string, payload: PartPayload) {
  const part = await prisma.part.create({
    data: {
      userId,
      name: payload.name,
      type: payload.type,
      variant: payload.variant,
      weight: payload.weight,
      archetype: payload.archetype,
      subArchetype: payload.subArchetype ?? null,
      tags: toJsonArray(payload.tags),
      notes: payload.notes,
      imageUrl: payload.imageUrl ?? null,
    },
  });

  return serializePart(part);
}

export async function updatePart(userId: string, id: string, payload: Partial<PartPayload>) {
  const existing = await prisma.part.findFirst({ where: { id, userId } });
  if (!existing) {
    throw notFound('Peça não encontrada.');
  }

  const updated = await prisma.part.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      type: payload.type ?? existing.type,
      variant: payload.variant ?? existing.variant,
      weight: payload.weight ?? existing.weight,
      archetype: payload.archetype ?? existing.archetype,
      subArchetype:
        payload.subArchetype !== undefined ? payload.subArchetype : existing.subArchetype,
      tags: payload.tags ? toJsonArray(payload.tags) : existing.tags,
      notes: payload.notes ?? existing.notes,
      imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : existing.imageUrl,
    },
  });

  return serializePart(updated);
}

export async function toggleArchivePart(userId: string, id: string, archived: boolean) {
  await getPartById(userId, id);
  const part = await prisma.part.update({ where: { id }, data: { archived } });

  return serializePart(part);
}
