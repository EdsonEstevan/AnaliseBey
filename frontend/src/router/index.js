import { createRouter, createWebHistory } from 'vue-router';

import DashboardView from '../views/DashboardView.vue';
import PartsView from '../views/PartsView.vue';
import ArenasView from '../views/ArenasView.vue';
import CombosView from '../views/CombosView.vue';
import ComboDetailsView from '../views/ComboDetailsView.vue';
import BattlesView from '../views/BattlesView.vue';
import BattleComposerView from '../views/BattleComposerView.vue';
import AnalysisView from '../views/AnalysisView.vue';
import SettingsView from '../views/SettingsView.vue';
import DecksView from '../views/DecksView.vue';
import BladersView from '../views/BladersView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/parts', component: PartsView },
    { path: '/arenas', component: ArenasView },
    { path: '/combos', component: CombosView },
    { path: '/combos/:id', component: ComboDetailsView, props: true },
    { path: '/battles', component: BattlesView },
    { path: '/battles/new', name: 'battle-new', component: BattleComposerView },
    { path: '/battles/:id', name: 'battle-view', component: BattleComposerView, props: true },
    { path: '/battles/:id/edit', name: 'battle-edit', component: BattleComposerView, props: true },
    { path: '/analysis', component: AnalysisView },
    { path: '/decks', component: DecksView },
    { path: '/bladers', component: BladersView },
    { path: '/settings', component: SettingsView },
  ],
});

export default router;
