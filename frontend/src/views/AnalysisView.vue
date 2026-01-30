<template>
  <div class="space-y-8">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
      <header>
        <p class="text-xs uppercase tracking-wide text-slate-400">Camada tática</p>
        <h2 class="text-2xl font-semibold">Relatórios detalhados de batalha</h2>
        <p class="text-sm text-slate-500">Combine filtros para entender eficiência por combo, arena e tipo de vitória.</p>
      </header>
      <div class="grid gap-4 lg:grid-cols-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Período</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="option in rangeOptions"
              :key="option.value"
              type="button"
              class="px-3 py-2 rounded-xl text-xs font-semibold border transition"
              :class="filters.range === option.value ? 'border-primary/70 text-white bg-primary/20' : 'border-slate-800 text-slate-400'"
              @click="filters.range = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <label class="text-xs uppercase tracking-wide text-slate-400">
          Arena
          <select v-model="filters.arenaId" class="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm">
            <option value="ALL">Todas</option>
            <option v-for="arena in arenasStore.items" :key="arena.id" :value="arena.id">{{ arena.name }}</option>
          </select>
        </label>
        <label class="text-xs uppercase tracking-wide text-slate-400">
          Tipo de vitória
          <select v-model="filters.victoryType" class="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm">
            <option value="ALL">Todos</option>
            <option v-for="type in victoryTypeOptions" :key="type" :value="type">
              {{ type === 'NO_DATA' ? 'Sem registro' : type }}
            </option>
          </select>
        </label>
        <label class="text-xs uppercase tracking-wide text-slate-400">
          Combo em foco
          <select v-model="filters.comboId" class="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm">
            <option value="ALL">Todos os combos</option>
            <option v-for="combo in combosStore.items" :key="combo.id" :value="combo.id">{{ combo.name }}</option>
          </select>
        </label>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <label class="flex flex-col text-xs uppercase tracking-wide text-slate-400">
          Mínimo para ranking: {{ filters.minBattles }} partidas
          <input
            v-model.number="filters.minBattles"
            type="range"
            min="1"
            max="8"
            step="1"
            class="mt-2 accent-primary"
          />
        </label>
        <p class="text-xs text-slate-500">Total de batalhas no filtro: {{ analysisBattles.length }}</p>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <article v-for="card in summaryCards" :key="card.label" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">{{ card.label }}</p>
        <p class="text-3xl font-semibold">{{ card.value }}</p>
        <p class="text-xs text-slate-500">{{ card.helper }}</p>
      </article>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Ranking detalhado</p>
          <h3 class="text-xl font-semibold">Eficiência por combo</h3>
          <p class="text-xs text-slate-500">Considera mínimo de {{ filters.minBattles }} partidas.</p>
        </div>
      </header>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-slate-400 uppercase text-xs">
            <tr>
              <th class="py-2">Combo</th>
              <th>Arquétipo</th>
              <th>Partidas</th>
              <th>Vitórias</th>
              <th>Derrotas</th>
              <th>Empates</th>
              <th>Winrate</th>
              <th>Eficiência</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="combo in ranking" :key="combo.id" class="border-t border-slate-800/70">
              <td class="py-3">
                <RouterLink :to="`/combos/${combo.id}`" class="text-primary hover:underline">{{ combo.name }}</RouterLink>
              </td>
              <td>{{ combo.archetype }}</td>
              <td>{{ combo.total }}</td>
              <td>{{ combo.wins }}</td>
              <td>{{ combo.losses }}</td>
              <td>{{ combo.draws }}</td>
              <td>{{ combo.winrate }}%</td>
              <td>{{ combo.efficiency }}%</td>
            </tr>
            <tr v-if="ranking.length === 0">
              <td colspan="8" class="py-4 text-center text-slate-500">Nenhum combo atingiu o mínimo configurado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="focusPanel" class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Painel do combo</p>
          <h3 class="text-2xl font-semibold">{{ focusPanel.name }}</h3>
        </div>
        <div class="grid grid-cols-4 gap-3 text-center">
          <div>
            <p class="text-xs text-slate-400">Partidas</p>
            <p class="text-xl font-semibold">{{ focusPanel.summary.total }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Vitórias</p>
            <p class="text-xl font-semibold text-emerald-400">{{ focusPanel.summary.wins }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Derrotas</p>
            <p class="text-xl font-semibold text-rose-400">{{ focusPanel.summary.losses }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Winrate</p>
            <p class="text-xl font-semibold">{{ focusPanel.summary.winrate }}%</p>
          </div>
        </div>
      </header>
      <div class="grid gap-6 lg:grid-cols-2">
        <article class="rounded-2xl border border-slate-800 p-4 bg-slate-950/40">
          <h4 class="text-sm font-semibold text-slate-300 mb-3">Adversários mais frequentes</h4>
          <table class="w-full text-xs">
            <thead class="text-slate-500 uppercase">
              <tr>
                <th class="py-1 text-left">Combo</th>
                <th>Partidas</th>
                <th>Vitórias</th>
                <th>Derrotas</th>
                <th>Winrate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="opponent in focusPanel.opponents" :key="opponent.id" class="border-t border-slate-800/60">
                <td class="py-2">{{ opponent.name }}</td>
                <td>{{ opponent.total }}</td>
                <td>{{ opponent.wins }}</td>
                <td>{{ opponent.losses }}</td>
                <td>{{ opponent.winrate }}%</td>
              </tr>
              <tr v-if="focusPanel.opponents.length === 0">
                <td colspan="5" class="py-3 text-center text-slate-500">Sem dados suficientes.</td>
              </tr>
            </tbody>
          </table>
        </article>
        <article class="rounded-2xl border border-slate-800 p-4 bg-slate-950/40">
          <h4 class="text-sm font-semibold text-slate-300 mb-3">Arenas favoráveis</h4>
          <ul class="space-y-3 text-sm">
            <li v-for="arena in focusPanel.arenas" :key="arena.id" class="flex items-center justify-between">
              <div>
                <p class="font-semibold">{{ arena.name }}</p>
                <p class="text-xs text-slate-500">{{ arena.total }} partidas</p>
              </div>
              <span class="text-sm font-semibold">{{ arena.winrate }}% win</span>
            </li>
            <li v-if="focusPanel.arenas.length === 0" class="text-center text-slate-500 text-xs">
              Ainda sem arenas favoritas neste recorte.
            </li>
          </ul>
        </article>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-2">
      <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <header class="mb-4">
          <p class="text-xs uppercase tracking-wide text-slate-400">Arenas e eficiência</p>
          <h3 class="text-xl font-semibold">Onde as batalhas decidem</h3>
        </header>
        <table class="w-full text-sm">
          <thead class="text-left text-slate-400 uppercase text-xs">
            <tr>
              <th class="py-2">Arena</th>
              <th>Batalhas</th>
              <th>Decisões</th>
              <th>Empates</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="arena in arenaBreakdown" :key="arena.id" class="border-t border-slate-800/70">
              <td class="py-3">{{ arena.name }}</td>
              <td>{{ arena.total }}</td>
              <td>{{ arena.decisiveRate }}%</td>
              <td>{{ arena.drawRate }}%</td>
            </tr>
            <tr v-if="arenaBreakdown.length === 0">
              <td colspan="4" class="py-4 text-center text-slate-500">Cadastre batalhas com arena para visualizar.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <header class="mb-4">
          <p class="text-xs uppercase tracking-wide text-slate-400">Distribuição dos resultados</p>
          <h3 class="text-xl font-semibold">Quem vence e como</h3>
        </header>
        <ul class="space-y-4">
          <li v-for="item in resultBreakdown" :key="item.label">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>{{ item.label }}</span>
              <span>{{ item.percent }}% · {{ item.count }} partidas</span>
            </div>
            <div class="h-2 rounded-full bg-slate-800 overflow-hidden mt-1">
              <div class="h-full bg-primary" :style="{ width: `${item.percent}%` }"></div>
            </div>
          </li>
          <li v-if="resultBreakdown.length === 0" class="text-center text-slate-500 text-sm">
            Nenhum dado para este filtro.
          </li>
        </ul>
      </section>
    </div>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Linha do tempo</p>
          <h3 class="text-xl font-semibold">Batalhas do recorte</h3>
        </div>
        <span class="text-xs text-slate-500">{{ recentBattles.length }} registros recentes</span>
      </header>
      <ul class="space-y-4 max-h-[480px] overflow-y-auto pr-2">
        <li v-for="battle in recentBattles" :key="battle.id" class="border border-slate-800 rounded-xl p-4 bg-slate-900/70">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">
              {{ battle.comboA.name }}
              <span class="text-slate-500">vs</span>
              {{ battle.comboB.name }}
            </p>
            <span class="text-xs text-slate-400">{{ battle.victoryType || 'Sem registro' }}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            {{ battle.occurredAt ? formatDate(battle.occurredAt) : 'Data não informada' }} ·
            {{ battle.arena?.name || 'Arena livre' }} · Score: {{ battle.score || '—' }} · Resultado: {{ labels[battle.result] || battle.result }}
          </p>
        </li>
        <li v-if="recentBattles.length === 0" class="text-center text-slate-500 text-sm">
          Nada para exibir. Ajuste os filtros acima.
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';

import { useCombosStore } from '../stores/combos';
import { useBattlesStore } from '../stores/battles';
import { useArenasStore } from '../stores/arenas';
import { formatDate } from '../utils/format';

const combosStore = useCombosStore();
const battlesStore = useBattlesStore();
const arenasStore = useArenasStore();

const labels = {
  COMBO_A: 'Vitória do Combo A',
  COMBO_B: 'Vitória do Combo B',
  DRAW: 'Empate',
};

const filters = reactive({
  range: '90',
  arenaId: 'ALL',
  victoryType: 'ALL',
  comboId: 'ALL',
  minBattles: 3,
});

const rangeOptions = [
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
  { label: '180 dias', value: '180' },
  { label: '1 ano', value: '365' },
  { label: 'Tudo', value: 'all' },
];

onMounted(async () => {
  await Promise.all([
    combosStore.fetchCombos(),
    battlesStore.fetchBattles({ limit: 500 }),
    arenasStore.fetchArenas(),
  ]);
});

const victoryTypeOptions = computed(() => {
  const set = new Set();
  let hasEmpty = false;
  battlesStore.items.forEach((battle) => {
    if (battle.victoryType) set.add(battle.victoryType);
    else hasEmpty = true;
  });
  const types = Array.from(set).sort();
  return hasEmpty ? [...types, 'NO_DATA'] : types;
});

const analysisBattles = computed(() => {
  const now = Date.now();
  const rangeDays = filters.range === 'all' ? null : Number(filters.range);
  const minTimestamp = rangeDays ? now - rangeDays * 24 * 60 * 60 * 1000 : null;

  return battlesStore.items.filter((battle) => {
    const occurredAt = battle.occurredAt ? new Date(battle.occurredAt).getTime() : null;
    if (minTimestamp && occurredAt && occurredAt < minTimestamp) return false;
    if (filters.arenaId !== 'ALL' && battle.arena?.id !== filters.arenaId) return false;
    if (filters.victoryType === 'NO_DATA' && battle.victoryType) return false;
    if (filters.victoryType !== 'ALL' && filters.victoryType !== 'NO_DATA' && battle.victoryType !== filters.victoryType) {
      return false;
    }
    if (filters.comboId !== 'ALL') {
      const id = filters.comboId;
      const involved =
        battle.comboAId === id ||
        battle.comboBId === id ||
        battle.comboA?.id === id ||
        battle.comboB?.id === id;
      if (!involved) return false;
    }
    return true;
  });
});

function ensureEntry(map, id, comboData) {
  if (!id) return null;
  if (!map.has(id)) {
    map.set(id, {
      id,
      name: comboData?.name ?? 'Combo desconhecido',
      archetype: comboData?.archetype ?? '—',
      wins: 0,
      losses: 0,
      draws: 0,
      total: 0,
    });
  }
  return map.get(id);
}

function buildComboStats(source) {
  const stats = new Map();
  source.forEach((battle) => {
    const comboAId = battle.comboAId ?? battle.comboA?.id;
    const comboBId = battle.comboBId ?? battle.comboB?.id;
    const entryA = ensureEntry(stats, comboAId, battle.comboA);
    const entryB = ensureEntry(stats, comboBId, battle.comboB);
    if (entryA) entryA.total += 1;
    if (entryB) entryB.total += 1;
    if (battle.result === 'COMBO_A') {
      if (entryA) entryA.wins += 1;
      if (entryB) entryB.losses += 1;
    } else if (battle.result === 'COMBO_B') {
      if (entryB) entryB.wins += 1;
      if (entryA) entryA.losses += 1;
    } else {
      if (entryA) entryA.draws += 1;
      if (entryB) entryB.draws += 1;
    }
  });

  return [...stats.values()].map((entry) => {
    const decisive = entry.total - entry.draws;
    const winrate = decisive > 0 ? ((entry.wins / decisive) * 100).toFixed(1) : '0.0';
    const efficiency = entry.total ? (((entry.wins - entry.losses) / entry.total) * 100).toFixed(1) : '0.0';
    return { ...entry, winrate, efficiency };
  });
}

const comboStats = computed(() => buildComboStats(analysisBattles.value));

const ranking = computed(() =>
  comboStats.value
    .filter((item) => item.total >= filters.minBattles)
    .sort((a, b) => Number(b.winrate) - Number(a.winrate))
    .slice(0, 20),
);

const analysisSummary = computed(() =>
  analysisBattles.value.reduce(
    (acc, battle) => {
      acc.total += 1;
      if (battle.result === 'DRAW') acc.draws += 1;
      else acc.decisions += 1;
      return acc;
    },
    { total: 0, draws: 0, decisions: 0 },
  ),
);

const averageWinrate = computed(() => {
  const eligible = ranking.value;
  if (!eligible.length) return '0.0';
  const sum = eligible.reduce((total, combo) => total + Number(combo.winrate), 0);
  return (sum / eligible.length).toFixed(1);
});

const arenaBreakdown = computed(() => {
  const map = new Map();
  analysisBattles.value.forEach((battle) => {
    if (!battle.arena?.id) return;
    const entry = map.get(battle.arena.id) ?? {
      id: battle.arena.id,
      name: battle.arena.name,
      total: 0,
      draws: 0,
      decisive: 0,
    };
    entry.total += 1;
    if (battle.result === 'DRAW') entry.draws += 1;
    else entry.decisive += 1;
    map.set(battle.arena.id, entry);
  });
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      decisiveRate: entry.total ? Math.round((entry.decisive / entry.total) * 100) : 0,
      drawRate: entry.total ? Math.round((entry.draws / entry.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
});

const resultBreakdown = computed(() => {
  const total = analysisBattles.value.length;
  if (!total) return [];
  const summary = { 'Vitórias do Combo A': 0, 'Vitórias do Combo B': 0, Empates: 0 };
  analysisBattles.value.forEach((battle) => {
    if (battle.result === 'COMBO_A') summary['Vitórias do Combo A'] += 1;
    else if (battle.result === 'COMBO_B') summary['Vitórias do Combo B'] += 1;
    else summary.Empates += 1;
  });
  return Object.entries(summary).map(([label, count]) => ({
    label,
    count,
    percent: Math.round((count / total) * 100),
  }));
});

const recentBattles = computed(() =>
  [...analysisBattles.value]
    .sort((a, b) => {
      const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
      const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 10),
);

const focusPanel = computed(() => {
  if (filters.comboId === 'ALL') return null;
  const combo = combosStore.items.find((item) => item.id === filters.comboId);
  const battles = analysisBattles.value.filter(
    (battle) => battle.comboAId === filters.comboId || battle.comboBId === filters.comboId || battle.comboA?.id === filters.comboId || battle.comboB?.id === filters.comboId,
  );
  if (!battles.length) {
    return {
      name: combo?.name ?? 'Combo selecionado',
      summary: { total: 0, wins: 0, losses: 0, winrate: '0.0' },
      opponents: [],
      arenas: [],
    };
  }
  const summary = { total: 0, wins: 0, losses: 0, draws: 0 };
  const opponents = new Map();
  const arenas = new Map();

  battles.forEach((battle) => {
    const isComboA = battle.comboAId === filters.comboId || battle.comboA?.id === filters.comboId;
    const opponent = isComboA ? battle.comboB : battle.comboA;
    const opponentId = isComboA ? battle.comboBId ?? opponent?.id : battle.comboAId ?? opponent?.id;
    summary.total += 1;
    if (battle.result === 'DRAW') summary.draws += 1;
    else if ((battle.result === 'COMBO_A' && isComboA) || (battle.result === 'COMBO_B' && !isComboA)) summary.wins += 1;
    else summary.losses += 1;

    if (opponentId) {
      const entry = opponents.get(opponentId) ?? {
        id: opponentId,
        name: opponent?.name ?? 'Desconhecido',
        total: 0,
        wins: 0,
        losses: 0,
      };
      entry.total += 1;
      if (battle.result === 'DRAW') {
        entry.draws = (entry.draws ?? 0) + 1;
      } else if ((battle.result === 'COMBO_A' && isComboA) || (battle.result === 'COMBO_B' && !isComboA)) {
        entry.wins += 1;
      } else {
        entry.losses += 1;
      }
      opponents.set(opponentId, entry);
    }

    if (battle.arena?.id) {
      const arenaEntry = arenas.get(battle.arena.id) ?? {
        id: battle.arena.id,
        name: battle.arena.name,
        total: 0,
        wins: 0,
      };
      arenaEntry.total += 1;
      if (battle.result !== 'DRAW') {
        const focusWon = (battle.result === 'COMBO_A' && isComboA) || (battle.result === 'COMBO_B' && !isComboA);
        if (focusWon) arenaEntry.wins += 1;
      }
      arenas.set(battle.arena.id, arenaEntry);
    }
  });

  const opponentsList = [...opponents.values()]
    .map((entry) => ({
      ...entry,
      winrate: entry.total ? ((entry.wins / entry.total) * 100).toFixed(1) : '0.0',
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const arenasList = [...arenas.values()]
    .map((entry) => ({
      ...entry,
      winrate: entry.total ? Math.round((entry.wins / entry.total) * 100) : 0,
    }))
    .sort((a, b) => b.winrate - a.winrate)
    .slice(0, 3);

  const winrate = summary.total - summary.draws > 0 ? ((summary.wins / (summary.total - summary.draws)) * 100).toFixed(1) : '0.0';

  return {
    name: combo?.name ?? 'Combo selecionado',
    summary: { ...summary, winrate },
    opponents: opponentsList,
    arenas: arenasList,
  };
});

const summaryCards = computed(() => {
  const total = analysisSummary.value.total;
  const draws = analysisSummary.value.draws;
  const decisions = analysisSummary.value.decisions;
  const drawRate = total ? Math.round((draws / total) * 100) : 0;
  const decisionRate = total ? Math.round((decisions / total) * 100) : 0;
  const bestArena = arenaBreakdown.value[0];
  const bestCombo = ranking.value[0];
  return [
    {
      label: 'Batalhas analisadas',
      value: total,
      helper: filters.range === 'all' ? 'Histórico completo' : `Últimos ${filters.range} dias`,
    },
    {
      label: 'Decisões',
      value: decisions,
      helper: `${decisionRate}% sem empate`,
    },
    {
      label: 'Empates',
      value: draws,
      helper: `${drawRate}% do total`,
    },
    {
      label: 'Winrate médio',
      value: `${averageWinrate.value}%`,
      helper: ranking.value.length ? 'Com base no ranking atual' : 'Cadastre mais batalhas',
    },
    {
      label: 'Arena destaque',
      value: bestArena?.name ?? '—',
      helper: bestArena ? `${bestArena.decisiveRate}% decisões` : 'Sem dados no filtro',
    },
    {
      label: 'Combo destaque',
      value: bestCombo?.name ?? '—',
      helper: bestCombo ? `${bestCombo.winrate}% em ${bestCombo.total} partidas` : 'Nenhum combo elegível',
    },
  ];
});
</script>
