<template>
  <div class="min-h-screen flex bg-slate-950 text-slate-100">
    <aside class="w-64 bg-slate-900/80 border-r border-slate-800 backdrop-blur-md">
      <div class="p-6 border-b border-slate-800">
        <p class="text-xs uppercase tracking-wide text-slate-400">Projeto Etapa 1</p>
        <h1 class="text-2xl font-semibold text-white">Beyblade X Lab</h1>
      </div>
      <nav class="p-4 space-y-2">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="block px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
          active-class="bg-primary/20 text-primary"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <main class="flex-1 overflow-y-auto">
      <header class="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Beyblade X</p>
          <h2 class="text-2xl font-bold">{{ currentTitle }}</h2>
        </div>
        <div class="text-right text-xs text-slate-400">
          Offline-first · Vue 3 + Express · SQLite
        </div>
      </header>
      <section class="p-8">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, RouterLink, RouterView } from 'vue-router';

const menu = [
  { to: '/', label: 'Dashboard' },
  { to: '/parts', label: 'Peças' },
  { to: '/arenas', label: 'Arenas' },
  { to: '/combos', label: 'Combos' },
  { to: '/battles', label: 'Batalhas' },
  { to: '/analysis', label: 'Análises' },
  { to: '/settings', label: 'Configurações' },
];

const titles = {
  '/': 'Painel de Controle',
  '/parts': 'Biblioteca de Peças',
  '/arenas': 'Arenas & Estádios',
  '/combos': 'Combos e Montador',
  '/battles': 'Registro de Batalhas',
  '/analysis': 'Análises e Rankings',
  '/settings': 'Configurações & Backup',
};

const route = useRoute();
const currentTitle = computed(() => titles[route.path] ?? 'Beyblade X');
</script>
