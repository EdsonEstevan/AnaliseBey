import { randomBytes } from 'crypto';
import { AccessKey, Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { AuthUser } from '../../types/auth';
import { ApiError } from '../../utils/apiError';

export type AccessKeyScope = 'owned' | 'all';

const DEFAULT_PREFIX = 'LAB';

function generateCode(prefix = DEFAULT_PREFIX) {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

type AccessKeyWithRelations = Prisma.AccessKeyGetPayload<{
  include: {
    owner: true;
    claimedBy: true;
  };
}>;

function serializeKey(key: AccessKeyWithRelations | AccessKey) {
  return {
    id: key.id,
    code: key.code,
    status: key.status,
    ownerId: key.ownerId,
    ownerName: 'owner' in key && key.owner ? key.owner.name : undefined,
    claimedById: key.claimedById,
    claimedByName: 'claimedBy' in key && key.claimedBy ? key.claimedBy.name : undefined,
    uses: key.uses,
    maxUses: key.maxUses,
    createdAt: key.createdAt,
    claimedAt: key.claimedAt,
    revokedAt: key.revokedAt,
  };
}

export async function listAccessKeys(user: AuthUser, scope: AccessKeyScope = 'owned') {
  const where = scope === 'all' && user.role === 'ADMIN' ? {} : { ownerId: user.id };
  const keys = await prisma.accessKey.findMany({
    where,
    include: {
      owner: true,
      claimedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return keys.map(serializeKey);
}

export async function createAccessKeys(user: AuthUser, quantity: number, maxUses: number) {
  if (quantity < 1 || quantity > 20) {
    throw new ApiError(400, 'Você pode gerar entre 1 e 20 convites por vez.');
  }
  if (maxUses < 1 || maxUses > 10) {
    throw new ApiError(400, 'maxUses precisa estar entre 1 e 10.');
  }

  const operations: Prisma.PrismaPromise<AccessKey>[] = [];
  for (let index = 0; index < quantity; index += 1) {
    operations.push(
      prisma.accessKey.create({
        data: {
          code: generateCode(user.role === 'ADMIN' ? 'EDSON' : DEFAULT_PREFIX),
          ownerId: user.id,
          maxUses,
          status: 'AVAILABLE',
          uses: 0,
        },
      }),
    );
  }

  const created = await prisma.$transaction(operations);
  return created.map(serializeKey);
}

export async function revokeAccessKey(user: AuthUser, keyId: string) {
  const key = await prisma.accessKey.findUnique({ where: { id: keyId } });
  if (!key) {
    throw new ApiError(404, 'Convite não encontrado.');
  }
  if (key.ownerId !== user.id && user.role !== 'ADMIN') {
    throw new ApiError(403, 'Você não pode revogar convites de outro usuário.');
  }
  if (key.status === 'REVOKED') {
    return serializeKey(key);
  }
  const updated = await prisma.accessKey.update({
    where: { id: key.id },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
    },
  });
  return serializeKey(updated);
}
