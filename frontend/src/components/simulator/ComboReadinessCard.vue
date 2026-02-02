<template>
  <div class="border border-slate-800 rounded-2xl bg-slate-950/40 p-4 space-y-3">
    <p v-if="!combo" class="text-sm text-slate-500">Selecione um bey para liberar os indicadores.</p>
    <template v-else>
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-base font-semibold text-slate-100">{{ combo.name }}</p>
          <p class="text-xs text-slate-500">{{ combo.archetype }} · {{ combo.status }}</p>
        </div>
        <span
          class="text-xs px-3 py-1 rounded-full border"
          :class="insightReady ? 'border-emerald-400/60 text-emerald-300' : 'border-amber-400/60 text-amber-300'"
        >
          {{ insightReady ? 'Pronto para simular' : 'Dados insuficientes' }}
        </span>
      </div>
      <div class="grid gap-2">
        <div class="flex items-center justify-between text-sm" v-for="part in partStats" :key="part.id">
          <div>
            <p class="font-semibold text-slate-200">{{ part.name }}</p>
            <p class="text-xs text-slate-500">{{ part.role }} · {{ part.total }} batalhas</p>
          </div>
          <span :class="part.total >= PART_SAMPLE_THRESHOLD ? 'text-emerald-400' : 'text-amber-300'">
            {{ part.total >= PART_SAMPLE_THRESHOLD ? 'OK' : `${part.total}/${PART_SAMPLE_THRESHOLD}` }}
          </span>
        </div>
        <p v-if="!partStats.length" class="text-xs text-slate-500">Nenhuma peça com histórico registrado.</p>
      </div>
      <p class="text-xs text-slate-400">
        Precisamos de {{ PART_SAMPLE_THRESHOLD }} batalhas por peça e {{ PAIR_SAMPLE_THRESHOLD }} com pares ativos para confiar na previsão.
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import { PART_SAMPLE_THRESHOLD, PAIR_SAMPLE_THRESHOLD } from '../../utils/analytics';

const props = defineProps({
  combo: { type: Object, default: null },
  insight: { type: Object, default: null },
});

const partStats = computed(() => props.insight?.partStats ?? []);
const insightReady = computed(() => Boolean(props.insight?.readyParts && props.insight?.readyPairs));
</script>
