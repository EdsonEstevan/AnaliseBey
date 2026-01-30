<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
    <aside class="w-full lg:w-64 bg-slate-900/80 border-b lg:border-b-0 lg:border-r border-slate-800 backdrop-blur-md sticky top-0 z-20">
      <div class="p-6 border-b border-slate-800">
        <p class="text-xs uppercase tracking-wide text-slate-400">Projeto Etapa 1</p>
        <h1 class="text-2xl font-semibold text-white">Beyblade X Lab</h1>
      </div>
      <nav class="p-4 flex lg:block gap-2 overflow-x-auto">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-slate-800"
          active-class="bg-primary/20 text-primary"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <main class="flex-1 min-h-screen overflow-y-auto">
      <header class="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Beyblade X</p>
          <h2 class="text-2xl font-bold">{{ currentTitle }}</h2>
        </div>
        <div class="text-right text-xs text-slate-400">
          Offline-first · Vue 3 + Express · Postgres
        </div>
      </header>
      <section class="p-4 sm:p-8">
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
  { to: '/decks', label: 'Decks' },
  { to: '/analysis', label: 'Análises' },
  { to: '/settings', label: 'Configurações' },
];

const titles = {
  '/': 'Painel de Controle',
  '/parts': 'Biblioteca de Peças',
  '/arenas': 'Arenas & Estádios',
  '/combos': 'Combos e Montador',
  '/battles': 'Registro de Batalhas',
  '/decks': 'Decks 3on3',
  '/analysis': 'Análises e Rankings',
  '/settings': 'Configurações & Backup',
};

const route = useRoute();
const currentTitle = computed(() => titles[route.path] ?? 'Beyblade X');
</script>
