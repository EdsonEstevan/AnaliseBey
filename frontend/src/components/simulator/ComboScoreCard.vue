<template>
  <div
    class="rounded-2xl border p-4 space-y-3"
    :class="highlight ? 'border-emerald-400/60 bg-emerald-400/5' : 'border-slate-800 bg-slate-950/40'"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-xs uppercase tracking-wide text-slate-400">{{ label }}</p>
        <p class="text-lg font-semibold">{{ combo?.name || 'Selecione um bey' }}</p>
      </div>
      <div v-if="insight" class="text-right">
        <p class="text-xs uppercase tracking-wide text-slate-400">Score</p>
        <p class="text-2xl font-semibold">{{ insight.combinedScore }}</p>
      </div>
    </div>
    <div v-if="insight" class="space-y-2">
      <StatBar label="Partes" :value="insight.partScore" :accent="highlight" />
      <StatBar label="Pares" :value="insight.pairScore" :accent="highlight" />
      <div class="flex gap-2 text-[11px]">
        <span
          class="px-2 py-1 rounded-full border"
          :class="insight.readyParts ? 'border-emerald-400/60 text-emerald-300' : 'border-amber-300/60 text-amber-200'"
        >
          Partes {{ insight.readyParts ? 'ok' : 'faltando dados' }}
        </span>
        <span
          class="px-2 py-1 rounded-full border"
          :class="insight.readyPairs ? 'border-emerald-400/60 text-emerald-300' : 'border-amber-300/60 text-amber-200'"
        >
          Pares {{ insight.readyPairs ? 'ok' : 'faltando dados' }}
        </span>
      </div>
    </div>
    <p v-else class="text-xs text-slate-500">Sem dados suficientes para este bey.</p>
  </div>
</template>

<script setup>
import StatBar from './StatBar.vue';

defineProps({
  label: { type: String, default: '' },
  combo: { type: Object, default: null },
  insight: { type: Object, default: null },
  highlight: { type: Boolean, default: false },
});
</script>
