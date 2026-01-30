<template>
  <div class="space-y-8">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex items-center justify-between mb-6">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Histórico</p>
          <h3 class="text-2xl font-semibold">Batalhas registradas</h3>
          <p class="text-sm text-slate-500">Gerencie combates, edite resultados e acompanhe o desempenho.</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="text-sm text-slate-400" @click="battlesStore.fetchBattles()">Atualizar</button>
          <RouterLink
            to="/battles/new"
            class="bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
          >
            Nova batalha
          </RouterLink>
        </div>
      </header>

      <div v-if="battlesStore.items.length" class="grid xl:grid-cols-3 md:grid-cols-2 gap-4">
        <article
          v-for="battle in battlesStore.items"
          :key="battle.id"
          class="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-lg shadow-slate-900/30"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">{{ formatDate(battle.occurredAt) }}</p>
              <h4 class="text-lg font-semibold text-white">{{ battle.comboA.name }} vs {{ battle.comboB.name }}</h4>
              <p class="text-xs text-slate-500">Arena: {{ battle.arena?.name ?? 'Não informada' }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-mono">{{ battle.score ?? '—' }}</p>
              <span :class="['text-xs font-semibold uppercase', resultColor(battle.result)]">
                {{ resultLabel(battle.result) }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>Tipo de vitória: {{ battle.victoryType || '—' }}</span>
            <span>Notas: {{ battle.notes ? 'Sim' : '—' }}</span>
          </div>

          <footer class="flex items-center justify-between text-sm">
            <div class="flex gap-2">
              <RouterLink :to="`/battles/${battle.id}`" class="text-primary">Visualizar</RouterLink>
              <RouterLink :to="`/battles/${battle.id}/edit`" class="text-slate-300">Editar</RouterLink>
            </div>
            <button class="text-rose-400 hover:text-rose-300" @click="removeBattle(battle)">
              Excluir
            </button>
          </footer>
        </article>
      </div>

      <p v-else class="text-center text-slate-500 text-sm py-10">Cadastre sua primeira batalha para começar.</p>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { useBattlesStore } from '../stores/battles';
import { useCombosStore } from '../stores/combos';
import { useArenasStore } from '../stores/arenas';
import { formatDate } from '../utils/format';

const battlesStore = useBattlesStore();
const combosStore = useCombosStore();
const arenasStore = useArenasStore();

const labels = {
  COMBO_A: 'Combo A',
  COMBO_B: 'Combo B',
  DRAW: 'Empate',
};

onMounted(async () => {
  await Promise.all([
    battlesStore.fetchBattles({ limit: 120 }),
    combosStore.fetchCombos(),
    arenasStore.fetchArenas(),
  ]);
});

function resultLabel(result) {
  return labels[result] ?? '—';
}

function resultColor(result) {
  if (result === 'COMBO_A') return 'text-emerald-400';
  if (result === 'COMBO_B') return 'text-rose-400';
  return 'text-slate-400';
}

async function removeBattle(battle) {
  const confirmed = window.confirm(`Remover batalha ${battle.comboA.name} vs ${battle.comboB.name}?`);
  if (!confirmed) return;
  await battlesStore.deleteBattle(battle.id);
}
</script>
