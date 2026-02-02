<template>
  <div class="space-y-8">
    <section class="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">3on3</p>
          <h1 class="text-3xl font-semibold">Decks rápidos</h1>
          <p class="text-sm text-slate-400">Agrupe até 3 combos para preencher batalhas simultâneas em um clique.</p>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="px-3 py-1 rounded-full border border-slate-700">{{ decksStore.items.length }} decks salvos</span>
          <button
            v-if="editingDeckId"
            class="px-3 py-1 rounded-full border border-amber-400/40 text-amber-200"
            @click="resetForm"
          >
            Cancelar edição
          </button>
        </div>
      </header>

      <form class="grid gap-6 lg:grid-cols-[2fr,1fr]" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <label class="text-sm">
            <span class="text-slate-300">Nome do deck</span>
            <input v-model="form.name" class="deck-input mt-1" placeholder="ex.: Linha Principal" required />
          </label>
          <label class="text-sm">
            <span class="text-slate-300">Notas</span>
            <textarea v-model="form.notes" class="deck-input mt-1" rows="2" placeholder="estratégias, prioridade" />
          </label>
          <div class="grid gap-4 sm:grid-cols-3">
            <div v-for="slot in 3" :key="slot" class="space-y-2">
              <p class="text-xs uppercase tracking-wider text-slate-500">Slot {{ slot }}</p>
              <select v-model="form.comboSlots[slot - 1]" class="deck-input">
                <option value="">Selecione um combo</option>
                <option v-for="combo in combosStore.items" :key="combo.id" :value="combo.id">
                  {{ combo.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <aside class="space-y-4 text-sm">
          <label class="text-sm">
            <span class="text-slate-300">Lado preferencial</span>
            <select v-model="form.side" class="deck-input mt-1">
              <option value="FLEX">Flexível</option>
              <option value="A">Combo A</option>
              <option value="B">Combo B</option>
            </select>
          </label>
          <label class="text-sm">
            <span class="text-slate-300">Blader responsável</span>
            <select v-model="form.bladerId" class="deck-input mt-1">
              <option value="">Sem vínculo</option>
              <option v-for="blader in bladersStore.items" :key="blader.id" :value="blader.id">
                {{ blader.nickname || blader.name }}
              </option>
            </select>
          </label>
          <p class="text-xs text-slate-500">
            Associe lados para pré-preencher automaticamente os slots A ou B durante o registro múltiplo de batalhas.
          </p>
          <button
            type="submit"
            class="w-full py-3 rounded-xl font-semibold text-white bg-primary/90 hover:bg-primary transition"
            :disabled="decksStore.loading"
          >
            {{ editingDeckId ? 'Salvar alterações' : 'Criar deck' }}
          </button>
        </aside>
      </form>
    </section>

    <section class="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Biblioteca</p>
          <h2 class="text-2xl font-semibold">Decks cadastrados</h2>
        </div>
        <button class="text-sm text-slate-400 hover:text-white" @click="decksStore.fetchDecks()">Atualizar lista</button>
      </div>

      <div v-if="decksStore.items.length" class="grid gap-4 md:grid-cols-2">
        <article
          v-for="deck in decksStore.items"
          :key="deck.id"
          class="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wider text-slate-500">{{ deck.side ?? 'FLEX' }}</p>
              <h3 class="text-lg font-semibold">{{ deck.name }}</h3>
              <p class="text-xs text-slate-500" v-if="deck.blader">
                Blader: {{ deck.blader.nickname || deck.blader.name }}
              </p>
            </div>
            <div class="flex gap-2 text-xs">
              <button class="text-primary" @click="editDeck(deck)">Editar</button>
              <button class="text-rose-400" @click="removeDeck(deck)">Excluir</button>
            </div>
          </div>
          <ul class="text-sm text-slate-300 space-y-1">
            <li v-for="slot in deck.slots" :key="`${deck.id}-${slot.position}`" class="flex items-center gap-2">
              <span class="text-xs text-slate-500 w-10">Slot {{ slot.position }}</span>
              <span>{{ slot.combo?.name ?? '—' }}</span>
            </li>
          </ul>
          <p class="text-xs text-slate-500" v-if="deck.notes">{{ deck.notes }}</p>
        </article>
      </div>

      <p v-else class="text-sm text-slate-500 text-center py-8">Nenhum deck salvo ainda.</p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';

import { useCombosStore } from '../stores/combos';
import { useDecksStore } from '../stores/decks';
import { useBladersStore } from '../stores/bladers';

const combosStore = useCombosStore();
const decksStore = useDecksStore();
const bladersStore = useBladersStore();

const editingDeckId = ref('');
const form = reactive({
  name: '',
  side: 'FLEX',
  notes: '',
  comboSlots: ['', '', ''],
  bladerId: '',
});

function resetForm() {
  editingDeckId.value = '';
  form.name = '';
  form.side = 'FLEX';
  form.notes = '';
  form.comboSlots.splice(0, form.comboSlots.length, '', '', '');
  form.bladerId = '';
}

function loadDeck(deck) {
  editingDeckId.value = deck.id;
  form.name = deck.name;
  form.side = deck.side ?? 'FLEX';
  form.notes = deck.notes ?? '';
  const slots = [0, 1, 2].map((index) => deck.slots[index]?.comboId ?? '');
  form.comboSlots.splice(0, form.comboSlots.length, ...slots);
  form.bladerId = deck.blader?.id ?? '';
}

async function handleSubmit() {
  const comboIds = form.comboSlots.filter(Boolean);
  if (!comboIds.length) {
    window.alert('Selecione pelo menos um combo para o deck.');
    return;
  }
  const payload = {
    name: form.name.trim(),
    side: form.side,
    notes: form.notes?.trim() || undefined,
    comboIds,
    bladerId: form.bladerId || undefined,
  };
  if (editingDeckId.value) {
    await decksStore.updateDeck(editingDeckId.value, payload);
  } else {
    await decksStore.createDeck(payload);
  }
  resetForm();
}

async function removeDeck(deck) {
  const confirmed = window.confirm(`Remover deck ${deck.name}?`);
  if (!confirmed) return;
  await decksStore.deleteDeck(deck.id);
  if (editingDeckId.value === deck.id) resetForm();
}

function editDeck(deck) {
  loadDeck(deck);
}

onMounted(async () => {
  await Promise.all([decksStore.fetchDecks(), combosStore.fetchCombos(), bladersStore.fetchBladers()]);
});
</script>

<style scoped>
.deck-input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.7);
  border-radius: 0.9rem;
  padding: 0.6rem 0.9rem;
  color: #e2e8f0;
}
</style>
