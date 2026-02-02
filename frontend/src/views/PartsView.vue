<template>
  <div class="space-y-8">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <form class="grid md:grid-cols-4 gap-4" @submit.prevent="partsStore.fetchParts()">
        <label class="text-sm">
          <span class="text-slate-400">Busca</span>
          <input v-model="partsStore.filters.search" type="text" class="mt-1 input" placeholder="nome ou tag" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Tipo</span>
          <select v-model="partsStore.filters.type" class="mt-1 input">
            <option value="">Todos</option>
            <option v-for="type in partsStore.metadata.types" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Tipagem</span>
          <select v-model="partsStore.filters.archetype" class="mt-1 input">
            <option value="">Todas</option>
            <option v-for="arch in partsStore.metadata.archetypes" :key="arch" :value="arch">{{ arch }}</option>
          </select>
        </label>
        <label class="flex items-end space-x-2 text-sm">
          <input v-model="partsStore.filters.includeArchived" type="checkbox" />
          <span>Incluir arquivadas</span>
        </label>
        <button type="submit" class="col-span-full md:col-span-1 bg-primary text-white rounded-lg py-2 font-semibold">
          Filtrar
        </button>
      </form>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold">Peças cadastradas</h3>
        <button class="text-sm text-primary" @click="partsStore.fetchParts">Atualizar</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-slate-400 uppercase text-xs">
            <tr>
              <th class="py-2">Nome</th>
              <th>Tipo</th>
              <th>Tipagem</th>
              <th>Sub-tipagem</th>
              <th>Imagem</th>
              <th>Tags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="part in partsStore.items"
              :key="part.id"
              class="border-t border-slate-800/70 hover:bg-slate-900/40"
            >
              <td class="py-3">
                <p class="font-semibold">{{ part.name }}</p>
                <p class="text-xs text-slate-500" v-if="part.notes">{{ part.notes }}</p>
              </td>
              <td>{{ part.type }}</td>
              <td>{{ part.archetype }}</td>
              <td>{{ part.subArchetype || '—' }}</td>
              <td>
                <img
                  v-if="part.imageUrl"
                  :src="part.imageUrl"
                  :alt="part.name"
                  class="w-12 h-12 object-cover rounded-lg border border-slate-800"
                />
                <span v-else class="text-xs text-slate-500">—</span>
              </td>
              <td>
                <span v-for="tag in part.tags" :key="tag" class="badge">{{ tag }}</span>
              </td>
              <td class="text-right space-x-2">
                <button class="text-xs text-primary" @click="startEdit(part)">Editar</button>
                <button class="text-xs text-slate-400" @click="partsStore.toggleArchive(part.id, !part.archived)">
                  {{ part.archived ? 'Reativar' : 'Arquivar' }}
                </button>
              </td>
            </tr>
            <tr v-if="partsStore.items.length === 0">
              <td colspan="7" class="py-4 text-center text-slate-500">Sem peças ainda.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h3 class="text-xl font-semibold mb-4">{{ editing ? 'Editar' : 'Nova' }} peça</h3>
      <form class="grid md:grid-cols-2 gap-4" @submit.prevent="submit">
        <label class="text-sm">
          <span class="text-slate-400">Nome</span>
          <input v-model="form.name" required type="text" class="input mt-1" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Tipo</span>
          <select v-model="form.type" required class="input mt-1">
            <option v-for="type in partsStore.metadata.types" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Tipagem</span>
          <select v-model="form.archetype" required class="input mt-1">
            <option v-for="arch in partsStore.metadata.archetypes" :key="arch" :value="arch">{{ arch }}</option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Sub-tipagem</span>
          <input v-model="form.subArchetype" type="text" class="input mt-1" placeholder="ex.: Burst Slayer" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Peso (g)</span>
          <input v-model.number="form.weight" type="number" step="0.1" class="input mt-1" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Tags (vírgula)</span>
          <input v-model="form.tags" type="text" class="input mt-1" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Imagem (URL)</span>
          <div class="mt-1 flex gap-2">
            <input v-model="form.imageUrl" type="url" class="input" placeholder="https://..." />
            <button
              type="button"
              class="px-3 min-w-[120px] rounded-lg border border-slate-700 text-xs text-slate-200"
              :disabled="uploadingImage"
              @click="triggerFilePicker"
            >
              {{ uploadingImage ? 'Enviando...' : 'Upload' }}
            </button>
          </div>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept="image/*"
            @change="handleFileSelected"
          />
        </label>
        <label class="text-sm md:col-span-2">
          <span class="text-slate-400">Notas</span>
          <textarea v-model="form.notes" rows="3" class="input mt-1"></textarea>
        </label>
        <div class="md:col-span-2 flex gap-2">
          <button type="submit" class="bg-primary text-white px-4 py-2 rounded-lg font-semibold">
            {{ editing ? 'Salvar alterações' : 'Adicionar peça' }}
          </button>
          <button type="button" class="text-slate-400" @click="resetForm">Cancelar</button>
        </div>
      </form>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Montagem rápida</p>
          <h3 class="text-2xl font-semibold">Crie combos direto deste painel</h3>
          <p class="text-sm text-slate-400">
            Após cadastrar as peças, selecione Blade, Ratchet e Bit para salvar o combo sem sair da tela.
          </p>
        </div>
        <div class="text-xs text-slate-500 max-w-xs">
          Use esta ferramenta para registrar rapidamente os 3 Beys que vão compor decks 3on3 ou combos de teste.
        </div>
      </header>

      <div class="grid gap-4 lg:grid-cols-4">
        <label class="text-sm">
          <span class="text-slate-400">Blade</span>
          <select v-model="comboForm.bladeId" class="mt-1 input">
            <option value="">Selecione um Blade</option>
            <option v-for="blade in bladeOptions" :key="blade.id" :value="blade.id">
              {{ blade.name }}
            </option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Assist Blade (CX)</span>
          <select v-model="comboForm.assistBladeId" class="mt-1 input" :disabled="!assistEnabled">
            <option value="">Opcional</option>
            <option v-for="assist in assistOptions" :key="assist.id" :value="assist.id">
              {{ assist.name }}
            </option>
          </select>
          <p class="text-xs mt-1" :class="assistEnabled ? 'text-slate-500' : 'text-amber-400'">
            {{ assistEnabled ? 'Compatível com blades CX selecionadas.' : 'Selecione uma blade CX para liberar.' }}
          </p>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Ratchet</span>
          <select v-model="comboForm.ratchetId" class="mt-1 input" :disabled="isIntegratedActive">
            <option value="">Selecione um Ratchet</option>
            <option v-for="ratchet in ratchetOptions" :key="ratchet.id" :value="ratchet.id">
              {{ ratchet.name }}
            </option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Bit</span>
          <select v-model="comboForm.bitId" class="mt-1 input" :disabled="isIntegratedActive">
            <option value="">Selecione um Bit</option>
            <option v-for="bit in bitOptions" :key="bit.id" :value="bit.id">
              {{ bit.name }}
            </option>
          </select>
        </label>
      </div>

      <div class="border border-slate-800 rounded-2xl bg-slate-950/40 p-4 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-slate-400 text-sm">Ratchet + Bit integrados (CX)</p>
            <p class="text-xs text-slate-500">Escolha uma unidade integrada para preencher automaticamente Ratchet e Bit.</p>
          </div>
          <button v-if="isIntegratedActive" type="button" class="text-xs text-primary" @click="clearIntegratedUnit">
            Remover integrado
          </button>
        </div>
        <select v-model="comboForm.integratedPartId" class="input" :disabled="!integratedEnabled">
          <option value="">Usar peças separadas</option>
          <option v-for="unit in integratedOptions" :key="unit.id" :value="unit.id">
            {{ unit.name }}
          </option>
        </select>
        <p class="text-xs" :class="integratedEnabled ? 'text-slate-500' : 'text-amber-400'">
          {{ integratedEnabled ? 'Disponível apenas para blades CX.' : 'Selecione uma blade CX para liberar os integrados.' }}
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="text-sm">
          <span class="text-slate-400">Tags do combo (vírgula)</span>
          <input v-model="comboForm.tags" class="mt-1 input" placeholder="aggressive, bx" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Notas</span>
          <textarea v-model="comboForm.notes" rows="2" class="mt-1 input" placeholder="Detalhes táticos"></textarea>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <article class="border border-slate-800 rounded-2xl bg-slate-950/40 p-4 space-y-2">
          <p class="text-xs uppercase tracking-wide text-slate-500">Prévia automática</p>
          <p class="text-2xl font-semibold text-white">{{ comboPreviewName || 'Selecione as peças' }}</p>
          <p class="text-sm text-slate-400">
            Tipagem sugerida:
            <span class="text-slate-100 font-semibold">{{ comboPreviewArchetype || '—' }}</span>
          </p>
          <p class="text-xs text-slate-500">O nome combina Blade + código do Ratchet + inicial do Bit.</p>
        </article>
        <article class="border border-dashed border-slate-800 rounded-2xl p-4 text-sm text-slate-400">
          <p>
            Sempre que você cadastrar uma nova peça, ela já aparece aqui pronta para ser usada no combo. Assim fica
            fácil manter o fluxo de cadastro seguindo Blade → Ratchet → Bit → Combo.
          </p>
        </article>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="bg-primary text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-60"
          :disabled="comboBuilderLoading"
          @click="createComboFromParts"
        >
          {{ comboBuilderLoading ? 'Salvando combo...' : 'Salvar combo agora' }}
        </button>
        <button type="button" class="text-sm text-slate-400" @click="resetComboForm">Limpar campos</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue';

