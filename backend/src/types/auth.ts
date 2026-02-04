import { UserRole, UserStatus } from '@prisma/client';

import { PartShareScope, PunishmentType, WorkspacePermissionScope } from './enums';

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  battleMilestone: number;
  permissions: WorkspacePermissionScope[];
  sharedPartsScope: PartShareScope | null;
  sharedPartAccess: Record<string, PartShareScope>;
  activePunishments: PunishmentType[];
};

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};
