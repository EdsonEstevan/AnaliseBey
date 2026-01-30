import { Archetype, BattleOutcome, ComboStatus, PartType } from './enums';

export type PartPayload = {
  name: string;
  type: PartType;
  variant?: string;
  weight?: number;
  archetype: Archetype;
  subArchetype?: string | null;
  tags?: string[];
  notes?: string;
  imageUrl?: string | null;
};

export type ArenaPayload = {
  name: string;
  model?: string;
  tags?: string[];
  notes?: string;
};

export type ComboPayload = {
  bladeId: string;
  ratchetId: string;
  bitId: string;
  tags?: string[];
  notes?: string;
  status?: ComboStatus;
  imageUrl?: string | null;
};

export type BattlePayload = {
  comboAId: string;
  comboBId: string;
  result: BattleOutcome;
  score?: string;
  victoryType?: string;
  arenaId?: string;
  notes?: string;
  occurredAt?: Date | string | null;
};
