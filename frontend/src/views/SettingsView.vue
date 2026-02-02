<template>
  <div class="space-y-8">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Backup</p>
          <h3 class="text-xl font-semibold">Exportar dados</h3>
        </div>
        <button class="text-sm text-primary" @click="refreshBackup">Atualizar contagem</button>
      </header>
      <p class="text-sm text-slate-400 mb-4">
        Gere um JSON completo ou exporte tabelas em CSV para análises externas. Ideal para compartilhar ou clonar o estado.
      </p>
      <div class="flex flex-wrap gap-3">
        <button class="btn" @click="downloadJson">Baixar JSON completo</button>
        <button class="btn" @click="() => downloadCsv('parts')">Exportar peças.csv</button>
        <button class="btn" @click="() => downloadCsv('battles')">Exportar batalhas.csv</button>
      </div>
      <ul class="text-xs text-slate-500 mt-4">
        <li>Peças: {{ status?.parts ?? 0 }}</li>
        <li>Arenas: {{ status?.arenas ?? 0 }}</li>
        <li>Combos: {{ status?.combos ?? 0 }}</li>
        <li>Batalhas: {{ status?.battles ?? 0 }}</li>
      </ul>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="mb-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">Importar backup</p>
        <h3 class="text-xl font-semibold">Colar JSON exportado</h3>
      </header>
      <textarea v-model="importText" rows="6" class="w-full input" placeholder="Cole aqui o JSON exportado"></textarea>
      <div class="flex gap-2 mt-3">
        <button class="btn" @click="handleImport">Importar</button>
        <button class="text-slate-400 text-sm" @click="importText = ''">Limpar</button>
      </div>
      <p class="text-xs text-slate-500 mt-2">A importação agora <strong>apenas mescla</strong> novos dados; nada é apagado.</p>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Fonte externa</p>
          <h3 class="text-xl font-semibold">Importar peças (opcional)</h3>
        </div>
        <span class="text-xs text-slate-500">Status: {{ providerLabel }}</span>
      </header>
      <p class="text-sm text-slate-400 mb-3">
        Conecte uma API externa futura através da variável EXTERNAL_PARTS_PROVIDER. Enquanto não houver configuração, o sistema apenas informa que não há fonte disponível.
      </p>
      <button class="btn" @click="importExternal">Importar da fonte externa</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

import api from '../services/apiClient';
import { useSettingsStore } from '../stores/settings';

const settingsStore = useSettingsStore();
const status = ref(null);
const provider = ref(null);
const importText = ref('');

onMounted(async () => {
  await refreshBackup();
  await fetchProviderStatus();
});

async function refreshBackup() {
  const snapshot = await settingsStore.fetchBackupSnapshot();
  status.value = snapshot.counts;
}

function downloadJson() {
  window.open('/api/backup/json', '_blank');
}

function downloadCsv(type) {
  window.open(`/api/backup/${type}.csv`, '_blank');
}

async function handleImport() {
  if (!importText.value) return;
  const payload = JSON.parse(importText.value);
  await settingsStore.importBackup(payload);
  importText.value = '';
  await refreshBackup();
}

async function fetchProviderStatus() {
  const { data } = await api.get('/providers/parts/source');
  provider.value = data;
}

async function importExternal() {
  await api.post('/providers/parts/import');
  await refreshBackup();
}

const providerLabel = computed(() => {
  if (!provider.value) return 'carregando';
  return provider.value.configured ? 'pronto' : 'não configurado';
});
</script>

<style scoped>
.btn {
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.5);
  color: #f97316;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
}
.input {
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.6);
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
}
</style>
