import { Router } from 'express';

import { deckPayloadSchema, deckUpdateSchema } from '../modules/decks/decks.schema';
import {
  createDeck,
  deleteDeck,
  getDeck,
  listDecks,
  updateDeck,
} from '../modules/decks/decks.service';

export const decksRouter = Router();

decksRouter.get('/', async (_req, res) => {
  const decks = await listDecks();
  res.json(decks);
});

decksRouter.post('/', async (req, res) => {
  const payload = deckPayloadSchema.parse(req.body);
  const deck = await createDeck(payload);
  res.status(201).json(deck);
});

decksRouter.get('/:id', async (req, res) => {
  const deck = await getDeck(req.params.id);
  res.json(deck);
});

decksRouter.put('/:id', async (req, res) => {
  const payload = deckUpdateSchema.parse(req.body);
  const deck = await updateDeck(req.params.id, payload);
  res.json(deck);
});

decksRouter.delete('/:id', async (req, res) => {
  await deleteDeck(req.params.id);
  res.status(204).end();
});
