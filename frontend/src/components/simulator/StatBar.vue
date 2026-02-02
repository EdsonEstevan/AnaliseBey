<template>
  <div>
    <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
      <span>{{ label }}</span>
      <span>{{ value.toFixed(1) }}%</span>
    </div>
    <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
      <div
        class="h-full transition-all"
        :class="accent ? 'bg-emerald-400' : 'bg-primary/80'"
        :style="{ width: `${Math.min(100, value)}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, default: 0 },
  accent: { type: Boolean, default: false },
});
</script>
