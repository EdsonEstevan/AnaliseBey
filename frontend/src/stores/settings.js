import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    backupStatus: null,
  }),
  actions: {
    async fetchBackupSnapshot() {
      const { data } = await api.get('/backup/json');
      this.backupStatus = data.counts;
      return data;
    },
    async importBackup(payload) {
      await api.post('/backup/json', payload, { params: { mode: 'append' } });
    },
  },
});
