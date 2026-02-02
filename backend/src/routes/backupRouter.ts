import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db/prisma';
import { toJsonArray } from '../utils/json';

export const backupRouter = Router();

const importSchema = z.object({
  parts: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        type: z.string(),
        archetype: z.string(),
        variant: z.string().optional(),
        weight: z.number().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        archived: z.boolean().optional(),
      }),
    )
    .default([]),
  arenas: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        model: z.string().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }),
    )
    .default([]),
  combos: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        bladeId: z.string(),
        ratchetId: z.string(),
        bitId: z.string(),
        assistBladeId: z.string().optional().nullable(),
        lockChipId: z.string().optional().nullable(),
        archetype: z.string(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .default([]),
  battles: z
    .array(
      z.object({
        id: z.string().optional(),
        comboAId: z.string(),
        comboBId: z.string(),
        result: z.string(),
        score: z.string().optional(),
        victoryType: z.string().optional(),
        arenaId: z.string().optional(),
        notes: z.string().optional(),
        occurredAt: z.string().optional(),
      }),
    )
    .default([]),
});

const normalizeQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' ? value : undefined;
};

backupRouter.get('/json', async (_req, res) => {
  const [parts, arenas, combos, battles] = await Promise.all([
    prisma.part.findMany(),
    prisma.arena.findMany(),
    prisma.combo.findMany(),
    prisma.battle.findMany(),
  ]);

  res.json({
    generatedAt: new Date().toISOString(),
    counts: {
      parts: parts.length,
      arenas: arenas.length,
      combos: combos.length,
      battles: battles.length,
    },
    parts,
    arenas,
    combos,
    battles,
  });
});

backupRouter.post('/json', async (req, res) => {
  const payload = importSchema.parse(req.body);
  const modeParam = normalizeQueryValue(req.query.mode)?.toLowerCase();
  const mergeParam = normalizeQueryValue(req.query.merge)?.toLowerCase();
  const appendMode = modeParam === 'append' || mergeParam === 'true';

  await prisma.$transaction(async (tx) => {
    if (!appendMode) {
      await tx.battle.deleteMany();
      await tx.combo.deleteMany();
      await tx.arena.deleteMany();
      await tx.part.deleteMany();
    }

    for (const part of payload.parts) {
      const data = {
        id: part.id,
        name: part.name,
        type: part.type as any,
        archetype: part.archetype as any,
        variant: part.variant,
        weight: part.weight,
        tags: toJsonArray(part.tags),
        notes: part.notes,
        archived: part.archived ?? false,
      };
      if (appendMode && part.id) {
        await tx.part.upsert({
          where: { id: part.id },
          update: {},
          create: data,
        });
      } else {
        await tx.part.create({ data });
      }
    }

    for (const arena of payload.arenas) {
      const data = {
        id: arena.id,
        name: arena.name,
        model: arena.model,
        tags: toJsonArray(arena.tags),
        notes: arena.notes,
      };
      if (appendMode && arena.id) {
        await tx.arena.upsert({
          where: { id: arena.id },
          update: {},
          create: data,
        });
      } else {
        await tx.arena.create({ data });
      }
    }

    for (const combo of payload.combos) {
      const data = {
        id: combo.id,
        name: combo.name,
        bladeId: combo.bladeId,
        ratchetId: combo.ratchetId,
        bitId: combo.bitId,
        assistBladeId: combo.assistBladeId,
        lockChipId: combo.lockChipId,
        archetype: combo.archetype as any,
        tags: toJsonArray(combo.tags),
        notes: combo.notes,
        status: combo.status as any,
      };
      if (appendMode && combo.id) {
        await tx.combo.upsert({
          where: { id: combo.id },
          update: {},
          create: data,
        });
      } else {
        await tx.combo.create({ data });
      }
    }

    for (const battle of payload.battles) {
      const data = {
        id: battle.id,
        comboAId: battle.comboAId,
        comboBId: battle.comboBId,
        result: battle.result as any,
        score: battle.score,
        victoryType: battle.victoryType,
        arenaId: battle.arenaId,
        notes: battle.notes,
        occurredAt: battle.occurredAt ? new Date(battle.occurredAt) : undefined,
      };
      if (appendMode && battle.id) {
        await tx.battle.upsert({
          where: { id: battle.id },
          update: {},
          create: data,
        });
      } else {
        await tx.battle.create({ data });
      }
    }
  });

  res.json({
    message: appendMode ? 'Importação concluída (modo de anexação)' : 'Importação concluída',
    mode: appendMode ? 'append' : 'replace',
    counts: {
      parts: payload.parts.length,
      arenas: payload.arenas.length,
      combos: payload.combos.length,
      battles: payload.battles.length,
    },
  });
});

function toCsv(data: Record<string, unknown>[], headers: string[]) {
  const lines = [headers.join(',')];
  for (const row of data) {
    const line = headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const normalized =
          typeof value === 'object' ? JSON.stringify(value) : String(value);
        const str = normalized.replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

backupRouter.get('/parts.csv', async (_req, res) => {
  const parts = await prisma.part.findMany();
  const csv = toCsv(parts as unknown as Record<string, unknown>[], [
    'id',
    'name',
    'type',
    'archetype',
    'variant',
    'weight',
    'tags',
    'notes',
    'archived',
  ]);
  res.header('Content-Type', 'text/csv');
  res.attachment('parts.csv');
  res.send(csv);
});

backupRouter.get('/battles.csv', async (_req, res) => {
  const battles = await prisma.battle.findMany();
  const csv = toCsv(battles as any, [
    'id',
    'comboAId',
    'comboBId',
    'result',
    'score',
    'victoryType',
    'arenaId',
    'occurredAt',
  ]);
  res.header('Content-Type', 'text/csv');
  res.attachment('battles.csv');
  res.send(csv);
});
