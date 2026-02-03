<template>
  <div class="assistant-layer">
    <button class="assistant-toggle" type="button" @click="handleToggle">
      <span class="label">Assistente CX</span>
      <span class="pulse" aria-hidden="true"></span>
      <span v-if="activeMissionsCount" class="badge">{{ activeMissionsCount }}</span>
    </button>

    <Transition name="assistant-panel">
      <section v-if="assistant.panelOpen" class="assistant-panel" aria-label="Assistente virtual">
        <header class="panel-header">
          <div>
            <p class="eyebrow">Central de bordo</p>
            <h3>Assistente CX</h3>
          </div>
          <div class="header-actions">
            <button class="ghost" type="button" @click="assistant.refreshMissions()">Sincronizar</button>
            <button class="ghost" type="button" @click="assistant.closePanel()" aria-label="Fechar">×</button>
          </div>
        </header>

        <div class="panel-body">
          <section class="chat-pane" aria-live="polite">
            <div class="chat-meta">
              <p class="eyebrow">Contexto atual</p>
              <div class="context-pill">
                <span>{{ assistant.context?.surface ?? 'Painel' }}</span>
                <span class="dot"></span>
                <span>{{ assistant.context?.route ?? '/' }}</span>
              </div>
            </div>

            <div ref="historyEl" class="chat-history">
              <p v-if="assistant.loading" class="placeholder">Conectando à assistente...</p>
              <p v-else-if="!assistant.history.length" class="placeholder">
                Nenhuma conversa ainda. Diga o que está montando ou qual missão precisa.
              </p>

              <article
                v-for="message in assistant.history"
                :key="message.id"
                :class="['bubble', message.role === 'ASSISTANT' ? 'assistant' : 'user']"
              >
                <header>
                  <span>{{ labels[message.role] ?? message.role }}</span>
                  <time>{{ formatTime(message.createdAt) }}</time>
                </header>
                <p>{{ message.content }}</p>
              </article>
            </div>

            <form class="chat-input" @submit.prevent="handleSubmit">
              <input
                ref="composerField"
                v-model="draft"
                type="text"
                placeholder="Fale comigo sobre a próxima missão..."
                :disabled="assistant.sending"
              />
              <button type="submit" :disabled="assistant.sending">{{ assistant.sending ? '...' : 'Enviar' }}</button>
            </form>
            <p v-if="assistant.error" class="error">{{ assistant.error }}</p>
            <p class="hint">Dica: cite "missão concluída" ou "bloqueio" para mudar o status automaticamente.</p>
          </section>

          <section class="missions-pane">
            <div class="missions-header">
              <div>
                <p class="eyebrow">Missões</p>
                <h4>Fila de ações</h4>
              </div>
              <p class="count">{{ assistant.missions.length }} registradas</p>
            </div>

            <ul class="mission-list">
              <li v-for="mission in assistant.missions" :key="mission.id" class="mission-card">
                <div class="mission-top">
                  <div>
                    <p class="mission-title">{{ mission.title }}</p>
                    <p class="mission-description">{{ mission.description }}</p>
                  </div>
                  <span class="status-chip" :class="statusClass(mission.status)">
                    {{ statusLabel(mission.status) }}
                  </span>
                </div>
                <p v-if="mission.blockingReason" class="mission-note">Bloqueio: {{ mission.blockingReason }}</p>
                <div v-if="mission.guide" class="mission-guide">
                  <p class="guide-label">
                    {{ mission.guide.surface ?? 'Fluxo indicado' }}
                    <span v-if="mission.guide.route" class="guide-route">→ {{ mission.guide.route }}</span>
                  </p>
                  <ul v-if="mission.guide.steps?.length" class="guide-steps">
                    <li
                      v-for="(step, index) in mission.guide.steps"
                      :key="`${mission.id}-step-${index}`"
                      class="guide-step"
                    >
                      <span class="step-index">{{ index + 1 }}</span>
                      <p>{{ step }}</p>
                    </li>
                  </ul>
                  <button
                    v-if="mission.status !== 'COMPLETED'"
                    class="action guide"
                    type="button"
                    @click="handleGoComplete(mission)"
                  >
                    {{ mission.guide.ctaLabel || 'Ir concluir' }}
                  </button>
                </div>
                <div class="mission-actions">
                  <button
                    v-if="mission.status !== 'COMPLETED'"
                    class="action primary"
                    type="button"
                    @click="assistant.updateMissionStatus(mission.id, 'COMPLETED')"
                  >
                    Concluir
                  </button>
                  <button
                    v-if="mission.status !== 'BLOCKED' && mission.status !== 'COMPLETED'"
                    class="action ghost"
                    type="button"
                    @click="handleBlock(mission)"
                  >
                    Bloquear
                  </button>
                  <button
                    v-if="mission.status === 'BLOCKED'"
                    class="action ghost"
                    type="button"
                    @click="assistant.updateMissionStatus(mission.id, 'ACTIVE')"
                  >
                    Retomar
                  </button>
                </div>
              </li>
            </ul>

            <p v-if="!assistant.missions.length" class="placeholder">
              Nenhuma missão ativa agora — registre batalhas ou decks para receber novas sugestões.
            </p>
          </section>
        </div>
      </section>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAssistantStore } from '../../stores/assistant';

const assistant = useAssistantStore();
const draft = ref('');
const historyEl = ref(null);
const composerField = ref(null);
const router = useRouter();

const labels = {
  ASSISTANT: 'Assistente',
  USER: 'Você',
};

const activeMissionsCount = computed(() => assistant.activeMissions.length);

