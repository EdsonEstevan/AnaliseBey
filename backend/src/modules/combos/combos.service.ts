import { Part, Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma';
import { badRequest, notFound } from '../../utils/apiError';
import { ensureStringArray, toJsonArray } from '../../utils/json';
import { ComboPayload } from '../../types/dto';
import { Archetype, Archetypes, ComboStatus, PartType } from '../../types/enums';

const comboInclude = {
  blade: true,
  ratchet: true,
  bit: true,
  assistBlade: true,
  lockChip: true,
} satisfies Prisma.ComboInclude;

type ComboWithParts = Prisma.ComboGetPayload<{ include: typeof comboInclude }>;

const normalizePart = (part?: Part | null) =>
  part
    ? {
        ...part,
        tags: ensureStringArray(part.tags as unknown),
      }
    : null;

const serializeCombo = (combo: ComboWithParts) => ({
  ...combo,
  tags: ensureStringArray(combo.tags as unknown),
  blade: normalizePart(combo.blade)!,
  ratchet: normalizePart(combo.ratchet)!,
  bit: normalizePart(combo.bit)!,
  assistBlade: normalizePart(combo.assistBlade),
  lockChip: normalizePart(combo.lockChip),
});

async function fetchPartOrThrow(partId: string) {
  const part = await prisma.part.findUnique({ where: { id: partId } });
  if (!part) {
    throw badRequest(`Peça ${partId} não encontrada.`);
  }
  return part;
}

async function ensurePartMatchesType(partId: string, expected: PartType | PartType[]) {
  const part = await fetchPartOrThrow(partId);
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(part.type as PartType)) {
    const label = allowed.length === 1 ? allowed[0] : allowed.join(' ou ');
    throw badRequest(`Peça ${part.name} precisa ser do tipo ${label}.`);
  }
  if (part.archived) {
    throw badRequest(`Peça ${part.name} está arquivada.`);
  }
  return part;
}

function isCxVariant(part: Part) {
  const variantLabel = (part.variant ?? '').toUpperCase();
  if (variantLabel.includes('CX')) {
    return true;
  }
  const tagList = ensureStringArray(part.tags as unknown).map((tag) =>
    typeof tag === 'string' ? tag.toUpperCase() : '',
  );
  return tagList.some((tag) => tag.includes('CX'));
}

function ensureAssistCompatibility(blade: Part, assist?: Part | null) {
  if (!assist) return;
  if (!isCxVariant(blade)) {
    throw badRequest(`${blade.name} não suporta Assist Blades.`);
  }
  if (!isCxVariant(assist)) {
    throw badRequest(`Assist ${assist.name} precisa ser da linha CX.`);
  }
}

function ensureLockChipRequirement(blade: Part, lockChip?: Part | null) {
  const bladeIsCx = isCxVariant(blade);
  if (bladeIsCx && !lockChip) {
    throw badRequest(`${blade.name} precisa de um Lock Chip CX.`);
  }
  if (!bladeIsCx && lockChip) {
    throw badRequest('Lock Chips só podem ser usados com blades CX.');
  }
  if (lockChip && !isCxVariant(lockChip)) {
    throw badRequest(`Lock Chip ${lockChip.name} precisa ser da linha CX.`);
  }
}

function ensureIntegratedPairing(blade: Part, ratchet: Part, bit: Part) {
  const ratchetIntegrated = ratchet.type === 'RATCHET_BIT';
  const bitIntegrated = bit.type === 'RATCHET_BIT';

  if (ratchetIntegrated !== bitIntegrated) {
    throw badRequest('Bits integrados precisam ser usados com o mesmo Ratchet integrado.');
  }

  if (ratchetIntegrated && bitIntegrated) {
    if (ratchet.id !== bit.id) {
      throw badRequest('Ratchet e Bit integrados devem ser a mesma peça.');
    }
    if (!isCxVariant(blade)) {
      throw badRequest(`${blade.name} não suporta unidades integradas de CX.`);
    }
    if (!isCxVariant(ratchet)) {
      throw badRequest(`${ratchet.name} precisa ser da linha CX para uso integrado.`);
    }
  }
}

