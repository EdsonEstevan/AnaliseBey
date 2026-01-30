import { Router } from 'express';

import {
  createArena,
  deleteArena,
  getArena,
  listArenas,
  updateArena,
} from '../modules/arenas/arenas.service';
import { arenaBodySchema } from '../modules/arenas/arenas.schema';

export const arenasRouter = Router();

arenasRouter.get('/', async (_req, res) => {
  const arenas = await listArenas();
  res.json(arenas);
});

arenasRouter.get('/:id', async (req, res) => {
  const arena = await getArena(req.params.id);
  res.json(arena);
});

arenasRouter.post('/', async (req, res) => {
  const payload = arenaBodySchema.parse(req.body);
  const arena = await createArena(payload);
  res.status(201).json(arena);
});

arenasRouter.put('/:id', async (req, res) => {
  const payload = arenaBodySchema.partial().parse(req.body);
  const arena = await updateArena(req.params.id, payload);
  res.json(arena);
});

arenasRouter.delete('/:id', async (req, res) => {
  await deleteArena(req.params.id);
  res.status(204).send();
});