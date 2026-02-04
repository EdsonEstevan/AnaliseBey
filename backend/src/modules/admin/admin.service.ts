import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { AuditAction, PartShareGrant, Prisma, PunishmentType, UserRole } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { AuthUser } from '../../types/auth';
import {
  AdminUserFilters,
  AuditQueryFilters,
  PartShareGrantPayload,
  PartShareRevokePayload,
  PermissionGrantPayload,
  PermissionRevokePayload,
  PunishmentLiftPayload,
  PunishmentPayload,
} from '../../types/dto';
import { ApiError } from '../../utils/apiError';
import { assertWorkspaceScope } from '../../utils/permissions';
import { mapAuthUser } from '../auth/auth.service';

function buildSearchFilter(search?: string) {
  if (!search?.trim()) return {};
  const term = search.trim();
  return {
    OR: [
      { name: { contains: term, mode: 'insensitive' as const } },
      { email: { contains: term, mode: 'insensitive' as const } },
      { username: { contains: term, mode: 'insensitive' as const } },
    ],
  } satisfies Prisma.UserWhereInput;
}

async function logAudit(
  actorId: string,
  action: AuditAction,
  metadata: Record<string, unknown> = {},
  targetUserId?: string,
  targetType?: string,
  targetId?: string,
) {
  const metadataPayload: Prisma.InputJsonValue | undefined = Object.keys(metadata).length
    ? (metadata as Prisma.InputJsonValue)
    : undefined;
  await prisma.adminAuditLog.create({
    data: {
      actorId,
      action,
      metadata: metadataPayload,
      targetUserId,
      targetType,
      targetId,
    },
  });
}

