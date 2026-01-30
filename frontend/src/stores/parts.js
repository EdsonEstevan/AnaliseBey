import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const usePartsStore = defineStore('parts', {
  state: () => ({
    items: [],
    catalog: [],
    loading: false,
    metadata: {
      types: [],
      archetypes: [],
    },
    filters: {
      search: '',
      type: '',
      archetype: '',
      includeArchived: false,
    },
  }),
  actions: {
    async fetchMetadata() {
      const { data } = await api.get('/parts/metadata');
      this.metadata = data;
    },
    async fetchParts() {
      this.loading = true;
      try {
        const { data } = await api.get('/parts', { params: this.filters });
        this.items = data;
      } finally {
        this.loading = false;
      }
    },
    async createPart(payload) {
      const { data } = await api.post('/parts', payload);
      await this.fetchParts();
      await this.fetchAllActiveParts();
      return data;
    },
    async updatePart(id, payload) {
      const { data } = await api.put(`/parts/${id}`, payload);
      await this.fetchParts();
      await this.fetchAllActiveParts();
      return data;
    },
    async toggleArchive(id, archived) {
      await api.patch(`/parts/${id}/archive`, { archived });
      await this.fetchParts();
      await this.fetchAllActiveParts();
    },
    async fetchAllActiveParts() {
      const { data } = await api.get('/parts', {
        params: { includeArchived: false },
      });
      this.catalog = data;
    },
  },
});
