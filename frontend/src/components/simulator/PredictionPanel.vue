<template>
  <div class="border border-slate-800 rounded-2xl bg-slate-950/30 p-4 space-y-4">
    <p v-if="!result" class="text-sm text-slate-500">Escolha os dois beys e clique em "Simular batalha".</p>
    <template v-else-if="result.status === 'invalid'">
      <p class="text-sm text-amber-300">{{ result.message }}</p>
    </template>
    <template v-else-if="result.status === 'insufficient'">
      <p class="text-sm text-amber-300 font-semibold">Precisamos de mais dados para uma previsão confiável.</p>
      <p class="text-xs text-slate-400 leading-relaxed">{{ result.message }}</p>
      <div class="grid gap-3 md:grid-cols-2" v-if="comboA && comboB">
        <ReadinessBadge :combo="comboA" :insight="result.combos?.[comboA.id]" />
        <ReadinessBadge :combo="comboB" :insight="result.combos?.[comboB.id]" />
      </div>
    </template>
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Projeção</p>
          <h4 class="text-2xl font-semibold">
            <span v-if="result.winner === comboA?.id">{{ comboA?.name }}</span>
            <span v-else-if="result.winner === comboB?.id">{{ comboB?.name }}</span>
            <span v-else>Equilíbrio técnico</span>
          </h4>
          <p class="text-sm text-slate-500">
            {{ result.winner === 'tie'
              ? 'Diferença inferior a 1 ponto — histórico indica duelo equilibrado.'
              : `Vantagem estimada de ${Math.abs(result.diff)} pts · Confiança ${result.confidence}%` }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase tracking-wide text-slate-400">Confiança</p>
          <p class="text-3xl font-semibold text-primary">{{ result.confidence }}%</p>
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <ComboScoreCard
          :label="'Bey A'"
          :combo="comboA"
          :insight="result.combos?.[comboA?.id ?? '']"
          :highlight="result.winner === comboA?.id"
        />
        <ComboScoreCard
          :label="'Bey B'"
          :combo="comboB"
          :insight="result.combos?.[comboB?.id ?? '']"
          :highlight="result.winner === comboB?.id"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import ComboScoreCard from './ComboScoreCard.vue';
import ReadinessBadge from './ReadinessBadge.vue';

const props = defineProps({
  result: { type: Object, default: null },
  comboA: { type: Object, default: null },
  comboB: { type: Object, default: null },
});
</script>