function extractRatchetCode(name: string) {
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

function extractBitInitial(name: string) {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const match = normalized.match(/[A-Za-z\d]/);
  return match ? match[0].toUpperCase() : '';
}

function ensureArchetype(value: string): Archetype {
  const found = Archetypes.find((entry) => entry === value);
  if (found) return found;
  return 'BALANCE';
}

function buildComboName(
  blade: Pick<Part, 'name'>,
  ratchet: Pick<Part, 'name'>,
  bit: Pick<Part, 'name'>,
) {
  const bladeLabel = blade.name.trim();
  const ratchetCode = extractRatchetCode(ratchet.name);
  const bitInitial = extractBitInitial(bit.name);

  if (!bladeLabel || !ratchetCode || !bitInitial) {
    throw badRequest('Não foi possível gerar o nome do combo. Confira as peças selecionadas.');
  }

  return `${bladeLabel}${ratchetCode}${bitInitial}`;
}

function deriveArchetype(
  blade: Part,
  ratchet: Part,
  bit: Part,
  assist?: Part | null,
  lockChip?: Part | null,
): Archetype {
  const bladeArchetype = ensureArchetype(blade.archetype);
  const ratchetArchetype = ensureArchetype(ratchet.archetype);
  const bitArchetype = ensureArchetype(bit.archetype);
  const assistArchetype = assist ? ensureArchetype(assist.archetype) : null;
  const lockChipArchetype = lockChip ? ensureArchetype(lockChip.archetype) : null;

  const tally = new Map<Archetype, number>();
  [bladeArchetype, ratchetArchetype, bitArchetype, assistArchetype, lockChipArchetype]
    .filter((arch): arch is Archetype => Boolean(arch))
    .forEach((arch) => {
      tally.set(arch, (tally.get(arch) ?? 0) + 1);
    });

  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const topCount = sorted[0]?.[1] ?? 0;
  const candidates = sorted.filter(([, count]) => count === topCount).map(([key]) => key);

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.includes(bladeArchetype)) return bladeArchetype;
  if (lockChipArchetype && candidates.includes(lockChipArchetype)) return lockChipArchetype;
  if (assistArchetype && candidates.includes(assistArchetype)) return assistArchetype;
  if (candidates.includes(ratchetArchetype)) return ratchetArchetype;
  return bitArchetype;
}

function deriveSubArchetype(
  blade: Part,
  ratchet: Part,
  bit: Part,
  assist?: Part | null,
  lockChip?: Part | null,
) {
  return (
    blade.subArchetype ??
    assist?.subArchetype ??
    lockChip?.subArchetype ??
    ratchet.subArchetype ??
    bit.subArchetype ??
    null
  );
}

export type ComboFilters = {
  status?: ComboStatus;
  archetype?: Archetype;
  search?: string;
};

export async function listCombos(filters: ComboFilters = {}) {
  const where: Prisma.ComboWhereInput = {
    status: filters.status,
    archetype: filters.archetype,
  };

  if (filters.search) {
    where.name = {
      contains: filters.search,
    };
  }

  const combos = await prisma.combo.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: comboInclude,
  });
  return combos.map(serializeCombo);
}

export async function getCombo(id: string) {
  const combo = await prisma.combo.findUnique({
    where: { id },
    include: comboInclude,
  });
  if (!combo) {
    throw notFound('Combo não encontrado.');
  }
  return serializeCombo(combo);
}

export async function createCombo(payload: ComboPayload) {
  const [blade, ratchet, bit] = await Promise.all([
    ensurePartMatchesType(payload.bladeId, 'BLADE'),
    ensurePartMatchesType(payload.ratchetId, ['RATCHET', 'RATCHET_BIT']),
    ensurePartMatchesType(payload.bitId, ['BIT', 'RATCHET_BIT']),
  ]);

  const assistBlade = payload.assistBladeId
    ? await ensurePartMatchesType(payload.assistBladeId, 'ASSIST')
    : null;
  const lockChip = payload.lockChipId
    ? await ensurePartMatchesType(payload.lockChipId, 'LOCK_CHIP')
    : null;

  ensureIntegratedPairing(blade, ratchet, bit);
  ensureAssistCompatibility(blade, assistBlade);
  ensureLockChipRequirement(blade, lockChip);

  const name = buildComboName(blade, ratchet, bit);
  const archetype = deriveArchetype(blade, ratchet, bit, assistBlade, lockChip);
  const subArchetype = deriveSubArchetype(blade, ratchet, bit, assistBlade, lockChip);

  const combo = await prisma.combo.create({
    data: {
      name,
      bladeId: blade.id,
      ratchetId: ratchet.id,
      bitId: bit.id,
      assistBladeId: assistBlade?.id ?? null,
      lockChipId: lockChip?.id ?? null,
      archetype,
      subArchetype,
      tags: toJsonArray(payload.tags),
      notes: payload.notes,
      status: payload.status ?? 'ACTIVE',
      imageUrl: payload.imageUrl ?? null,
    },
    include: comboInclude,
  });
  return serializeCombo(combo);
}

