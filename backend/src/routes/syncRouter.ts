import { Router } from 'express';
import { z } from 'zod';

export const syncRouter = Router();

const syncPayloadSchema = z.object({
  clientId: z.string(),
  mutations: z.array(
    z.object({
      id: z.string(),
      entity: z.string(),
      action: z.string(),
      payload: z.unknown(),
      timestamp: z.number(),
    }),
  ),
});

syncRouter.post('/apply', async (req, res) => {
  const { clientId, mutations } = syncPayloadSchema.parse(req.body);
  // Etapa 2: implementar lógica de sincronização real.
  res.json({
    clientId,
    applied: mutations.length,
    message: 'Fila de sincronização armazenada (placeholder Etapa 1).',
  });
});