import { usePartsStore } from '../stores/parts';
import { useCombosStore } from '../stores/combos';
import { uploadImage } from '../services/uploadService';

const partsStore = usePartsStore();
const combosStore = useCombosStore();

const editing = ref(null);
const uploadingImage = ref(false);
const fileInput = ref(null);
const form = reactive({
  name: '',
  type: 'BLADE',
  archetype: 'ATTACK',
  subArchetype: '',
  weight: null,
  notes: '',
  tags: '',
  imageUrl: '',
});

const comboForm = reactive({
  bladeId: '',
  ratchetId: '',
  bitId: '',
  assistBladeId: '',
  integratedPartId: '',
  tags: '',
  notes: '',
});
const comboBuilderLoading = ref(false);

onMounted(async () => {
  await partsStore.fetchMetadata();
  await partsStore.fetchParts();
  await partsStore.fetchAllActiveParts();
  await combosStore.fetchCombos();
});

const bladeOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'BLADE' && !part.archived));
const ratchetOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'RATCHET' && !part.archived));
const bitOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'BIT' && !part.archived));
const assistOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'ASSIST' && !part.archived));
const integratedOptions = computed(() =>
  partsStore.catalog.filter((part) => part.type === 'RATCHET_BIT' && !part.archived),
);

function normalize(text) {
  return text
    ? text
        .normalize('NFD')
        .replace(/[^A-Za-z0-9]/g, '')
        .replace(/[\u0300-\u036f]/g, '')
    : '';
}

