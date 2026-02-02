import { Router } from 'express';
import { z } from 'zod';

import {
  assistantMessageSchema,
  assistantMissionUpdateSchema,
  assistantSessionSchema,
} from '../modules/assistant/assistant.schema';
import {
  bootstrapAssistant,
  listAssistantMissions,
  processAssistantMessage,
  updateAssistantContext,
  updateAssistantMission,
} from '../modules/assistant/assistant.service';

export const assistantRouter = Router();

assistantRouter.post('/session', async (req, res) => {
  const payload = assistantSessionSchema.parse(req.body);
  const data = await bootstrapAssistant(payload);
  res.json(data);
});

assistantRouter.post('/context', async (req, res) => {
  const payload = assistantSessionSchema.parse(req.body);
  const data = await updateAssistantContext(payload);
  res.json(data);
});

assistantRouter.post('/message', async (req, res) => {
  const payload = assistantMessageSchema.parse(req.body);
  const data = await processAssistantMessage(payload);
  res.json(data);
});

assistantRouter.get('/missions', async (req, res) => {
  const schema = z.object({ sessionId: z.string().cuid() });
  const { sessionId } = schema.parse(req.query);
  const missions = await listAssistantMissions(sessionId);
  res.json({ missions });
});

assistantRouter.patch('/missions/:id', async (req, res) => {
  const schema = z.object({ sessionId: z.string().cuid() });
  const { sessionId } = schema.parse(req.body);
  const updates = assistantMissionUpdateSchema.parse(req.body);
  const mission = await updateAssistantMission(sessionId, req.params.id, updates.status, updates.note);
  res.json(mission);
});
