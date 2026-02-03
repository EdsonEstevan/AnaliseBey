import { Archetype, BattleMode, BattleOutcome, ComboStatus, PartType } from './enums';

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
  assistBladeId?: string | null;
  lockChipId?: string | null;
  tags?: string[];
  notes?: string;
  status?: ComboStatus;
  imageUrl?: string | null;
};

export type BattlePayload = {
  comboAId: string;
  comboBId: string;
  bladerAId?: string | null;
  bladerBId?: string | null;
  result: BattleOutcome;
  mode?: BattleMode;
  score?: string;
  victoryType?: string;
  arenaId?: string;
  notes?: string;
  occurredAt?: Date | string | null;
  turns?: BattleTurnPayload[];
};

export type BattleTurnPayload = {
  winner: BattleOutcome;
  victoryType?: string;
  notes?: string;
};

export type DeckPayload = {
  name: string;
  side?: 'A' | 'B' | 'FLEX';
  notes?: string;
  comboIds: string[];
  maxTurns?: number;
  bladerId?: string | null;
};

export type BladerPayload = {
  name: string;
  nickname?: string | null;
  age?: number | null;
  country?: string | null;
  team?: string | null;
  notes?: string | null;
};

export type AssistantContextPayload = {
  route?: string;
  surface?: string;
  focus?: string;
  summary?: Record<string, unknown>;
};

export type AssistantSessionPayload = {
  sessionId?: string;
  context?: AssistantContextPayload;
};

export type AssistantMessagePayload = AssistantSessionPayload & {
  message: string;
};

export type AssistantMissionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'BLOCKED';

export type AssistantMissionUpdatePayload = {
  status: AssistantMissionStatus;
  note?: string;
};
