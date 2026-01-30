import { z } from 'zod';
import { BattleOutcomes } from '../../types/enums';

const battleOutcomeValues = BattleOutcomes;

const battleTurnSchema = z.object({
  winner: z.enum(battleOutcomeValues),
  victoryType: z.string().max(120).optional(),
  notes: z.string().optional(),
});

export const battleBodySchema = z.object({
  comboAId: z.string().min(1),
  comboBId: z.string().min(1),
  result: z.enum(battleOutcomeValues),
  score: z.string().optional(),
  victoryType: z.string().optional(),
  arenaId: z.string().optional(),
  notes: z.string().optional(),
  occurredAt: z.string().or(z.date()).optional(),
  turns: z.array(battleTurnSchema).max(20).optional(),
});

export const battleFiltersSchema = z.object({
  comboId: z.string().optional(),
  arenaId: z.string().optional(),
  result: z.enum(battleOutcomeValues).optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
});

export const battleTurnArraySchema = battleTurnSchema.array();
