const PART_SAMPLE_THRESHOLD = 20;
const PAIR_SAMPLE_THRESHOLD = 10;

function uniqueIds(ids = []) {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function comboPartIds(combo) {
  if (!combo) return [];
  const ids = [combo.bladeId, combo.ratchetId, combo.bitId];
  if (combo.assistBladeId) ids.push(combo.assistBladeId);
  if (combo.lockChipId) ids.push(combo.lockChipId);
  return uniqueIds(ids);
}

export function battleComboIds(battle) {
  return {
    a: battle?.comboAId ?? battle?.comboA?.id ?? null,
    b: battle?.comboBId ?? battle?.comboB?.id ?? null,
  };
}

export function aggregateBattlesForComboIds(comboIds, battles = []) {
  const idsSet = new Set(comboIds ?? []);
  const stats = { total: 0, wins: 0, losses: 0, draws: 0, winrate: 0 };
  if (!idsSet.size) return stats;
  for (const battle of battles) {
    const ids = battleComboIds(battle);
    const hasA = ids.a && idsSet.has(ids.a);
    const hasB = ids.b && idsSet.has(ids.b);
    if (!hasA && !hasB) continue;
    stats.total += 1;
    if (battle.result === 'DRAW' || (hasA && hasB)) {
      stats.draws += 1;
      continue;
    }
    const winnerIsA = battle.result === 'COMBO_A';
    if ((winnerIsA && hasA) || (!winnerIsA && hasB)) stats.wins += 1;
    else stats.losses += 1;
  }
  const decisive = stats.total - stats.draws;
  stats.winrate = decisive > 0 ? Number(((stats.wins / decisive) * 100).toFixed(1)) : 0;
  return stats;
}

export function combosUsingPartIds(partIds, combos = []) {
  const target = uniqueIds(partIds);
  if (!target.length) return [];
  return combos.filter((combo) => {
    const ids = new Set(comboPartIds(combo));
    return target.every((id) => ids.has(id));
  });
}

function buildPairDefinitions(combo) {
  if (!combo) return [];
  const bladeName = combo.blade?.name || 'Blade';
  const ratchetName = combo.ratchet?.name || 'Ratchet';
  const bitName = combo.bit?.name || 'Bit';
  const assistName = combo.assistBlade?.name || 'Assist';
  const lockName = combo.lockChip?.name || 'Lock Chip';
  const pairs = [
    {
      id: 'blade-ratchet',
      name: `${bladeName} + ${ratchetName}`,
      partIds: uniqueIds([combo.bladeId, combo.ratchetId]),
    },
    {
      id: 'blade-bit',
      name: `${bladeName} + ${bitName}`,
      partIds: uniqueIds([combo.bladeId, combo.bitId]),
    },
    {
      id: 'ratchet-bit',
      name: `${ratchetName} + ${bitName}`,
      partIds: uniqueIds([combo.ratchetId, combo.bitId]),
    },
  ];
  if (combo.assistBladeId) {
    pairs.push(
      {
        id: 'blade-assist',
        name: `${bladeName} + ${assistName}`,
        partIds: uniqueIds([combo.bladeId, combo.assistBladeId]),
      },
      {
        id: 'assist-ratchet',
        name: `${assistName} + ${ratchetName}`,
        partIds: uniqueIds([combo.assistBladeId, combo.ratchetId]),
      },
      {
        id: 'assist-bit',
        name: `${assistName} + ${bitName}`,
        partIds: uniqueIds([combo.assistBladeId, combo.bitId]),
      },
    );
  }
  if (combo.lockChipId) {
    pairs.push(
      {
        id: 'blade-lock',
        name: `${bladeName} + ${lockName}`,
        partIds: uniqueIds([combo.bladeId, combo.lockChipId]),
      },
      {
        id: 'lock-ratchet',
        name: `${lockName} + ${ratchetName}`,
        partIds: uniqueIds([combo.lockChipId, combo.ratchetId]),
      },
      {
        id: 'lock-bit',
        name: `${lockName} + ${bitName}`,
        partIds: uniqueIds([combo.lockChipId, combo.bitId]),
      },
    );
    if (combo.assistBladeId) {
      pairs.push({
        id: 'lock-assist',
        name: `${lockName} + ${assistName}`,
        partIds: uniqueIds([combo.lockChipId, combo.assistBladeId]),
      });
    }
  }
  return pairs.filter((pair) => pair.partIds.length === 2 && pair.partIds[0] !== pair.partIds[1]);
}

export function computeSynergyHighlights(combo, combos = [], battles = []) {
  if (!combo) return [];
  return buildPairDefinitions(combo)
    .map((pair) => {
      const relatedCombos = combosUsingPartIds(pair.partIds, combos);
      const stats = aggregateBattlesForComboIds(
        relatedCombos.map((item) => item.id),
        battles,
      );
      return {
        ...pair,
        combos: relatedCombos.length,
        ...stats,
      };
    })
    .filter((entry) => entry.total >= 3)
    .sort((a, b) => b.winrate - a.winrate || b.total - a.total);
}

export function computeOpponentMatchups(comboId, battles = []) {
  if (!comboId) return { opponents: [], archetypes: [] };
  const opponents = new Map();
  const archetypes = new Map();
  for (const battle of battles) {
    const ids = battleComboIds(battle);
    const isA = ids.a === comboId;
    const isB = ids.b === comboId;
    if (!isA && !isB) continue;
    const opponentId = isA ? ids.b : ids.a;
    if (!opponentId) continue;
    const opponent = isA ? battle.comboB : battle.comboA;
    const key = opponentId;
    const entry = opponents.get(key) ?? {
      id: opponentId,
      name: opponent?.name || 'Combo adversário',
      archetype: opponent?.archetype || 'Indefinido',
      total: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };
    entry.total += 1;
    if (battle.result === 'DRAW') entry.draws += 1;
    else if ((battle.result === 'COMBO_A' && isA) || (battle.result === 'COMBO_B' && isB)) entry.wins += 1;
    else entry.losses += 1;
    opponents.set(key, entry);

    const archKey = entry.archetype;
    const arch = archetypes.get(archKey) ?? { archetype: archKey, total: 0, wins: 0, losses: 0, draws: 0 };
    arch.total += 1;
    if (battle.result === 'DRAW') arch.draws += 1;
    else if ((battle.result === 'COMBO_A' && isA) || (battle.result === 'COMBO_B' && isB)) arch.wins += 1;
    else arch.losses += 1;
    archetypes.set(archKey, arch);
  }

  const computeWinrate = (entry) => {
    const decisive = entry.total - entry.draws;
    return decisive > 0 ? Number(((entry.wins / decisive) * 100).toFixed(1)) : 0;
  };

  return {
    opponents: [...opponents.values()].map((entry) => ({
      ...entry,
      winrate: computeWinrate(entry),
    })),
    archetypes: [...archetypes.values()].map((entry) => ({
      ...entry,
      winrate: computeWinrate(entry),
    })),
  };
}

function buildPartStats(combo, combos = [], battles = []) {
  if (!combo) return [];
  const roles = [
    { role: 'Blade', id: combo.bladeId, meta: combo.blade },
    { role: 'Ratchet', id: combo.ratchetId, meta: combo.ratchet },
    { role: 'Bit', id: combo.bitId, meta: combo.bit },
  ];
  if (combo.assistBladeId) {
    roles.push({ role: 'Assist Blade', id: combo.assistBladeId, meta: combo.assistBlade });
  }
  if (combo.lockChipId) {
    roles.push({ role: 'Lock Chip', id: combo.lockChipId, meta: combo.lockChip });
  }
  return roles
    .filter((part) => Boolean(part.id))
    .map((part) => {
      const related = combosUsingPartIds([part.id], combos);
      const stats = aggregateBattlesForComboIds(
        related.map((item) => item.id),
        battles,
      );
      return {
        role: part.role,
        id: part.id,
        name: part.meta?.name || 'Peça',
        type: part.meta?.type || '—',
        archetype: part.meta?.archetype || '—',
        combos: related.length,
        ...stats,
      };
    })
    .sort((a, b) => b.total - a.total);
}

function buildPairStats(combo, combos = [], battles = []) {
  return buildPairDefinitions(combo)
    .map((pair) => {
      const related = combosUsingPartIds(pair.partIds, combos);
      const stats = aggregateBattlesForComboIds(
        related.map((item) => item.id),
        battles,
      );
      return {
        id: pair.id,
        name: pair.name,
        combos: related.length,
        partIds: pair.partIds,
        ...stats,
      };
    })
    .sort((a, b) => b.total - a.total);
}

function weightedAverage(entries = []) {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.total, 0);
  if (!totalWeight) return 0;
  const value = entries.reduce((sum, entry) => sum + entry.winrate * (entry.total / totalWeight), 0);
  return Number(value.toFixed(1));
}

