import { Part } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { ApiError, notFound } from '../../utils/apiError';
import { ensureStringArray, toJsonArray } from '../../utils/json';
import { PartPayload } from '../../types/dto';
import { Archetype, PartType } from '../../types/enums';
import { AuthUser } from '../../types/auth';
import { canEditSharedParts } from '../../utils/permissions';

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

function resolveAccessibleOwnerIds(user: AuthUser) {
  return Array.from(new Set([user.id, ...Object.keys(user.sharedPartAccess ?? {})]));
}

function ensurePartView(user: AuthUser, ownerId: string) {
  if (ownerId === user.id) return;
  if (user.sharedPartAccess[ownerId]) return;
  throw notFound('Peça não encontrada.');
}

function ensurePartEdit(user: AuthUser, ownerId: string) {
  if (ownerId === user.id || user.role === 'ADMIN') return;
  const scope = user.sharedPartAccess[ownerId];
  if (scope === 'EDIT') return;
  throw new ApiError(403, 'Você não pode editar esta peça compartilhada.');
}

function resolvePartOwnerForCreation(user: AuthUser) {
  if (user.sharedPartsScope === 'EDIT') {
    const editableOwner = Object.entries(user.sharedPartAccess).find(([, scope]) => scope === 'EDIT');
    if (editableOwner) {
      return editableOwner[0];
    }
  }
  return user.id;
}

export async function listParts(user: AuthUser, filters: PartFilters = {}) {
  const { includeArchived = false, search, type, archetype } = filters;
  const ownerIds = resolveAccessibleOwnerIds(user);

  const where = {
    userId: {
      in: ownerIds,
    },
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

  const parts = await prisma.part.findMany({ where, orderBy: [{ userId: 'asc' }, { updatedAt: 'desc' }] });

  return parts.map(serializePart);
}

export async function getPartById(user: AuthUser, id: string) {
  const part = await prisma.part.findUnique({ where: { id } });
  if (!part) {
    throw notFound('Peça não encontrada.');
  }
  ensurePartView(user, part.userId);
  return serializePart(part);
}

export async function createPart(user: AuthUser, payload: PartPayload) {
  if (!canEditSharedParts(user)) {
    throw new ApiError(403, 'Apenas curadores autorizados podem cadastrar peças.');
  }
  const ownerId = resolvePartOwnerForCreation(user);
  const part = await prisma.part.create({
    data: {
      userId: ownerId,
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

export async function updatePart(user: AuthUser, id: string, payload: Partial<PartPayload>) {
  const existing = await prisma.part.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('Peça não encontrada.');
  }
  ensurePartEdit(user, existing.userId);

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

export async function toggleArchivePart(user: AuthUser, id: string, archived: boolean) {
  const existing = await prisma.part.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('Peça não encontrada.');
  }
  ensurePartEdit(user, existing.userId);
  const updated = await prisma.part.update({ where: { id }, data: { archived } });

  return serializePart(updated);
}
