import { z } from 'zod';

const optionalImageUrl = z
  .union([z.string().url('URL inválida'), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    return value;
  });

export const teamCreateSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(500).optional(),
  imageUrl: optionalImageUrl,
});

export const teamMessageSchema = z.object({
  content: z.string().min(1).max(500),
});

export const teamMemberPermissionSchema = z.object({
  canManageMissions: z.boolean(),
});

export const teamMissionCreateSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().max(1000).optional(),
  xpReward: z.coerce.number().min(5).max(500).optional(),
  assignedToId: z.string().cuid().optional().nullable(),
});

export const teamMissionSubmitSchema = z.object({
  note: z.string().max(500).optional(),
});

export const teamMissionReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(500).optional(),
});
