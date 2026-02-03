import { Router } from 'express';

import { deckPayloadSchema, deckUpdateSchema } from '../modules/decks/decks.schema';
import {
  createDeck,
  deleteDeck,
  getDeck,
  listDecks,
  updateDeck,
} from '../modules/decks/decks.service';
import { authenticate } from '../middleware/auth';

export const decksRouter = Router();

decksRouter.use(authenticate);

decksRouter.get('/', async (req, res) => {
  const decks = await listDecks(req.user!.id);
  res.json(decks);
});

decksRouter.post('/', async (req, res) => {
  const payload = deckPayloadSchema.parse(req.body);
  const deck = await createDeck(req.user!.id, payload);
  res.status(201).json(deck);
});

decksRouter.get('/:id', async (req, res) => {
  const deck = await getDeck(req.user!.id, req.params.id);
  res.json(deck);
});

decksRouter.put('/:id', async (req, res) => {
  const payload = deckUpdateSchema.parse(req.body);
  const deck = await updateDeck(req.user!.id, req.params.id, payload);
  res.json(deck);
});

decksRouter.delete('/:id', async (req, res) => {
  await deleteDeck(req.user!.id, req.params.id);
  res.status(204).end();
});