function formatTime(value) {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

async function handleSubmit() {
  await assistant.sendMessage(draft.value);
  draft.value = '';
  await nextTick();
  scrollHistory();
}

function handleToggle() {
  assistant.togglePanel();
  if (!assistant.bootstrapped && !assistant.loading) {
    assistant.bootstrap(assistant.context ?? undefined);
  }
}

function handleBlock(mission) {
  const note = window.prompt('Qual o motivo do bloqueio? (opcional)') ?? undefined;
  assistant.updateMissionStatus(mission.id, 'BLOCKED', note);
}

function handleGoComplete(mission) {
  if (!mission?.guide?.route) return;
  const location = mission.guide.anchor
    ? { path: mission.guide.route, hash: mission.guide.anchor.startsWith('#') ? mission.guide.anchor : `#${mission.guide.anchor}` }
    : mission.guide.route;
  assistant.closePanel();
  router.push(location).catch(() => {});
}

function statusLabel(status) {
  switch (status) {
    case 'ACTIVE':
      return 'Em andamento';
    case 'PENDING':
      return 'Pendente';
    case 'COMPLETED':
      return 'Concluída';
    case 'BLOCKED':
      return 'Bloqueada';
    default:
      return status;
  }
}

function statusClass(status) {
  return `status-${status.toLowerCase()}`;
}

function scrollHistory() {
  if (!historyEl.value) return;
  historyEl.value.scrollTop = historyEl.value.scrollHeight;
}

watch(
  () => assistant.history.length,
  () => nextTick(scrollHistory),
);

watch(
  () => assistant.panelOpen,
  (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        scrollHistory();
        composerField.value?.focus();
      });
    }
  },
);
</script>

<style scoped>
.assistant-layer {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 60;
  font-family: 'Space Grotesk', 'Segoe UI', system-ui;
}

.assistant-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.4rem;
  background: radial-gradient(circle at top, rgba(245, 158, 11, 0.35), rgba(15, 23, 42, 0.95));
  color: #fef3c7;
  font-weight: 600;
  letter-spacing: 0.04em;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.assistant-toggle .label {
  text-transform: uppercase;
  font-size: 0.7rem;
}

.assistant-toggle .pulse {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #facc15;
  box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.6);
  animation: pulse 2s infinite;
}

.assistant-toggle .badge {
  min-width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #f97316;
  color: #fff;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.6);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(250, 204, 21, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
  }
}

.assistant-panel-enter-active,
.assistant-panel-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.assistant-panel-enter-from,
.assistant-panel-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.assistant-panel {
  position: absolute;
  bottom: 4rem;
  right: 0;
  width: min(36rem, calc(100vw - 2rem));
  max-height: 80vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(45, 55, 72, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.panel-header h3 {
  margin-top: 0.15rem;
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.header-actions .ghost {
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  background: transparent;
  color: #e2e8f0;
  font-size: 0.85rem;
}

.panel-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  padding: 1.25rem;
  color: #e2e8f0;
  overflow-y: auto;
}

@media (min-width: 768px) {
  .assistant-panel {
    width: 50rem;
  }
  .panel-body {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

.eyebrow {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  color: #94a3b8;
}

.chat-pane,
.missions-pane {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 1.2rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 22rem;
}

.chat-meta {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.context-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 0.3rem 0.9rem;
  font-size: 0.75rem;
  color: #cbd5f5;
}

.context-pill .dot {
  width: 0.3rem;
  height: 0.3rem;
  border-radius: 50%;
  background: #f97316;
}

.chat-history {
  flex: 1;
  margin-top: 1rem;
  padding-right: 0.4rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.placeholder {
  font-size: 0.85rem;
  color: #94a3b8;
}

.bubble {
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.bubble header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #cbd5f5;
  margin-bottom: 0.35rem;
}

.bubble.user {
  margin-left: auto;
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
}

.bubble.assistant {
  margin-right: auto;
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.35);
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.chat-input input {
  flex: 1;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.75);
  color: #f8fafc;
  padding: 0.6rem 1rem;
}

.chat-input button {
  border-radius: 999px;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(120deg, #f97316, #facc15);
  border: none;
  color: #0f172a;
  font-weight: 700;
}

.hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.6rem;
}

.error {
  color: #f87171;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.missions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mission-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.mission-card {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 1rem;
  padding: 0.9rem;
  background: rgba(15, 23, 42, 0.5);
}

.mission-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.mission-title {
  font-weight: 600;
}

.mission-description,
.mission-note {
  font-size: 0.85rem;
  color: #cbd5f5;
  margin-top: 0.35rem;
}

.status-chip {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status-active {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

.status-pending {
  background: rgba(234, 179, 8, 0.15);
  color: #fde047;
}

.status-completed {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.status-blocked {
  background: rgba(248, 113, 113, 0.2);
  color: #fecaca;
}

.mission-guide {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed rgba(148, 163, 184, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.guide-label {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.guide-route {
  font-size: 0.65rem;
  color: #fbbf24;
}

.guide-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.guide-step {
  display: flex;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: #e2e8f0;
}

.step-index {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 0.35rem;
  border: 1px solid rgba(248, 250, 252, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #facc15;
}

.mission-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.action {
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: #cbd5f5;
}

.action.primary {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
  color: #a7f3d0;
}

.action.guide {
  background: linear-gradient(120deg, #f97316, #fbbf24);
  border-color: transparent;
  color: #0f172a;
  font-weight: 600;
}

.count {
  font-size: 0.85rem;
  color: #cbd5f5;
}
</style>
