import { Router } from 'express';
import { z } from 'zod';

import {
  createPart,
  getPartById,
  listParts,
  toggleArchivePart,
  updatePart,
} from '../modules/parts/parts.service';
import { partBodySchema, partFiltersSchema } from '../modules/parts/parts.schema';
import { badRequest } from '../utils/apiError';
import { Archetypes, PartTypes } from '../types/enums';
import { authenticate } from '../middleware/auth';

export const partsRouter = Router();

partsRouter.use(authenticate);

partsRouter.get('/', async (req, res) => {
  const filters = partFiltersSchema.partial().parse(req.query);
  const parts = await listParts(req.user!, filters);
  res.json(parts);
});

partsRouter.get('/metadata', (_req, res) => {
  res.json({
    types: PartTypes,
    archetypes: Archetypes,
  });
});

partsRouter.get('/:id', async (req, res) => {
  const part = await getPartById(req.user!, req.params.id);
  res.json(part);
});

partsRouter.post('/', async (req, res) => {
  const payload = partBodySchema.parse(req.body);
  const part = await createPart(req.user!, payload);
  res.status(201).json(part);
});

partsRouter.put('/:id', async (req, res) => {
  const payload = partBodySchema.partial().parse(req.body);
  const part = await updatePart(req.user!, req.params.id, payload);
  res.json(part);
});

partsRouter.patch('/:id/archive', async (req, res) => {
  const schema = z.object({ archived: z.boolean() });
  const { archived } = schema.parse(req.body);
  const part = await toggleArchivePart(req.user!, req.params.id, archived);
  res.json(part);
});

partsRouter.post('/bulk', async (req, res) => {
  const schema = z.array(partBodySchema);
  const items = schema.parse(req.body);
  if (items.length === 0) {
    throw badRequest('Nenhuma peça informada.');
  }
  const createdIds: string[] = [];
  for (const payload of items) {
    const created = await createPart(req.user!, payload);
    createdIds.push(created.id);
  }
  res.status(201).json({ count: createdIds.length, ids: createdIds });
});