export async function listUsers(actor: AuthUser, filters: AdminUserFilters = {}) {
  assertWorkspaceScope(actor, 'USERS_MANAGE');
  const where: Prisma.UserWhereInput = {
    ...buildSearchFilter(filters.search),
    role: filters.role,
    status: filters.status,
  };
  const now = new Date();
  const users = await prisma.user.findMany({
    where,
    include: {
      permissions: { where: { revokedAt: null } },
      partShareAccess: { where: { revokedAt: null } },
      partShareGrants: { where: { revokedAt: null } },
      punishments: {
        where: {
          revokedAt: null,
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      },
      _count: {
        select: { parts: true, combos: true, arenas: true, battles: true, decks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => ({
    summary: mapAuthUser(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    stats: user._count,
    permissions: user.permissions,
    partShares: user.partShareAccess,
    shareGrants: user.partShareGrants,
    punishments: user.punishments,
  }));
}

export async function grantWorkspacePermission(actor: AuthUser, payload: PermissionGrantPayload) {
  assertWorkspaceScope(actor, 'USERS_MANAGE');
  const permission = await prisma.workspacePermission.create({
    data: {
      userId: payload.userId,
      grantedById: actor.id,
      scope: payload.scope,
      notes: payload.notes,
      expiresAt: payload.expiresAt ?? undefined,
    },
  });
  await logAudit(actor.id, 'PERMISSION_GRANTED', { scope: permission.scope }, payload.userId, 'WorkspacePermission', permission.id);
  return permission;
}

export async function revokeWorkspacePermission(actor: AuthUser, payload: PermissionRevokePayload) {
  assertWorkspaceScope(actor, 'USERS_MANAGE');
  const permission = await prisma.workspacePermission.findUnique({ where: { id: payload.permissionId } });
  if (!permission) {
    throw new ApiError(404, 'Permissão não encontrada.');
  }
  if (permission.revokedAt) {
    return permission;
  }
  const updated = await prisma.workspacePermission.update({
    where: { id: permission.id },
    data: { revokedAt: new Date(), notes: payload.reason ?? permission.notes },
  });
  await logAudit(actor.id, 'PERMISSION_REVOKED', { scope: updated.scope, reason: payload.reason }, updated.userId, 'WorkspacePermission', updated.id);
  return updated;
}

export async function grantPartShare(actor: AuthUser, payload: PartShareGrantPayload) {
  assertWorkspaceScope(actor, 'PARTS_EDIT');
  const ownerId = actor.id;
  const existing = await prisma.partShareGrant.findFirst({
    where: { ownerId, granteeId: payload.granteeId, scope: payload.scope },
  });
  let grant: PartShareGrant;
  if (existing) {
    grant = await prisma.partShareGrant.update({
      where: { id: existing.id },
      data: { notes: payload.notes ?? existing.notes, revokedAt: null },
    });
  } else {
    grant = await prisma.partShareGrant.create({
      data: {
        ownerId,
        granteeId: payload.granteeId,
        scope: payload.scope,
        notes: payload.notes,
      },
    });
  }
  await logAudit(actor.id, 'PART_PERMISSION_GRANTED', { scope: payload.scope }, payload.granteeId, 'PartShareGrant', grant.id);
  return grant;
}

export async function revokePartShare(actor: AuthUser, payload: PartShareRevokePayload) {
  assertWorkspaceScope(actor, 'PARTS_EDIT');
  const grant = await prisma.partShareGrant.findUnique({ where: { id: payload.grantId } });
  if (!grant) {
    throw new ApiError(404, 'Compartilhamento não encontrado.');
  }
  if (grant.ownerId !== actor.id && actor.role !== 'ADMIN') {
    throw new ApiError(403, 'Você não pode alterar permissões de outro mantenedor.');
  }
  if (grant.revokedAt) {
    return grant;
  }
  const updated = await prisma.partShareGrant.update({
    where: { id: grant.id },
    data: { revokedAt: new Date(), notes: payload.reason ?? grant.notes },
  });
  await logAudit(actor.id, 'PART_PERMISSION_REVOKED', { reason: payload.reason }, grant.granteeId, 'PartShareGrant', grant.id);
  return updated;
}

function resolveEndsAt(payload: PunishmentPayload) {
  if (payload.endsAt) return new Date(payload.endsAt);
  if (payload.durationHours) {
    return new Date(Date.now() + payload.durationHours * 60 * 60 * 1000);
  }
  return null;
}

async function applyBanSideEffects(userId: string, type: PunishmentType) {
  if (type !== 'TEMP_BAN') return;
  await prisma.user.update({ where: { id: userId }, data: { status: 'BANNED' } });
}

async function liftBanIfNeeded(userId: string) {
  const remaining = await prisma.punishment.count({
    where: {
      userId,
      type: 'TEMP_BAN',
      revokedAt: null,
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
  });
  if (remaining === 0) {
    await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
  }
}

export async function applyPunishment(actor: AuthUser, payload: PunishmentPayload) {
  assertWorkspaceScope(actor, 'PUNISHMENTS_MANAGE');
  const endsAt = resolveEndsAt(payload);
  const punishment = await prisma.punishment.create({
    data: {
      userId: payload.userId,
      issuedById: actor.id,
      type: payload.type,
      reason: payload.reason,
      metadata: (payload.metadata ?? null) as Prisma.InputJsonValue,
      endsAt,
    },
  });
  await applyBanSideEffects(payload.userId, payload.type);
  await logAudit(actor.id, 'USER_PUNISHED', { type: payload.type, reason: payload.reason }, payload.userId, 'Punishment', punishment.id);
  return punishment;
}

export async function liftPunishment(actor: AuthUser, payload: PunishmentLiftPayload) {
  assertWorkspaceScope(actor, 'PUNISHMENTS_MANAGE');
  const punishment = await prisma.punishment.findUnique({ where: { id: payload.punishmentId } });
  if (!punishment) {
    throw new ApiError(404, 'Punição não encontrada.');
  }
  if (punishment.revokedAt) {
    return punishment;
  }
  const baseMetadata =
    typeof punishment.metadata === 'object' && punishment.metadata !== null
      ? { ...(punishment.metadata as Record<string, unknown>) }
      : {};
  if (payload.reason) {
    baseMetadata.revokeReason = payload.reason;
  }
  const updated = await prisma.punishment.update({
    where: { id: punishment.id },
    data: { revokedAt: new Date(), metadata: baseMetadata as Prisma.InputJsonValue },
  });
  if (punishment.type === 'TEMP_BAN') {
    await liftBanIfNeeded(punishment.userId);
  }
  await logAudit(actor.id, 'USER_UNPUNISHED', { punishmentId: punishment.id, reason: payload.reason }, punishment.userId, 'Punishment', punishment.id);
  return updated;
}

export async function resetUserPassword(actor: AuthUser, userId: string) {
  assertWorkspaceScope(actor, 'USERS_MANAGE');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'Usuário não encontrado.');
  }
  const newPassword = randomBytes(8).toString('base64');
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordNote: newPassword },
  });
  await logAudit(actor.id, 'PASSWORD_RESET', { userId }, userId, 'User', userId);
  return { userId: user.id, password: newPassword };
}

export async function updateUserRole(actor: AuthUser, userId: string, role: UserRole, reason?: string) {
  assertWorkspaceScope(actor, 'USERS_MANAGE');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'Usuário não encontrado.');
  }
  if (user.role === role) {
    return user;
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role } });
  await logAudit(actor.id, 'USER_ROLE_CHANGED', { from: user.role, to: role, reason }, userId, 'User', userId);
  return updated;
}

export async function listAuditLogs(actor: AuthUser, filters: AuditQueryFilters = {}) {
  assertWorkspaceScope(actor, 'AUDIT_VIEW');
  const logs = await prisma.adminAuditLog.findMany({
    where: {
      action: filters.action,
      targetUserId: filters.targetUserId,
    },
    include: {
      actor: { select: { id: true, name: true, username: true } },
      targetUser: { select: { id: true, name: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ?? 100,
  });
  return logs;
}

export async function describeUser(actor: AuthUser, userId: string) {
  assertWorkspaceScope(actor, 'USERS_MANAGE');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissions: true,
      partShareAccess: true,
      punishments: true,
    },
  });
  if (!user) {
    throw new ApiError(404, 'Usuário não encontrado.');
  }
  return mapAuthUser(user);
}
