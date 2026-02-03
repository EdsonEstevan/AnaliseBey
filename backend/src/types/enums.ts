const partTypes = ['BLADE', 'ASSIST', 'RATCHET', 'BIT', 'RATCHET_BIT', 'LOCK_CHIP'] as const;
export type PartType = (typeof partTypes)[number];
export const PartTypes = [...partTypes] as [PartType, ...PartType[]];

const archetypes = ['ATTACK', 'DEFENSE', 'STAMINA', 'BALANCE'] as const;
export type Archetype = (typeof archetypes)[number];
export const Archetypes = [...archetypes] as [Archetype, ...Archetype[]];

const comboStatuses = ['ACTIVE', 'ARCHIVED'] as const;
export type ComboStatus = (typeof comboStatuses)[number];
export const ComboStatuses = [...comboStatuses] as [ComboStatus, ...ComboStatus[]];

const battleOutcomes = ['COMBO_A', 'COMBO_B', 'DRAW'] as const;
export type BattleOutcome = (typeof battleOutcomes)[number];
export const BattleOutcomes = [...battleOutcomes] as [BattleOutcome, ...BattleOutcome[]];

const battleModes = ['OFFICIAL_3ON3', 'REGIONAL_CIRCUIT', 'LONG_TRAINING', 'CUSTOM'] as const;
export type BattleMode = (typeof battleModes)[number];
export const BattleModes = [...battleModes] as [BattleMode, ...BattleMode[]];
