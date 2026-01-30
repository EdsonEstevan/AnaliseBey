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
      <div class="grid sm:grid-cols-3 gap-4 text-sm text-slate-300">
        <div>
          <p class="text-slate-500">Blade</p>
          <p>{{ combo.blade.name }}</p>
        </div>
        <div>
          <p class="text-slate-500">Ratchet</p>
          <p>{{ combo.ratchet.name }}</p>
        </div>
        <div>
          <p class="text-slate-500">Bit</p>
          <p>{{ combo.bit.name }}</p>
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
import { formatDate } from '../utils/format';

const combosStore = useCombosStore();
const route = useRoute();
const comboId = route.params.id;

onMounted(async () => {
  if (combosStore.items.length === 0) {
    await combosStore.fetchCombos();
  }
  await combosStore.fetchComboBattles(comboId);
});

const combo = computed(() => combosStore.items.find((item) => item.id === comboId));
const battles = computed(() => combosStore.battlesByCombo[comboId] ?? []);

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
</script>
