const partTypes = ['BLADE', 'ASSIST', 'RATCHET', 'BIT', 'RATCHET_BIT', 'LOCK_CHIP'] as const;
export type PartType = (typeof partTypes)[number];
export const PartTypes = [...partTypes] as [PartType, ...PartType[]];

const archetypes = ['ATTACK', 'DEFENSE', 'STAMINA', 'BALANCE'] as const;
export type Archetype = (typeof archetypes)[number];
export const Archetypes = [...archetypes] as [Archetype, ...Archetype[]];

const comboStatuses = ['ACTIVE', 'ARCHIVED'] as const;
export type ComboStatus = (typeof comboStatuses)[number];
export const ComboStatuses = [...comboStatuses] as [ComboStatus, ...ComboStatus[]];

const battleOutcomes = ['COMBO_A', 'COMBO_B', 'DRAW'] as const;
export type BattleOutcome = (typeof battleOutcomes)[number];
export const BattleOutcomes = [...battleOutcomes] as [BattleOutcome, ...BattleOutcome[]];

const battleModes = ['OFFICIAL_3ON3', 'REGIONAL_CIRCUIT', 'LONG_TRAINING', 'CUSTOM'] as const;
export type BattleMode = (typeof battleModes)[number];
export const BattleModes = [...battleModes] as [BattleMode, ...BattleMode[]];

const workspacePermissionScopes = [
	'PARTS_EDIT',
	'USERS_MANAGE',
	'ACCESS_KEYS_MANAGE',
	'PUNISHMENTS_MANAGE',
	'AUDIT_VIEW',
] as const;
export type WorkspacePermissionScope = (typeof workspacePermissionScopes)[number];
export const WorkspacePermissionScopes = [...workspacePermissionScopes] as [
	WorkspacePermissionScope,
	...WorkspacePermissionScope[]
];

const partShareScopes = ['VIEW', 'EDIT'] as const;
export type PartShareScope = (typeof partShareScopes)[number];
export const PartShareScopes = [...partShareScopes] as [PartShareScope, ...PartShareScope[]];

const punishmentTypes = ['TEMP_BAN', 'PARTS_LOCK', 'KEYS_LOCK', 'ACCOUNT_LIMIT'] as const;
export type PunishmentType = (typeof punishmentTypes)[number];
export const PunishmentTypes = [...punishmentTypes] as [PunishmentType, ...PunishmentType[]];

const auditActions = [
	'USER_CREATED',
	'USER_UPDATED',
	'USER_ROLE_CHANGED',
	'USER_PUNISHED',
	'USER_UNPUNISHED',
	'ACCESS_KEY_CREATED',
	'ACCESS_KEY_REVOKED',
	'PERMISSION_GRANTED',
	'PERMISSION_REVOKED',
	'PART_PERMISSION_GRANTED',
	'PART_PERMISSION_REVOKED',
	'PASSWORD_RESET',
	'DATA_TRANSFERRED',
] as const;
export type AuditAction = (typeof auditActions)[number];
export const AuditActions = [...auditActions] as [AuditAction, ...AuditAction[]];

const teamRoles = ['OWNER', 'MEMBER'] as const;
export type TeamRole = (typeof teamRoles)[number];
export const TeamRoles = [...teamRoles] as [TeamRole, ...TeamRole[]];

const teamMembershipStatuses = ['ACTIVE', 'PENDING'] as const;
export type TeamMembershipStatus = (typeof teamMembershipStatuses)[number];
export const TeamMembershipStatuses = [...teamMembershipStatuses] as [
	TeamMembershipStatus,
	...TeamMembershipStatus[]
];

const teamMissionStatuses = ['OPEN', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export type TeamMissionStatus = (typeof teamMissionStatuses)[number];
export const TeamMissionStatuses = [...teamMissionStatuses] as [
	TeamMissionStatus,
	...TeamMissionStatus[]
];
