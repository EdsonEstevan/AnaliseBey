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
import BattleSimulatorView from '../views/BattleSimulatorView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminView from '../views/AdminView.vue';
import TeamsView from '../views/TeamsView.vue';
import PostsView from '../views/PostsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
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
    { path: '/simulator', component: BattleSimulatorView },
    { path: '/decks', component: DecksView },
    { path: '/bladers', component: BladersView },
    { path: '/teams', component: TeamsView },
    { path: '/posts', component: PostsView },
    { path: '/settings', component: SettingsView },
    { path: '/admin', component: AdminView },
  ],
});

export default router;
