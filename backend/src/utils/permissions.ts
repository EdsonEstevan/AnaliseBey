import { PunishmentType, WorkspacePermissionScope } from '@prisma/client';

import { AuthUser } from '../types/auth';
import { ApiError } from './apiError';

export function hasWorkspaceScope(user: AuthUser, scope: WorkspacePermissionScope) {
  return user.role === 'ADMIN' || user.permissions.includes(scope);
}

export function assertWorkspaceScope(user: AuthUser, scope: WorkspacePermissionScope, message?: string) {
  if (!hasWorkspaceScope(user, scope)) {
    throw new ApiError(403, message ?? 'Permissão insuficiente para esta ação.');
  }
}

export function canEditSharedParts(user: AuthUser) {
  return user.role === 'ADMIN' || user.sharedPartsScope === 'EDIT';
}

export function hasPunishment(user: AuthUser, type: PunishmentType) {
  return user.activePunishments.includes(type);
}
