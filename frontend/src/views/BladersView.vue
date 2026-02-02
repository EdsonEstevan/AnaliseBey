<template>
  <div class="space-y-8">
    <section class="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-slate-500">Equipe</p>
          <h1 class="text-3xl font-semibold">Cadastro de bladers</h1>
          <p class="text-sm text-slate-400">
            Registre informações básicas do piloto — as estatísticas são calculadas automaticamente a partir das batalhas vinculadas.
          </p>
        </div>
        <button
          v-if="editingId"
          type="button"
          class="px-4 py-2 rounded-full border border-amber-400/40 text-xs text-amber-200"
          @click="resetForm"
        >
          Cancelar edição
        </button>
      </header>

      <form class="grid gap-6 md:grid-cols-2" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <label class="text-sm">
            <span class="text-slate-300">Nome completo</span>
            <input v-model="form.name" class="input" placeholder="ex.: Kai Tanaka" required />
          </label>
          <label class="text-sm">
            <span class="text-slate-300">Nickname</span>
            <input v-model="form.nickname" class="input" placeholder="ex.: Alpha Kai" />
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="text-sm">
              <span class="text-slate-300">Idade</span>
              <input v-model.number="form.age" type="number" min="5" max="99" class="input" placeholder="16" />
            </label>
            <label class="text-sm">
              <span class="text-slate-300">País / região</span>
              <input v-model="form.country" class="input" placeholder="Brasil" />
            </label>
          </div>
        </div>
        <div class="space-y-4">
          <label class="text-sm">
            <span class="text-slate-300">Equipe</span>
            <input v-model="form.team" class="input" placeholder="ex.: Nova Labs" />
          </label>
          <label class="text-sm">
            <span class="text-slate-300">Notas</span>
            <textarea v-model="form.notes" class="input" rows="4" placeholder="Observações, pontos fortes"></textarea>
          </label>
          <button
            type="submit"
            class="w-full py-3 rounded-xl font-semibold text-white bg-primary/90 hover:bg-primary transition"
            :disabled="bladersStore.loading"
          >
            {{ editingId ? 'Salvar alterações' : 'Cadastrar blader' }}
          </button>
        </div>
      </form>
    </section>

    <section class="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Banco ativo</p>
          <h2 class="text-2xl font-semibold">Bladers registrados</h2>
        </div>
        <button class="text-sm text-slate-400 hover:text-white" @click="bladersStore.fetchBladers()">Atualizar</button>
      </div>

      <div v-if="bladersStore.items.length" class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="blader in bladersStore.items"
          :key="blader.id"
          class="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">{{ blader.team || 'Independente' }}</p>
              <h3 class="text-lg font-semibold">{{ blader.name }}</h3>
              <p class="text-xs text-slate-500" v-if="blader.nickname">{{ blader.nickname }}</p>
            </div>
            <div class="flex gap-2 text-xs">
              <button class="text-primary" @click="editBlader(blader)">Editar</button>
              <button class="text-rose-400" @click="removeBlader(blader)">Excluir</button>
            </div>
          </div>
          <ul class="grid grid-cols-3 gap-2 text-center text-xs">
            <li class="rounded-xl border border-slate-800 py-2">
              <p class="text-[0.65rem] uppercase tracking-wide text-slate-500">Batalhas</p>
              <p class="text-base font-semibold">{{ blader.stats.total }}</p>
            </li>
            <li class="rounded-xl border border-slate-800 py-2">
              <p class="text-[0.65rem] uppercase tracking-wide text-slate-500">Winrate</p>
              <p class="text-base font-semibold text-emerald-300">{{ blader.stats.winrate }}%</p>
            </li>
            <li class="rounded-xl border border-slate-800 py-2">
              <p class="text-[0.65rem] uppercase tracking-wide text-slate-500">Decks</p>
              <p class="text-base font-semibold">{{ blader.deckCount }}</p>
            </li>
          </ul>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500 mb-1">Beys mais usados</p>
            <p class="text-sm text-slate-300" v-if="blader.combosUsed.length">
              {{ blader.combosUsed.map((combo) => `${combo.name} (${combo.count})`).join(' · ') }}
            </p>
            <p class="text-sm text-slate-500" v-else>Nenhum combo registrado ainda.</p>
          </div>
          <p class="text-xs text-slate-500" v-if="blader.notes">{{ blader.notes }}</p>
          <p class="text-[0.65rem] text-slate-600" v-if="blader.lastBattleAt">
            Última batalha: {{ new Date(blader.lastBattleAt).toLocaleDateString('pt-BR') }}
          </p>
        </article>
      </div>

      <p v-else class="text-sm text-slate-500 text-center py-10">Nenhum blader cadastrado ainda.</p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';

import { useBladersStore } from '../stores/bladers';

const bladersStore = useBladersStore();

const editingId = ref('');
const form = reactive({
  name: '',
  nickname: '',
  age: null,
  country: '',
  team: '',
  notes: '',
});

function resetForm() {
  editingId.value = '';
  form.name = '';
  form.nickname = '';
  form.age = null;
  form.country = '';
  form.team = '';
  form.notes = '';
}

function loadForm(blader) {
  editingId.value = blader.id;
  form.name = blader.name;
  form.nickname = blader.nickname ?? '';
  form.age = blader.age ?? null;
  form.country = blader.country ?? '';
  form.team = blader.team ?? '';
  form.notes = blader.notes ?? '';
}

async function handleSubmit() {
  if (!form.name.trim()) {
    window.alert('Informe o nome do blader.');
    return;
  }
  const payload = {
    name: form.name.trim(),
    nickname: form.nickname?.trim() || undefined,
    age: typeof form.age === 'number' && !Number.isNaN(form.age) ? form.age : undefined,
    country: form.country?.trim() || undefined,
    team: form.team?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
  };
  if (editingId.value) {
    await bladersStore.updateBlader(editingId.value, payload);
  } else {
    await bladersStore.createBlader(payload);
  }
  resetForm();
}

async function removeBlader(blader) {
  const confirmed = window.confirm(`Remover ${blader.name}?`);
  if (!confirmed) return;
  try {
    await bladersStore.deleteBlader(blader.id);
    if (editingId.value === blader.id) {
      resetForm();
    }
  } catch (err) {
    window.alert(err?.response?.data?.message || 'Não foi possível remover o blader.');
  }
}

function editBlader(blader) {
  loadForm(blader);
}

onMounted(() => {
  bladersStore.fetchBladers();
});
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.7);
  border-radius: 0.9rem;
  padding: 0.65rem 0.9rem;
  color: #e2e8f0;
}
</style>
