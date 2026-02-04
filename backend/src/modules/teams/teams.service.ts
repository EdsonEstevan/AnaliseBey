import { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { AuthUser } from '../../types/auth';
import {
  TeamCreatePayload,
  TeamMemberPermissionPayload,
  TeamMessagePayload,
  TeamMissionCreatePayload,
  TeamMissionDTO,
  TeamMissionReviewPayload,
  TeamMissionSubmitPayload,
} from '../../types/dto';
import { ApiError } from '../../utils/apiError';
import { broadcastTeamMessage } from './teams.stream';

const MAX_TEAMS_PER_USER = 2;
const LEVEL_BASE_XP = 100;

const userPreviewSelect = { id: true, name: true, username: true } as const;
const missionInclude = {
  createdBy: { select: userPreviewSelect },
  assignedTo: { select: userPreviewSelect },
  submittedBy: { select: userPreviewSelect },
  approvedBy: { select: userPreviewSelect },
} satisfies Prisma.TeamMissionInclude;

type MissionWithRelations = Prisma.TeamMissionGetPayload<{ include: typeof missionInclude }>;

function isVisitor(user: AuthUser) {
  return user.role === 'VISITOR';
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function calculateLevel(xp: number) {
  return Math.max(1, Math.floor(xp / LEVEL_BASE_XP) + 1);
}

async function buildUniqueSlug(name: string) {
  const base = toSlug(name) || `equipe-${Math.random().toString(36).slice(2, 6)}`;
  let slug = base;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.team.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function ensureTeamSlots(userId: string) {
  const count = await prisma.teamMembership.count({
    where: { userId, status: 'ACTIVE' },
  });
  if (count >= MAX_TEAMS_PER_USER) {
    throw new ApiError(400, 'Você já participa do limite de equipes permitido.');
  }
}

async function getTeamOrFail(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      memberships: true,
    },
  });
  if (!team) {
    throw new ApiError(404, 'Equipe não encontrada.');
  }
  return team;
}

function serializeTeam(team: Prisma.TeamGetPayload<{ include: { memberships: true } }>, userId: string) {
  const memberCount = team.memberships.filter((membership) => membership.status === 'ACTIVE').length;
  const membership = team.memberships.find((item) => item.userId === userId) ?? null;
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    description: team.description,
    imageUrl: team.imageUrl,
    ownerId: team.ownerId,
    memberCount,
    membership: membership
      ? {
          role: membership.role,
          status: membership.status,
          level: membership.level,
          xp: membership.xp,
          canManageMissions: membership.canManageMissions,
        }
      : null,
  };
}

function serializeMission(mission: MissionWithRelations): TeamMissionDTO {
  return {
    id: mission.id,
    teamId: mission.teamId,
    title: mission.title,
    description: mission.description,
    xpReward: mission.xpReward,
    status: mission.status,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
    createdBy: mission.createdBy,
    assignedTo: mission.assignedTo,
    submittedBy: mission.submittedBy,
    approvedBy: mission.approvedBy,
    submissionNote: mission.submissionNote,
    reviewNote: mission.reviewNote,
    submittedAt: mission.submittedAt,
    approvedAt: mission.approvedAt,
  };
}

async function ensureTeamMembership(user: AuthUser, teamId: string) {
  const membership = await prisma.teamMembership.findFirst({
    where: {
      teamId,
      userId: user.id,
      status: 'ACTIVE',
    },
  });
  if (!membership) {
    throw new ApiError(403, 'Você precisa participar desta equipe.');
  }
  return membership;
}

async function ensureMissionManager(user: AuthUser, teamId: string) {
  const membership = await ensureTeamMembership(user, teamId);
  if (membership.role !== 'OWNER' && !membership.canManageMissions) {
    throw new ApiError(403, 'Apenas o proprietário ou membros autorizados podem gerenciar missões.');
  }
  return membership;
}

async function ensureTeamMemberUser(teamId: string, userId: string) {
  const membership = await prisma.teamMembership.findFirst({
    where: { teamId, userId, status: 'ACTIVE' },
  });
  if (!membership) {
    throw new ApiError(404, 'Membro não encontrado na equipe.');
  }
  return membership;
}

async function findMissionOrFail(missionId: string) {
  const mission = await prisma.teamMission.findUnique({
    where: { id: missionId },
    include: missionInclude,
  });
  if (!mission) {
    throw new ApiError(404, 'Missão não encontrada.');
  }
  return mission;
}

