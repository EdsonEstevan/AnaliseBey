<template>
  <div class="space-y-8">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Administração</p>
        <h1 class="text-3xl font-semibold text-white">Painel do Laboratório</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
          @click="refreshAll"
          :disabled="panelLoading"
        >
          {{ panelLoading ? 'Atualizando...' : 'Atualizar dados' }}
        </button>
        <button
          class="rounded-full border border-slate-700 bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          @click="pinLiveMode"
        >
          {{ liveModeEnabled ? 'Modo manual' : 'Modo monitor' }}
        </button>
      </div>
    </header>

    <div v-if="!canAdmin" class="rounded-3xl border border-rose-500/40 bg-rose-950/30 p-8 text-rose-100 shadow-inner shadow-rose-900/40">
      <h2 class="text-xl font-semibold">Permissão insuficiente</h2>
      <p class="mt-2 text-sm text-rose-200/80">
        Você precisa de escopos administrativos (por exemplo, USERS_MANAGE) para acessar este painel. Solicite liberações junto ao mantenedor.
      </p>
    </div>

    <template v-else>
      <section class="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/40">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
            <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Usuários ativos</p>
            <p class="mt-3 text-3xl font-semibold">{{ totalUsers }}</p>
            <p class="text-sm text-slate-400">{{ admin.loading ? 'Carregando...' : 'Equipe conectada' }}</p>
          </article>
          <article class="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
            <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Convites disponíveis</p>
            <p class="mt-3 text-3xl font-semibold">{{ availableKeys }}</p>
            <p class="text-sm text-slate-400">{{ allowKeys ? 'Controle total' : 'Visualização limitada' }}</p>
          </article>
          <article class="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
            <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Alertas ativos</p>
            <p class="mt-3 text-3xl font-semibold">{{ activePunishmentCount }}</p>
            <p class="text-sm text-slate-400">Restrições temporárias</p>
          </article>
          <article class="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
            <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Auditoria</p>
            <p class="mt-3 text-3xl font-semibold">{{ recentAudit.length }}</p>
            <p class="text-sm text-slate-400">Eventos recentes</p>
          </article>
        </div>
        <p v-if="feedback" class="mt-4 text-sm text-slate-300">{{ feedback }}</p>
        <p v-if="resetResult" class="mt-2 rounded-2xl border border-emerald-500/40 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-100">
          Nova senha para {{ resetResult.userId }}: <span class="font-semibold">{{ resetResult.password }}</span>
        </p>
      </section>

      <section class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/30">
        <header class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-white">Usuários e permissões</h2>
            <p class="text-sm text-slate-400">Gerencie papéis, acessos e integrações.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <label class="text-xs uppercase tracking-[0.3em] text-slate-500">Selecionar usuário</label>
            <select v-model="permissionForm.userId" class="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">
              <option v-for="option in userOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </header>

        <div class="grid gap-5 lg:grid-cols-2">
          <form v-if="allowPermissions" class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col gap-3" @submit.prevent="handlePermissionGrant">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white">Conceder escopo</h3>
              <span class="text-xs text-slate-500">Escopos críticos</span>
            </div>
            <label class="text-sm text-slate-400">
              Escopo
              <select v-model="permissionForm.scope" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                <option v-for="scope in workspaceScopes" :key="scope" :value="scope">{{ scope }}</option>
              </select>
            </label>
            <label class="text-sm text-slate-400">
              Notas internas
              <textarea v-model="permissionForm.notes" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" rows="2" placeholder="Justificativa"></textarea>
            </label>
            <button type="submit" class="rounded-xl bg-primary/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary">Conceder escopo</button>
          </form>
          <form
            v-if="allowSharing"
            class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col gap-3"
            @submit.prevent="handleShareGrant"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white">Compartilhar peças</h3>
              <span class="text-xs text-slate-500">Integração de dados</span>
            </div>
            <label class="text-sm text-slate-400">
              Usuário destino
              <select v-model="shareForm.granteeId" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                <option v-for="option in userOptions" :key="`share-${option.value}`" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="text-sm text-slate-400">
              Escopo de compartilhamento
              <select v-model="shareForm.scope" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                <option v-for="scope in partShareScopes" :key="scope" :value="scope">{{ scope }}</option>
              </select>
            </label>
            <label class="text-sm text-slate-400">
              Notas
              <textarea v-model="shareForm.notes" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" rows="2" placeholder="Uso previsto"></textarea>
            </label>
            <button type="submit" class="rounded-xl border border-emerald-500/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30">Compartilhar inventário</button>
          </form>
          <div
            v-else
            class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400"
          >
            Você precisa do escopo PARTS_EDIT para distribuir dados compartilhados.
          </div>
        </div>

        <div class="mt-6 grid gap-4">
          <article v-for="user in admin.users" :key="user.summary.id" class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 class="text-xl font-semibold text-white">{{ user.summary.name }}</h3>
                <p class="text-sm text-slate-400">@{{ user.summary.username }} · {{ user.summary.role }}</p>
                <p class="text-xs text-slate-500">{{ formatDate(user.createdAt) }}</p>
              </div>
              <div class="flex flex-wrap gap-2 text-xs text-slate-400">
                <span class="rounded-full border border-slate-700 px-3 py-1">Peças {{ user.stats.parts }}</span>
                <span class="rounded-full border border-slate-700 px-3 py-1">Combos {{ user.stats.combos }}</span>
                <span class="rounded-full border border-slate-700 px-3 py-1">Batalhas {{ user.stats.battles }}</span>
              </div>
            </div>

            <div class="mt-4 grid gap-4 md:grid-cols-3">
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs text-slate-500">
                  <span>Papel</span>
                  <span>status {{ user.summary.status }}</span>
                </div>
                <select
                  :value="user.summary.role"
                  @change="handleRoleChange(user.summary.id, $event.target.value)"
                  class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  :disabled="!allowPermissions"
                >
                  <option v-for="role in userRoles" :key="role" :value="role">{{ role }}</option>
                </select>
                <button
                  class="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
                  @click="handleResetPassword(user.summary.id, user.summary.name)"
                >
                  Resetar senha
                </button>
              </div>

              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Permissões</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="perm in user.permissions"
                    :key="perm.id"
                    class="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
                  >
                    {{ perm.scope }}
                    <button v-if="allowPermissions" class="text-primary/70" @click="handlePermissionRevoke(perm.id)">×</button>
                  </span>
                  <span v-if="!user.permissions?.length" class="text-xs text-slate-500">Sem escopos extras</span>
                </div>
                <p class="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">Compartilhamentos recebidos</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="share in user.partShares"
                    :key="share.id"
                    class="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200"
                  >
                    {{ share.ownerId === user.summary.id ? 'Próprio' : share.scope }} de {{ share.ownerId === user.summary.id ? 'self' : abbreviateId(share.ownerId) }}
                  </span>
                  <span v-if="!user.partShares?.length" class="text-xs text-slate-500">Nenhum acesso externo</span>
                </div>
              </div>

              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Punições ativas</p>
                <div class="mt-2 space-y-2">
                  <div
                    v-for="punish in user.punishments"
                    :key="punish.id"
                    class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ punish.type }}</span>
                      <button
                        v-if="allowPunishments"
                        class="text-rose-200"
                        @click="handleLiftPunishment(punish.id)"
                      >Liberar</button>
                    </div>
                    <p class="mt-1 text-[0.7rem] text-rose-200/80">{{ punish.reason }}</p>
                  </div>
                  <span v-if="!user.punishments?.length" class="text-xs text-slate-500">Sem restrições</span>
                </div>
              </div>
            </div>

            <div v-if="user.summary.id === currentUserId && user.shareGrants?.length" class="mt-4 border-t border-slate-800 pt-4">
              <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Compartilhamentos emitidos</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="grant in user.shareGrants"
                  :key="grant.id"
                  class="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
                >
                  {{ grant.scope }} ➜ {{ abbreviateId(grant.granteeId) }}
                  <button class="text-cyan-200" @click="handleShareRevoke(grant.id)">×</button>
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="allowPunishments" class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/30">
        <h2 class="text-2xl font-semibold text-white">Aplicar punição</h2>
        <form class="mt-4 grid gap-4 md:grid-cols-2" @submit.prevent="handlePunishment">
          <label class="text-sm text-slate-400">
            Usuário
            <select v-model="punishmentForm.userId" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
              <option v-for="option in userOptions" :key="`punish-${option.value}`" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="text-sm text-slate-400">
            Tipo
            <select v-model="punishmentForm.type" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
              <option v-for="type in punishmentTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label class="text-sm text-slate-400 md:col-span-2">
            Motivo
            <textarea v-model="punishmentForm.reason" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" rows="3" placeholder="Detalhe o motivo"></textarea>
          </label>
          <label class="text-sm text-slate-400">
            Duração (horas)
            <input type="number" min="1" v-model.number="punishmentForm.durationHours" class="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" />
          </label>
          <div class="flex items-end">
            <button type="submit" class="rounded-xl bg-rose-500/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500">Aplicar punição</button>
          </div>
        </form>
      </section>

      <section v-if="allowKeys" class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/30">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-white">Chaves de acesso</h2>
            <p class="text-sm text-slate-400">Emita, revogue e acompanhe o uso.</p>
          </div>
          <form class="flex flex-wrap gap-3 text-sm text-slate-200" @submit.prevent="handleCreateKeys">
            <label>
              Qtde
              <input type="number" min="1" max="10" v-model.number="newKeyForm.quantity" class="ml-2 w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1" />
            </label>
            <label>
              Max usos
              <input type="number" min="1" max="10" v-model.number="newKeyForm.maxUses" class="ml-2 w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1" />
            </label>
            <button type="submit" class="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 font-semibold text-primary">Gerar convites</button>
          </form>
        </div>
        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-left text-xs uppercase tracking-[0.25em] text-slate-500">
              <tr>
                <th class="px-3 py-2">Código</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">Dono</th>
                <th class="px-3 py-2">Uso</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in admin.accessKeys" :key="key.id" class="border-t border-slate-800 text-slate-200">
                <td class="px-3 py-2 font-mono text-sm">{{ key.code }}</td>
                <td class="px-3 py-2">{{ key.status }}</td>
                <td class="px-3 py-2">{{ key.ownerName ?? '—' }}</td>
                <td class="px-3 py-2">{{ key.uses }}/{{ key.maxUses }}</td>
                <td class="px-3 py-2 text-right">
                  <button v-if="key.status !== 'REVOKED'" class="text-xs text-rose-300" @click="handleKeyRevoke(key.id)">Revogar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="canAudit" class="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/30">
        <h2 class="text-2xl font-semibold text-white">Auditoria</h2>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <article v-for="log in recentAudit" :key="log.id" class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p class="text-xs uppercase tracking-[0.35em] text-slate-500">{{ log.action }}</p>
            <p class="mt-2 text-sm text-slate-300">
              {{ log.actor?.name ?? 'Sistema' }} → {{ log.targetUser?.name ?? log.targetType ?? 'N/A' }}
            </p>
            <p class="text-xs text-slate-500">{{ formatDate(log.createdAt) }}</p>
            <pre v-if="log.metadata" class="mt-2 rounded-xl bg-slate-900/80 p-3 text-[0.65rem] text-slate-400">{{ stringifyMetadata(log.metadata) }}</pre>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAdminStore } from '../stores/admin';
