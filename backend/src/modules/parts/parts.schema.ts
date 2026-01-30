import { z } from 'zod';

import { Archetypes, PartTypes } from '../../types/enums';

const archetypeValues = Archetypes;
const typeValues = PartTypes;

const optionalSubArchetype = z
  .preprocess((val) => {
    if (val === null || val === undefined) return val;
    if (typeof val === 'string') return val.trim();
    return val;
  }, z.union([z.string().max(120, 'Sub-tipagem deve ter no máximo 120 caracteres'), z.null()]))
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    return val.length ? val : null;
  });

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

const enumFilter = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .union([z.enum(values), z.literal('')])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val as T;
    });

export const partBodySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  type: z.enum(typeValues),
  variant: z.string().max(120).optional(),
  weight: z
    .number({ invalid_type_error: 'Peso deve ser número' })
    .positive('Peso deve ser positivo')
    .optional(),
  archetype: z.enum(archetypeValues),
  subArchetype: optionalSubArchetype,
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
  imageUrl: optionalImageUrl,
});

export const partFiltersSchema = z.object({
  search: z.string().optional(),
  type: enumFilter(typeValues),
  archetype: enumFilter(archetypeValues),
  includeArchived: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    }),
});