async function grantMissionXp(teamId: string, userId: string | null, xpReward: number) {
  if (!userId || xpReward <= 0) return;
  const membership = await prisma.teamMembership.findFirst({
    where: { teamId, userId, status: 'ACTIVE' },
  });
  if (!membership) return;
  const nextXp = membership.xp + xpReward;
  const nextLevel = calculateLevel(nextXp);
  await prisma.teamMembership.update({
    where: { id: membership.id },
    data: {
      xp: nextXp,
      level: nextLevel,
      lastXpAt: new Date(),
    },
  });
}

export async function listTeams(user: AuthUser) {
  const teams = await prisma.team.findMany({
    include: {
      memberships: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return teams.map((team) => serializeTeam(team, user.id));
}

export async function listUserTeams(user: AuthUser) {
  const teams = await prisma.team.findMany({
    where: {
      memberships: {
        some: {
          userId: user.id,
          status: 'ACTIVE',
        },
      },
    },
    include: {
      memberships: true,
    },
    orderBy: { name: 'asc' },
  });
  return teams.map((team) => serializeTeam(team, user.id));
}

export async function createTeam(user: AuthUser, payload: TeamCreatePayload) {
  if (isVisitor(user)) {
    throw new ApiError(403, 'Visitantes não podem criar equipes.');
  }
  await ensureTeamSlots(user.id);
  const slug = await buildUniqueSlug(payload.name);
  const team = await prisma.team.create({
    data: {
      name: payload.name.trim(),
      slug,
      description: payload.description?.trim(),
      imageUrl: payload.imageUrl ?? null,
      ownerId: user.id,
      memberships: {
        create: {
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
          canManageMissions: true,
        },
      },
    },
    include: {
      memberships: true,
    },
  });
  return serializeTeam(team, user.id);
}

export async function joinTeam(user: AuthUser, teamId: string) {
  if (isVisitor(user)) {
    throw new ApiError(403, 'Visitantes não podem entrar em equipes.');
  }
  const team = await getTeamOrFail(teamId);
  const existing = team.memberships.find((membership) => membership.userId === user.id);
  if (existing) {
    if (existing.status === 'ACTIVE') {
      return serializeTeam(team, user.id);
    }
    await prisma.teamMembership.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE' },
    });
    const refreshed = await prisma.team.findUnique({
      where: { id: teamId },
      include: { memberships: true },
    });
    return serializeTeam(refreshed!, user.id);
  }
  await ensureTeamSlots(user.id);
  await prisma.teamMembership.create({
    data: {
      teamId,
      userId: user.id,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });
  const refreshed = await prisma.team.findUnique({
    where: { id: teamId },
    include: { memberships: true },
  });
  return serializeTeam(refreshed!, user.id);
}

export async function leaveTeam(user: AuthUser, teamId: string) {
  const membership = await prisma.teamMembership.findFirst({
    where: { teamId, userId: user.id, status: 'ACTIVE' },
  });
  if (!membership) {
    throw new ApiError(404, 'Você não participa desta equipe.');
  }
  if (membership.role === 'OWNER') {
    throw new ApiError(400, 'Transfira ou encerre a equipe antes de sair.');
  }
  await prisma.teamMembership.delete({ where: { id: membership.id } });
  return { success: true };
}

export async function updateMemberPermissions(
  user: AuthUser,
  teamId: string,
  memberId: string,
  payload: TeamMemberPermissionPayload,
) {
  const actor = await ensureMissionManager(user, teamId);
  if (actor.role !== 'OWNER') {
    throw new ApiError(403, 'Somente o proprietário pode delegar permissões.');
  }
  if (actor.id === memberId) {
    throw new ApiError(400, 'Sua permissão já é elevada como líder.');
  }
  const target = await prisma.teamMembership.findUnique({ where: { id: memberId } });
  if (!target || target.teamId !== teamId) {
    throw new ApiError(404, 'Membro não encontrado.');
  }
  await prisma.teamMembership.update({
    where: { id: memberId },
    data: { canManageMissions: payload.canManageMissions },
  });
  return { success: true };
}

export async function getTeamDashboard(user: AuthUser, teamId: string) {
  await ensureTeamMembership(user, teamId);
  const members = await prisma.teamMembership.findMany({
    where: { teamId, status: 'ACTIVE' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  if (!members.length) {
    throw new ApiError(404, 'Equipe sem integrantes.');
  }
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const memberIds = members.map((member) => member.userId);
  const combos = await prisma.combo.findMany({
    where: { userId: { in: memberIds } },
    include: {
      blade: true,
      ratchet: true,
      bit: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  const battles = await prisma.battle.findMany({
    where: { userId: { in: memberIds } },
    include: {
      arena: true,
      comboA: true,
      comboB: true,
    },
    orderBy: { occurredAt: 'desc' },
    take: 100,
  });

  return {
    team,
    members,
    stats: {
      combos: combos.length,
      battles: battles.length,
    },
    combos,
    battles,
  };
}

export async function listTeamMessages(user: AuthUser, teamId: string, limit = 50) {
  await ensureTeamMembership(user, teamId);
  const messages = await prisma.teamMessage.findMany({
    where: { teamId },
    include: {
      user: {
        select: userPreviewSelect,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return messages.reverse();
}

export async function postTeamMessage(user: AuthUser, teamId: string, payload: TeamMessagePayload) {
  await ensureTeamMembership(user, teamId);
  const message = await prisma.teamMessage.create({
    data: {
      teamId,
      userId: user.id,
      content: payload.content.trim(),
    },
    include: {
      user: {
        select: userPreviewSelect,
      },
    },
  });
  broadcastTeamMessage(teamId, message);
  return message;
}

export async function listTeamMissions(user: AuthUser, teamId: string) {
  await ensureTeamMembership(user, teamId);
  const missions = await prisma.teamMission.findMany({
    where: { teamId },
    include: missionInclude,
    orderBy: { createdAt: 'desc' },
  });
  return missions.map(serializeMission);
}

export async function createTeamMission(
  user: AuthUser,
  teamId: string,
  payload: TeamMissionCreatePayload,
) {
  await ensureMissionManager(user, teamId);
  let assignedToId: string | null = null;
  if (payload.assignedToId) {
    await ensureTeamMemberUser(teamId, payload.assignedToId);
    assignedToId = payload.assignedToId;
  }
  const mission = await prisma.teamMission.create({
    data: {
      teamId,
      title: payload.title.trim(),
      description: payload.description?.trim(),
      xpReward: payload.xpReward ?? 25,
      createdById: user.id,
      assignedToId,
    },
    include: missionInclude,
  });
  return serializeMission(mission);
}

export async function submitTeamMission(
  user: AuthUser,
  missionId: string,
  payload: TeamMissionSubmitPayload,
) {
  const mission = await findMissionOrFail(missionId);
  await ensureTeamMembership(user, mission.teamId);
  if (mission.status === 'APPROVED') {
    throw new ApiError(400, 'Esta missão já foi aprovada.');
  }
  if (mission.status === 'SUBMITTED') {
    throw new ApiError(400, 'A missão aguarda revisão.');
  }
  if (mission.assignedToId && mission.assignedToId !== user.id) {
    throw new ApiError(403, 'A missão pertence a outro integrante.');
  }
  const updated = await prisma.teamMission.update({
    where: { id: missionId },
    data: {
      status: 'SUBMITTED',
      submittedById: user.id,
      submittedAt: new Date(),
      submissionNote: payload.note ?? null,
    },
    include: missionInclude,
  });
  return serializeMission(updated);
}

export async function reviewTeamMission(
  user: AuthUser,
  missionId: string,
  payload: TeamMissionReviewPayload,
) {
  const mission = await findMissionOrFail(missionId);
  await ensureMissionManager(user, mission.teamId);
  if (mission.status !== 'SUBMITTED') {
    throw new ApiError(400, 'Somente missões enviadas podem ser avaliadas.');
  }
  const approve = payload.action === 'APPROVE';
  const updated = await prisma.teamMission.update({
    where: { id: missionId },
    data: {
      status: approve ? 'APPROVED' : 'REJECTED',
      approvedById: approve ? user.id : null,
      approvedAt: approve ? new Date() : null,
      reviewNote: payload.note ?? null,
    },
    include: missionInclude,
  });
  if (approve) {
    const xpTarget = mission.submittedBy?.id ?? mission.submittedById ?? mission.assignedTo?.id ?? mission.assignedToId;
    await grantMissionXp(mission.teamId, xpTarget ?? null, mission.xpReward);
  }
  return serializeMission(updated);
}
