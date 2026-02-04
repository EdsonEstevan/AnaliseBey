import { Router } from 'express';
import { z } from 'zod';

import {
  createTeam,
  createTeamMission,
  getTeamDashboard,
  joinTeam,
  leaveTeam,
  listTeamMessages,
  listTeamMissions,
  listTeams,
  listUserTeams,
  postTeamMessage,
  reviewTeamMission,
  submitTeamMission,
  updateMemberPermissions,
} from '../modules/teams/teams.service';
import {
  teamCreateSchema,
  teamMemberPermissionSchema,
  teamMessageSchema,
  teamMissionCreateSchema,
  teamMissionReviewSchema,
  teamMissionSubmitSchema,
} from '../modules/teams/teams.schema';
import { authenticate } from '../middleware/auth';
import {
  registerTeamStream,
  sendInitialMessages,
  unregisterTeamStream,
} from '../modules/teams/teams.stream';

export const teamsRouter = Router();

teamsRouter.use(authenticate);

teamsRouter.get('/', async (req, res) => {
  const teams = await listTeams(req.user!);
  res.json(teams);
});

teamsRouter.get('/mine', async (req, res) => {
  const teams = await listUserTeams(req.user!);
  res.json(teams);
});

teamsRouter.post('/', async (req, res) => {
  const payload = teamCreateSchema.parse(req.body);
  const team = await createTeam(req.user!, payload);
  res.status(201).json(team);
});

teamsRouter.post('/:teamId/join', async (req, res) => {
  const team = await joinTeam(req.user!, req.params.teamId);
  res.json(team);
});

teamsRouter.post('/:teamId/leave', async (req, res) => {
  const result = await leaveTeam(req.user!, req.params.teamId);
  res.json(result);
});

teamsRouter.get('/:teamId/dashboard', async (req, res) => {
  const dashboard = await getTeamDashboard(req.user!, req.params.teamId);
  res.json(dashboard);
});

teamsRouter.patch('/:teamId/members/:memberId/permissions', async (req, res) => {
  const payload = teamMemberPermissionSchema.parse(req.body);
  const result = await updateMemberPermissions(
    req.user!,
    req.params.teamId,
    req.params.memberId,
    payload,
  );
  res.json(result);
});

teamsRouter.get('/:teamId/missions', async (req, res) => {
  const missions = await listTeamMissions(req.user!, req.params.teamId);
  res.json(missions);
});

teamsRouter.post('/:teamId/missions', async (req, res) => {
  const payload = teamMissionCreateSchema.parse(req.body);
  const mission = await createTeamMission(req.user!, req.params.teamId, payload);
  res.status(201).json(mission);
});

teamsRouter.post('/:teamId/missions/:missionId/submit', async (req, res) => {
  const payload = teamMissionSubmitSchema.parse(req.body ?? {});
  const mission = await submitTeamMission(req.user!, req.params.missionId, payload);
  res.json(mission);
});

teamsRouter.post('/:teamId/missions/:missionId/review', async (req, res) => {
  const payload = teamMissionReviewSchema.parse(req.body);
  const mission = await reviewTeamMission(req.user!, req.params.missionId, payload);
  res.json(mission);
});

teamsRouter.get('/:teamId/messages/stream', async (req, res) => {
  const messages = await listTeamMessages(req.user!, req.params.teamId, 50);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const client = registerTeamStream(req.params.teamId, res);
  sendInitialMessages(res, messages);

  const cleanup = () => unregisterTeamStream(req.params.teamId, client);
  req.on('close', cleanup);
  req.on('error', cleanup);
});

teamsRouter.get('/:teamId/messages', async (req, res) => {
  const schema = z.object({ limit: z.coerce.number().min(1).max(200).optional() });
  const { limit } = schema.parse(req.query);
  const messages = await listTeamMessages(req.user!, req.params.teamId, limit ?? 50);
  res.json(messages);
});

teamsRouter.post('/:teamId/messages', async (req, res) => {
  const payload = teamMessageSchema.parse(req.body);
  const message = await postTeamMessage(req.user!, req.params.teamId, payload);
  res.status(201).json(message);
});
