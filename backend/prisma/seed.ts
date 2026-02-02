import { PrismaClient } from '@prisma/client';

import { toJsonArray } from '../src/utils/json';
import { Archetype, PartType } from '../src/types/enums';

const prisma = new PrismaClient();

const placeholder = (label: string) => `https://placehold.co/320x320?text=${encodeURIComponent(label)}`;

type LineCode = 'BX' | 'UX' | 'CX' | 'XO';

type SeedPart = {
  name: string;
  type: PartType;
  archetype: Archetype;
  subArchetype?: string;
  variant?: string;
  weight?: number;
  tags?: string[];
  notes?: string;
  imageUrl?: string;
};

type BladeSpec = {
  name: string;
  archetype: Archetype;
  weight: number;
  line: LineCode;
  alias?: string;
};

type RatchetLineCode = Extract<LineCode, 'BX' | 'UX' | 'CX'>;

type RatchetSpec = {
  name: string;
  line: RatchetLineCode;
  archetype: Archetype;
  weight: number;
};

type BitSpec = {
  name: string;
  line: LineCode;
  archetype?: Archetype;
  weight?: number;
  notes?: string;
};

type AssistSpec = {
  name: string;
  line: Extract<LineCode, 'CX'>;
  archetype: Archetype;
  weight?: number;
  notes?: string;
};

type LockChipSpec = {
  name: string;
  archetype: Archetype;
  weight?: number;
  notes?: string;
};

type RatchetBitSpec = {
  name: string;
  line: Extract<LineCode, 'CX'>;
  archetype: Archetype;
  weight: number;
  notes?: string;
};

