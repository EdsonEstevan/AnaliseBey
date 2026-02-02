<template>
  <div>
    <div v-if="!insight" class="text-sm text-slate-500">Selecione um bey para ver o detalhamento.</div>
    <template v-else>
      <section>
        <p class="text-xs uppercase tracking-wide text-slate-400 mb-2">Peças</p>
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase text-slate-400">
            <tr>
              <th class="py-2">Peça</th>
              <th class="py-2">Batalhas</th>
              <th class="py-2">Winrate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="part in insight.partStats" :key="part.id" class="border-t border-slate-800/60">
              <td class="py-2">
                <p class="font-semibold">{{ part.name }}</p>
                <p class="text-xs text-slate-500">{{ part.role }}</p>
              </td>
              <td>{{ part.total }}</td>
              <td>{{ part.winrate }}%</td>
            </tr>
            <tr v-if="!insight.partStats.length">
              <td colspan="3" class="py-3 text-center text-slate-500">Sem amostras registradas.</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="mt-4">
        <p class="text-xs uppercase tracking-wide text-slate-400 mb-2">Pares monitorados</p>
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase text-slate-400">
            <tr>
              <th class="py-2">Par</th>
              <th class="py-2">Batalhas</th>
              <th class="py-2">Winrate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pair in pairRows" :key="pair.id" class="border-t border-slate-800/60">
              <td class="py-2">{{ pair.name }}</td>
              <td>{{ pair.total }}</td>
              <td>{{ pair.winrate }}%</td>
            </tr>
            <tr v-if="!pairRows.length">
              <td colspan="3" class="py-3 text-center text-slate-500">Nenhum par com dados suficientes.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  insight: { type: Object, default: null },
});

const pairRows = computed(() => (props.insight?.pairStats ?? []).slice(0, 6));
</script>
