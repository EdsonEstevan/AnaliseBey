import { defineStore } from 'pinia';

import api, { setApiAuthToken } from '../services/apiClient';

const TOKEN_KEY = 'lab-auth-token';

function loadPersistedToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TOKEN_KEY) ?? '';
}

function persistToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: loadPersistedToken(),
    user: null,
    ready: false,
    loading: false,
    error: '',
  }),
  getters: {
    isAuthenticated(state) {
      return Boolean(state.token && state.user);
    },
  },
  actions: {
    async bootstrap() {
      if (this.ready) return;
      if (this.token) {
        setApiAuthToken(this.token);
        try {
          await this.fetchProfile();
        } catch (error) {
          console.warn('Falha ao restaurar sessão:', error.message);
          this.logout();
        }
      } else {
        setApiAuthToken('');
      }
      this.ready = true;
    },
    async fetchProfile() {
      const { data } = await api.get('/auth/me');
      this.user = data.user;
    },
    setSession(result) {
      this.token = result.token;
      this.user = result.user;
      this.error = '';
      setApiAuthToken(this.token);
      persistToken(this.token);
    },
    clearError() {
      this.error = '';
    },
    async login(credentials) {
      this.loading = true;
      this.error = '';
      try {
        const { data } = await api.post('/auth/login', credentials);
        this.setSession(data);
        this.ready = true;
        return data.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async loginVisitor() {
      this.loading = true;
      this.error = '';
      try {
        const { data } = await api.post('/auth/visitor');
        this.setSession(data);
        this.ready = true;
        return data.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async register(payload) {
      this.loading = true;
      this.error = '';
      try {
        const { data } = await api.post('/auth/register', payload);
        this.setSession(data);
        this.ready = true;
        return data.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = '';
      this.user = null;
      setApiAuthToken('');
      persistToken('');
    },
  },
});
