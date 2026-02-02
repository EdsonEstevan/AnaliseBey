import { Router } from 'express';

import { bladerPayloadSchema, bladerUpdateSchema } from '../modules/bladers/bladers.schema';
import {
  createBlader,
  deleteBlader,
  getBlader,
  listBladers,
  updateBlader,
} from '../modules/bladers/bladers.service';

export const bladersRouter = Router();

bladersRouter.get('/', async (_req, res) => {
  const bladers = await listBladers();
  res.json(bladers);
});

bladersRouter.post('/', async (req, res) => {
  const payload = bladerPayloadSchema.parse(req.body);
  const blader = await createBlader(payload);
  res.status(201).json(blader);
});

bladersRouter.get('/:id', async (req, res) => {
  const blader = await getBlader(req.params.id);
  res.json(blader);
});

bladersRouter.put('/:id', async (req, res) => {
  const payload = bladerUpdateSchema.parse(req.body);
  const blader = await updateBlader(req.params.id, payload);
  res.json(blader);
});

bladersRouter.delete('/:id', async (req, res) => {
  await deleteBlader(req.params.id);
  res.status(204).end();
});
