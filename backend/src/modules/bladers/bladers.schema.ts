import { z } from 'zod';

export const bladerPayloadSchema = z.object({
  name: z.string().min(2).max(80),
  nickname: z.string().max(80).optional(),
  age: z.coerce.number().int().min(5).max(99).optional(),
  country: z.string().max(80).optional(),
  team: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
});

export const bladerUpdateSchema = bladerPayloadSchema.partial();
