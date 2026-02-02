<template>
  <div class="space-y-8">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
      <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Laboratório tático</p>
      <h2 class="text-3xl font-semibold">Simular batalha</h2>
      <p class="text-sm text-slate-400">
        Compare dois beys usando apenas evidências do banco de dados. A simulação é liberada quando cada peça acumulou
        pelo menos {{ PART_SAMPLE_THRESHOLD }} batalhas e quando existe histórico de {{ PAIR_SAMPLE_THRESHOLD }}+ partidas com dois componentes atuando juntos.
      </p>
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
      <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-400">Bey A</p>
          <h3 class="text-xl font-semibold">Escolha o desafiante</h3>
        </header>
        <select v-model="form.comboA" class="input">
          <option value="" disabled>Selecione um bey</option>
          <option v-for="combo in combosOptions" :key="combo.id" :value="combo.id">
            {{ combo.name }} · {{ combo.archetype }}
          </option>
        </select>
        <ComboReadinessCard :combo="selectedComboA" :insight="insightA" />
      </article>
      <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-400">Bey B</p>
          <h3 class="text-xl font-semibold">Escolha o oponente</h3>
        </header>
        <select v-model="form.comboB" class="input">
          <option value="" disabled>Selecione um bey</option>
          <option v-for="combo in combosOptions" :key="combo.id" :value="combo.id">
            {{ combo.name }} · {{ combo.archetype }}
          </option>
        </select>
        <ComboReadinessCard :combo="selectedComboB" :insight="insightB" />
      </article>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Previsão</p>
          <h3 class="text-2xl font-semibold">Resultado estimado</h3>
        </div>
        <button
          type="button"
          class="bg-primary text-white px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
          :disabled="!canSimulate"
          @click="runSimulation"
        >
          Simular batalha
        </button>
      </header>
      <PredictionPanel :result="lastResult" :combo-a="selectedComboA" :combo-b="selectedComboB" />
    </section>

    <section class="grid gap-6 lg:grid-cols-2" v-if="showInsights">
      <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-400">Componentes analisados</p>
          <h3 class="text-xl font-semibold">{{ selectedComboA?.name || 'Bey A' }}</h3>
        </header>
        <PartsBreakdown :insight="insightA" />
      </article>
      <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-400">Componentes analisados</p>
          <h3 class="text-xl font-semibold">{{ selectedComboB?.name || 'Bey B' }}</h3>
        </header>
        <PartsBreakdown :insight="insightB" />
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { useCombosStore } from '../stores/combos';
import { useBattlesStore } from '../stores/battles';
import {
  PART_SAMPLE_THRESHOLD,
  PAIR_SAMPLE_THRESHOLD,
  buildSimulationInsight,
  simulateMatchup,
} from '../utils/analytics';

import ComboReadinessCard from '../components/simulator/ComboReadinessCard.vue';
import PredictionPanel from '../components/simulator/PredictionPanel.vue';
import PartsBreakdown from '../components/simulator/PartsBreakdown.vue';

const combosStore = useCombosStore();
const battlesStore = useBattlesStore();

const form = reactive({
  comboA: '',
  comboB: '',
});
const lastResult = ref(null);

onMounted(async () => {
  if (!combosStore.items.length) {
    await combosStore.fetchCombos();
  }
  if (!battlesStore.items.length) {
    await battlesStore.fetchBattles({ limit: 500 });
  }
});

const combosOptions = computed(() =>
  combosStore.items
    .filter((combo) => combo.status !== 'ARCHIVED')
    .sort((a, b) => a.name.localeCompare(b.name))
);

const selectedComboA = computed(() => combosStore.items.find((combo) => combo.id === form.comboA) || null);
const selectedComboB = computed(() => combosStore.items.find((combo) => combo.id === form.comboB) || null);

const insightA = computed(() => (selectedComboA.value ? buildSimulationInsight(selectedComboA.value, combosStore.items, battlesStore.items) : null));
const insightB = computed(() => (selectedComboB.value ? buildSimulationInsight(selectedComboB.value, combosStore.items, battlesStore.items) : null));

const canSimulate = computed(() => Boolean(selectedComboA.value && selectedComboB.value && selectedComboA.value.id !== selectedComboB.value.id));
const showInsights = computed(() => Boolean(insightA.value || insightB.value));

function runSimulation() {
  if (!canSimulate.value) {
    lastResult.value = { status: 'invalid', message: 'Selecione dois beys diferentes.' };
    return;
  }
  lastResult.value = simulateMatchup(selectedComboA.value, selectedComboB.value, combosStore.items, battlesStore.items);
}
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.6);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
}
</style>
