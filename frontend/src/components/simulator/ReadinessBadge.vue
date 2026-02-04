<template>
  <div class="border border-slate-800 rounded-2xl p-3 bg-slate-950/40 text-sm">
    <p class="font-semibold">{{ combo?.name || 'Bey' }}</p>
    <p class="text-xs text-slate-500 mb-2">{{ combo?.archetype || '—' }}</p>
    <div class="flex flex-wrap gap-2 text-[11px]">
      <span
        class="px-2 py-1 rounded-full border"
        :class="insight?.readyParts ? 'border-emerald-400/60 text-emerald-300' : 'border-amber-300/60 text-amber-200'"
      >
        Partes {{ insight?.readyParts ? 'ok' : 'insuficientes' }}
      </span>
      <span
        class="px-2 py-1 rounded-full border"
        :class="insight?.readyPairs ? 'border-emerald-400/60 text-emerald-300' : 'border-amber-300/60 text-amber-200'"
      >
        Pares {{ insight?.readyPairs ? 'ok' : 'insuficientes' }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  combo: { type: Object, default: null },
  insight: { type: Object, default: null },
});
</script>
