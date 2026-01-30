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

  await prisma.$transaction(async (tx) => {
    await tx.battle.deleteMany();
    await tx.combo.deleteMany();
    await tx.arena.deleteMany();
    await tx.part.deleteMany();

    for (const part of payload.parts) {
      await tx.part.create({
        data: {
          id: part.id,
          name: part.name,
          type: part.type as any,
          archetype: part.archetype as any,
          variant: part.variant,
          weight: part.weight,
          tags: toJsonArray(part.tags),
          notes: part.notes,
          archived: part.archived ?? false,
        },
      });
    }

    for (const arena of payload.arenas) {
      await tx.arena.create({
        data: {
          id: arena.id,
          name: arena.name,
          model: arena.model,
          tags: toJsonArray(arena.tags),
          notes: arena.notes,
        },
      });
    }

    for (const combo of payload.combos) {
      await tx.combo.create({
        data: {
          id: combo.id,
          name: combo.name,
          bladeId: combo.bladeId,
          ratchetId: combo.ratchetId,
          bitId: combo.bitId,
          archetype: combo.archetype as any,
          tags: toJsonArray(combo.tags),
          notes: combo.notes,
          status: combo.status as any,
        },
      });
    }

    for (const battle of payload.battles) {
      await tx.battle.create({
        data: {
          id: battle.id,
          comboAId: battle.comboAId,
          comboBId: battle.comboBId,
          result: battle.result as any,
          score: battle.score,
          victoryType: battle.victoryType,
          arenaId: battle.arenaId,
          notes: battle.notes,
          occurredAt: battle.occurredAt ? new Date(battle.occurredAt) : undefined,
        },
      });
    }
  });

  res.json({
    message: 'Importação concluída',
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
