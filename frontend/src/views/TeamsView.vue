<template>
  <div class="space-y-8">
    <section class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-3xl border border-slate-800 bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-sky-900/30">
        <p class="text-xs uppercase tracking-[0.35em] text-sky-200/70">Equipes</p>
        <h1 class="mt-2 text-3xl font-semibold text-white">Coordene missões em dupla ou células avançadas</h1>
        <p class="mt-3 text-sm text-slate-300">
          Cada blader pode participar de no máximo duas equipes (visitantes não têm acesso). Crie um laboratório tático,
          convide aliados e compartilhe batalhas, builds e métricas em tempo real.
        </p>
        <dl class="mt-6 grid grid-cols-2 gap-4 text-center text-sm text-slate-200">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <dt class="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Equipes públicas</dt>
            <dd class="mt-2 text-3xl font-semibold text-white">{{ teamsStore.catalog.length }}</dd>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <dt class="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Minhas equipes</dt>
            <dd class="mt-2 text-3xl font-semibold text-white">{{ teamsStore.mine.length }}</dd>
          </div>
        </dl>
      </div>
      <form class="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 space-y-4" @submit.prevent="handleCreate">
        <header>
          <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Novo laboratório</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">Criar equipe</h2>
          <p class="text-sm text-slate-400">Nomeie, descreva e prepare um avatar visual para inspirar o time.</p>
        </header>
        <label class="text-sm">
          <span class="text-slate-400">Nome</span>
          <input v-model="createForm.name" class="input mt-1" placeholder="Equipe Nova X" :disabled="!canCreateTeams" required />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Descrição</span>
          <textarea v-model="createForm.description" class="input mt-1" rows="3" placeholder="Propósito, lineup, estilos" :disabled="!canCreateTeams"></textarea>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Imagem da equipe</span>
          <div class="mt-1 space-y-2">
            <input
              v-model="createForm.imageUrl"
              class="input"
              type="url"
              placeholder="Cole uma URL ou faça upload"
              :disabled="!canCreateTeams"
            />
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                class="rounded-xl border border-slate-700 px-4 py-2 text-slate-200 disabled:opacity-50"
                :disabled="!canCreateTeams || teamImageUploading"
                @click="triggerTeamImagePicker"
              >
                {{ teamImageUploading ? 'Enviando imagem...' : 'Selecionar arquivo' }}
              </button>
              <button
                v-if="createForm.imageUrl"
                type="button"
                class="text-xs text-slate-400 underline"
                :disabled="teamImageUploading"
                @click="clearTeamImage"
              >
                Remover imagem
              </button>
            </div>
            <p class="text-[0.7rem] text-slate-500">Aceita PNG/JPG até 5MB. O arquivo será hospedado automaticamente.</p>
            <div v-if="createForm.imageUrl" class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <img :src="createForm.imageUrl" alt="Prévia da equipe" class="w-full rounded-xl object-cover" />
            </div>
          </div>
          <input
            ref="teamImageInput"
            type="file"
            class="hidden"
            accept="image/*"
            :disabled="!canCreateTeams"
            @change="handleTeamImageSelected"
          />
        </label>
        <p class="text-xs text-amber-400" v-if="!canCreateTeams">Visitantes não podem criar ou ingressar em equipes.</p>
        <p class="text-xs text-amber-400" v-else-if="reachedTeamCap">Limite de duas equipes atingido. Saia de uma equipe para abrir espaço.</p>
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>{{ createFeedback }}</span>
          <button type="submit" class="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="!canCreateTeams || reachedTeamCap || !createForm.name.trim()">
            Criar equipe
          </button>
        </div>
      </form>
    </section>

    <section class="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Minhas células</p>
          <h3 class="text-2xl font-semibold text-white">Equipes que participo</h3>
        </div>
        <button type="button" class="text-sm text-slate-400" @click="refreshMine">Atualizar</button>
      </header>
      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="team in teamsStore.mine"
          :key="team.id"
          :class="[
            'rounded-2xl border p-4 transition hover:border-sky-400/60 cursor-pointer',
            teamsStore.selectedTeamId === team.id ? 'border-sky-400/80 bg-sky-950/30' : 'border-slate-800 bg-slate-900/50'
          ]"
          @click="teamsStore.loadWorkspace(team.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-lg font-semibold text-white">{{ team.name }}</p>
              <p class="text-xs text-slate-400">{{ team.memberCount }} integrantes</p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span class="rounded-full border border-slate-700 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-300">
                {{ team.membership?.role ?? 'MEMBER' }}
              </span>
              <button
                type="button"
                class="text-xs text-rose-300"
                @click.stop="leaveTeamAction(team.id)"
                :disabled="leavingTeamId === team.id"
              >
                {{ leavingTeamId === team.id ? 'Saindo...' : 'Sair' }}
              </button>
            </div>
          </div>
          <p class="mt-3 text-sm text-slate-400 line-clamp-3">{{ team.description || 'Sem descrição' }}</p>
          <div class="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Nível {{ team.membership?.level ?? 1 }} · XP {{ team.membership?.xp ?? 0 }}</span>
            <span v-if="team.membership?.canManageMissions" class="text-emerald-300">Gestor de missões</span>
          </div>
          <div class="mt-2 h-1.5 rounded-full bg-slate-800">
            <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${progressPercent(team.membership?.xp ?? 0)}%` }"></div>
          </div>
        </article>
        <p v-if="!teamsStore.mine.length" class="text-sm text-slate-500">Você ainda não integra nenhuma equipe. Crie ou entre em uma lista abaixo.</p>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Explorar</p>
          <h3 class="text-2xl font-semibold text-white">Equipes abertas no laboratório</h3>
        </div>
        <button type="button" class="text-sm text-slate-400" @click="refreshCatalog">Atualizar</button>
      </header>
      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="team in teamsStore.catalog" :key="team.id" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-3">
          <div>
            <p class="text-lg font-semibold text-white">{{ team.name }}</p>
            <p class="text-xs text-slate-400">{{ team.memberCount }} membros</p>
          </div>
          <p class="text-sm text-slate-400 line-clamp-3">{{ team.description || 'Compartilhe builds, planos e scrims.' }}</p>
          <div class="mt-auto flex items-center justify-between text-xs">
            <span class="text-slate-500">Owner: {{ resolveOwner(team.ownerId) }}</span>
            <button
              class="text-sm font-semibold text-primary disabled:opacity-40"
              :disabled="team.membership?.status === 'ACTIVE' || reachedTeamCap || !canCreateTeams"
              @click="joinTeam(team.id)"
            >
              {{ team.membership?.status === 'ACTIVE' ? 'Participando' : 'Entrar' }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <div class="xl:col-span-2 space-y-6">
        <article class="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <header class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Progresso pessoal</p>
              <h3 class="text-2xl font-semibold text-white">Níveis e XP na equipe atual</h3>
            </div>
            <button
              v-if="teamsStore.selectedTeamId"
              type="button"
              class="text-sm text-rose-300 disabled:opacity-40"
              @click="leaveTeamAction(teamsStore.selectedTeamId)"
              :disabled="leavingTeamId === teamsStore.selectedTeamId"
            >
              {{ leavingTeamId === teamsStore.selectedTeamId ? 'Saindo...' : 'Sair da equipe' }}
            </button>
          </header>
          <div v-if="currentMembership" class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-300">
              <div>
                <p class="text-xl font-semibold text-white">Nível {{ currentMembership.level }}</p>
                <p>XP total: {{ currentMembership.xp }} · Próximo nível em {{ xpToNext }} XP</p>
              </div>
              <span class="text-xs uppercase tracking-[0.35em] text-slate-500">Participante ativo</span>
            </div>
            <div class="h-3 rounded-full bg-slate-800">
              <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${levelProgress}%` }"></div>
            </div>
            <p class="text-xs text-slate-500">Conclua missões para subir de nível e desbloquear destaques na equipe.</p>
          </div>
          <p v-else class="mt-4 text-sm text-slate-500">Entre em uma equipe para acompanhar sua barra de XP.</p>
        </article>

        <article class="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 min-h-[320px]">
          <header class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Painel integrado</p>
              <h3 class="text-2xl font-semibold text-white">Dashboard compartilhado</h3>
            </div>
            <button type="button" class="text-sm text-slate-400" @click="refreshWorkspace">Recarregar</button>
          </header>
          <div v-if="teamsStore.dashboardLoading" class="mt-6 text-sm text-slate-400">Sincronizando dados...</div>
          <div v-else-if="!teamsStore.dashboard" class="mt-6 text-sm text-slate-500">Selecione uma equipe para visualizar métricas combinadas.</div>
          <div v-else class="mt-6 space-y-6">
            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Equipe</p>
                  <h4 class="text-xl font-semibold text-white">{{ teamsStore.dashboard.team?.name }}</h4>
                  <p class="text-sm text-slate-400">{{ teamsStore.dashboard.members.length }} integrantes ativos</p>
                </div>
                <dl class="grid grid-cols-2 gap-4 text-center text-sm text-white">
                  <div class="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                    <dt class="text-[0.55rem] uppercase tracking-[0.35em] text-slate-500">Combos</dt>
                    <dd class="mt-1 text-2xl font-semibold text-sky-300">{{ teamsStore.dashboard.stats.combos }}</dd>
                  </div>
                  <div class="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                    <dt class="text-[0.55rem] uppercase tracking-[0.35em] text-slate-500">Batalhas</dt>
                    <dd class="mt-1 text-2xl font-semibold text-emerald-300">{{ teamsStore.dashboard.stats.battles }}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
              <section class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Integrantes</p>
                <ul class="mt-3 space-y-2">
                  <li
                    v-for="member in teamsStore.dashboard.members"
                    :key="member.id"
                    class="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-3 text-sm text-slate-200"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div>
                        <p class="font-semibold">{{ member.user.name || member.user.username }}</p>
                        <p class="text-xs text-slate-500">Nível {{ member.level }} · XP {{ member.xp }}</p>
                      </div>
                      <span class="text-xs text-slate-500">{{ member.user.role }} · {{ member.role }}</span>
                    </div>
                    <div class="flex items-center justify-between text-xs text-slate-500">
                      <span>{{ formatDate(member.createdAt) }}</span>
                      <button
                        v-if="isOwner && member.role !== 'OWNER'"
                        type="button"
                        class="text-primary"
                        :disabled="permissionSavingId === member.id"
                        @click="toggleMissionPermission(member)"
                      >
                        {{ member.canManageMissions ? 'Revogar missões' : 'Autorizar missões' }}
                      </button>
                    </div>
                  </li>
                </ul>
              </section>
              <section class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Combos recentes</p>
                <ul class="mt-3 space-y-2 text-sm text-slate-200">
                  <li v-for="combo in recentCombos" :key="combo.id" class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold">{{ combo.name }}</p>
                      <p class="text-xs text-slate-500">{{ combo.archetype }} · {{ combo.owner?.name || combo.user?.name || combo.userId }}</p>
                    </div>
                    <span class="text-xs text-slate-500">{{ formatDate(combo.updatedAt || combo.createdAt) }}</span>
                  </li>
                  <li v-if="!recentCombos.length" class="text-xs text-slate-500">Sem combos ainda.</li>
                </ul>
              </section>
            </div>
            <section class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Batalhas</p>
              <ul class="mt-3 space-y-2 text-sm text-slate-200">
                <li v-for="battle in recentBattles" :key="battle.id" class="flex flex-col rounded-xl border border-slate-800/80 bg-slate-900/70 p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-semibold">{{ battle.comboA?.name }} vs {{ battle.comboB?.name }}</p>
                    <span class="text-xs text-slate-500">{{ formatDate(battle.occurredAt) }}</span>
                  </div>
                  <p class="text-xs text-slate-500">Arena: {{ battle.arena?.name || '—' }} · Resultado: {{ battle.result }}</p>
                </li>
                <li v-if="!recentBattles.length" class="text-xs text-slate-500">Nenhuma batalha registrada.</li>
              </ul>
            </section>
          </div>
        </article>

        <article class="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
          <header class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Missões da equipe</p>
              <h3 class="text-2xl font-semibold text-white">Planos guiados e XP compartilhado</h3>
            </div>
            <button type="button" class="text-sm text-slate-400" @click="refreshMissions">Atualizar</button>
          </header>
          <p class="mt-2 text-xs text-slate-500">{{ missionFeedback }}</p>
          <div v-if="teamsStore.missionsLoading" class="mt-4 text-sm text-slate-400">Carregando missões...</div>
          <div v-else class="mt-4 space-y-4">
            <form v-if="canCreateMissions" class="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 grid gap-3 md:grid-cols-2" @submit.prevent="handleCreateMission">
              <label class="text-sm md:col-span-2">
                <span class="text-slate-400">Título</span>
                <input v-model="missionForm.title" class="input mt-1" placeholder="Revisar combos do torneio" required />
              </label>
              <label class="text-sm md:col-span-2">
                <span class="text-slate-400">Descrição</span>
                <textarea v-model="missionForm.description" class="input mt-1" rows="2" placeholder="Contexto e critérios"></textarea>
              </label>
              <label class="text-sm">
                <span class="text-slate-400">XP</span>
                <input v-model.number="missionForm.xpReward" type="number" min="5" max="500" class="input mt-1" />
              </label>
              <label class="text-sm">
                <span class="text-slate-400">Responsável</span>
                <select v-model="missionForm.assignedToId" class="input mt-1">
                  <option value="">Aberta para o time</option>
                  <option v-for="member in availableMembers" :key="member.id" :value="member.user.id">
                    {{ member.user.name || member.user.username }}
                  </option>
                </select>
              </label>
              <div class="md:col-span-2 flex items-center justify-end gap-3">
                <button type="submit" class="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="missionSaving">
                  {{ missionSaving ? 'Publicando...' : 'Criar missão' }}
                </button>
                <button type="button" class="text-xs text-slate-400" @click="resetMissionForm">Limpar</button>
              </div>
            </form>
            <ul class="space-y-3">
              <li v-for="mission in orderedMissions" :key="mission.id" class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 space-y-3">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p class="text-lg font-semibold text-white">{{ mission.title }}</p>
                    <p class="text-xs text-slate-500">Atualizado em {{ formatDate(mission.updatedAt) }}</p>
                  </div>
                  <span :class="['rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]', statusMeta(mission).class]">
                    {{ statusMeta(mission).label }}
                  </span>
                </div>
                <p class="text-sm text-slate-300">{{ mission.description || 'Sem descrição.' }}</p>
                <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span>XP: {{ mission.xpReward }}</span>
                  <span>Responsável: {{ mission.assignedTo?.name || mission.assignedTo?.username || 'Equipe' }}</span>
                  <span v-if="mission.submittedBy">Enviado por {{ mission.submittedBy.name || mission.submittedBy.username }}</span>
                </div>
                <div class="grid gap-2 md:grid-cols-2">
                  <input v-model="missionNotes[mission.id]" class="input text-sm" placeholder="Observação opcional" />
                  <div class="flex flex-wrap items-center justify-end gap-2 text-sm">
                    <button
                      v-if="canSubmitMission(mission)"
                      type="button"
                      class="rounded-xl border border-slate-700 px-4 py-2 text-slate-200 disabled:opacity-40"
                      :disabled="submittingMissionId === mission.id"
                      @click="handleSubmitMission(mission)"
                    >
                      {{ submittingMissionId === mission.id ? 'Enviando...' : 'Enviar conclusão' }}
                    </button>
                    <button
                      v-if="canReviewMission(mission)"
                      type="button"
                      class="rounded-xl bg-emerald-500/80 px-4 py-2 text-white disabled:opacity-40"
                      :disabled="reviewingMissionId === mission.id"
                      @click="handleReviewMission(mission, 'APPROVE')"
                    >
                      Aprovar
                    </button>
                    <button
                      v-if="canReviewMission(mission)"
                      type="button"
                      class="rounded-xl bg-amber-500/30 px-4 py-2 text-amber-200 disabled:opacity-40"
                      :disabled="reviewingMissionId === mission.id"
                      @click="handleReviewMission(mission, 'REJECT')"
                    >
                      Reprovar
                    </button>
                  </div>
                </div>
              </li>
              <li v-if="!orderedMissions.length" class="rounded-2xl border border-dashed border-slate-800/70 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
                Nenhuma missão cadastrada. Crie uma missão para começar a distribuição de XP.
              </li>
            </ul>
          </div>
        </article>
      </div>

      <article class="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 flex flex-col">
        <header class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Chat tático</p>
            <h3 class="text-2xl font-semibold text-white">Canal da equipe</h3>
          </div>
          <button type="button" class="text-sm text-slate-400" @click="refreshMessages">Buscar histórico</button>
        </header>
        <div class="mt-4 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          <div class="h-80 overflow-y-auto space-y-3 p-4" ref="chatScroller">
            <p v-if="!teamsStore.selectedTeamId" class="text-sm text-slate-500">Selecione uma equipe para habilitar o chat.</p>
            <template v-else>
              <p v-if="teamsStore.chatLoading" class="text-sm text-slate-400">Carregando mensagens...</p>
              <article
                v-for="message in teamsStore.messages"
                :key="message.id"
                :class="[
                  'rounded-2xl border px-3 py-2 text-sm',
                  message.userId === auth.user?.id ? 'border-primary/40 bg-primary/10 text-primary-200' : 'border-slate-800/90 bg-slate-900/70 text-slate-200'
                ]"
              >
                <header class="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.25em]">
                  <span>{{ message.user?.name || message.user?.username }}</span>
                  <span class="text-slate-500">{{ formatDate(message.createdAt) }}</span>
                </header>
                <p class="mt-1 text-base leading-tight">{{ message.content }}</p>
              </article>
            </template>
          </div>
        </div>
        <form class="mt-4 flex gap-2" @submit.prevent="sendChat">
          <input
            v-model="chatInput"
            class="input flex-1"
            placeholder="Compartilhe descobertas, scrims, alertas..."
            :disabled="!teamsStore.selectedTeamId"
          />
          <button type="submit" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" :disabled="!teamsStore.selectedTeamId || !chatInput.trim()">
            Enviar
          </button>
        </form>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import { useTeamsStore } from '../stores/teams';
