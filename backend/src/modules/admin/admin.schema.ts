import { UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';

import {
  AuditActions,
  PartShareScopes,
  PunishmentTypes,
  WorkspacePermissionScopes,
} from '../../types/enums';

export const adminUserFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const permissionGrantSchema = z.object({
  userId: z.string().min(1),
  scope: z.enum(WorkspacePermissionScopes),
  notes: z.string().max(280).optional(),
  expiresAt: z.preprocess((value) => {
    if (value === null || value === undefined || value === '') return undefined;
    return new Date(value as string);
  }, z.date().optional()),
});

export const permissionRevokeSchema = z.object({
  permissionId: z.string().min(1),
  reason: z.string().max(280).optional(),
});

export const partShareGrantSchema = z.object({
  granteeId: z.string().min(1),
  scope: z.enum(PartShareScopes),
  notes: z.string().max(280).optional(),
});

export const partShareRevokeSchema = z.object({
  grantId: z.string().min(1),
  reason: z.string().max(280).optional(),
});

export const punishmentCreateSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(PunishmentTypes),
  reason: z.string().min(5).max(500),
  durationHours: z.number().int().positive().optional(),
  endsAt: z.preprocess((value) => {
    if (value === null || value === undefined || value === '') return undefined;
    return new Date(value as string);
  }, z.date().optional()),
  metadata: z.record(z.any()).optional(),
});

export const punishmentLiftSchema = z.object({
  punishmentId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const auditQuerySchema = z.object({
  action: z.enum(AuditActions).optional(),
  targetUserId: z.string().optional(),
  limit: z
    .preprocess((value) => {
      if (value === null || value === undefined || value === '') return undefined;
      if (typeof value === 'string') return Number(value);
      return value;
    }, z.number().int().min(1).max(200).optional())
    .transform((value) => value ?? 100),
});

export const roleUpdateSchema = z.object({
  role: z.nativeEnum(UserRole),
  reason: z.string().max(280).optional(),
});
