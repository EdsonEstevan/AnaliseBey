<template>
  <div class="space-y-8">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <form class="grid md:grid-cols-4 gap-4" @submit.prevent="combosStore.fetchCombos()">
        <label class="text-sm">
          <span class="text-slate-400">Busca</span>
          <input v-model="combosStore.filters.search" class="input mt-1" placeholder="nome" />
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Status</span>
          <select v-model="combosStore.filters.status" class="input mt-1">
            <option value="">Todos</option>
            <option v-for="status in combosStore.metadata.statuses" :key="status" :value="status">{{ status }}</option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Tipagem</span>
          <select v-model="combosStore.filters.archetype" class="input mt-1">
            <option value="">Todas</option>
            <option v-for="arch in combosStore.metadata.archetypes" :key="arch" :value="arch">{{ arch }}</option>
          </select>
        </label>
        <div class="flex items-end">
          <button type="submit" class="bg-primary text-white px-4 py-2 rounded-lg font-semibold">Filtrar</button>
        </div>
      </form>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold">Combos</h3>
        <RouterLink to="/analysis" class="text-sm text-primary">Comparar</RouterLink>
      </header>
      <div class="grid md:grid-cols-2 gap-4">
        <article
          v-for="combo in combosStore.items"
          :key="combo.id"
          class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2"
        >
          <div class="flex items-start gap-4">
            <img
              v-if="combo.imageUrl"
              :src="combo.imageUrl"
              :alt="combo.name"
              class="w-20 h-20 object-cover rounded-xl border border-slate-800"
            />
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold text-lg">{{ combo.name }}</p>
                  <p class="text-xs text-slate-400">{{ combo.archetype }} · {{ combo.status }}</p>
                  <p class="text-xs text-slate-500" v-if="combo.subArchetype">{{ combo.subArchetype }}</p>
                </div>
                <div class="space-x-2 text-xs">
                  <RouterLink :to="`/combos/${combo.id}`" class="text-primary">Detalhes</RouterLink>
                  <button class="text-slate-400" @click="combosStore.changeStatus(combo.id, combo.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE')">
                    {{ combo.status === 'ACTIVE' ? 'Arquivar' : 'Ativar' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <ul class="text-sm text-slate-300 space-y-1">
            <li><span class="text-slate-500">Blade:</span> {{ combo.blade.name }}</li>
            <li v-if="combo.assistBlade"><span class="text-slate-500">Assist Blade:</span> {{ combo.assistBlade.name }}</li>
            <li v-if="combo.lockChip"><span class="text-slate-500">Lock Chip:</span> {{ combo.lockChip.name }}</li>
            <li v-if="combo.ratchet?.type === 'RATCHET_BIT'">
              <span class="text-slate-500">Ratchet + Bit:</span>
              {{ combo.ratchet.name }}
              <span class="text-xs text-primary/80">(Integrado)</span>
            </li>
            <template v-else>
              <li><span class="text-slate-500">Ratchet:</span> {{ combo.ratchet.name }}</li>
              <li><span class="text-slate-500">Bit:</span> {{ combo.bit.name }}</li>
            </template>
          </ul>
          <div class="text-xs text-slate-500 flex items-center justify-between">
            <span>Tags: {{ combo.tags?.join(', ') || '—' }}</span>
            <button class="text-primary" @click="combosStore.duplicateCombo(combo.id)">Duplicar</button>
          </div>
        </article>
      </div>
      <p v-if="combosStore.items.length === 0" class="text-center text-slate-500 text-sm mt-6">Cadastre um combo abaixo.</p>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="mb-4">
        <p class="text-xs uppercase tracking-wide text-slate-400">Montador</p>
        <h3 class="text-xl font-semibold">Criar novo combo</h3>
      </header>
      <form class="grid md:grid-cols-2 gap-4" @submit.prevent="submit">
        <div class="md:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wide text-slate-400">Nome gerado automaticamente</span>
          <p class="text-lg font-mono text-primary">
            {{ generatedName || 'Selecione Blade, Ratchet e Bit' }}
          </p>
          <p class="text-xs text-slate-500">Formato: Blade + código do Ratchet + inicial do Bit</p>
        </div>
        <div class="text-sm bg-slate-950/40 border border-slate-800 rounded-xl p-4 md:col-span-2">
          <p class="text-slate-400 text-xs uppercase tracking-wide">Tipagem automática</p>
          <p class="text-slate-100 text-lg font-semibold">
            {{ autoArchetype || 'Defina Blade, Ratchet e Bit para gerar' }}
          </p>
          <p class="text-xs text-slate-500">Derivada das peças selecionadas. Sub-tipagem segue a referência das peças.</p>
        </div>
        <label class="text-sm">
          <span class="text-slate-400">Blade</span>
          <select v-model="form.bladeId" required class="input mt-1">
            <option value="" disabled>Selecione</option>
            <option v-for="part in blades" :key="part.id" :value="part.id">{{ part.name }}</option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Assist Blade (CX)</span>
          <select v-model="form.assistBladeId" class="input mt-1" :disabled="!assistEnabled">
            <option value="">Opcional</option>
            <option v-for="assist in assistBlades" :key="assist.id" :value="assist.id">
              {{ assist.name }}
            </option>
          </select>
          <p class="text-xs mt-1" :class="assistEnabled ? 'text-slate-500' : 'text-amber-400'">
            {{ assistEnabled ? 'Compatível apenas com blades CX.' : 'Selecione uma Blade CX para habilitar.' }}
          </p>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Lock Chip (CX)</span>
          <select
            v-model="form.lockChipId"
            class="input mt-1"
            :disabled="!lockChipEnabled"
            :required="lockChipEnabled"
          >
            <option value="">Selecione um Lock Chip CX</option>
            <option v-for="chip in lockChips" :key="chip.id" :value="chip.id">
              {{ chip.name }}
            </option>
          </select>
          <p class="text-xs mt-1" :class="lockChipEnabled ? 'text-slate-500' : 'text-amber-400'">
            {{ lockChipEnabled ? 'Obrigatório para blades CX.' : 'Selecione uma Blade CX para habilitar.' }}
          </p>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Ratchet</span>
          <select v-model="form.ratchetId" required class="input mt-1" :disabled="isIntegratedActive">
            <option value="" disabled>Selecione</option>
            <option v-for="part in ratchets" :key="part.id" :value="part.id">{{ part.name }}</option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-slate-400">Bit</span>
          <select v-model="form.bitId" required class="input mt-1" :disabled="isIntegratedActive">
            <option value="" disabled>Selecione</option>
            <option v-for="part in bits" :key="part.id" :value="part.id">{{ part.name }}</option>
          </select>
        </label>
        <div class="md:col-span-2 border border-slate-800 rounded-xl bg-slate-950/30 p-4 space-y-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-slate-400 text-sm">Ratchet + Bit integrados (CX)</p>
              <p class="text-xs text-slate-500">Ao selecionar uma unidade integrada, os campos de Ratchet e Bit são preenchidos automaticamente.</p>
            </div>
            <button
              v-if="isIntegratedActive"
              type="button"
              class="text-xs text-primary"
              @click="clearIntegrated"
            >
              Remover integrado
            </button>
          </div>
          <select
            v-model="form.integratedPartId"
            class="input"
            :disabled="!integratedEnabled"
          >
            <option value="">Usar componentes separados</option>
            <option v-for="unit in integratedRatchetBits" :key="unit.id" :value="unit.id">
              {{ unit.name }}
            </option>
          </select>
          <p class="text-xs" :class="integratedEnabled ? 'text-slate-500' : 'text-amber-400'">
            {{ integratedEnabled ? 'Disponível apenas para combos Custom X.' : 'Selecione uma Blade CX para liberar os integrados.' }}
          </p>
        </div>
        <label class="text-sm">
          <span class="text-slate-400">Tags (vírgula)</span>
          <input v-model="form.tags" class="input mt-1" />
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
          <button type="submit" class="bg-primary text-white px-4 py-2 rounded-lg font-semibold">Salvar combo</button>
          <button type="button" class="text-slate-400" @click="resetForm">Limpar</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useCombosStore } from '../stores/combos';
import { usePartsStore } from '../stores/parts';
import { uploadImage } from '../services/uploadService';

const combosStore = useCombosStore();
const partsStore = usePartsStore();

const uploadingImage = ref(false);
const fileInput = ref(null);

const form = reactive({
  bladeId: '',
  ratchetId: '',
  bitId: '',
  assistBladeId: '',
  lockChipId: '',
  integratedPartId: '',
  tags: '',
  notes: '',
  imageUrl: '',
});

onMounted(async () => {
  await Promise.all([
    combosStore.fetchMetadata(),
    combosStore.fetchCombos(),
    partsStore.fetchMetadata(),
    partsStore.fetchAllActiveParts(),
  ]);
});

const blades = computed(() => partsStore.catalog.filter((p) => p.type === 'BLADE' && !p.archived));
const ratchets = computed(() => partsStore.catalog.filter((p) => p.type === 'RATCHET' && !p.archived));
const bits = computed(() => partsStore.catalog.filter((p) => p.type === 'BIT' && !p.archived));
const assistBlades = computed(() => partsStore.catalog.filter((p) => p.type === 'ASSIST' && !p.archived));
const lockChips = computed(() => partsStore.catalog.filter((p) => p.type === 'LOCK_CHIP' && !p.archived));
const integratedRatchetBits = computed(() =>
  partsStore.catalog.filter((p) => p.type === 'RATCHET_BIT' && !p.archived),
);

const selectedBlade = computed(() => partsStore.catalog.find((p) => p.id === form.bladeId));
const selectedRatchet = computed(() => partsStore.catalog.find((p) => p.id === form.ratchetId));
const selectedBit = computed(() => partsStore.catalog.find((p) => p.id === form.bitId));
const selectedAssist = computed(() => partsStore.catalog.find((p) => p.id === form.assistBladeId));
const selectedLockChip = computed(() => partsStore.catalog.find((p) => p.id === form.lockChipId));

function isCxPart(part) {
  if (!part) return false;
  const variantLabel = (part.variant ?? '').toString().toUpperCase();
  if (variantLabel.includes('CX')) {
    return true;
  }
  const tags = Array.isArray(part.tags) ? part.tags : [];
  return tags.some((tag) => typeof tag === 'string' && tag.toUpperCase().includes('CX'));
}

const assistEnabled = computed(() => isCxPart(selectedBlade.value));
const integratedEnabled = computed(() => isCxPart(selectedBlade.value));
const lockChipEnabled = computed(() => isCxPart(selectedBlade.value));
const isIntegratedActive = computed(() => Boolean(form.integratedPartId));

watch(
  () => form.integratedPartId,
  (id) => {
    if (id) {
      form.ratchetId = id;
      form.bitId = id;
    }
  },
);

watch(
  () => [form.ratchetId, form.bitId],
  ([ratchetId, bitId]) => {
    if (form.integratedPartId && (ratchetId !== form.integratedPartId || bitId !== form.integratedPartId)) {
      form.integratedPartId = '';
    }
  },
);

watch(
  () => form.bladeId,
  () => {
    if (!assistEnabled.value) {
      form.assistBladeId = '';
    }
    if (!lockChipEnabled.value) {
      form.lockChipId = '';
    }
    if (!integratedEnabled.value && form.integratedPartId) {
      form.integratedPartId = '';
    }
  },
);

function deriveArchetypeFromParts(blade, ratchet, bit, assist, lockChip) {
  if (!blade || !ratchet || !bit) return '';
  const tally = {};
  [blade, ratchet, bit, assist, lockChip]
    .filter(Boolean)
    .forEach((part) => {
    tally[part.archetype] = (tally[part.archetype] ?? 0) + 1;
  });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const topCount = sorted[0]?.[1] ?? 0;
  const candidates = sorted.filter(([, count]) => count === topCount).map(([key]) => key);
  if (candidates.length === 1) return candidates[0];
  if (candidates.includes(blade.archetype)) return blade.archetype;
  if (lockChip && candidates.includes(lockChip.archetype)) return lockChip.archetype;
  if (assist && candidates.includes(assist.archetype)) return assist.archetype;
  if (candidates.includes(ratchet.archetype)) return ratchet.archetype;
  return bit.archetype;
}

const autoArchetype = computed(() => {
  if (!selectedBlade.value || !selectedRatchet.value || !selectedBit.value) return '';
  return deriveArchetypeFromParts(
    selectedBlade.value,
    selectedRatchet.value,
    selectedBit.value,
    selectedAssist.value,
    selectedLockChip.value,
  );
});

function clean(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function ratchetCode(name) {
  const digits = name.replace(/\D/g, '');
  if (digits) return digits;
  return clean(name)
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

function bitInitial(name) {
  const match = clean(name).match(/[A-Za-z\d]/);
  return match ? match[0].toUpperCase() : '';
}

const generatedName = computed(() => {
  if (!selectedBlade.value || !selectedRatchet.value || !selectedBit.value) return '';
  const bladeName = selectedBlade.value.name.trim();
  const ratchetPart = ratchetCode(selectedRatchet.value.name);
  const bitLetter = bitInitial(selectedBit.value.name);
  return `${bladeName}${ratchetPart}${bitLetter}`;
});

async function submit() {
  const payload = {
    bladeId: form.bladeId,
    ratchetId: form.ratchetId,
    bitId: form.bitId,
    assistBladeId: form.assistBladeId || undefined,
    lockChipId: form.lockChipId || undefined,
    tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    notes: form.notes || undefined,
    imageUrl: form.imageUrl?.trim() ? form.imageUrl.trim() : null,
  };
  await combosStore.createCombo(payload);
  resetForm();
}

function resetForm() {
  form.bladeId = '';
  form.ratchetId = '';
  form.bitId = '';
  form.assistBladeId = '';
  form.lockChipId = '';
  form.integratedPartId = '';
  form.tags = '';
  form.notes = '';
  form.imageUrl = '';
}

function clearIntegrated() {
  form.integratedPartId = '';
  form.ratchetId = '';
  form.bitId = '';
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
</style>