function extractDigitsOrFallback(name: string) {
  const digits = name.replace(/\D/g, '');
  if (digits.length > 0) {
    return digits;
  }
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

function bitInitial(name: string) {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const match = normalized.match(/[A-Za-z\d]/);
  return match ? match[0].toUpperCase() : '';
}

function buildComboName(blade: string, ratchet: string, bit: string) {
  const bladeLabel = blade.trim();
  const ratchetCode = extractDigitsOrFallback(ratchet);
  const bitLetter = bitInitial(bit);
  return `${bladeLabel}${ratchetCode}${bitLetter}`;
}

async function main() {
  console.log('Limpando base...');
  await prisma.battle.deleteMany();
  await prisma.deckSlot.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.blader.deleteMany();
  await prisma.combo.deleteMany();
  await prisma.arena.deleteMany();
  await prisma.part.deleteMany();

  console.log('Criando peças...');
  const baseParts: SeedPart[] = [];

  const bladeSpecs: BladeSpec[] = [
    { name: 'Cobalt Drake', archetype: 'ATTACK', weight: 38.0, line: 'BX' },
    { name: 'Phoenix Feather', archetype: 'ATTACK', weight: 34.8, line: 'BX' },
    { name: 'Dran Sword', archetype: 'ATTACK', weight: 32.2, line: 'BX' },
    { name: 'Hells Scythe', archetype: 'BALANCE', weight: 32.6, line: 'BX' },
    { name: 'Wizard Arrow', archetype: 'STAMINA', weight: 32.0, line: 'BX' },
    { name: 'Knight Shield', archetype: 'DEFENSE', weight: 32.3, line: 'BX' },
    { name: 'Knight Lance', archetype: 'DEFENSE', weight: 32.2, line: 'BX' },
    { name: 'Shark Edge', archetype: 'ATTACK', weight: 32.5, line: 'BX' },
    { name: 'Leon Claw', archetype: 'BALANCE', weight: 31.3, line: 'BX' },
    { name: 'Viper Tail', archetype: 'STAMINA', weight: 32.0, line: 'BX' },
    { name: 'Rhino Horn', archetype: 'DEFENSE', weight: 31.9, line: 'BX' },
    { name: 'Dran Dagger', archetype: 'ATTACK', weight: 32.0, line: 'BX' },
    { name: 'Hells Chain', archetype: 'BALANCE', weight: 33.25, line: 'BX' },
    { name: 'Phoenix Wing', archetype: 'ATTACK', weight: 38.0, line: 'BX' },
    { name: 'Wyvern Gale', archetype: 'STAMINA', weight: 32.15, line: 'BX' },
    { name: 'Unicorn Sting', archetype: 'BALANCE', weight: 33.3, line: 'BX' },
    { name: 'Sphynx Cowl', archetype: 'DEFENSE', weight: 32.7, line: 'BX' },
    { name: 'Cobalt Dragoon', archetype: 'ATTACK', weight: 37.8, line: 'BX' },
    { name: 'Whale Wave', archetype: 'BALANCE', weight: 38.2, line: 'BX' },
    { name: 'Tricera Press', archetype: 'DEFENSE', weight: 36.5, line: 'BX' },
    { name: 'BlackShell', archetype: 'DEFENSE', weight: 32.4, line: 'BX' },
    { name: 'CrimsonGaruda', archetype: 'BALANCE', weight: 35.0, line: 'BX' },
    { name: 'ShelterDrake', archetype: 'BALANCE', weight: 32.6, line: 'BX' },
    { name: 'WeissTiger', archetype: 'BALANCE', weight: 34.6, line: 'BX' },
    { name: 'Bite Croc', archetype: 'ATTACK', weight: 34.0, line: 'BX', alias: 'CrocCrunch' },
    { name: 'Knife Shinobi', archetype: 'DEFENSE', weight: 30.9, line: 'BX', alias: 'ShinobiKnife' },
    { name: 'Talon Ptera', archetype: 'STAMINA', weight: 34.3, line: 'BX', alias: 'PteraSwing' },
    { name: 'Roar Tyranno', archetype: 'ATTACK', weight: 36.0, line: 'BX', alias: 'TyrannoRoar' },
    { name: 'Savage Bear', archetype: 'DEFENSE', weight: 29.6, line: 'BX', alias: 'BearScratch' },
    { name: 'TyrannoBeat', archetype: 'ATTACK', weight: 37.0, line: 'BX' },
    { name: 'Aero Pegasus', archetype: 'ATTACK', weight: 38.3, line: 'UX' },
    { name: 'Dran Buster', archetype: 'ATTACK', weight: 36.5, line: 'UX' },
    { name: 'Hells Hammer', archetype: 'ATTACK', weight: 33.0, line: 'UX' },
    { name: 'Wizard Rod', archetype: 'STAMINA', weight: 35.4, line: 'UX' },
    { name: 'Leon Crest', archetype: 'DEFENSE', weight: 35.0, line: 'UX' },
    { name: 'Silver Wolf', archetype: 'STAMINA', weight: 36.8, line: 'UX' },
    { name: 'Samurai Saber', archetype: 'ATTACK', weight: 36.5, line: 'UX' },
    { name: 'Knight Mail', archetype: 'DEFENSE', weight: 36.6, line: 'UX' },
    { name: 'Impact Drake', archetype: 'ATTACK', weight: 39.0, line: 'UX' },
    { name: 'Golem Rock', archetype: 'DEFENSE', weight: 34.0, line: 'UX' },
    { name: 'Scorpio Spear', archetype: 'BALANCE', weight: 39.7, line: 'UX' },
    { name: 'Shark Scale', archetype: 'ATTACK', weight: 37.5, line: 'UX' },
    { name: 'Clock Mirage', archetype: 'STAMINA', weight: 37.7, line: 'UX' },
    { name: 'Mummy Curse', archetype: 'DEFENSE', weight: 37.5, line: 'UX' },
    { name: 'WizardRod', archetype: 'STAMINA', weight: 35.3, line: 'UX' },
    { name: 'MeteorDragoon', archetype: 'ATTACK', weight: 39.0, line: 'UX' },
    { name: 'Tempest Dragon', archetype: 'ATTACK', weight: 38.5, line: 'CX' },
    { name: 'Aegis Hydra', archetype: 'DEFENSE', weight: 37.1, line: 'CX' },
    { name: 'Mirage Crane', archetype: 'STAMINA', weight: 36.4, line: 'CX' },
    { name: 'Antler', archetype: 'DEFENSE', weight: 29.1, line: 'CX' },
    { name: 'Arc', archetype: 'BALANCE', weight: 29.2, line: 'CX' },
    { name: 'Blast', archetype: 'ATTACK', weight: 32.8, line: 'CX' },
    { name: 'Brave', archetype: 'ATTACK', weight: 31.2, line: 'CX' },
    { name: 'Brush', archetype: 'STAMINA', weight: 30.3, line: 'CX' },
    { name: 'Dark', archetype: 'BALANCE', weight: 30.3, line: 'CX' },
    { name: 'Eclipse', archetype: 'BALANCE', weight: 32.3, line: 'CX' },
    { name: 'Fang', archetype: 'ATTACK', weight: 30.4, line: 'CX' },
    { name: 'Flame', archetype: 'ATTACK', weight: 28.5, line: 'CX' },
    { name: 'Flare', archetype: 'ATTACK', weight: 31.1, line: 'CX' },
    { name: 'Fort', archetype: 'DEFENSE', weight: 29.0, line: 'CX' },
    { name: 'Hunt', archetype: 'ATTACK', weight: 31.6, line: 'CX' },
    { name: 'Might', archetype: 'BALANCE', weight: 33.1, line: 'CX' },
    { name: 'Reaper', archetype: 'ATTACK', weight: 29.0, line: 'CX' },
    { name: 'Volt', archetype: 'ATTACK', weight: 31.0, line: 'CX' },
    { name: 'Wriggle', archetype: 'STAMINA', weight: 29.3, line: 'CX' },
  ];

  const bitSpecs: BitSpec[] = [
    // Basic Line
    { name: 'Ball', line: 'BX', archetype: 'STAMINA', weight: 2.1 },
    { name: 'Cyclone', line: 'BX', archetype: 'ATTACK', weight: 2.1 },
    { name: 'Dot', line: 'BX', archetype: 'DEFENSE', weight: 2.0 },
    { name: 'Elevate', line: 'BX', archetype: 'BALANCE', weight: 3.2 },
    { name: 'Gear Ball', line: 'BX', archetype: 'STAMINA', weight: 2.0 },
    { name: 'Gear Needle', line: 'BX', archetype: 'DEFENSE', weight: 2.0 },
    { name: 'Gear Point', line: 'BX', archetype: 'BALANCE', weight: 2.3 },
    { name: 'Low Flat', line: 'BX', archetype: 'ATTACK', weight: 2.1 },
    { name: 'Merge', line: 'BX', archetype: 'BALANCE', weight: 2.2 },
    { name: 'Needle', line: 'BX', archetype: 'DEFENSE', weight: 2.0 },
    { name: 'Orb', line: 'BX', archetype: 'STAMINA', weight: 2.0 },
    { name: 'Point', line: 'BX', archetype: 'BALANCE', weight: 2.2 },
    { name: 'Rush', line: 'BX', archetype: 'ATTACK', weight: 2.1 },
    { name: 'Spike', line: 'BX', archetype: 'DEFENSE', weight: 2.0 },
    { name: 'Taper', line: 'BX', archetype: 'BALANCE', weight: 2.2 },
    { name: 'Unite', line: 'BX', archetype: 'BALANCE', weight: 2.1 },
    { name: 'Trans Point', line: 'BX', archetype: 'BALANCE', notes: 'Peso não informado na fonte' },
    // Unique Line
    { name: 'Accel', line: 'UX', archetype: 'ATTACK', weight: 2.6 },
    { name: 'Bound Spike', line: 'UX', archetype: 'DEFENSE', weight: 2.0 },
    { name: 'Disk Ball', line: 'UX', archetype: 'STAMINA', weight: 3.2 },
    { name: 'Free Ball', line: 'UX', archetype: 'STAMINA', weight: 1.9 },
    { name: 'Glide', line: 'UX', archetype: 'STAMINA', weight: 2.5 },
    { name: 'Hexa', line: 'UX', archetype: 'BALANCE', weight: 2.6 },
    { name: 'Level', line: 'UX', archetype: 'ATTACK', weight: 2.7 },
    { name: 'Low Rush', line: 'UX', archetype: 'ATTACK', weight: 1.9 },
    { name: 'Metal Needle', line: 'UX', archetype: 'DEFENSE', weight: 2.8 },
    { name: 'Rubber Accel', line: 'UX', archetype: 'ATTACK', weight: 3.1 },
    { name: 'Under Flat', line: 'UX', archetype: 'ATTACK', weight: 2.0 },
    { name: 'Under Needle', line: 'UX', archetype: 'DEFENSE', weight: 1.9 },
    { name: 'Zap', line: 'UX', archetype: 'BALANCE', weight: 2.5 },
    // Custom Line
    { name: 'Gear Rush', line: 'CX', archetype: 'ATTACK', weight: 2.1 },
    { name: 'Kick', line: 'CX', archetype: 'BALANCE', weight: 2.2 },
    { name: 'Trans Kick', line: 'CX', archetype: 'BALANCE', weight: 2.3 },
    { name: 'Vortex', line: 'CX', archetype: 'ATTACK', weight: 2.2 },
  ];

  const assistSpecs: AssistSpec[] = [
    { name: 'Edge Boost Assist', line: 'CX', archetype: 'ATTACK', weight: 5.8 },
    { name: 'Shell Guard Assist', line: 'CX', archetype: 'DEFENSE', weight: 5.6 },
    { name: 'Horizon Glide Assist', line: 'CX', archetype: 'STAMINA', weight: 5.4 },
    { name: 'Assist Blade – Assault', line: 'CX', archetype: 'ATTACK', weight: 5.0 },
    { name: 'Assist Blade – Bumper', line: 'CX', archetype: 'DEFENSE', weight: 6.0 },
    { name: 'Assist Blade – Charge', line: 'CX', archetype: 'BALANCE', weight: 5.4 },
    { name: 'Assist Blade – Dual', line: 'CX', archetype: 'BALANCE', weight: 5.5 },
    { name: 'Assist Blade – Free', line: 'CX', archetype: 'STAMINA', weight: 4.8 },
    { name: 'Assist Blade – Heavy', line: 'CX', archetype: 'DEFENSE', weight: 7.8 },
    { name: 'Assist Blade – Jaggy', line: 'CX', archetype: 'ATTACK', weight: 4.9 },
    { name: 'Assist Blade – Massive', line: 'CX', archetype: 'DEFENSE', weight: 5.34 },
    { name: 'Assist Blade – Round', line: 'CX', archetype: 'BALANCE', weight: 5.9 },
    { name: 'Assist Blade – Slash', line: 'CX', archetype: 'ATTACK', weight: 4.7 },
    { name: 'Assist Blade – Turn', line: 'CX', archetype: 'BALANCE', weight: 5.6 },
    { name: 'Assist Blade – Wheel', line: 'CX', archetype: 'STAMINA', weight: 7.2 },
    { name: 'Assist Blade – Zillion', line: 'CX', archetype: 'BALANCE', weight: 6.7 },
  ];

  const lockChipSpecs: LockChipSpec[] = [
    { name: 'Nova Lock Chip', archetype: 'ATTACK', weight: 3.2 },
    { name: 'Aegis Core Lock Chip', archetype: 'DEFENSE', weight: 3.4 },
    { name: 'Mirage Anchor Lock Chip', archetype: 'STAMINA', weight: 3.0 },
    { name: 'Valkyrie Lock Chip', archetype: 'ATTACK', weight: 5.6 },
    { name: 'Emperor Lock Chip', archetype: 'DEFENSE', weight: 4.7 },
    { name: 'Cerberus Lock Chip', archetype: 'DEFENSE', weight: 1.7 },
    { name: 'Dran Lock Chip', archetype: 'ATTACK', weight: 1.7 },
    { name: 'Fox Lock Chip', archetype: 'BALANCE', weight: 1.7 },
    { name: 'Hells Lock Chip', archetype: 'BALANCE', weight: 1.7 },
    { name: 'Hornet Lock Chip', archetype: 'ATTACK', weight: 1.7 },
    { name: 'Kraken Lock Chip', archetype: 'DEFENSE', weight: 1.7 },
    { name: 'Leon Lock Chip', archetype: 'BALANCE', weight: 1.7 },
    { name: 'Pegasus Lock Chip', archetype: 'ATTACK', weight: 1.7 },
    { name: 'Perseus Lock Chip', archetype: 'BALANCE', weight: 1.7 },
    { name: 'Phoenix Lock Chip', archetype: 'ATTACK', weight: 1.7 },
    { name: 'Rhino Lock Chip', archetype: 'DEFENSE', weight: 1.7 },
    { name: 'Sol Lock Chip', archetype: 'STAMINA', weight: 1.7 },
    { name: 'Stag Lock Chip', archetype: 'ATTACK', weight: 1.7 },
    { name: 'Whale Lock Chip', archetype: 'STAMINA', weight: 1.7 },
    { name: 'Wolf Lock Chip', archetype: 'BALANCE', weight: 1.7 },
    { name: 'Wizard Lock Chip', archetype: 'STAMINA', weight: 1.7 },
  ];

  const ratchetSpecs: RatchetSpec[] = [
    { name: '0-60', line: 'CX', archetype: 'ATTACK', weight: 7.0 },
    { name: '0-70', line: 'CX', archetype: 'STAMINA', weight: 6.9 },
    { name: '0-80', line: 'UX', archetype: 'STAMINA', weight: 7.3 },
    { name: '1-60', line: 'BX', archetype: 'ATTACK', weight: 6.0 },
    { name: '1-70', line: 'UX', archetype: 'DEFENSE', weight: 7.0 },
    { name: '1-80', line: 'UX', archetype: 'ATTACK', weight: 6.7 },
    { name: '2-60', line: 'BX', archetype: 'BALANCE', weight: 6.2 },
    { name: '2-70', line: 'BX', archetype: 'DEFENSE', weight: 6.7 },
    { name: '2-80', line: 'BX', archetype: 'DEFENSE', weight: 6.9 },
    { name: '3-60', line: 'BX', archetype: 'ATTACK', weight: 6.4 },
    { name: '3-70', line: 'BX', archetype: 'ATTACK', weight: 7.1 },
    { name: '3-80', line: 'BX', archetype: 'BALANCE', weight: 7.1 },
    { name: '3-85', line: 'UX', archetype: 'BALANCE', weight: 4.7 },
    { name: '4-50', line: 'UX', archetype: 'DEFENSE', weight: 5.9 },
    { name: '4-55', line: 'CX', archetype: 'STAMINA', weight: 4.8 },
    { name: '4-60', line: 'BX', archetype: 'BALANCE', weight: 6.3 },
    { name: '4-70', line: 'BX', archetype: 'BALANCE', weight: 6.7 },
    { name: '4-80', line: 'BX', archetype: 'BALANCE', weight: 7.0 },
    { name: '5-60', line: 'BX', archetype: 'ATTACK', weight: 6.6 },
    { name: '5-70', line: 'UX', archetype: 'ATTACK', weight: 6.7 },
    { name: '5-80', line: 'BX', archetype: 'ATTACK', weight: 7.3 },
    { name: '6-60', line: 'CX', archetype: 'ATTACK', weight: 6.1 },
    { name: '6-70', line: 'BX', archetype: 'ATTACK', weight: 6.3 },
    { name: '6-80', line: 'CX', archetype: 'ATTACK', weight: 6.9 },
    { name: '7-60', line: 'UX', archetype: 'BALANCE', weight: 6.8 },
    { name: '7-70', line: 'BX', archetype: 'ATTACK', weight: 6.8 },
    { name: '7-80', line: 'BX', archetype: 'DEFENSE', weight: 6.8 },
    { name: '9-60', line: 'BX', archetype: 'BALANCE', weight: 6.3 },
    { name: '9-65', line: 'UX', archetype: 'ATTACK', weight: 4.4 },
    { name: '9-70', line: 'UX', archetype: 'BALANCE', weight: 6.3 },
    { name: '9-80', line: 'BX', archetype: 'ATTACK', weight: 6.9 },
    { name: 'M-85', line: 'BX', archetype: 'DEFENSE', weight: 10.6 },
  ];

  const ratchetBitSpecs: RatchetBitSpec[] = [
    { name: 'F-4-60', line: 'CX', archetype: 'ATTACK', weight: 8.2 },
    { name: 'N-5-70', line: 'CX', archetype: 'DEFENSE', weight: 8.6 },
  ];

  const partsData: SeedPart[] = [
    ...baseParts,
    ...bladeSpecs.map((spec) => ({
      name: spec.name,
      type: 'BLADE' as PartType,
      archetype: spec.archetype,
      variant: spec.line,
      subArchetype: `Linha ${spec.line}`,
      weight: spec.weight,
      tags: spec.alias ? [spec.line, spec.alias] : [spec.line],
      notes: spec.alias ? `Também conhecido como ${spec.alias}` : undefined,
      imageUrl: placeholder(spec.name),
    })),
    ...ratchetSpecs.map((spec) => ({
      name: spec.name,
      type: 'RATCHET' as PartType,
      archetype: spec.archetype,
      variant: spec.line,
      subArchetype: `Linha ${spec.line}`,
      weight: spec.weight,
      tags: [spec.line],
      imageUrl: placeholder(`Ratchet ${spec.name}`),
    })),
    ...bitSpecs
      .filter((spec) => spec.archetype)
      .map((spec) => ({
        name: spec.name,
        type: 'BIT' as PartType,
        archetype: spec.archetype as Archetype,
        variant: spec.line,
        subArchetype: `Linha ${spec.line}`,
        weight: spec.weight ?? undefined,
        tags: spec.notes ? [spec.line, 'info-incompleta'] : [spec.line],
        notes: spec.notes,
        imageUrl: placeholder(`Bit ${spec.name}`),
      })),
    ...assistSpecs.map((spec) => ({
      name: spec.name,
      type: 'ASSIST' as PartType,
      archetype: spec.archetype,
      variant: spec.line,
      subArchetype: `Assist ${spec.line}`,
      weight: spec.weight,
      tags: ['CX', 'ASSIST'],
      notes: spec.notes,
      imageUrl: placeholder(`Assist ${spec.name}`),
    })),
    ...lockChipSpecs.map((spec) => ({
      name: spec.name,
      type: 'LOCK_CHIP' as PartType,
      archetype: spec.archetype,
      variant: 'CX',
      subArchetype: 'Lock Chip CX',
      weight: spec.weight,
      tags: ['CX', 'LOCK_CHIP'],
      notes: spec.notes,
      imageUrl: placeholder(`Lock Chip ${spec.name}`),
    })),
    ...ratchetBitSpecs.map((spec) => ({
      name: spec.name,
      type: 'RATCHET_BIT' as PartType,
      archetype: spec.archetype,
      variant: spec.line,
      subArchetype: `Linha ${spec.line}`,
      weight: spec.weight,
      tags: ['CX', 'INTEGRADO'],
      notes: spec.notes,
      imageUrl: placeholder(`Unidade ${spec.name}`),
    })),
  ];

  const parts = {} as Record<string, string>;
  for (const data of partsData) {
    const part = await prisma.part.create({
      data: {
        name: data.name,
        type: data.type,
        variant: data.variant ?? null,
        weight: data.weight ?? null,
        archetype: data.archetype,
        subArchetype: data.subArchetype ?? null,
        tags: toJsonArray(data.tags),
        notes: data.notes ?? null,
        imageUrl: data.imageUrl ?? placeholder(data.name),
      },
    });
    parts[data.name] = part.id;
  }

  console.log('Criando arenas...');
  const arena = await prisma.arena.create({
    data: { name: 'Quad Stadium', model: 'X-01' },
  });
  const arena2 = await prisma.arena.create({
    data: { name: 'Speed Crater', model: 'X-02' },
  });

  console.log('Criando combos...');
  const combos = await Promise.all([
    prisma.combo.create({
      data: {
        name: buildComboName('Cobalt Drake', '5-60', 'Rush'),
        bladeId: parts['Cobalt Drake'],
        ratchetId: parts['5-60'],
        bitId: parts['Rush'],
        archetype: 'ATTACK',
        subArchetype: 'Blitz Core',
        imageUrl: placeholder('Drake Combo'),
      },
    }),
    prisma.combo.create({
      data: {
        name: buildComboName('Knight Shield', '4-70', 'Needle'),
        bladeId: parts['Knight Shield'],
        ratchetId: parts['4-70'],
        bitId: parts['Needle'],
        archetype: 'DEFENSE',
        subArchetype: 'Iron Guard',
        imageUrl: placeholder('Shield Combo'),
      },
    }),
    prisma.combo.create({
      data: {
        name: buildComboName('Whale Wave', '2-70', 'Elevate'),
        bladeId: parts['Whale Wave'],
        ratchetId: parts['2-70'],
        bitId: parts['Elevate'],
        archetype: 'BALANCE',
        subArchetype: 'Flow Sync',
        imageUrl: placeholder('Wave Combo'),
      },
    }),
    prisma.combo.create({
      data: {
        name: buildComboName('Tempest Dragon', 'F-4-60', 'F-4-60'),
        bladeId: parts['Tempest Dragon'],
        ratchetId: parts['F-4-60'],
        bitId: parts['F-4-60'],
        assistBladeId: parts['Edge Boost Assist'],
            lockChipId: parts['Nova Lock Chip'],
        archetype: 'ATTACK',
        subArchetype: 'CX Blitz',
        tags: toJsonArray(['CX', 'integrado']),
        imageUrl: placeholder('Tempest CX'),
      },
    }),
    prisma.combo.create({
      data: {
        name: buildComboName('Mirage Crane', 'N-5-70', 'N-5-70'),
        bladeId: parts['Mirage Crane'],
        ratchetId: parts['N-5-70'],
        bitId: parts['N-5-70'],
        assistBladeId: parts['Horizon Glide Assist'],
            lockChipId: parts['Mirage Anchor Lock Chip'],
        archetype: 'STAMINA',
        subArchetype: 'CX Sustain',
        tags: toJsonArray(['CX']),
        imageUrl: placeholder('Mirage CX'),
      },
    }),
  ]);

  console.log('Criando batalhas de exemplo...');
  const [comboA, comboB, comboC] = combos;
  console.log('Criando bladers...');
  const bladerA = await prisma.blader.create({
    data: {
      name: 'Kai Tanaka',
      nickname: 'Alpha Kai',
      age: 16,
      country: 'Brasil',
      team: 'Team Nova',
      notes: 'Titular do laboratório',
    },
  });
  const bladerB = await prisma.blader.create({
    data: {
      name: 'Maya Lopes',
      nickname: 'Storm Maya',
      age: 17,
      country: 'Brasil',
      team: 'Storm League',
    },
  });

  console.log('Criando decks baseados nos bladers...');
  await prisma.deck.create({
    data: {
      name: 'Alpha Kai Deck',
      side: 'A',
      bladerId: bladerA.id,
      slots: {
        create: [
          { comboId: comboA.id, position: 1 },
          { comboId: comboB.id, position: 2 },
          { comboId: comboC.id, position: 3 },
        ],
      },
    },
  });

  await prisma.deck.create({
    data: {
      name: 'Storm Maya Deck',
      side: 'B',
      bladerId: bladerB.id,
      slots: {
        create: [
          { comboId: comboB.id, position: 1 },
          { comboId: comboC.id, position: 2 },
        ],
      },
    },
  });

  await prisma.battle.createMany({
    data: [
      {
        comboAId: comboA.id,
        comboBId: comboB.id,
        bladerAId: bladerA.id,
        bladerBId: bladerB.id,
        result: 'COMBO_A',
        victoryType: 'knockout',
        arenaId: arena.id,
      },
      {
        comboAId: comboA.id,
        comboBId: comboC.id,
        bladerAId: bladerA.id,
        bladerBId: bladerB.id,
        result: 'COMBO_B',
        victoryType: 'spin',
        arenaId: arena2.id,
      },
      {
        comboAId: comboB.id,
        comboBId: comboC.id,
        bladerAId: bladerB.id,
        bladerBId: bladerA.id,
        result: 'DRAW',
        victoryType: 'over',
        arenaId: arena.id,
      },
    ],
  });

  console.log('Seed concluído.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