export async function updateCombo(id: string, payload: Partial<ComboPayload>) {
  const existing = await prisma.combo.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('Combo não encontrado.');
  }

  const bladeId = payload.bladeId ?? existing.bladeId;
  const ratchetId = payload.ratchetId ?? existing.ratchetId;
  const bitId = payload.bitId ?? existing.bitId;
  const assistBladeId =
    payload.assistBladeId === undefined ? existing.assistBladeId : payload.assistBladeId;
  const lockChipId = payload.lockChipId === undefined ? existing.lockChipId : payload.lockChipId;

  const [blade, ratchet, bit] = await Promise.all([
    payload.bladeId ? ensurePartMatchesType(bladeId, 'BLADE') : fetchPartOrThrow(bladeId),
    payload.ratchetId
      ? ensurePartMatchesType(ratchetId, ['RATCHET', 'RATCHET_BIT'])
      : fetchPartOrThrow(ratchetId),
    payload.bitId
      ? ensurePartMatchesType(bitId, ['BIT', 'RATCHET_BIT'])
      : fetchPartOrThrow(bitId),
  ]);

  const assistBlade = assistBladeId
    ? payload.assistBladeId !== undefined
      ? await ensurePartMatchesType(assistBladeId, 'ASSIST')
      : await fetchPartOrThrow(assistBladeId)
    : null;
  const lockChip = lockChipId
    ? payload.lockChipId !== undefined
      ? await ensurePartMatchesType(lockChipId, 'LOCK_CHIP')
      : await fetchPartOrThrow(lockChipId)
    : null;

  ensureIntegratedPairing(blade, ratchet, bit);
  ensureAssistCompatibility(blade, assistBlade);
  ensureLockChipRequirement(blade, lockChip);

  const name = buildComboName(blade, ratchet, bit);
  const archetype = deriveArchetype(blade, ratchet, bit, assistBlade, lockChip);
  const subArchetype = deriveSubArchetype(blade, ratchet, bit, assistBlade, lockChip);

  const combo = await prisma.combo.update({
    where: { id },
    data: {
      name,
      bladeId,
      ratchetId,
      bitId,
      assistBladeId: assistBladeId ?? null,
      lockChipId: lockChipId ?? null,
      archetype,
      subArchetype,
      tags: payload.tags ? toJsonArray(payload.tags) : existing.tags,
      notes: payload.notes ?? existing.notes,
      status: payload.status ?? existing.status,
      imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : existing.imageUrl,
    },
    include: comboInclude,
  });
  return serializeCombo(combo);
}

export async function changeComboStatus(id: string, status: ComboStatus) {
  const combo = await prisma.combo.update({
    where: { id },
    data: { status },
    include: comboInclude,
  });
  return serializeCombo(combo);
}

export async function duplicateCombo(id: string) {
  const combo = await getCombo(id);
  const name = buildComboName(combo.blade, combo.ratchet, combo.bit);
  const clone = await prisma.combo.create({
    data: {
      name,
      bladeId: combo.bladeId,
      ratchetId: combo.ratchetId,
      bitId: combo.bitId,
      assistBladeId: combo.assistBladeId,
      lockChipId: combo.lockChipId,
      archetype: combo.archetype,
      subArchetype: combo.subArchetype,
      tags: toJsonArray(combo.tags),
      notes: combo.notes,
      status: 'ACTIVE',
      imageUrl: combo.imageUrl,
    },
    include: comboInclude,
  });
  return serializeCombo(clone);
}

export async function listComboBattles(id: string) {
  const battles = await prisma.battle.findMany({
    where: {
      OR: [{ comboAId: id }, { comboBId: id }],
    },
    include: {
      comboA: { include: comboInclude },
      comboB: { include: comboInclude },
      arena: true,
    },
    orderBy: { occurredAt: 'desc' },
  });

  return battles.map((battle) => ({
    ...battle,
    comboA: serializeCombo(battle.comboA as ComboWithParts),
    comboB: serializeCombo(battle.comboB as ComboWithParts),
    arena: battle.arena
      ? {
          ...battle.arena,
          tags: ensureStringArray(battle.arena.tags as unknown),
        }
      : null,
  }));
}
