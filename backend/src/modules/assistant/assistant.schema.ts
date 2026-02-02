import { z } from 'zod';

export const assistantMissionStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'BLOCKED'] as const;

export const assistantContextSchema = z
  .object({
    route: z.string().max(120).optional(),
    surface: z.string().max(120).optional(),
    focus: z.string().max(120).optional(),
    summary: z.record(z.any()).optional(),
  })
  .optional();

export const assistantSessionSchema = z.object({
  sessionId: z.string().cuid().optional(),
  context: assistantContextSchema,
});

export const assistantMessageSchema = assistantSessionSchema.extend({
  message: z
    .string()
    .trim()
    .min(1, 'Envie pelo menos um caractere para que eu possa responder.'),
});

export const assistantMissionUpdateSchema = z.object({
  status: z.enum(assistantMissionStatuses),
  note: z.string().max(280).optional(),
});
