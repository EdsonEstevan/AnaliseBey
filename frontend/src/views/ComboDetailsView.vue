<template>
  <div v-if="combo" class="space-y-8">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8 mb-4">
        <div class="flex-1">
          <p class="text-xs uppercase tracking-wide text-slate-400">Combo</p>
          <h2 class="text-2xl font-bold">{{ combo.name }}</h2>
          <p class="text-sm text-slate-400 mt-1">
            {{ combo.archetype }}
            <span v-if="combo.subArchetype" class="text-slate-500">· {{ combo.subArchetype }}</span>
          </p>
        </div>
        <img
          v-if="combo.imageUrl"
          :src="combo.imageUrl"
          :alt="combo.name"
          class="w-full max-w-[220px] rounded-2xl border border-slate-800 object-cover"
        />
        <RouterLink to="/combos" class="text-sm text-primary">Voltar</RouterLink>
      </div>
      <div class="grid sm:grid-cols-5 gap-4 text-sm text-slate-300">
        <div>
          <p class="text-slate-500">Blade</p>
          <p>{{ combo.blade.name }}</p>
        </div>
        <div>
          <p class="text-slate-500">Assist Blade</p>
          <p>{{ combo.assistBlade?.name || '—' }}</p>
        </div>
        <div>
          <p class="text-slate-500">Lock Chip</p>
          <p>{{ combo.lockChip?.name || '—' }}</p>
        </div>
        <div>
          <p class="text-slate-500">Ratchet</p>
          <p>
            {{ combo.ratchet.name }}
            <span v-if="combo.ratchet.type === 'RATCHET_BIT'" class="text-xs text-primary/70">(Integrado)</span>
          </p>
        </div>
        <div>
          <p class="text-slate-500">Bit</p>
          <p>
            {{ combo.bit.name }}
            <span v-if="combo.bit.type === 'RATCHET_BIT'" class="text-xs text-primary/70">(Integrado)</span>
          </p>
        </div>
      </div>
      <div class="mt-4 grid sm:grid-cols-4 gap-4">
        <article class="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide">Partidas</p>
          <p class="text-3xl font-bold">{{ stats.total }}</p>
        </article>
        <article class="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide">Vitórias</p>
          <p class="text-3xl font-bold text-emerald-400">{{ stats.wins }}</p>
        </article>
        <article class="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide">Derrotas</p>
          <p class="text-3xl font-bold text-rose-400">{{ stats.losses }}</p>
        </article>
        <article class="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
          <p class="text-xs text-slate-400 uppercase tracking-wide">Winrate</p>
          <p class="text-3xl font-bold">{{ stats.winrate }}%</p>
        </article>
      </div>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Leituras de peças</p>
          <h3 class="text-xl font-semibold">Sinergias principais</h3>
          <p class="text-sm text-slate-500">Pairs analisados a partir de todas as batalhas registradas para essas peças.</p>
        </div>
      </header>
      <div class="overflow-x-auto -mx-2 px-2">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase text-slate-400">
            <tr>
              <th class="py-2">Par</th>
              <th class="py-2">Combos</th>
              <th class="py-2">Batalhas</th>
              <th class="py-2">Winrate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in synergyHighlights.slice(0, 6)" :key="entry.id" class="border-t border-slate-800/70">
              <td class="py-3">
                <p class="font-semibold">{{ entry.name }}</p>
                <p class="text-xs text-slate-500">{{ entry.combos }} combos monitorados</p>
              </td>
              <td>{{ entry.combos }}</td>
              <td>{{ entry.total }}</td>
              <td>{{ entry.winrate }}%</td>
            </tr>
            <tr v-if="!synergyHighlights.length">
              <td colspan="4" class="py-4 text-center text-slate-500 text-sm">
                Precisamos de mais batalhas para avaliar sinergias deste bey.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <header class="mb-4">
          <p class="text-xs uppercase tracking-wide text-slate-400">Matchups por bey</p>
          <h3 class="text-xl font-semibold">Onde somos mais fortes</h3>
        </header>
        <ul class="space-y-3">
          <li
            v-for="opponent in favorableOpponents"
            :key="opponent.id"
            class="p-4 rounded-xl border border-slate-800 bg-slate-950/40"
          >
            <div class="flex items-center justify-between text-sm">
              <div>
                <p class="font-semibold">{{ opponent.name }}</p>
                <p class="text-xs text-slate-500">{{ opponent.archetype }} · {{ opponent.total }} batalhas</p>
              </div>
              <span class="text-emerald-400 font-semibold">{{ opponent.winrate }}%</span>
            </div>
          </li>
          <li v-if="!favorableOpponents.length" class="text-sm text-slate-500 text-center">
            Nenhum matchup favorável ainda — registre mais confrontos.
          </li>
        </ul>
      </article>
      <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <header class="mb-4">
          <p class="text-xs uppercase tracking-wide text-slate-400">Matchups desafiadores</p>
          <h3 class="text-xl font-semibold">Onde precisamos evoluir</h3>
        </header>
        <ul class="space-y-3">
          <li
            v-for="opponent in toughOpponents"
            :key="opponent.id"
            class="p-4 rounded-xl border border-slate-800 bg-slate-950/40"
          >
            <div class="flex items-center justify-between text-sm">
              <div>
                <p class="font-semibold">{{ opponent.name }}</p>
                <p class="text-xs text-slate-500">{{ opponent.archetype }} · {{ opponent.total }} batalhas</p>
              </div>
              <span class="text-rose-400 font-semibold">{{ opponent.winrate }}%</span>
            </div>
          </li>
          <li v-if="!toughOpponents.length" class="text-sm text-slate-500 text-center">
            Nenhum ponto fraco mapeado com dados suficientes.
          </li>
        </ul>
      </article>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="mb-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">Matchups por tipagem</p>
        <h3 class="text-xl font-semibold">Arquétipos favoráveis x delicados</h3>
      </header>
      <div class="overflow-x-auto -mx-2 px-2">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase text-slate-400">
            <tr>
              <th class="py-2">Arquétipo</th>
              <th class="py-2">Batalhas</th>
              <th class="py-2">Vitórias</th>
              <th class="py-2">Winrate</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in archetypeMatchups"
              :key="row.archetype"
              class="border-t border-slate-800/70"
            >
              <td class="py-3">{{ row.archetype }}</td>
              <td>{{ row.total }}</td>
              <td>{{ row.wins }}</td>
              <td :class="row.winrate >= 50 ? 'text-emerald-300' : 'text-rose-300'">{{ row.winrate }}%</td>
            </tr>
            <tr v-if="!archetypeMatchups.length">
              <td colspan="4" class="py-4 text-center text-slate-500 text-sm">
                Ainda não temos batalhas suficientes contra outras tipagens.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="mb-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">Histórico</p>
        <h3 class="text-xl font-semibold">Batalhas recentes</h3>
      </header>
      <table class="w-full text-sm">
        <thead class="text-left text-slate-400 uppercase text-xs">
          <tr>
            <th class="py-2">Adversário</th>
            <th>Resultado</th>
            <th>Tipo</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="battle in battles"
            :key="battle.id"
            class="border-t border-slate-800/70"
          >
            <td class="py-3">{{ opponentName(battle) }}</td>
            <td>{{ battle.result }}</td>
            <td>{{ battle.victoryType ?? '—' }}</td>
            <td>{{ formatDate(battle.occurredAt) }}</td>
          </tr>
          <tr v-if="battles.length === 0">
            <td colspan="4" class="py-4 text-center text-slate-500">Sem batalhas registradas.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
  <p v-else class="text-slate-500">Carregando combo...</p>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { useCombosStore } from '../stores/combos';
