<template>
  <div
    v-if="!authReady"
    class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100"
  >
    <div class="text-center">
      <p class="text-sm uppercase tracking-[0.4em] text-slate-500">Carregando</p>
      <p class="mt-2 text-xl font-semibold">Preparando o laboratório...</p>
    </div>
  </div>
  <div v-else-if="!isAuthenticated" class="min-h-screen bg-slate-950 text-slate-100">
    <RouterView />
  </div>
  <div v-else class="app-shell min-h-screen bg-slate-950 text-slate-100 lg:flex">
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
          v-for="item in menuItems"
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
      <AssistantPanel />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router';

import AssistantPanel from './components/assistant/AssistantPanel.vue';
import { useAssistantStore } from './stores/assistant';
import { useAuthStore } from './stores/auth';
import { canAccessAdminPanel } from './utils/accessControl';

const baseMenu = [
  { to: '/', label: 'Dashboard' },
  { to: '/parts', label: 'Peças' },
  { to: '/arenas', label: 'Arenas' },
  { to: '/combos', label: 'Combos' },
  { to: '/battles', label: 'Batalhas' },
  { to: '/simulator', label: 'Simular batalha' },
  { to: '/decks', label: 'Decks' },
  { to: '/bladers', label: 'Bladers' },
  { to: '/teams', label: 'Equipes' },
  { to: '/posts', label: 'Posts' },
  { to: '/analysis', label: 'Análises' },
  { to: '/settings', label: 'Configurações' },
];

const titles = {
  '/': 'Painel de Controle',
  '/parts': 'Biblioteca de Peças',
  '/arenas': 'Arenas & Estádios',
  '/combos': 'Combos e Montador',
  '/battles': 'Registro de Batalhas',
  '/simulator': 'Simular batalha',
  '/decks': 'Decks 3on3',
  '/bladers': 'Bladers & Equipes',
  '/teams': 'Equipes e Quartéis',
  '/posts': 'Feed Comunitário',
  '/analysis': 'Análises e Rankings',
  '/settings': 'Configurações & Backup',
  '/admin': 'Gerenciamento do Laboratório',
};

const route = useRoute();
const router = useRouter();
const currentTitle = computed(() => titles[route.path] ?? 'Beyblade X');
const publicRoutes = ['/login', '/register'];

const assistant = useAssistantStore();
const auth = useAuthStore();
const canAccessAdmin = computed(() => canAccessAdminPanel(auth.user));
const routeContext = computed(() => ({
  route: route.fullPath,
  surface: titles[route.path] ?? 'Beyblade X',
  focus: currentTitle.value,
}));
const authReady = computed(() => auth.ready);
const isAuthenticated = computed(() => auth.isAuthenticated);

const isMobileMenuOpen = ref(false);
const menuItems = computed(() => {
  const items = baseMenu.slice();
  if (canAccessAdmin.value) {
    const alreadyExists = items.some((item) => item.to === '/admin');
    if (!alreadyExists) {
      items.splice(items.length - 1, 0, { to: '/admin', label: 'Gerenciamento' });
    }
  }
  return items;
});
const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
const closeMenu = () => {
  isMobileMenuOpen.value = false;
};

onMounted(() => {
  auth.bootstrap();
});

watch(
  () => [auth.ready, auth.isAuthenticated, route.path],
  () => {
    if (!auth.ready) return;
    const isPublic = publicRoutes.includes(route.path);
    if (!auth.isAuthenticated && !isPublic) {
      const redirect = route.fullPath !== '/login' ? route.fullPath : undefined;
      router.replace({ path: '/login', query: redirect ? { redirect } : undefined });
      return;
    }
    if (auth.isAuthenticated && isPublic) {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
      router.replace(redirect && redirect !== '/login' ? redirect : '/');
    }
  },
  { immediate: true },
);

watch(
  () => ({ ready: auth.ready, authed: auth.isAuthenticated }),
  ({ ready, authed }) => {
    if (!ready) return;
    if (authed) {
      assistant.bootstrap(routeContext.value);
    } else {
      assistant.reset();
    }
  },
  { immediate: true },
);

watch(
  () => route.path,
  () => {
    closeMenu();
    if (auth.ready && auth.isAuthenticated) {
      assistant.updateContext(routeContext.value);
    }
  }
);
</script>
