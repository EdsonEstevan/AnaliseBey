import { z } from 'zod';

export const deckPayloadSchema = z.object({
  name: z.string().min(2).max(80),
  side: z.enum(['A', 'B', 'FLEX']).optional(),
  notes: z.string().max(500).optional(),
  comboIds: z.array(z.string().min(1)).min(1).max(3),
});

export const deckUpdateSchema = deckPayloadSchema.partial({ comboIds: true });
