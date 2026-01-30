import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_URL;
const normalizedBaseUrl = envBaseUrl
  ? envBaseUrl.replace(/\/$/, '')
  : '/api';

const api = axios.create({
  baseURL: normalizedBaseUrl,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? 'Erro inesperado.';
    return Promise.reject(new Error(message));
  },
);

export default api;