import { useAuthStore } from '../stores/auth';
import { formatDate } from '../utils/format';
import { uploadImage } from '../services/uploadService';

const teamsStore = useTeamsStore();
const auth = useAuthStore();

const createForm = reactive({
  name: '',
  description: '',
  imageUrl: '',
});
const missionForm = reactive({
  title: '',
  description: '',
  xpReward: 40,
  assignedToId: '',
});
const missionNotes = reactive({});
const chatInput = ref('');
const createFeedback = ref('');
const missionFeedback = ref('');
const chatScroller = ref(null);
const teamImageInput = ref(null);
const teamImageUploading = ref(false);

const missionSaving = ref(false);
const submittingMissionId = ref('');
const reviewingMissionId = ref('');
const permissionSavingId = ref('');
const leavingTeamId = ref('');

const canCreateTeams = computed(() => auth.user?.role && auth.user.role !== 'VISITOR');
const reachedTeamCap = computed(() => teamsStore.mine.length >= 2);
const currentMembership = computed(() => teamsStore.currentMembership);
const isOwner = computed(() => currentMembership.value?.role === 'OWNER');
const canCreateMissions = computed(() => teamsStore.canManageMissions);
const recentCombos = computed(() => teamsStore.dashboard?.combos?.slice?.(0, 4) ?? []);
const recentBattles = computed(() => teamsStore.dashboard?.battles?.slice?.(0, 4) ?? []);
const availableMembers = computed(() => teamsStore.dashboard?.members ?? []);
const levelProgress = computed(() => {
  if (!currentMembership.value) return 0;
  return Math.min(100, currentMembership.value.xp % 100);
});
const xpToNext = computed(() => {
  if (!currentMembership.value) return 100;
  return 100 - (currentMembership.value.xp % 100 || 0);
});
const missionOrder = ['SUBMITTED', 'OPEN', 'REJECTED', 'APPROVED', 'CANCELLED'];
const orderedMissions = computed(() => {
  return [...teamsStore.missions].sort((a, b) => {
    const diff = missionOrder.indexOf(a.status) - missionOrder.indexOf(b.status);
    if (diff !== 0) return diff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
});
const missionStatusMeta = {
  OPEN: { label: 'Aberta', class: 'border border-slate-700 text-slate-200' },
  SUBMITTED: { label: 'Pendente', class: 'bg-amber-500/20 text-amber-200' },
  APPROVED: { label: 'Aprovada', class: 'bg-emerald-500/30 text-emerald-200' },
  REJECTED: { label: 'Revisar', class: 'bg-rose-500/20 text-rose-200' },
  CANCELLED: { label: 'Cancelada', class: 'bg-slate-700/40 text-slate-300' },
};

onMounted(async () => {
  if (!teamsStore.catalog.length) {
    await teamsStore.bootstrap();
  } else if (teamsStore.selectedTeamId) {
    await teamsStore.loadWorkspace(teamsStore.selectedTeamId);
  }
});

onBeforeUnmount(() => {
  teamsStore.disconnectChatStream();
});

watch(
  () => teamsStore.messages.length,
  async () => {
    await nextTick();
    if (!chatScroller.value) return;
    chatScroller.value.scrollTop = chatScroller.value.scrollHeight;
  },
);

function resetCreateForm() {
  createForm.name = '';
  createForm.description = '';
  createForm.imageUrl = '';
  if (teamImageInput.value) {
    teamImageInput.value.value = '';
  }
}

function resetMissionForm() {
  missionForm.title = '';
  missionForm.description = '';
  missionForm.xpReward = 40;
  missionForm.assignedToId = '';
}

async function handleCreate() {
  if (!canCreateTeams.value || reachedTeamCap.value) return;
  try {
    await teamsStore.createTeam({
      name: createForm.name.trim(),
      description: createForm.description?.trim() || undefined,
      imageUrl: createForm.imageUrl?.trim() || undefined,
    });
    createFeedback.value = 'Equipe criada e sincronizada.';
    resetCreateForm();
  } catch (error) {
    createFeedback.value = error.message || 'Erro ao criar equipe.';
  }
}

function triggerTeamImagePicker() {
  if (!canCreateTeams.value) return;
  teamImageInput.value?.click();
}

function clearTeamImage() {
  createForm.imageUrl = '';
  if (teamImageInput.value) {
    teamImageInput.value.value = '';
  }
}

async function handleTeamImageSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  teamImageUploading.value = true;
  createFeedback.value = '';
  try {
    const { url } = await uploadImage(file);
    createForm.imageUrl = url;
    createFeedback.value = 'Imagem enviada com sucesso.';
  } catch (error) {
    createFeedback.value = error.message || 'Falha ao enviar imagem.';
  } finally {
    teamImageUploading.value = false;
    event.target.value = '';
  }
}

async function joinTeam(teamId) {
  if (!canCreateTeams.value || reachedTeamCap.value) return;
  try {
    await teamsStore.joinTeam(teamId);
  } catch (error) {
    createFeedback.value = error.message || 'Não foi possível entrar.';
  }
}

async function leaveTeamAction(teamId) {
  if (!teamId) return;
  if (!window.confirm('Tem certeza que deseja sair desta equipe?')) return;
  leavingTeamId.value = teamId;
  try {
    await teamsStore.leaveTeam(teamId);
  } catch (error) {
    missionFeedback.value = error.message || 'Erro ao sair da equipe.';
  } finally {
    leavingTeamId.value = '';
  }
}

async function refreshMine() {
  await teamsStore.fetchMyTeams();
}

async function refreshCatalog() {
  await teamsStore.fetchAllTeams();
}

async function refreshWorkspace() {
  if (!teamsStore.selectedTeamId) return;
  await Promise.all([
    teamsStore.fetchDashboard(teamsStore.selectedTeamId),
    teamsStore.fetchMessages(teamsStore.selectedTeamId, 100),
    teamsStore.fetchMissions(teamsStore.selectedTeamId),
  ]);
}

async function refreshMessages() {
  if (!teamsStore.selectedTeamId) return;
  await teamsStore.fetchMessages(teamsStore.selectedTeamId, 100);
}

async function refreshMissions() {
  if (!teamsStore.selectedTeamId) return;
  await teamsStore.fetchMissions(teamsStore.selectedTeamId);
}

async function sendChat() {
  if (!teamsStore.selectedTeamId || !chatInput.value.trim()) return;
  try {
    await teamsStore.sendMessage(chatInput.value.trim());
    chatInput.value = '';
  } catch (error) {
    createFeedback.value = error.message || 'Erro ao enviar mensagem.';
  }
}

function progressPercent(xp) {
  if (!xp) return 0;
  return Math.min(100, xp % 100);
}

function statusMeta(mission) {
  return missionStatusMeta[mission.status] ?? missionStatusMeta.OPEN;
}

function noteForMission(id) {
  return missionNotes[id] ?? '';
}

function canSubmitMission(mission) {
  if (!teamsStore.selectedTeamId) return false;
  if (['SUBMITTED', 'APPROVED'].includes(mission.status)) return false;
  if (!currentMembership.value) return false;
  if (mission.assignedTo?.id) {
    return mission.assignedTo.id === auth.user?.id;
  }
  return true;
}

function canReviewMission(mission) {
  if (!canCreateMissions.value) return false;
  return mission.status === 'SUBMITTED';
}

async function handleCreateMission() {
  if (!missionForm.title.trim()) return;
  missionSaving.value = true;
  missionFeedback.value = '';
  try {
    await teamsStore.createMission({
      title: missionForm.title.trim(),
      description: missionForm.description?.trim() || undefined,
      xpReward: missionForm.xpReward,
      assignedToId: missionForm.assignedToId || undefined,
    });
    missionFeedback.value = 'Missão publicada.';
    resetMissionForm();
  } catch (error) {
    missionFeedback.value = error.message || 'Erro ao criar missão.';
  } finally {
    missionSaving.value = false;
  }
}

async function handleSubmitMission(mission) {
  submittingMissionId.value = mission.id;
  missionFeedback.value = '';
  try {
    await teamsStore.submitMission(mission.id, { note: noteForMission(mission.id) || undefined });
    missionNotes[mission.id] = '';
    missionFeedback.value = 'Missão enviada para revisão.';
  } catch (error) {
    missionFeedback.value = error.message || 'Não foi possível enviar a missão.';
  } finally {
    submittingMissionId.value = '';
  }
}

async function handleReviewMission(mission, action) {
  reviewingMissionId.value = mission.id;
  missionFeedback.value = '';
  try {
    await teamsStore.reviewMission(mission.id, { action, note: noteForMission(mission.id) || undefined });
    missionNotes[mission.id] = '';
    missionFeedback.value = action === 'APPROVE' ? 'Missão aprovada.' : 'Missão enviada para revisão novamente.';
  } catch (error) {
    missionFeedback.value = error.message || 'Erro ao revisar missão.';
  } finally {
    reviewingMissionId.value = '';
  }
}

async function toggleMissionPermission(member) {
  permissionSavingId.value = member.id;
  try {
    await teamsStore.updateMemberPermissions(member.id, { canManageMissions: !member.canManageMissions });
    missionFeedback.value = member.canManageMissions ? 'Permissão revogada.' : 'Permissão concedida.';
  } catch (error) {
    missionFeedback.value = error.message || 'Erro ao atualizar permissões.';
  } finally {
    permissionSavingId.value = '';
  }
}

function resolveOwner(ownerId) {
  if (!ownerId) return '—';
  const ownerMembership = teamsStore.dashboard?.members?.find((member) => member.userId === ownerId);
  return ownerMembership?.user?.name || ownerMembership?.user?.username || ownerId.slice(0, 6);
}
</script>
