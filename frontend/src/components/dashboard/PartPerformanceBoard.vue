<template>
  <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-wide text-slate-400">Peças</p>
        <h2 class="text-2xl font-semibold">Inteligência de desempenho</h2>
        <p class="text-sm text-slate-500">Compare métricas avançadas para descobrir onde cada peça entrega melhores resultados.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
          :class="filters.mode === 'all'
            ? 'bg-primary/20 border-primary/70 text-white'
            : 'border-slate-700 text-slate-300 hover:border-primary/50'"
          @click="setMode('all')"
        >
          Todas as amostras
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
          :class="filters.mode === 'likely'
            ? 'bg-emerald-500/20 border-emerald-400/70 text-white'
            : 'border-slate-700 text-slate-300 hover:border-emerald-400/50'"
          @click="setMode('likely')"
        >
          Resultado mais provável
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:border-slate-500"
          @click="loadData"
        >
          Atualizar
        </button>
      </div>
    </header>

    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
      <article v-for="card in summaryCards" :key="card.label" class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">{{ card.label }}</p>
        <p class="text-2xl font-semibold">{{ card.value }}</p>
        <p class="text-xs text-slate-500">{{ card.helper }}</p>
      </article>
    </div>

    <p v-if="contextInfo.generatedAt" class="text-xs text-slate-500">
      Última atualização: {{ formatTimestamp(contextInfo.generatedAt) }} · Critério mínimo: {{ contextInfo.filters.minBattles }} batalhas por peça.
    </p>

    <div v-if="loading" class="text-sm text-slate-400 py-12 text-center">Carregando relatórios avançados...</div>
    <div v-else-if="error" class="text-sm text-rose-400 py-6">{{ error }}</div>
    <div v-else-if="!hasData" class="text-sm text-slate-500 py-6">
      Nenhuma peça atingiu o critério mínimo para gerar relatórios nesta visão. Registre mais batalhas ou reduza o filtro.
    </div>

    <template v-else>
      <section class="space-y-4">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-400">Vitórias e consistência</p>
          <h3 class="text-xl font-semibold">Quem vence e quanto dá para confiar</h3>
        </header>
        <div class="grid gap-6 lg:grid-cols-3">
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[260px] flex items-center justify-center">
            <Bar v-if="winrateChartData" :data="winrateChartData" :options="winrateBarOptions" />
            <p v-else class="text-sm text-slate-500">Sem peças com vitórias suficientes.</p>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[260px] flex items-center justify-center">
            <Bar v-if="confidenceChartData" :data="confidenceChartData" :options="confidenceBarOptions" />
            <p v-else class="text-sm text-slate-500">Ainda não há confiança estatística para esta visão.</p>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
            <table class="w-full text-xs">
              <thead class="text-slate-400 uppercase">
                <tr>
                  <th class="py-1 text-left">Peça</th>
                  <th class="py-1 text-right">Winrate</th>
                  <th class="py-1 text-right">Batalhas</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in consistencyTable" :key="row.id" class="border-t border-slate-800/60">
                  <td class="py-2">
                    <p class="font-semibold text-slate-100">{{ row.name }}</p>
                    <p class="text-[11px] text-slate-500">{{ row.type }} · {{ row.archetype ?? '—' }}</p>
                  </td>
                  <td class="py-2 text-right">{{ row.winRate }}%</td>
                  <td class="py-2 text-right">{{ row.battles }}</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
      </section>

      <section class="space-y-4">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-400">Uso e impacto</p>
          <h3 class="text-xl font-semibold">Frequência em combos e saldo decisivo</h3>
        </header>
        <div class="grid gap-6 xl:grid-cols-3">
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[260px] flex items-center justify-center">
            <Bar v-if="usageChartData" :data="usageChartData" :options="countBarOptions" />
            <p v-else class="text-sm text-slate-500">Nenhuma peça aparece em combos suficientes.</p>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[260px] flex items-center justify-center">
            <Bar v-if="impactChartData" :data="impactChartData" :options="impactBarOptions" />
            <p v-else class="text-sm text-slate-500">Precisamos de mais batalhas para medir impacto.</p>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <table class="w-full text-xs">
              <thead class="text-slate-400 uppercase">
                <tr>
                  <th class="py-1 text-left">Peça</th>
                  <th class="py-1 text-right">Roles</th>
                  <th class="py-1 text-right">Combos</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in versatilityRows" :key="row.id" class="border-t border-slate-800/60">
                  <td class="py-2">
                    <p class="font-semibold text-slate-100">{{ row.name }}</p>
                    <p class="text-[11px] text-slate-500">{{ row.type }}</p>
                  </td>
                  <td class="py-2 text-right">{{ row.roles }}</td>
                  <td class="py-2 text-right">{{ row.combos }}</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
      </section>

      <section class="space-y-4">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-400">Sinergias e arenas</p>
          <h3 class="text-xl font-semibold">Onde cada peça brilha mais</h3>
        </header>
        <div class="grid gap-6 lg:grid-cols-3">
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
            <h4 class="text-sm font-semibold text-slate-200 mb-3">Blade + Assist</h4>
            <table class="w-full text-xs">
              <thead class="text-slate-400 uppercase">
                <tr>
                  <th class="py-1 text-left">Par</th>
                  <th class="py-1 text-right">Rodadas</th>
                  <th class="py-1 text-right">Winrate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in assistSynergyRows" :key="row.id" class="border-t border-slate-800/60">
                  <td class="py-2">
                    <p class="font-semibold text-slate-100">{{ row.pair }}</p>
                    <p class="text-[11px] text-slate-500">{{ row.highlight }}</p>
                  </td>
                  <td class="py-2 text-right">{{ row.battles }}</td>
                  <td class="py-2 text-right">{{ row.winRate }}%</td>
                </tr>
                <tr v-if="assistSynergyRows.length === 0">
                  <td colspan="3" class="py-3 text-center text-slate-500">Sem pares com amostra mínima.</td>
                </tr>
              </tbody>
            </table>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
            <h4 class="text-sm font-semibold text-slate-200 mb-3">Blade + Lock chip</h4>
            <table class="w-full text-xs">
              <thead class="text-slate-400 uppercase">
                <tr>
                  <th class="py-1 text-left">Par</th>
                  <th class="py-1 text-right">Rodadas</th>
                  <th class="py-1 text-right">Winrate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in lockSynergyRows" :key="row.id" class="border-t border-slate-800/60">
                  <td class="py-2">
                    <p class="font-semibold text-slate-100">{{ row.pair }}</p>
                    <p class="text-[11px] text-slate-500">{{ row.highlight }}</p>
                  </td>
                  <td class="py-2 text-right">{{ row.battles }}</td>
                  <td class="py-2 text-right">{{ row.winRate }}%</td>
                </tr>
                <tr v-if="lockSynergyRows.length === 0">
                  <td colspan="3" class="py-3 text-center text-slate-500">Nenhum lock chip se destacou ainda.</td>
                </tr>
              </tbody>
            </table>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[260px] flex items-center justify-center">
            <Bar v-if="arenaChartData" :data="arenaChartData" :options="countBarOptions" />
            <p v-else class="text-sm text-slate-500">Não há arenas suficientes para o relatório.</p>
          </article>
        </div>
        <div class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 overflow-hidden">
          <h4 class="text-sm font-semibold text-slate-200 mb-3">Hotspots de arena</h4>
          <table class="w-full text-xs">
            <thead class="text-slate-400 uppercase">
              <tr>
                <th class="py-1 text-left">Peça</th>
                <th class="py-1 text-left">Arena</th>
                <th class="py-1 text-right">Rodadas</th>
                <th class="py-1 text-right">Winrate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in arenaHighlights" :key="row.id" class="border-t border-slate-800/60">
                <td class="py-2 text-slate-100">{{ row.part }}</td>
                <td class="py-2 text-slate-400">{{ row.arena }}</td>
                <td class="py-2 text-right">{{ row.battles }}</td>
                <td class="py-2 text-right">{{ row.winRate }}%</td>
              </tr>
              <tr v-if="arenaHighlights.length === 0">
                <td colspan="4" class="py-3 text-center text-slate-500">Precisamos de mais registros por arena.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-4">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-400">Peso e arquétipos</p>
          <h3 class="text-xl font-semibold">Tendências físicas e filosóficas</h3>
        </header>
        <div class="grid gap-6 lg:grid-cols-3">
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[260px] flex items-center justify-center">
            <Line v-if="weightTrendChartData" :data="weightTrendChartData" :options="linePercentOptions" />
            <p v-else class="text-sm text-slate-500">Cadastre o peso das peças para liberar essa curva.</p>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[260px] flex items-center justify-center">
            <Bar v-if="archetypeChartData" :data="archetypeChartData" :options="winrateBarOptions" />
            <p v-else class="text-sm text-slate-500">Sem amostras suficientes por arquétipo.</p>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <table class="w-full text-xs">
              <thead class="text-slate-400 uppercase">
                <tr>
                  <th class="py-1 text-left">Peça</th>
                  <th class="py-1 text-right">Peso</th>
                  <th class="py-1 text-right">Winrate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in weightLeaders" :key="row.id" class="border-t border-slate-800/60">
                  <td class="py-2 text-slate-100">{{ row.name }}</td>
                  <td class="py-2 text-right">{{ row.weight }} g</td>
                  <td class="py-2 text-right">{{ row.winRate }}%</td>
                </tr>
                <tr v-if="weightLeaders.length === 0">
                  <td colspan="3" class="py-3 text-center text-slate-500">Sem medições de peso disponíveis.</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, watch } from 'vue';
