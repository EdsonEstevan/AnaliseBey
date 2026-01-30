import { Router } from 'express';
import { z } from 'zod';

import {
  changeComboStatus,
  createCombo,
  duplicateCombo,
  getCombo,
  listComboBattles,
  listCombos,
  updateCombo,
} from '../modules/combos/combos.service';
import { comboBodySchema, comboFiltersSchema } from '../modules/combos/combos.schema';
import { Archetypes, ComboStatuses } from '../types/enums';

export const combosRouter = Router();

combosRouter.get('/', async (req, res) => {
  const filters = comboFiltersSchema.partial().parse(req.query);
  const combos = await listCombos(filters);
  res.json(combos);
});

combosRouter.get('/metadata', (_req, res) => {
  res.json({
    archetypes: Archetypes,
    statuses: ComboStatuses,
  });
});

combosRouter.get('/:id', async (req, res) => {
  const combo = await getCombo(req.params.id);
  res.json(combo);
});

combosRouter.get('/:id/battles', async (req, res) => {
  const battles = await listComboBattles(req.params.id);
  res.json(battles);
});

combosRouter.post('/', async (req, res) => {
  const payload = comboBodySchema.parse(req.body);
  const combo = await createCombo(payload);
  res.status(201).json(combo);
});

combosRouter.put('/:id', async (req, res) => {
  const payload = comboBodySchema.partial().parse(req.body);
  const combo = await updateCombo(req.params.id, payload);
  res.json(combo);
});

combosRouter.patch('/:id/status', async (req, res) => {
  const schema = z.object({ status: z.enum(ComboStatuses) });
  const { status } = schema.parse(req.body);
  const combo = await changeComboStatus(req.params.id, status);
  res.json(combo);
});

combosRouter.post('/:id/duplicate', async (req, res) => {
  const combo = await duplicateCombo(req.params.id);
  res.status(201).json(combo);
});
