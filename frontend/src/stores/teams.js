import { defineStore } from 'pinia';

import api, { apiBaseUrl } from '../services/apiClient';
import { useAuthStore } from './auth';

const defaultState = () => ({
  catalog: [],
  mine: [],
  selectedTeamId: '',
  dashboard: null,
  messages: [],
  missions: [],
  loading: false,
  dashboardLoading: false,
  chatLoading: false,
  missionsLoading: false,
  chatStream: null,
});

function parseEventPayload(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Falha ao interpretar payload SSE', error);
    return null;
  }
}

function upsertMessage(messages, payload) {
  if (!payload || !payload.id) return messages;
  const index = messages.findIndex((message) => message.id === payload.id);
  if (index >= 0) {
    const clone = [...messages];
    clone[index] = payload;
    return clone;
  }
  return [...messages, payload];
}

export const useTeamsStore = defineStore('teams', {
  state: defaultState,
  getters: {
    selectedTeam(state) {
      return state.catalog.find((team) => team.id === state.selectedTeamId) ?? null;
    },
    currentMembership(state) {
      const team = state.mine.find((item) => item.id === state.selectedTeamId);
      return team?.membership ?? null;
    },
    canManageMissions() {
      const membership = this.currentMembership;
      if (!membership) return false;
      return membership.role === 'OWNER' || membership.canManageMissions;
    },
  },
  actions: {
    async fetchAllTeams() {
      const { data } = await api.get('/teams');
      this.catalog = data;
    },
    async fetchMyTeams() {
      const { data } = await api.get('/teams/mine');
      this.mine = data;
      if (!this.selectedTeamId && data.length) {
        this.selectedTeamId = data[0].id;
      }
    },
    async bootstrap() {
      this.loading = true;
      try {
        await Promise.all([this.fetchAllTeams(), this.fetchMyTeams()]);
        if (this.selectedTeamId) {
          await this.loadWorkspace(this.selectedTeamId);
        }
      } finally {
        this.loading = false;
      }
    },
    async loadWorkspace(teamId) {
      this.selectedTeamId = teamId;
      this.disconnectChatStream();
      if (!teamId) {
        this.dashboard = null;
        this.messages = [];
        this.missions = [];
        return;
      }
      await Promise.all([
        this.fetchDashboard(teamId),
        this.fetchMessages(teamId),
        this.fetchMissions(teamId),
      ]);
      this.connectChatStream(teamId);
    },
    async fetchDashboard(teamId) {
      this.dashboardLoading = true;
      try {
        const { data } = await api.get(`/teams/${teamId}/dashboard`);
        this.dashboard = data;
      } finally {
        this.dashboardLoading = false;
      }
    },
    async fetchMessages(teamId, limit = 50) {
      this.chatLoading = true;
      try {
        const { data } = await api.get(`/teams/${teamId}/messages`, { params: { limit } });
        this.messages = data;
      } finally {
        this.chatLoading = false;
      }
    },
    async fetchMissions(teamId) {
      this.missionsLoading = true;
      try {
        const { data } = await api.get(`/teams/${teamId}/missions`);
        this.missions = data;
      } finally {
        this.missionsLoading = false;
      }
    },
    async createTeam(payload) {
      const { data } = await api.post('/teams', payload);
      await Promise.all([this.fetchAllTeams(), this.fetchMyTeams()]);
      await this.loadWorkspace(data.id);
      return data;
    },
    async joinTeam(teamId) {
      const { data } = await api.post(`/teams/${teamId}/join`);
      await Promise.all([this.fetchAllTeams(), this.fetchMyTeams()]);
      await this.loadWorkspace(data.id);
      return data;
    },
    async leaveTeam(teamId) {
      await api.post(`/teams/${teamId}/leave`);
      this.disconnectChatStream();
      await Promise.all([this.fetchAllTeams(), this.fetchMyTeams()]);
      const fallback = this.mine[0]?.id ?? '';
      await this.loadWorkspace(fallback);
    },
    async sendMessage(content) {
      if (!this.selectedTeamId) return;
      const { data } = await api.post(`/teams/${this.selectedTeamId}/messages`, { content });
      this.messages = upsertMessage(this.messages, data);
    },
    async createMission(payload) {
      if (!this.selectedTeamId) return null;
      const { data } = await api.post(`/teams/${this.selectedTeamId}/missions`, payload);
      this.missions = [data, ...this.missions];
      return data;
    },
    async submitMission(missionId, payload) {
      const { data } = await api.post(`/teams/${this.selectedTeamId}/missions/${missionId}/submit`, payload ?? {});
      this.missions = this.missions.map((mission) => (mission.id === missionId ? data : mission));
      return data;
    },
    async reviewMission(missionId, payload) {
      const currentTeamId = this.selectedTeamId;
      const { data } = await api.post(`/teams/${this.selectedTeamId}/missions/${missionId}/review`, payload);
      this.missions = this.missions.map((mission) => (mission.id === missionId ? data : mission));
      await this.fetchMyTeams();
      if (currentTeamId) {
        await this.fetchDashboard(currentTeamId);
      }
      return data;
    },
    async updateMemberPermissions(memberId, payload) {
      const currentTeamId = this.selectedTeamId;
      await api.patch(`/teams/${this.selectedTeamId}/members/${memberId}/permissions`, payload);
      await this.fetchMyTeams();
      if (currentTeamId) {
        await this.fetchDashboard(currentTeamId);
      }
    },
    connectChatStream(teamId) {
      if (typeof window === 'undefined' || !window.EventSource || !teamId) return;
      const auth = useAuthStore();
      if (!auth.token) return;
      this.disconnectChatStream();
      const url = new URL(`${apiBaseUrl}/teams/${teamId}/messages/stream`);
      url.searchParams.set('token', auth.token);
      const source = new EventSource(url.toString());
      source.addEventListener('init', (event) => {
        const payload = parseEventPayload(event.data);
        if (payload?.messages) {
          this.messages = payload.messages;
        }
      });
      source.addEventListener('message', (event) => {
        const payload = parseEventPayload(event.data);
        if (!payload) return;
        this.messages = upsertMessage(this.messages, payload);
      });
      source.addEventListener('heartbeat', () => {
        // mantém conexão viva
      });
      source.onerror = () => {
        source.close();
        this.chatStream = null;
        setTimeout(() => {
          if (this.selectedTeamId === teamId) {
            this.connectChatStream(teamId);
          }
        }, 5000);
      };
      this.chatStream = source;
    },
    disconnectChatStream() {
      if (this.chatStream) {
        this.chatStream.close?.();
        this.chatStream = null;
      }
    },
  },
});