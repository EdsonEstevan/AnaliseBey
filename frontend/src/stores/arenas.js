import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const useArenasStore = defineStore('arenas', {
  state: () => ({
    items: [],
    loading: false,
  }),
  actions: {
    async fetchArenas() {
      this.loading = true;
      try {
        const { data } = await api.get('/arenas');
        this.items = data;
      } finally {
        this.loading = false;
      }
    },
    async createArena(payload) {
      await api.post('/arenas', payload);
      await this.fetchArenas();
    },
    async updateArena(id, payload) {
      await api.put(`/arenas/${id}`, payload);
      await this.fetchArenas();
    },
    async deleteArena(id) {
      await api.delete(`/arenas/${id}`);
      await this.fetchArenas();
    },
  },
});