import { Bar, Line } from 'vue-chartjs';
import {
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

import { useAnalyticsStore } from '../../stores/analytics';
import { formatDate } from '../../utils/format';

Chart.register(BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

const analyticsStore = useAnalyticsStore();

const filters = reactive({
  mode: 'all',
});

const palette = ['#f97316', '#22c55e', '#38bdf8', '#a855f7', '#f43f5e', '#fde047', '#c084fc'];
const secondaryPalette = ['#0ea5e9', '#10b981', '#facc15', '#fb7185', '#6366f1', '#14b8a6'];

const winrateBarOptions = {
  responsive: true,
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    y: {
      ticks: {
        color: '#94a3b8',
        callback: (value) => `${value}%`,
      },
      grid: { color: '#1e293b' },
      beginAtZero: true,
      suggestedMax: 100,
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.parsed.y ?? context.parsed}% de winrate`,
      },
    },
  },
};

const confidenceBarOptions = {
  ...winrateBarOptions,
  scales: {
    ...winrateBarOptions.scales,
    y: {
      ...winrateBarOptions.scales.y,
      ticks: {
        color: '#94a3b8',
        callback: (value) => `${value}% confiança`,
      },
    },
  },
};

const countBarOptions = {
  responsive: true,
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: '#1e293b' },
      beginAtZero: true,
    },
  },
  plugins: { legend: { display: false } },
};

const impactBarOptions = {
  ...countBarOptions,
  scales: {
    ...countBarOptions.scales,
    y: {
      ...countBarOptions.scales.y,
      ticks: { color: '#94a3b8' },
    },
  },
};

const linePercentOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    y: {
      ticks: {
        color: '#94a3b8',
        callback: (value) => `${value}%`,
      },
      grid: { color: '#1e293b' },
      beginAtZero: true,
      suggestedMax: 100,
    },
  },
};

const loading = computed(() => analyticsStore.loading);
const error = computed(() => analyticsStore.error);
const parts = computed(() => analyticsStore.partsAnalytics ?? []);
const contextInfo = computed(() => analyticsStore.context ?? { filters: { minBattles: filters.mode === 'likely' ? 10 : 1 } });
const hasData = computed(() => parts.value.length > 0);

const summaryCards = computed(() => {
  const summary = contextInfo.value.summary;
  if (!summary) return [];
  return [
    {
      label: 'Peças exibidas',
      value: summary.partsWithData,
      helper: `${summary.hiddenForSample} filtradas pelo critério`,
    },
    {
      label: 'Batalhas analisadas',
      value: summary.totalBattles,
      helper: `${summary.totalCombos} combos registrados`,
    },
    {
      label: 'Modo',
      value: filters.mode === 'likely' ? 'Resultado provável' : 'Todas',
      helper: `${contextInfo.value.filters.minBattles}+ batalhas por peça`,
    },
    {
      label: 'Atualizações',
      value: summary.totalParts,
      helper: 'Peças com qualquer histórico',
    },
  ];
});

const winrateLeaders = computed(() =>
  [...parts.value]
    .sort((a, b) => (b.winRate === a.winRate ? b.battles - a.battles : b.winRate - a.winRate))
    .slice(0, 8),
);

const winrateChartData = computed(() => {
  if (!winrateLeaders.value.length) return null;
  return {
    labels: winrateLeaders.value.map((part) => part.name),
    datasets: [
      {
        data: winrateLeaders.value.map((part) => Number((part.winRate * 100).toFixed(1))),
        backgroundColor: palette.slice(0, winrateLeaders.value.length),
      },
    ],
  };
});

function confidenceScore(part) {
  const winRate = part.winRate * 100;
  const weight = Math.log10(part.battles + 1);
  return Number((winRate * weight).toFixed(1));
}

const confidenceLeaders = computed(() =>
  [...parts.value]
    .map((part) => ({
      ...part,
      confidence: confidenceScore(part),
    }))
    .sort((a, b) => (b.confidence === a.confidence ? b.battles - a.battles : b.confidence - a.confidence))
    .slice(0, 8),
);

const confidenceChartData = computed(() => {
  if (!confidenceLeaders.value.length) return null;
  return {
    labels: confidenceLeaders.value.map((part) => part.name),
    datasets: [
      {
        data: confidenceLeaders.value.map((part) => part.confidence),
        backgroundColor: secondaryPalette.slice(0, confidenceLeaders.value.length),
      },
    ],
  };
});

const consistencyTable = computed(() =>
  confidenceLeaders.value.map((part) => ({
    id: part.id,
    name: part.name,
    type: part.type,
    archetype: part.archetype,
    battles: part.battles,
    winRate: (part.winRate * 100).toFixed(1),
  })),
);

const usageLeaders = computed(() =>
  [...parts.value]
    .sort((a, b) => (b.comboCount === a.comboCount ? b.battles - a.battles : b.comboCount - a.comboCount))
    .slice(0, 8),
);

const usageChartData = computed(() => {
  if (!usageLeaders.value.length) return null;
  return {
    labels: usageLeaders.value.map((part) => part.name),
    datasets: [
      {
        data: usageLeaders.value.map((part) => part.comboCount),
        backgroundColor: palette.slice(0, usageLeaders.value.length),
      },
    ],
  };
});

const impactLeaders = computed(() =>
  [...parts.value]
    .map((part) => ({
      ...part,
      impact: part.wins - part.losses,
    }))
    .sort((a, b) => (b.impact === a.impact ? b.battles - a.battles : b.impact - a.impact))
    .slice(0, 8),
);

const impactChartData = computed(() => {
  if (!impactLeaders.value.length) return null;
  return {
    labels: impactLeaders.value.map((part) => part.name),
    datasets: [
      {
        data: impactLeaders.value.map((part) => part.impact),
        backgroundColor: secondaryPalette.slice(0, impactLeaders.value.length),
      },
    ],
  };
});

const versatilityRows = computed(() =>
  [...parts.value]
    .map((part) => ({
      id: part.id,
      name: part.name,
      type: part.type,
      roles: Object.values(part.roles ?? {}).filter((value) => value > 0).length,
      combos: part.comboCount,
    }))
    .sort((a, b) => (b.roles === a.roles ? b.combos - a.combos : b.roles - a.roles))
    .slice(0, 6),
);

function flattenSynergy(partsList, extractor, labelBuilder) {
  const rows = [];
  partsList.forEach((part) => {
    extractor(part)?.forEach((partner) => {
      if (!partner || partner.battles < 3) return;
      rows.push({
        id: `${part.id}-${partner.id}`,
        pair: labelBuilder(part.name, partner.name),
        highlight: `${partner.battles} batalhas · ${partner.type}`,
        battles: partner.battles,
        winRate: Math.round(partner.winRate * 100),
      });
    });
  });
  return rows
    .sort((a, b) => (b.winRate === a.winRate ? b.battles - a.battles : b.winRate - a.winRate))
    .slice(0, 6);
}

const assistSynergyRows = computed(() =>
  flattenSynergy(
    parts.value.filter((part) => part.type === 'BLADE'),
    (part) => part.partners?.assists ?? [],
    (blade, assist) => `${blade} + ${assist}`,
  ),
);

const lockSynergyRows = computed(() =>
  flattenSynergy(
    parts.value.filter((part) => part.type === 'BLADE'),
    (part) => part.partners?.lockChips ?? [],
    (blade, lock) => `${blade} + ${lock}`,
  ),
);

const arenaMatrix = computed(() => {
  const map = new Map();
  parts.value.forEach((part) => {
    (part.arenas ?? []).forEach((arena) => {
      if (!arena) return;
      const entry = map.get(arena.id) ?? { id: arena.id, name: arena.name, battles: 0, wins: 0 };
      entry.battles += arena.battles;
      entry.wins += arena.wins;
      map.set(arena.id, entry);
    });
  });
  return [...map.values()].map((entry) => ({
    ...entry,
    winRate: entry.wins && entry.battles ? (entry.wins / entry.battles) * 100 : 0,
  }));
});

const arenaChartData = computed(() => {
  const top = arenaMatrix.value.filter((entry) => entry.battles >= 5).sort((a, b) => b.battles - a.battles).slice(0, 6);
  if (!top.length) return null;
  return {
    labels: top.map((entry) => entry.name),
    datasets: [
      {
        data: top.map((entry) => Math.round(entry.winRate)),
        backgroundColor: palette.slice(0, top.length),
      },
    ],
  };
});

const arenaHighlights = computed(() => {
  const rows = [];
  parts.value.forEach((part) => {
    (part.arenas ?? []).forEach((arena) => {
      if (!arena || arena.battles < 3) return;
      rows.push({
        id: `${part.id}-${arena.id}`,
        part: part.name,
        arena: arena.name,
        battles: arena.battles,
        winRate: Math.round(arena.winRate * 100),
      });
    });
  });
  return rows.sort((a, b) => (b.winRate === a.winRate ? b.battles - a.battles : b.winRate - a.winRate)).slice(0, 6);
});

const weightBuckets = computed(() => {
  const map = new Map();
  parts.value.forEach((part) => {
    if (typeof part.weight !== 'number') return;
    const bucket = Math.floor(part.weight / 2) * 2;
    const entry = map.get(bucket) ?? { bucket, wins: 0, battles: 0 };
    entry.wins += part.wins;
    entry.battles += part.battles - part.draws;
    map.set(bucket, entry);
  });
  return [...map.values()]
    .sort((a, b) => a.bucket - b.bucket)
    .map((entry) => ({
      label: `${entry.bucket}-${entry.bucket + 2}g`,
      winRate: entry.battles ? (entry.wins / entry.battles) * 100 : 0,
    }));
});

const weightTrendChartData = computed(() => {
  if (!weightBuckets.value.length) return null;
  return {
    labels: weightBuckets.value.map((bucket) => bucket.label),
    datasets: [
      {
        data: weightBuckets.value.map((bucket) => Number(bucket.winRate.toFixed(1))),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fill: true,
        tension: 0.35,
      },
    ],
  };
});

const weightLeaders = computed(() =>
  [...parts.value]
    .filter((part) => typeof part.weight === 'number')
    .sort((a, b) => (b.weight === a.weight ? b.winRate - a.winRate : (b.weight ?? 0) - (a.weight ?? 0)))
    .slice(0, 6)
    .map((part) => ({
      id: part.id,
      name: part.name,
      weight: part.weight?.toFixed(1) ?? '—',
      winRate: (part.winRate * 100).toFixed(1),
    })),
);

const archetypeChartData = computed(() => {
  const archetypes = contextInfo.value.archetypes ?? [];
  const dataset = archetypes.filter((entry) => entry.battles >= 5).sort((a, b) => b.winRate - a.winRate).slice(0, 6);
  if (!dataset.length) return null;
  return {
    labels: dataset.map((entry) => entry.archetype),
    datasets: [
      {
        data: dataset.map((entry) => Number((entry.winRate * 100).toFixed(1))),
        backgroundColor: secondaryPalette.slice(0, dataset.length),
      },
    ],
  };
});

async function loadData() {
  try {
    const minBattles = filters.mode === 'likely' ? 10 : 1;
    await analyticsStore.fetchPartsAnalytics({ minBattles, mode: filters.mode });
  } catch (err) {
    console.warn('Falha ao carregar analytics de peças', err);
  }
}

function setMode(mode) {
  if (filters.mode === mode) return;
  filters.mode = mode;
}

function formatTimestamp(value) {
  return formatDate(value);
}

onMounted(loadData);

watch(
  () => filters.mode,
  () => {
    loadData();
  },
);
</script>
