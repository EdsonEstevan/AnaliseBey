import api from './apiClient';

export async function uploadImage(file) {
  const data = new FormData();
  data.append('file', file);
  const response = await api.post('/uploads', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
