import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    partsAnalytics: [],
    context: null,
    loading: false,
    error: null,
    lastParams: null,
  }),
  actions: {
    async fetchPartsAnalytics(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        this.lastParams = params;
        const { data } = await api.get('/analytics/parts', { params });
        this.partsAnalytics = data.parts ?? [];
        this.context = {
          generatedAt: data.generatedAt,
          filters: data.filters,
          summary: data.summary,
          archetypes: data.archetypeSummary ?? [],
        };
      } catch (err) {
        this.error = err.message ?? 'Erro inesperado ao carregar analytics.';
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
