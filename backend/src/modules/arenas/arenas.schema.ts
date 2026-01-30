import { z } from 'zod';

export const arenaBodySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  model: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
