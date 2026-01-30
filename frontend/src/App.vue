<template>
  <div class="app-shell min-h-screen bg-slate-950 text-slate-100 lg:flex">
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm lg:hidden z-20"
      @click="closeMenu"
    ></div>

    <aside
      :class="[
        'app-sidebar fixed inset-y-0 left-0 z-30 flex w-72 max-w-full flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur-md transition-transform duration-300 lg:static lg:w-64 lg:translate-x-0 lg:border-b-0',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="p-6 border-b border-slate-800">
        <p class="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">Projeto Etapa 1</p>
        <h1 class="text-2xl font-semibold text-white">Beyblade X Lab</h1>
      </div>
      <nav class="p-4 flex flex-col gap-2 overflow-y-auto">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="px-4 py-3 rounded-xl text-sm font-medium transition hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          active-class="bg-primary/25 text-primary shadow-inner shadow-primary/20"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <main class="flex-1 min-h-screen overflow-y-auto pt-safe">
      <header class="app-header border-b border-slate-800/70 px-4 sm:px-8 py-4 sm:py-6 flex flex-wrap items-center gap-4 justify-between">
        <div class="flex items-center gap-3">
          <button
            class="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/70 text-xl text-slate-200 shadow-lg shadow-black/20"
            type="button"
            aria-label="Abrir navegação"
            @click="toggleMenu"
          >
            <span aria-hidden="true">⋮</span>
          </button>
          <div>
            <p class="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Beyblade X</p>
            <h2 class="text-2xl font-semibold leading-tight">{{ currentTitle }}</h2>
          </div>
        </div>

        <div class="flex flex-col text-xs text-slate-400 sm:text-right">
          <span class="font-semibold text-slate-200/90">Offline-first workspace</span>
          <span>Vue 3 · Express API · Postgres</span>
        </div>
      </header>

      <section class="page-shell">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
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

const isMobileMenuOpen = ref(false);
const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
const closeMenu = () => {
  isMobileMenuOpen.value = false;
};

watch(
  () => route.path,
  () => {
    closeMenu();
  }
);
</script>