function extractRatchetCode(name) {
  const digits = name.replace(/\D/g, '');
  if (digits) return digits;
  return normalize(name || '').toUpperCase();
}

function extractBitInitial(name) {
  const cleaned = normalize(name || '');
  const match = cleaned.match(/[A-Za-z\d]/);
  return match ? match[0].toUpperCase() : '';
}

function findPart(partId) {
  return partsStore.catalog.find((part) => part.id === partId);
}

const selectedComboBlade = computed(() => findPart(comboForm.bladeId));

function isCxPart(part) {
  return Boolean(part?.variant?.toUpperCase().includes('CX'));
}

const assistEnabled = computed(() => isCxPart(selectedComboBlade.value));
const integratedEnabled = computed(() => isCxPart(selectedComboBlade.value));
const isIntegratedActive = computed(() => Boolean(comboForm.integratedPartId));

watch(
  () => comboForm.integratedPartId,
  (id) => {
    if (id) {
      comboForm.ratchetId = id;
      comboForm.bitId = id;
    }
  },
);

watch(
  () => [comboForm.ratchetId, comboForm.bitId],
  ([ratchetId, bitId]) => {
    if (
      comboForm.integratedPartId &&
      (ratchetId !== comboForm.integratedPartId || bitId !== comboForm.integratedPartId)
    ) {
      comboForm.integratedPartId = '';
    }
  },
);

watch(
  () => comboForm.bladeId,
  () => {
    if (!assistEnabled.value) {
      comboForm.assistBladeId = '';
    }
    if (!integratedEnabled.value && comboForm.integratedPartId) {
      comboForm.integratedPartId = '';
    }
  },
);

function deriveArchetypeFromParts(blade, ratchet, bit) {
  if (!blade || !ratchet || !bit) return '';
  const tally = {};
  [blade, ratchet, bit].forEach((piece) => {
    tally[piece.archetype] = (tally[piece.archetype] ?? 0) + 1;
  });
  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const highest = entries[0]?.[1] ?? 0;
  const candidates = entries.filter(([, count]) => count === highest).map(([arch]) => arch);
  if (candidates.length === 1) return candidates[0];
  if (candidates.includes(blade.archetype)) return blade.archetype;
  if (candidates.includes(ratchet.archetype)) return ratchet.archetype;
  return bit.archetype;
}