import { useAuthStore } from '../stores/auth';
import {
  canAccessAdminPanel,
  canManageKeys,
  canManagePermissions,
  canManagePunishments,
  hasWorkspaceScope,
} from '../utils/accessControl';

const admin = useAdminStore();
const auth = useAuthStore();

const workspaceScopes = ['PARTS_EDIT', 'USERS_MANAGE', 'ACCESS_KEYS_MANAGE', 'PUNISHMENTS_MANAGE', 'AUDIT_VIEW'];
const partShareScopes = ['VIEW', 'EDIT'];
const punishmentTypes = ['TEMP_BAN', 'PARTS_LOCK', 'KEYS_LOCK', 'ACCOUNT_LIMIT'];
const userRoles = ['ADMIN', 'MEMBER', 'VISITOR'];

const panelLoading = ref(false);
const feedback = ref('');
const liveModeEnabled = ref(false);
const resetResult = ref(null);

const permissionForm = reactive({ userId: '', scope: 'PARTS_EDIT', notes: '' });
const shareForm = reactive({ granteeId: '', scope: 'VIEW', notes: '' });
const punishmentForm = reactive({ userId: '', type: 'TEMP_BAN', reason: '', durationHours: 24 });
const newKeyForm = reactive({ quantity: 3, maxUses: 1 });