export function buildSimulationInsight(combo, combos = [], battles = []) {
  if (!combo) return null;
  const partStats = buildPartStats(combo, combos, battles);
  const pairStats = buildPairStats(combo, combos, battles);
  const readyParts = partStats.length > 0 && partStats.every((part) => part.total >= PART_SAMPLE_THRESHOLD);
  const readyPairs = pairStats.some((pair) => pair.total >= PAIR_SAMPLE_THRESHOLD);
  const partScore = weightedAverage(partStats);
  const pairScore = weightedAverage(pairStats);
  const combinedScore = Number((partScore * 0.6 + pairScore * 0.4).toFixed(1));
  return {
    comboId: combo.id,
    partStats,
    pairStats,
    readyParts,
    readyPairs,
    partScore,
    pairScore,
    combinedScore,
  };
}

export function simulateMatchup(comboA, comboB, combos = [], battles = []) {
  if (!comboA || !comboB) {
    return { status: 'invalid', message: 'Selecione dois beys para simular.' };
  }
  const insightA = buildSimulationInsight(comboA, combos, battles);
  const insightB = buildSimulationInsight(comboB, combos, battles);
  const missing = [];
  if (!insightA?.readyParts) missing.push(`${comboA.name}: menos de ${PART_SAMPLE_THRESHOLD} batalhas por peça.`);
  if (!insightB?.readyParts) missing.push(`${comboB.name}: menos de ${PART_SAMPLE_THRESHOLD} batalhas por peça.`);
  if (!insightA?.readyPairs) missing.push(`${comboA.name}: precisamos de ${PAIR_SAMPLE_THRESHOLD}+ batalhas com pelo menos dois componentes juntos.`);
  if (!insightB?.readyPairs) missing.push(`${comboB.name}: precisamos de ${PAIR_SAMPLE_THRESHOLD}+ batalhas com pelo menos dois componentes juntos.`);
  if (missing.length) {
    return {
      status: 'insufficient',
      message: missing.join(' '),
      combos: {
        [comboA.id]: insightA,
        [comboB.id]: insightB,
      },
    };
  }
  const diff = insightA.combinedScore - insightB.combinedScore;
  let winner = 'tie';
  if (diff > 1) winner = comboA.id;
  else if (diff < -1) winner = comboB.id;
  const confidence = Math.min(95, Math.max(5, Math.round(Math.abs(diff) * 5) + 20));
  return {
    status: 'predicted',
    winner,
    confidence,
    diff: Number(diff.toFixed(1)),
    combos: {
      [comboA.id]: insightA,
      [comboB.id]: insightB,
    },
  };
}

export { PART_SAMPLE_THRESHOLD, PAIR_SAMPLE_THRESHOLD };
