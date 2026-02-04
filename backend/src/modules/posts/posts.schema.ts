import { z } from 'zod';

const optionalImageUrl = z
  .union([z.string().url('URL inválida'), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (!value || value === '') return undefined;
    return value;
  });

export const postCreateSchema = z.object({
  content: z.string().min(1).max(1500),
  imageUrl: optionalImageUrl,
});

export const postCommentSchema = z.object({
  content: z.string().min(1).max(600),
});
