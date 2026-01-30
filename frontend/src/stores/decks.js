import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const useDecksStore = defineStore('decks', {
  state: () => ({
    items: [],
    loading: false,
  }),
  actions: {
    async fetchDecks() {
      this.loading = true;
      try {
        const { data } = await api.get('/decks');
        this.items = data;
      } finally {
        this.loading = false;
      }
    },
    async createDeck(payload) {
      const { data } = await api.post('/decks', payload);
      this.items = [data, ...this.items];
      return data;
    },
    async updateDeck(id, payload) {
      const { data } = await api.put(`/decks/${id}`, payload);
      this.items = this.items.map((deck) => (deck.id === id ? data : deck));
      return data;
    },
    async deleteDeck(id) {
      await api.delete(`/decks/${id}`);
      this.items = this.items.filter((deck) => deck.id !== id);
    },
  },
});
