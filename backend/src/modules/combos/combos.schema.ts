import { Archetypes, ComboStatuses } from '../../types/enums';
import { z } from 'zod';

const statusValues = ComboStatuses;

const optionalImageUrl = z
  .preprocess(
    (val) => {
      if (val === null || val === undefined) return val;
      if (typeof val === 'string') return val.trim();
      return val;
    },
    z.union([z.string().url('URL inválida'), z.literal(''), z.null()]),
  )
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val === null || val === '') return null;
    return val;
  });

const optionalId = z
  .union([z.string().min(1), z.literal(''), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === '') return undefined;
    return val;
  });

const enumFilter = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .union([z.enum(values), z.literal('')])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val as T;
    });

export const comboBodySchema = z.object({
  bladeId: z.string().min(1),
  ratchetId: z.string().min(1),
  bitId: z.string().min(1),
  assistBladeId: optionalId,
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(statusValues).optional(),
  imageUrl: optionalImageUrl,
});

export const comboFiltersSchema = z.object({
  status: enumFilter(statusValues),
  archetype: enumFilter(Archetypes),
  search: z.string().optional(),
});
