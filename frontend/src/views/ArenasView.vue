<template>
  <div class="grid lg:grid-cols-2 gap-6">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Base</p>
          <h3 class="text-xl font-semibold">Arenas cadastradas</h3>
        </div>
        <button class="text-sm text-primary" @click="arenasStore.fetchArenas">Atualizar</button>
      </header>
      <ul class="space-y-4 max-h-[560px] overflow-y-auto pr-2">
        <li v-for="arena in arenasStore.items" :key="arena.id" class="bg-slate-900/70 rounded-xl p-4 border border-slate-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-lg">{{ arena.name }}</p>
              <p class="text-xs text-slate-500" v-if="arena.model">Modelo {{ arena.model }}</p>
            </div>
            <div class="space-x-3 text-xs">
              <button class="text-primary" @click="startEdit(arena)">Editar</button>
              <button class="text-red-400" @click="arenasStore.deleteArena(arena.id)">Excluir</button>
            </div>
          </div>
          <p class="text-sm text-slate-400 mt-2" v-if="arena.notes">{{ arena.notes }}</p>
          <div class="mt-2 space-x-2">
            <span v-for="tag in arena.tags" :key="tag" class="badge">{{ tag }}</span>
          </div>
        </li>
        <li v-if="arenasStore.items.length === 0" class="text-center text-slate-500 text-sm">
          Nenhuma arena cadastrada.
        </li>
      </ul>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h3 class="text-xl font-semibold mb-4">{{ editing ? 'Editar arena' : 'Nova arena' }}</h3>
      <form class="space-y-4" @submit.prevent="submit">
        <label class="text-sm">
          <span class="text-slate-400">Nome</span>
          <input v-model="form.name" required class="input mt-1" type="text" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Modelo</span>
          <input v-model="form.model" class="input mt-1" type="text" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Tags (vírgula)</span>
          <input v-model="form.tags" class="input mt-1" type="text" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Notas</span>
          <textarea v-model="form.notes" rows="4" class="input mt-1"></textarea>
        </label>
        <div class="flex gap-2">
          <button type="submit" class="bg-primary text-white px-4 py-2 rounded-lg font-semibold">
            {{ editing ? 'Salvar alterações' : 'Adicionar arena' }}
          </button>
          <button type="button" class="text-slate-400" @click="resetForm">Cancelar</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';

import { useArenasStore } from '../stores/arenas';

const arenasStore = useArenasStore();
const editing = ref(null);
const form = reactive({ name: '', model: '', tags: '', notes: '' });

onMounted(() => {
  arenasStore.fetchArenas();
});

async function submit() {
  const payload = {
    name: form.name,
    model: form.model || undefined,
    notes: form.notes || undefined,
    tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  };
  if (editing.value) {
    await arenasStore.updateArena(editing.value, payload);
  } else {
    await arenasStore.createArena(payload);
  }
  resetForm();
}

function startEdit(arena) {
  editing.value = arena.id;
  form.name = arena.name;
  form.model = arena.model ?? '';
  form.notes = arena.notes ?? '';
  form.tags = (arena.tags ?? []).join(', ');
}

function resetForm() {
  editing.value = null;
  form.name = '';
  form.model = '';
  form.tags = '';
  form.notes = '';
}
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.6);
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
}
.badge {
  display: inline-flex;
  margin-right: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  font-size: 0.75rem;
}
</style>