const comboPreviewName = computed(() => {
  const blade = findPart(comboForm.bladeId);
  const ratchet = findPart(comboForm.ratchetId);
  const bit = findPart(comboForm.bitId);
  if (!blade || !ratchet || !bit) return '';
  const bladeLabel = blade.name?.trim();
  if (!bladeLabel) return '';
  const ratchetCode = extractRatchetCode(ratchet.name || '');
  const bitInitial = extractBitInitial(bit.name || '');
  if (!ratchetCode || !bitInitial) return '';
  return `${bladeLabel}${ratchetCode}${bitInitial}`;
});

const comboPreviewArchetype = computed(() => {
  const blade = findPart(comboForm.bladeId);
  const ratchet = findPart(comboForm.ratchetId);
  const bit = findPart(comboForm.bitId);
  if (!blade || !ratchet || !bit) return '';
  return deriveArchetypeFromParts(blade, ratchet, bit);
});

function builderTagsFromInput() {
  return comboForm.tags
    ? comboForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];
}

function maybeAssignPartToBuilder(part) {
  if (!part) return;
  if (part.type === 'BLADE') comboForm.bladeId = part.id;
  if (part.type === 'RATCHET') comboForm.ratchetId = part.id;
  if (part.type === 'BIT') comboForm.bitId = part.id;
  if (part.type === 'ASSIST') comboForm.assistBladeId = part.id;
  if (part.type === 'RATCHET_BIT') {
    comboForm.integratedPartId = part.id;
    comboForm.ratchetId = part.id;
    comboForm.bitId = part.id;
  }
}

function resetComboForm() {
  comboForm.bladeId = '';
  comboForm.ratchetId = '';
  comboForm.bitId = '';
  comboForm.assistBladeId = '';
  comboForm.integratedPartId = '';
  comboForm.tags = '';
  comboForm.notes = '';
}

function clearIntegratedUnit() {
  comboForm.integratedPartId = '';
  comboForm.ratchetId = '';
  comboForm.bitId = '';
}

async function createComboFromParts() {
  try {
    if (!comboForm.bladeId || !comboForm.ratchetId || !comboForm.bitId) {
      throw new Error('Selecione Blade, Ratchet e Bit para montar o combo.');
    }
    comboBuilderLoading.value = true;
    const payload = {
      bladeId: comboForm.bladeId,
      ratchetId: comboForm.ratchetId,
      bitId: comboForm.bitId,
      assistBladeId: comboForm.assistBladeId || undefined,
      tags: builderTagsFromInput(),
      notes: comboForm.notes?.trim() || undefined,
    };
    const combo = await combosStore.createCombo(payload);
    const label = combo?.name || comboPreviewName.value || 'Combo criado';
    window.alert(`${label} salvo com sucesso!`);
    resetComboForm();
  } catch (err) {
    window.alert(err.message || 'Erro ao salvar combo.');
  } finally {
    comboBuilderLoading.value = false;
  }
}

async function submit() {
  const payload = {
    name: form.name,
    type: form.type,
    archetype: form.archetype,
    subArchetype: form.subArchetype?.trim() ? form.subArchetype.trim() : null,
    weight: form.weight ?? undefined,
    notes: form.notes || undefined,
    tags: form.tags ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    imageUrl: form.imageUrl?.trim() ? form.imageUrl.trim() : null,
  };

  if (editing.value) {
    await partsStore.updatePart(editing.value, payload);
  } else {
    const created = await partsStore.createPart(payload);
    maybeAssignPartToBuilder(created);
  }
  resetForm();
}

function startEdit(part) {
  editing.value = part.id;
  form.name = part.name;
  form.type = part.type;
  form.archetype = part.archetype;
  form.subArchetype = part.subArchetype ?? '';
  form.weight = part.weight;
  form.notes = part.notes ?? '';
  form.tags = (part.tags ?? []).join(', ');
  form.imageUrl = part.imageUrl ?? '';
}

function resetForm() {
  editing.value = null;
  form.name = '';
  form.type = partsStore.metadata.types[0] ?? 'BLADE';
  form.archetype = partsStore.metadata.archetypes[0] ?? 'ATTACK';
  form.subArchetype = '';
  form.weight = null;
  form.notes = '';
  form.tags = '';
  form.imageUrl = '';
}

function triggerFilePicker() {
  fileInput.value?.click();
}

async function handleFileSelected(event) {
  const [file] = event.target.files ?? [];
  if (!file) return;
  uploadingImage.value = true;
  try {
    const { url } = await uploadImage(file);
    form.imageUrl = url;
  } catch (err) {
    window.alert(err.message || 'Falha ao enviar imagem.');
  } finally {
    uploadingImage.value = false;
    event.target.value = '';
  }
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
  margin-bottom: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.14);
  font-size: 0.75rem;
}
</style>
