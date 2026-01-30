import { Router } from 'express';

import {
  battleBodySchema,
  battleFiltersSchema,
} from '../modules/battles/battles.schema';
import {
  bulkCreateBattles,
  createBattle,
  deleteBattle,
  getBattle,
  listBattles,
  updateBattle,
} from '../modules/battles/battles.service';

export const battlesRouter = Router();

battlesRouter.get('/', async (req, res) => {
  const filters = battleFiltersSchema.partial().parse(req.query);
  const battles = await listBattles(filters);
  res.json(battles);
});

battlesRouter.post('/', async (req, res) => {
  const payload = battleBodySchema.parse(req.body);
  const battle = await createBattle(payload);
  res.status(201).json(battle);
});

battlesRouter.post('/bulk', async (req, res) => {
  const schema = battleBodySchema.array();
  const battles = await bulkCreateBattles(schema.parse(req.body));
  res.status(201).json({ count: battles.length, battles });
});

battlesRouter.get('/:id', async (req, res) => {
  const battle = await getBattle(req.params.id);
  res.json(battle);
});

battlesRouter.put('/:id', async (req, res) => {
  const payload = battleBodySchema.partial().parse(req.body);
  const battle = await updateBattle(req.params.id, payload);
  res.json(battle);
});

battlesRouter.delete('/:id', async (req, res) => {
  await deleteBattle(req.params.id);
  res.status(204).end();
});