import { useBattlesStore } from '../stores/battles';
import { formatDate } from '../utils/format';
import { computeOpponentMatchups, computeSynergyHighlights } from '../utils/analytics';

const combosStore = useCombosStore();
const battlesStore = useBattlesStore();
const route = useRoute();
const comboId = route.params.id;

onMounted(async () => {
  if (combosStore.items.length === 0) {
    await combosStore.fetchCombos();
  }
  await combosStore.fetchComboBattles(comboId);
  if (!battlesStore.items.length) {
    await battlesStore.fetchBattles({ limit: 250 });
  }
});

const combo = computed(() => combosStore.items.find((item) => item.id === comboId));
const battles = computed(() => combosStore.battlesByCombo[comboId] ?? []);
const battleUniverse = computed(() => (battlesStore.items.length ? battlesStore.items : battles.value));

const stats = computed(() => {
  let wins = 0;
  let losses = 0;
  let total = battles.value.length;
  for (const battle of battles.value) {
    if (battle.comboAId === comboId && battle.result === 'COMBO_A') wins += 1;
    else if (battle.comboBId === comboId && battle.result === 'COMBO_B') wins += 1;
    else if (battle.comboAId === comboId && battle.result === 'COMBO_B') losses += 1;
    else if (battle.comboBId === comboId && battle.result === 'COMBO_A') losses += 1;
  }
  const winrate = total ? ((wins / total) * 100).toFixed(1) : '0.0';
  return { total, wins, losses, winrate };
});

function opponentName(battle) {
  if (battle.comboAId === comboId) return battle.comboB.name;
  if (battle.comboBId === comboId) return battle.comboA.name;
  return '—';
}

const synergyHighlights = computed(() => {
  if (!combo.value) return [];
  return computeSynergyHighlights(combo.value, combosStore.items, battleUniverse.value);
});

const matchupBreakdown = computed(() => {
  if (!combo.value) return { opponents: [], archetypes: [] };
  return computeOpponentMatchups(combo.value.id, battleUniverse.value);
});

const opponentMatchups = computed(() =>
  matchupBreakdown.value.opponents
    .map((entry) => ({
      ...entry,
      winrate: Number(entry.winrate ?? 0),
    }))
    .filter((entry) => entry.total >= 2),
);

const favorableOpponents = computed(() =>
  opponentMatchups.value
    .filter((entry) => entry.winrate >= 55)
    .sort((a, b) => (b.winrate === a.winrate ? b.total - a.total : b.winrate - a.winrate))
    .slice(0, 4),
);

const toughOpponents = computed(() =>
  opponentMatchups.value
    .filter((entry) => entry.winrate <= 45)
    .sort((a, b) => (a.winrate === b.winrate ? b.total - a.total : a.winrate - b.winrate))
    .slice(0, 4),
);

const archetypeMatchups = computed(() =>
  matchupBreakdown.value.archetypes
    .map((entry) => ({
      ...entry,
      winrate: Number(entry.winrate ?? 0),
    }))
    .filter((entry) => entry.total >= 2)
    .sort((a, b) => (b.total === a.total ? b.winrate - a.winrate : b.total - a.total)),
);
</script>
