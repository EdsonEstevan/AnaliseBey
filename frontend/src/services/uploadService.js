import api, { apiBaseUrl } from './apiClient';

function resolveAssetUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const assetBase = apiBaseUrl.replace(/\/api$/, '') || '';
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${assetBase}${normalizedPath}`;
}

export async function uploadImage(file) {
  const data = new FormData();
  data.append('file', file);
  const response = await api.post('/uploads', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = response.data ?? {};
  return {
    ...payload,
    url: resolveAssetUrl(payload.url),
  };
}