const canAdmin = computed(() => canAccessAdminPanel(auth.user));
const allowKeys = computed(() => canManageKeys(auth.user));
const allowPermissions = computed(() => canManagePermissions(auth.user));
const allowPunishments = computed(() => canManagePunishments(auth.user));
const allowSharing = computed(() => hasWorkspaceScope(auth.user, 'PARTS_EDIT'));
const canAudit = computed(() => canManagePermissions(auth.user) || hasWorkspaceScope(auth.user, 'AUDIT_VIEW'));
const currentUserId = computed(() => auth.user?.id ?? '');

const userOptions = computed(() =>
  admin.users.map((entry) => ({
    value: entry.summary.id,
    label: `${entry.summary.name} (@${entry.summary.username})`,
  })),
);

const totalUsers = computed(() => admin.users.length);
const availableKeys = computed(() => admin.accessKeys.filter((key) => key.status === 'AVAILABLE').length);
const activePunishmentCount = computed(() =>
  admin.users.reduce((total, entry) => total + (entry.punishments?.length ?? 0), 0),
);
const recentAudit = computed(() => admin.auditLogs.slice(0, 8));

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function abbreviateId(id) {
  if (!id) return '—';
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function stringifyMetadata(metadata) {
  try {
    return JSON.stringify(metadata, null, 2);
  } catch (error) {
    return String(metadata);
  }
}

async function refreshAll() {
  if (!canAdmin.value) return;
  panelLoading.value = true;
  feedback.value = '';
  try {
    const tasks = [admin.fetchUsers()];
    if (allowKeys.value) tasks.push(admin.fetchAccessKeys('all'));
    if (canAudit.value) tasks.push(admin.fetchAudit({ limit: 50 }));
    await Promise.all(tasks);
    primeForms();
  } catch (error) {
    feedback.value = error.message;
  } finally {
    panelLoading.value = false;
  }
}

function primeForms() {
  const firstUser = userOptions.value[0];
  if (firstUser) {
    if (!permissionForm.userId) permissionForm.userId = firstUser.value;
    if (!shareForm.granteeId) shareForm.granteeId = firstUser.value;
    if (!punishmentForm.userId) punishmentForm.userId = firstUser.value;
  }
}

async function handlePermissionGrant() {
  if (!permissionForm.userId) return;
  try {
    await admin.grantPermission({ ...permissionForm });
    permissionForm.notes = '';
    feedback.value = 'Permissão concedida.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handlePermissionRevoke(permissionId) {
  if (!permissionId) return;
  try {
    await admin.revokePermission({ permissionId });
    feedback.value = 'Permissão revogada.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleShareGrant() {
  if (!shareForm.granteeId) return;
  try {
    await admin.grantPartShare({ ...shareForm });
    shareForm.notes = '';
    feedback.value = 'Compartilhamento atualizado.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleShareRevoke(grantId) {
  if (!grantId) return;
  try {
    await admin.revokePartShare({ grantId });
    feedback.value = 'Compartilhamento removido.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handlePunishment() {
  if (!punishmentForm.userId || !punishmentForm.reason) {
    feedback.value = 'Informe usuário e motivo.';
    return;
  }
  try {
    await admin.applyPunishment({ ...punishmentForm });
    punishmentForm.reason = '';
    feedback.value = 'Punição aplicada.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleLiftPunishment(punishmentId) {
  if (!punishmentId) return;
  try {
    await admin.liftPunishment({ punishmentId });
    feedback.value = 'Punição removida.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleCreateKeys() {
  try {
    await admin.createAccessKeys({ ...newKeyForm });
    feedback.value = 'Convites gerados.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleKeyRevoke(id) {
  try {
    await admin.revokeAccessKey(id);
    feedback.value = 'Convite revogado.';
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleResetPassword(userId, name) {
  try {
    resetResult.value = await admin.resetPassword(userId);
    feedback.value = `Senha temporária emitida para ${name}.`;
  } catch (error) {
    feedback.value = error.message;
  }
}

async function handleRoleChange(userId, role) {
  try {
    await admin.updateUserRole(userId, role);
    feedback.value = 'Papel atualizado.';
  } catch (error) {
    feedback.value = error.message;
  }
}

function pinLiveMode() {
  liveModeEnabled.value = !liveModeEnabled.value;
  if (liveModeEnabled.value) {
    refreshAll();
  }
}

watch(
  () => canAdmin.value,
  (enabled) => {
    if (enabled) {
      refreshAll();
    }
  },
  { immediate: true },
);

watch(
  () => admin.users,
  () => {
    primeForms();
  },
);

onMounted(() => {
  if (canAdmin.value) {
    refreshAll();
  }
});
</script>
