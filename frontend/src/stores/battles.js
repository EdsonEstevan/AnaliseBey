import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const useBattlesStore = defineStore('battles', {
  state: () => ({
    items: [],
    current: null,
    loading: false,
    filters: {
      limit: 50,
    },
  }),
  actions: {
    async fetchBattles(params = {}) {
      this.loading = true;
      try {
        const { data } = await api.get('/battles', { params: { ...this.filters, ...params } });
        this.items = data;
      } finally {
        this.loading = false;
      }
    },
    async createBattle(payload) {
      await api.post('/battles', payload);
      await this.fetchBattles();
    },
    async fetchBattle(id) {
      const { data } = await api.get(`/battles/${id}`);
      this.current = data;
      return data;
    },
    async updateBattle(id, payload) {
      await api.put(`/battles/${id}`, payload);
      await this.fetchBattles();
    },
    async deleteBattle(id) {
      await api.delete(`/battles/${id}`);
      this.items = this.items.filter((battle) => battle.id !== id);
    },
    async bulkCreate(battles) {
      await api.post('/battles/bulk', battles);
      await this.fetchBattles();
    },
  },
});
