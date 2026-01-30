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
  ]);

  console.log('Criando batalhas de exemplo...');
  const [comboA, comboB, comboC] = combos;
  await prisma.battle.createMany({
    data: [
      {
        comboAId: comboA.id,
        comboBId: comboB.id,
        result: 'COMBO_A',
        victoryType: 'knockout',
        arenaId: arena.id,
      },
      {
        comboAId: comboA.id,
        comboBId: comboC.id,
        result: 'COMBO_B',
        victoryType: 'spin',
        arenaId: arena2.id,
      },
      {
        comboAId: comboB.id,
        comboBId: comboC.id,
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
