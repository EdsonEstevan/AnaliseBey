import api from './apiClient';

export async function bootstrapAssistantSession(payload) {
  const { data } = await api.post('/assistant/session', payload);
  return data;
}

export async function sendAssistantMessage(payload) {
  const { data } = await api.post('/assistant/message', payload);
  return data;
}

export async function pushAssistantContext(payload) {
  const { data } = await api.post('/assistant/context', payload);
  return data;
}

export async function fetchAssistantMissions(sessionId) {
  const { data } = await api.get('/assistant/missions', { params: { sessionId } });
  return data;
}

export async function updateAssistantMission(sessionId, missionId, updates) {
  const { data } = await api.patch(`/assistant/missions/${missionId}`, { sessionId, ...updates });
  return data;
}
