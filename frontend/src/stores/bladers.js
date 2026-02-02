import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const useBladersStore = defineStore('bladers', {
  state: () => ({
    items: [],
    loading: false,
  }),
  actions: {
    async fetchBladers() {
      this.loading = true;
      try {
        const { data } = await api.get('/bladers');
        this.items = data;
      } finally {
        this.loading = false;
      }
    },
    async createBlader(payload) {
      const { data } = await api.post('/bladers', payload);
      this.items = [data, ...this.items];
      return data;
    },
    async updateBlader(id, payload) {
      const { data } = await api.put(`/bladers/${id}`, payload);
      this.items = this.items.map((blader) => (blader.id === id ? data : blader));
      return data;
    },
    async deleteBlader(id) {
      await api.delete(`/bladers/${id}`);
      this.items = this.items.filter((blader) => blader.id !== id);
    },
  },
});
