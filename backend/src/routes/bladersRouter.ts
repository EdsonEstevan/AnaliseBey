import { Router } from 'express';

import { bladerPayloadSchema, bladerUpdateSchema } from '../modules/bladers/bladers.schema';
import {
  createBlader,
  deleteBlader,
  getBlader,
  listBladers,
  updateBlader,
} from '../modules/bladers/bladers.service';
import { authenticate } from '../middleware/auth';

export const bladersRouter = Router();

bladersRouter.use(authenticate);

bladersRouter.get('/', async (req, res) => {
  const bladers = await listBladers(req.user!.id);
  res.json(bladers);
});

bladersRouter.post('/', async (req, res) => {
  const payload = bladerPayloadSchema.parse(req.body);
  const blader = await createBlader(req.user!.id, payload);
  res.status(201).json(blader);
});

bladersRouter.get('/:id', async (req, res) => {
  const blader = await getBlader(req.user!.id, req.params.id);
  res.json(blader);
});

bladersRouter.put('/:id', async (req, res) => {
  const payload = bladerUpdateSchema.parse(req.body);
  const blader = await updateBlader(req.user!.id, req.params.id, payload);
  res.json(blader);
});

bladersRouter.delete('/:id', async (req, res) => {
  await deleteBlader(req.user!.id, req.params.id);
  res.status(204).end();
});
