import { defineStore } from 'pinia';

import api from '../services/apiClient';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    auditLogs: [],
    accessKeys: [],
    loading: false,
    error: '',
  }),
  actions: {
    async fetchUsers(params = {}) {
      this.loading = true;
      this.error = '';
      try {
        const { data } = await api.get('/admin/users', { params });
        this.users = data.users ?? [];
        return this.users;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async fetchAudit(params = {}) {
      const { data } = await api.get('/admin/audit', { params });
      this.auditLogs = data.logs ?? [];
      return this.auditLogs;
    },
    async fetchAccessKeys(scope = 'all') {
      const { data } = await api.get('/access-keys', { params: { scope } });
      this.accessKeys = data.keys ?? [];
      return this.accessKeys;
    },
    async createAccessKeys(payload) {
      const { data } = await api.post('/access-keys', payload);
      await this.fetchAccessKeys('all');
      return data.keys;
    },
    async revokeAccessKey(id) {
      const { data } = await api.post(`/access-keys/${id}/revoke`);
      await this.fetchAccessKeys('all');
      return data;
    },
    async grantPermission(payload) {
      const { data } = await api.post('/admin/permissions/grant', payload);
      await this.fetchUsers();
      return data.permission;
    },
    async revokePermission(payload) {
      const { data } = await api.post('/admin/permissions/revoke', payload);
      await this.fetchUsers();
      return data.permission;
    },
    async grantPartShare(payload) {
      const { data } = await api.post('/admin/parts/share', payload);
      await this.fetchUsers();
      return data.grant;
    },
    async revokePartShare(payload) {
      const { data } = await api.post('/admin/parts/share/revoke', payload);
      await this.fetchUsers();
      return data.grant;
    },
    async applyPunishment(payload) {
      const { data } = await api.post('/admin/punishments', payload);
      await this.fetchUsers();
      return data.punishment;
    },
    async liftPunishment(payload) {
      const { data } = await api.post('/admin/punishments/lift', payload);
      await this.fetchUsers();
      return data.punishment;
    },
    async resetPassword(userId) {
      const { data } = await api.post(`/admin/users/${userId}/reset-password`);
      return data;
    },
    async updateUserRole(userId, role, reason) {
      const { data } = await api.post(`/admin/users/${userId}/role`, { role, reason });
      await this.fetchUsers();
      return data.user;
    },
    async describeUser(userId) {
      const { data } = await api.get(`/admin/users/${userId}`);
      return data.user;
    },
    async refreshAll() {
      await Promise.all([this.fetchUsers(), this.fetchAudit({ limit: 50 }), this.fetchAccessKeys('all')]);
    },
  },
});
