import { defineStore } from 'pinia';

import {
  bootstrapAssistantSession,
  fetchAssistantMissions,
  pushAssistantContext,
  sendAssistantMessage,
  updateAssistantMission,
} from '../services/assistantService';

const SESSION_KEY = 'lab-assistant-session';

function loadPersistedSession() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(SESSION_KEY) ?? '';
}

function persistSessionId(sessionId) {
  if (typeof window === 'undefined') return;
  if (sessionId) {
    window.localStorage.setItem(SESSION_KEY, sessionId);
  }
}

export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    sessionId: loadPersistedSession(),
    history: [],
    missions: [],
    loading: false,
    sending: false,
    panelOpen: false,
    bootstrapped: false,
    context: null,
    error: '',
  }),
  getters: {
    activeMissions(state) {
      return state.missions.filter((mission) => mission.status === 'ACTIVE');
    },
  },
  actions: {
    togglePanel() {
      this.panelOpen = !this.panelOpen;
      if (this.panelOpen) {
        this.refreshMissions();
      }
    },
    closePanel() {
      this.panelOpen = false;
    },
    async bootstrap(context) {
      if (this.loading) return;
      this.loading = true;
      this.context = context ?? this.context;
      try {
        const payload = {
          sessionId: this.sessionId || undefined,
          context: this.context || undefined,
        };
        const data = await bootstrapAssistantSession(payload);
        this.sessionId = data.sessionId;
        persistSessionId(this.sessionId);
        this.history = data.history ?? [];
        this.missions = data.missions ?? [];
        this.bootstrapped = true;
        this.error = '';
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    async ensureSession() {
      if (this.bootstrapped && this.sessionId) {
        return this.sessionId;
      }
      await this.bootstrap(this.context ?? undefined);
      return this.sessionId;
    },
    async sendMessage(message) {
      const trimmed = message?.trim();
      if (!trimmed) return;
      await this.ensureSession();
      if (!this.sessionId) return;
      this.sending = true;
      try {
        const data = await sendAssistantMessage({
          sessionId: this.sessionId,
          message: trimmed,
          context: this.context || undefined,
        });
        this.history = data.history ?? this.history;
        this.missions = data.missions ?? this.missions;
        this.error = '';
      } catch (error) {
        this.error = error.message;
      } finally {
        this.sending = false;
      }
    },
    async updateContext(context) {
      this.context = { ...(this.context ?? {}), ...context };
      if (!this.sessionId) return;
      try {
        await pushAssistantContext({ sessionId: this.sessionId, context: this.context });
        this.error = '';
      } catch (error) {
        this.error = error.message;
      }
    },
    async refreshMissions() {
      if (!this.sessionId) return;
      try {
        const data = await fetchAssistantMissions(this.sessionId);
        this.missions = data.missions ?? this.missions;
      } catch (error) {
        this.error = error.message;
      }
    },
    async updateMissionStatus(missionId, status, note) {
      if (!this.sessionId) return;
      try {
        const mission = await updateAssistantMission(this.sessionId, missionId, { status, note });
        this.missions = this.missions.map((item) => (item.id === mission.id ? mission : item));
        this.error = '';
      } catch (error) {
        this.error = error.message;
      }
    },
  },
});
