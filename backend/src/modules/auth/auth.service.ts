import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  AccessKeyStatus,
  PartShareGrant,
  PartShareScope,
  Prisma,
  Punishment,
  PunishmentType,
  User,
  WorkspacePermission,
  WorkspacePermissionScope,
} from '@prisma/client';

import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { AuthResult, AuthTokenPayload, AuthUser } from '../../types/auth';
import { ApiError, badRequest } from '../../utils/apiError';

const TOKEN_TTL = '7d';

type UserWithContext = User & {
  permissions?: WorkspacePermission[];
  partShareAccess?: PartShareGrant[];
  punishments?: Punishment[];
};

const authUserInclude = {
  permissions: true,
  partShareAccess: true,
  punishments: true,
} satisfies Prisma.UserInclude;

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeAccessCode(value: string) {
  return value.trim().toUpperCase();
}

function collectActivePermissions(perms?: WorkspacePermission[]) {
  if (!perms?.length) return [] as WorkspacePermissionScope[];
  const now = new Date();
  return Array.from(
    new Set(
      perms
        .filter((perm) => !perm.revokedAt && (!perm.expiresAt || perm.expiresAt > now))
        .map((perm) => perm.scope),
    ),
  );
}

function buildSharedPartAccess(grants?: PartShareGrant[]) {
  const access: Record<string, PartShareScope> = {};
  if (!grants?.length) return access;
  grants.forEach((grant) => {
    if (grant.revokedAt) {
      return;
    }
    if (access[grant.ownerId] === 'EDIT') {
      return;
    }
    if (grant.scope === 'EDIT') {
      access[grant.ownerId] = 'EDIT';
      return;
    }
    if (!access[grant.ownerId]) {
      access[grant.ownerId] = grant.scope;
    }
  });
  return access;
}

function resolveSharedPartScope(access: Record<string, PartShareScope>) {
  const scopes = Object.values(access);
  if (!scopes.length) {
    return null;
  }
  if (scopes.includes('EDIT')) {
    return 'EDIT' as PartShareScope;
  }
  if (scopes.includes('VIEW')) {
    return 'VIEW' as PartShareScope;
  }
  return null;
}

function collectActivePunishments(list?: Punishment[]) {
  if (!list?.length) return [] as PunishmentType[];
  const now = new Date();
  return list
    .filter((punishment) => !punishment.revokedAt && (!punishment.endsAt || punishment.endsAt > now))
    .map((punishment) => punishment.type);
}

export function mapAuthUser(user: UserWithContext): AuthUser {
  const sharedPartAccess = buildSharedPartAccess(user.partShareAccess);
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    battleMilestone: user.battleMilestone,
    permissions: collectActivePermissions(user.permissions),
    sharedPartAccess,
    sharedPartsScope: resolveSharedPartScope(sharedPartAccess),
    activePunishments: collectActivePunishments(user.punishments),
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
  return prisma.user.findUnique({ where: { username }, include: authUserInclude });
}

async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, include: authUserInclude });
}

async function grantDefaultPartView(granteeId: string) {
  const owner = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!owner) return;
  await prisma.partShareGrant.createMany({
    data: [
      {
        ownerId: owner.id,
        granteeId,
        scope: 'VIEW',
        notes: 'Acesso automático ao catálogo compartilhado.',
      },
    ],
    skipDuplicates: true,
  });
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
  const visitor = await prisma.user.findFirst({
    where: { role: 'VISITOR' },
    orderBy: { createdAt: 'asc' },
    include: authUserInclude,
  });
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
  email: string;
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

  const normalizedEmail = normalizeEmail(payload.email);
  const emailInUse = await findUserByEmail(normalizedEmail);
  if (emailInUse) {
    throw badRequest('Já existe um usuário com este e-mail.');
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: payload.name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  await grantDefaultPartView(user.id);

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

  const hydrated = await prisma.user.findUnique({ where: { id: user.id }, include: authUserInclude });
  if (!hydrated) {
    throw new ApiError(500, 'Não foi possível carregar o usuário recém-criado.');
  }
  return { token: signToken(user), user: mapAuthUser(hydrated) } satisfies AuthResult;
}

export async function getProfile(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: authUserInclude });
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
