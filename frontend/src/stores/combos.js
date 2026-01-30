import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const useCombosStore = defineStore('combos', {
  state: () => ({
    items: [],
    loading: false,
    metadata: {
      archetypes: [],
      statuses: [],
    },
    filters: {
      search: '',
      status: 'ACTIVE',
      archetype: '',
    },
    battlesByCombo: {},
  }),
  actions: {
    async fetchMetadata() {
      const { data } = await api.get('/combos/metadata');
      this.metadata = data;
    },
    async fetchCombos() {
      this.loading = true;
      try {
        const { data } = await api.get('/combos', { params: this.filters });
        this.items = data;
      } finally {
        this.loading = false;
      }
    },
    async createCombo(payload) {
      const { data } = await api.post('/combos', payload);
      await this.fetchCombos();
      return data;
    },
    async updateCombo(id, payload) {
      await api.put(`/combos/${id}`, payload);
      await this.fetchCombos();
    },
    async changeStatus(id, status) {
      await api.patch(`/combos/${id}/status`, { status });
      await this.fetchCombos();
    },
    async duplicateCombo(id) {
      await api.post(`/combos/${id}/duplicate`);
      await this.fetchCombos();
    },
    async fetchComboBattles(id) {
      const { data } = await api.get(`/combos/${id}/battles`);
      this.battlesByCombo[id] = data;
    },
  },
});
