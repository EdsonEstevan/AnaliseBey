import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_URL;
const normalizedBaseUrl = envBaseUrl
  ? (() => {
      const trimmed = envBaseUrl.replace(/\/$/, '');
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    })()
  : '/api';

export const apiBaseUrl = normalizedBaseUrl;

const api = axios.create({
  baseURL: normalizedBaseUrl,
});

let authToken = '';

export function setApiAuthToken(token) {
  authToken = token ?? '';
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? 'Erro inesperado.';
    return Promise.reject(new Error(message));
  },
);

export default api;
