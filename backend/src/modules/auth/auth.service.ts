import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AccessKeyStatus, Prisma, User, UserRole } from '@prisma/client';

import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { AuthResult, AuthTokenPayload, AuthUser } from '../../types/auth';
import { ApiError, badRequest } from '../../utils/apiError';

const TOKEN_TTL = '7d';

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function normalizeAccessCode(value: string) {
  return value.trim().toUpperCase();
}

export function mapAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    status: user.status,
    battleMilestone: user.battleMilestone,
  } satisfies AuthUser;
}

function signToken(user: User) {
  const payload: AuthTokenPayload = {
    sub: user.id,
    role: user.role,
  };
  return jwt.sign(payload, env.authSecret, { expiresIn: TOKEN_TTL });
}

function ensureActive(user: User) {
  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'Usuário bloqueado. Fale com o administrador.');
  }
}

async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function loginWithPassword(username: string, password: string): Promise<AuthResult> {
  const normalized = normalizeUsername(username);
  const user = await findUserByUsername(normalized);
  if (!user || !user.passwordHash) {
    throw new ApiError(401, 'Credenciais inválidas.');
  }
  ensureActive(user);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, 'Credenciais inválidas.');
  }
  return { token: signToken(user), user: mapAuthUser(user) } satisfies AuthResult;
}

export async function loginAsVisitor(): Promise<AuthResult> {
  const visitor = await prisma.user.findFirst({ where: { role: 'VISITOR' }, orderBy: { createdAt: 'asc' } });
  if (!visitor) {
    throw new ApiError(400, 'Usuário visitante não configurado.');
  }
  ensureActive(visitor);
  return { token: signToken(visitor), user: mapAuthUser(visitor) } satisfies AuthResult;
}

type RegisterWithKeyPayload = {
  name: string;
  username: string;
  password: string;
  accessCode: string;
};

export async function registerWithAccessKey(payload: RegisterWithKeyPayload): Promise<AuthResult> {
  const code = normalizeAccessCode(payload.accessCode);
  const accessKey = await prisma.accessKey.findUnique({ where: { code } });
  if (!accessKey) {
    throw badRequest('Código de acesso inválido.');
  }
  if (accessKey.status === 'REVOKED') {
    throw badRequest('Este código foi revogado pelo administrador.');
  }
  if (accessKey.status === 'CLAIMED' && accessKey.uses >= accessKey.maxUses) {
    throw badRequest('Este código já foi totalmente utilizado.');
  }

  const normalizedUsername = normalizeUsername(payload.username);
  const existing = await findUserByUsername(normalizedUsername);
  if (existing) {
    throw badRequest('Nome de usuário indisponível.');
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: payload.name.trim(),
      username: normalizedUsername,
      passwordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  const nextUses = accessKey.uses + 1;
  const nextStatus: AccessKeyStatus = nextUses >= accessKey.maxUses ? 'CLAIMED' : accessKey.status;

  await prisma.accessKey.update({
    where: { id: accessKey.id },
    data: {
      uses: nextUses,
      status: nextStatus,
      claimedById: user.id,
      claimedAt: new Date(),
    },
  });

  return { token: signToken(user), user: mapAuthUser(user) } satisfies AuthResult;
}

export async function getProfile(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'Usuário não encontrado.');
  }
  return mapAuthUser(user);
}

export async function updatePassword(userId: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function ensureAdmin(user: AuthUser) {
  if (user.role !== 'ADMIN') {
    throw new ApiError(403, 'Apenas administradores podem executar esta ação.');
  }
}

export async function transferAccessKeyOwnership(keyId: string, ownerId: string) {
  await prisma.accessKey.update({
    where: { id: keyId },
    data: { ownerId },
  });
}

export async function createUserAccessKey(ownerId: string, code: string, data?: Partial<Prisma.AccessKeyUncheckedCreateInput>) {
  return prisma.accessKey.create({
    data: {
      code,
      ownerId,
      status: 'AVAILABLE',
      maxUses: 1,
      uses: 0,
      ...data,
    },
  });
}
