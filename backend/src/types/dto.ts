import {
  Archetype,
  AuditAction,
  BattleMode,
  BattleOutcome,
  ComboStatus,
  PartShareScope,
  PartType,
  PunishmentType,
  TeamMembershipStatus,
  TeamMissionStatus,
  TeamRole,
  WorkspacePermissionScope,
} from './enums';
import { UserRole, UserStatus } from '@prisma/client';

export type PartPayload = {
  name: string;
  type: PartType;
  variant?: string;
  weight?: number;
  archetype: Archetype;
  subArchetype?: string | null;
  tags?: string[];
  notes?: string;
  imageUrl?: string | null;
};

export type ArenaPayload = {
  name: string;
  model?: string;
  tags?: string[];
  notes?: string;
};

export type ComboPayload = {
  bladeId: string;
  ratchetId: string;
  bitId: string;
  assistBladeId?: string | null;
  lockChipId?: string | null;
  tags?: string[];
  notes?: string;
  status?: ComboStatus;
  imageUrl?: string | null;
};

export type BattlePayload = {
  comboAId: string;
  comboBId: string;
  bladerAId?: string | null;
  bladerBId?: string | null;
  result: BattleOutcome;
  mode?: BattleMode;
  score?: string;
  victoryType?: string;
  arenaId?: string;
  notes?: string;
  occurredAt?: Date | string | null;
  turns?: BattleTurnPayload[];
};

export type BattleTurnPayload = {
  winner: BattleOutcome;
  victoryType?: string;
  notes?: string;
};

export type DeckPayload = {
  name: string;
  side?: 'A' | 'B' | 'FLEX';
  notes?: string;
  comboIds: string[];
  maxTurns?: number;
  bladerId?: string | null;
};

export type BladerPayload = {
  name: string;
  nickname?: string | null;
  age?: number | null;
  country?: string | null;
  team?: string | null;
  notes?: string | null;
};

export type AssistantContextPayload = {
  route?: string;
  surface?: string;
  focus?: string;
  summary?: Record<string, unknown>;
};

export type AssistantSessionPayload = {
  sessionId?: string;
  context?: AssistantContextPayload;
};

export type AssistantMessagePayload = AssistantSessionPayload & {
  message: string;
};

export type AssistantMissionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'BLOCKED';

export type AssistantMissionUpdatePayload = {
  status: AssistantMissionStatus;
  note?: string;
};

export type AdminUserFilters = {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
};

export type PermissionGrantPayload = {
  userId: string;
  scope: WorkspacePermissionScope;
  notes?: string;
  expiresAt?: string | Date | null;
};

export type PermissionRevokePayload = {
  permissionId: string;
  reason?: string;
};

export type PartShareGrantPayload = {
  granteeId: string;
  scope: PartShareScope;
  notes?: string;
};

export type PartShareRevokePayload = {
  grantId: string;
  reason?: string;
};

export type PunishmentPayload = {
  userId: string;
  type: PunishmentType;
  reason: string;
  durationHours?: number;
  endsAt?: string | Date | null;
  metadata?: Record<string, unknown>;
};

export type PunishmentLiftPayload = {
  punishmentId: string;
  reason?: string;
};

export type AuditQueryFilters = {
  action?: AuditAction;
  targetUserId?: string;
  limit?: number;
};

export type TeamCreatePayload = {
  name: string;
  description?: string;
  imageUrl?: string | null;
};

export type TeamJoinPayload = {
  teamId: string;
};

export type TeamMessagePayload = {
  content: string;
};

export type TeamMemberPermissionPayload = {
  canManageMissions: boolean;
};

export type TeamMissionCreatePayload = {
  title: string;
  description?: string;
  xpReward?: number;
  assignedToId?: string | null;
};

export type TeamMissionSubmitPayload = {
  note?: string;
};

export type TeamMissionReviewPayload = {
  action: 'APPROVE' | 'REJECT';
  note?: string;
};

export type TeamMissionDTO = {
  id: string;
  teamId: string;
  title: string;
  description?: string | null;
  xpReward: number;
  status: TeamMissionStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
    username: string;
  };
  assignedTo?: {
    id: string;
    name: string | null;
    username: string;
  } | null;
  submittedBy?: {
    id: string;
    name: string | null;
    username: string;
  } | null;
  approvedBy?: {
    id: string;
    name: string | null;
    username: string;
  } | null;
  submissionNote?: string | null;
  reviewNote?: string | null;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
};

export type TeamListItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  ownerId: string;
  memberCount: number;
  membership?: {
    role: TeamRole;
    status: TeamMembershipStatus;
    level: number;
    xp: number;
    canManageMissions: boolean;
  } | null;
};
