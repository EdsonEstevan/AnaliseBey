import { Router } from 'express';

import {
  createArena,
  deleteArena,
  getArena,
  listArenas,
  updateArena,
} from '../modules/arenas/arenas.service';
import { arenaBodySchema } from '../modules/arenas/arenas.schema';
import { authenticate } from '../middleware/auth';

export const arenasRouter = Router();

arenasRouter.use(authenticate);

arenasRouter.get('/', async (req, res) => {
  const arenas = await listArenas(req.user!.id);
  res.json(arenas);
});

arenasRouter.get('/:id', async (req, res) => {
  const arena = await getArena(req.user!.id, req.params.id);
  res.json(arena);
});

arenasRouter.post('/', async (req, res) => {
  const payload = arenaBodySchema.parse(req.body);
  const arena = await createArena(req.user!.id, payload);
  res.status(201).json(arena);
});

arenasRouter.put('/:id', async (req, res) => {
  const payload = arenaBodySchema.partial().parse(req.body);
  const arena = await updateArena(req.user!.id, req.params.id, payload);
  res.json(arena);
});

arenasRouter.delete('/:id', async (req, res) => {
  await deleteArena(req.user!.id, req.params.id);
  res.status(204).send();
});