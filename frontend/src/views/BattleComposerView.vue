<template>
  <div class="space-y-8" v-if="!loading">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Fluxo de batalha</p>
        <h1 class="text-3xl font-semibold">{{ pageTitle }}</h1>
        <p class="text-sm text-slate-400">Configure os combos, registre cada turno e mantenha o histórico rico em detalhes.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <RouterLink to="/battles" class="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300">Voltar</RouterLink>
        <button
          v-if="!isView"
          class="px-5 py-2 rounded-xl bg-primary/90 hover:bg-primary text-sm font-semibold text-white"
          :disabled="saving"
          @click="saveBattle"
        >
          {{ isEdit ? 'Salvar alterações' : 'Registrar batalha' }}
        </button>
      </div>
    </header>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">Resumo</p>
          <h2 class="text-2xl font-semibold">
            {{ selectedComboA?.name || 'Combo A' }}
            <span class="text-slate-500 font-light">vs</span>
            {{ selectedComboB?.name || 'Combo B' }}
          </h2>
        </div>
        <div class="text-right">
          <p class="text-sm text-slate-400">Placar projetado</p>
          <p class="text-3xl font-mono">{{ scorePreview }}</p>
          <p :class="['text-xs uppercase', resultColor(resultFromTurns)]">{{ resultLabel(resultFromTurns) }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-6 text-sm text-slate-400">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{{ selectedComboA?.archetype || 'Tipagem A indefinida' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-rose-400"></span>
          <span>{{ selectedComboB?.archetype || 'Tipagem B indefinida' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>Arena: {{ selectedArena?.name || 'Não definida' }}</span>
        </div>
      </div>
    </section>

    <div class="grid xl:grid-cols-[2fr,1fr] gap-6">
      <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-500">Turnos</p>
          <h3 class="text-xl font-semibold">Sequência da batalha</h3>
          <p class="text-sm text-slate-500">Defina o vencedor e o tipo de vitória de cada turno para gerar o placar automaticamente.</p>
        </header>
        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="(turn, index) in turns"
            :key="turn.id"
            class="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm text-slate-400">Turno {{ index + 1 }}</p>
              <span class="text-xs text-slate-500">{{ winnerBadge(turn.winner) }}</span>
            </div>
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Vencedor
              <select v-model="turn.winner" class="input mt-1" :disabled="isView">
                <option value="">—</option>
                <option value="COMBO_A">Combo A</option>
                <option value="COMBO_B">Combo B</option>
                <option value="DRAW">Empate</option>
              </select>
            </label>
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Tipo de vitória
              <select v-model="turn.victoryType" class="input mt-1" :disabled="isView">
                <option value="">—</option>
                <option v-for="kind in victoryKinds" :key="kind" :value="kind">{{ kind }}</option>
              </select>
            </label>
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Observações
              <textarea v-model="turn.notes" class="input mt-1" rows="2" :disabled="isView"></textarea>
            </label>
          </article>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <label class="text-sm">
            <span class="text-slate-400">Tipo geral de vitória</span>
            <input v-model="form.victoryType" class="input mt-1" :disabled="isView" placeholder="ex.: Burst / Knockout" />
          </label>
          <label class="text-sm">
            <span class="text-slate-400">Placar manual</span>
            <input v-model="form.score" class="input mt-1" :disabled="isView" placeholder="custom ex.: 5-3" />
          </label>
        </div>
        <label class="text-sm">
          <span class="text-slate-400">Notas gerais</span>
          <textarea v-model="form.notes" class="input mt-1" rows="3" :disabled="isView"></textarea>
        </label>
      </section>

      <aside class="space-y-4">
        <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-emerald-300/70">Combo A</p>
              <h4 class="text-lg font-semibold">{{ selectedComboA?.name || 'Selecione ou monte o Combo A' }}</h4>
            </div>
            <span class="text-xs text-slate-500">{{ selectedComboA?.status || '—' }}</span>
          </div>
          <div class="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
            <button
              type="button"
              class="px-3 py-1 rounded-lg border transition"
              :class="comboBuilders.A.mode === 'existing'
                ? 'border-primary/50 text-primary bg-primary/10'
                : 'border-slate-800 text-slate-400'
              "
              :disabled="isView"
              @click="setBuilderMode('A', 'existing')"
            >
              Usar combo salvo
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-lg border transition"
              :class="comboBuilders.A.mode === 'builder'
                ? 'border-emerald-400/60 text-emerald-300 bg-emerald-400/10'
                : 'border-slate-800 text-slate-400'
              "
              :disabled="isView"
              @click="setBuilderMode('A', 'builder')"
            >
              Montar agora
            </button>
          </div>
          <div v-if="comboBuilders.A.mode === 'existing'" class="space-y-3">
            <select v-model="form.comboAId" class="input" :disabled="isView">
              <option value="" disabled>Escolha um combo</option>
              <option v-for="combo in combosStore.items" :key="combo.id" :value="combo.id">
                {{ combo.name }}
              </option>
            </select>
            <ul class="text-sm text-slate-300 space-y-1">
              <li><span class="text-slate-500">Blade:</span> {{ selectedComboA?.blade?.name || '—' }}</li>
              <li><span class="text-slate-500">Ratchet:</span> {{ selectedComboA?.ratchet?.name || '—' }}</li>
              <li><span class="text-slate-500">Bit:</span> {{ selectedComboA?.bit?.name || '—' }}</li>
              <li><span class="text-slate-500">Tags:</span> {{ selectedComboA?.tags?.join(', ') || '—' }}</li>
            </ul>
          </div>
          <div v-else class="space-y-3">
            <label class="text-sm">
              <span class="text-slate-400">Blade</span>
              <select v-model="comboBuilders.A.bladeId" class="input mt-1" :disabled="isView">
                <option value="" disabled>Selecione</option>
                <option v-for="part in bladeOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Ratchet</span>
              <select v-model="comboBuilders.A.ratchetId" class="input mt-1" :disabled="isView">
                <option value="" disabled>Selecione</option>
                <option v-for="part in ratchetOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Bit</span>
              <select v-model="comboBuilders.A.bitId" class="input mt-1" :disabled="isView">
                <option value="" disabled>Selecione</option>
                <option v-for="part in bitOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Tags (vírgula)</span>
              <input v-model="comboBuilders.A.tags" class="input mt-1" :disabled="isView" />
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Notas</span>
              <textarea v-model="comboBuilders.A.notes" class="input mt-1" rows="2" :disabled="isView"></textarea>
            </label>
            <p class="text-xs text-slate-500">
              Nome sugerido:
              <span class="font-mono text-slate-200">{{ builderPreviewName('A') || 'Selecione as peças' }}</span>
            </p>
            <p class="text-xs text-slate-500">
              Tipagem automática:
              <span class="text-slate-200 font-semibold">{{ builderPreviewArchetype('A') || '—' }}</span>
            </p>
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 px-4 py-2 rounded-xl bg-primary/90 hover:bg-primary text-white text-sm font-semibold"
                :disabled="isView || builderLoading.A"
                @click="createComboInline('A')"
              >
                {{ builderLoading.A ? 'Criando...' : 'Salvar combo e usar' }}
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400"
                :disabled="isView"
                @click="resetBuilder('A', 'builder')"
              >
                Limpar
              </button>
            </div>
          </div>
        </article>

        <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-rose-300/70">Combo B</p>
              <h4 class="text-lg font-semibold">{{ selectedComboB?.name || 'Selecione ou monte o Combo B' }}</h4>
            </div>
            <span class="text-xs text-slate-500">{{ selectedComboB?.status || '—' }}</span>
          </div>
          <div class="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
            <button
              type="button"
              class="px-3 py-1 rounded-lg border transition"
              :class="comboBuilders.B.mode === 'existing'
                ? 'border-primary/50 text-primary bg-primary/10'
                : 'border-slate-800 text-slate-400'
              "
              :disabled="isView"
              @click="setBuilderMode('B', 'existing')"
            >
              Usar combo salvo
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-lg border transition"
              :class="comboBuilders.B.mode === 'builder'
                ? 'border-rose-400/60 text-rose-300 bg-rose-400/10'
                : 'border-slate-800 text-slate-400'
              "
              :disabled="isView"
              @click="setBuilderMode('B', 'builder')"
            >
              Montar agora
            </button>
          </div>
          <div v-if="comboBuilders.B.mode === 'existing'" class="space-y-3">
            <select v-model="form.comboBId" class="input" :disabled="isView">
              <option value="" disabled>Escolha um combo</option>
              <option v-for="combo in combosStore.items" :key="combo.id" :value="combo.id">
                {{ combo.name }}
              </option>
            </select>
            <ul class="text-sm text-slate-300 space-y-1">
              <li><span class="text-slate-500">Blade:</span> {{ selectedComboB?.blade?.name || '—' }}</li>
              <li><span class="text-slate-500">Ratchet:</span> {{ selectedComboB?.ratchet?.name || '—' }}</li>
              <li><span class="text-slate-500">Bit:</span> {{ selectedComboB?.bit?.name || '—' }}</li>
              <li><span class="text-slate-500">Tags:</span> {{ selectedComboB?.tags?.join(', ') || '—' }}</li>
            </ul>
          </div>
          <div v-else class="space-y-3">
            <label class="text-sm">
              <span class="text-slate-400">Blade</span>
              <select v-model="comboBuilders.B.bladeId" class="input mt-1" :disabled="isView">
                <option value="" disabled>Selecione</option>
                <option v-for="part in bladeOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Ratchet</span>
              <select v-model="comboBuilders.B.ratchetId" class="input mt-1" :disabled="isView">
                <option value="" disabled>Selecione</option>
                <option v-for="part in ratchetOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Bit</span>
              <select v-model="comboBuilders.B.bitId" class="input mt-1" :disabled="isView">
                <option value="" disabled>Selecione</option>
                <option v-for="part in bitOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Tags (vírgula)</span>
              <input v-model="comboBuilders.B.tags" class="input mt-1" :disabled="isView" />
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Notas</span>
              <textarea v-model="comboBuilders.B.notes" class="input mt-1" rows="2" :disabled="isView"></textarea>
            </label>
            <p class="text-xs text-slate-500">
              Nome sugerido:
              <span class="font-mono text-slate-200">{{ builderPreviewName('B') || 'Selecione as peças' }}</span>
            </p>
            <p class="text-xs text-slate-500">
              Tipagem automática:
              <span class="text-slate-200 font-semibold">{{ builderPreviewArchetype('B') || '—' }}</span>
            </p>
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 px-4 py-2 rounded-xl bg-primary/90 hover:bg-primary text-white text-sm font-semibold"
                :disabled="isView || builderLoading.B"
                @click="createComboInline('B')"
              >
                {{ builderLoading.B ? 'Criando...' : 'Salvar combo e usar' }}
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400"
                :disabled="isView"
                @click="resetBuilder('B', 'builder')"
              >
                Limpar
              </button>
            </div>
          </div>
        </article>

        <article class="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <label class="text-sm">
            <span class="text-slate-400">Arena</span>
            <select v-model="form.arenaId" class="input mt-1" :disabled="isView">
              <option value="">—</option>
              <option v-for="arena in arenasStore.items" :key="arena.id" :value="arena.id">{{ arena.name }}</option>
            </select>
          </label>
          <label class="text-sm">
            <span class="text-slate-400">Data</span>
            <input type="date" v-model="form.occurredAt" class="input mt-1" :disabled="isView" />
          </label>
          <div class="flex gap-2" v-if="isEdit && !isView">
            <button class="flex-1 text-sm text-rose-300 border border-rose-500/40 rounded-xl py-2" @click="deleteCurrent">
              Excluir batalha
            </button>
          </div>
        </article>
      </aside>
    </div>
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    Carregando dados da batalha...
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useBattlesStore } from '../stores/battles';
import { useCombosStore } from '../stores/combos';
import { useArenasStore } from '../stores/arenas';
import { usePartsStore } from '../stores/parts';

const battlesStore = useBattlesStore();
const combosStore = useCombosStore();
const arenasStore = useArenasStore();
const partsStore = usePartsStore();

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const saving = ref(false);

const form = reactive({
  comboAId: '',
  comboBId: '',
  arenaId: '',
  occurredAt: new Date().toISOString().slice(0, 10),
  result: 'COMBO_A',
  score: '',
  victoryType: '',
  notes: '',
});

const turns = reactive([
  { id: 1, winner: '', victoryType: '', notes: '' },
  { id: 2, winner: '', victoryType: '', notes: '' },
  { id: 3, winner: '', victoryType: '', notes: '' },
]);

function createBuilderState() {
  return {
    mode: 'existing',
    bladeId: '',
    ratchetId: '',
    bitId: '',
    tags: '',
    notes: '',
  };
}

const comboBuilders = reactive({
  A: createBuilderState(),
  B: createBuilderState(),
});

const builderLoading = reactive({ A: false, B: false });

const victoryKinds = ['Burst', 'Knockout', 'Spin Finish', 'Equalização', 'Over Finish'];

const isEdit = computed(() => route.name === 'battle-edit');
const isView = computed(() => route.name === 'battle-view');

const selectedComboA = computed(() => combosStore.items.find((combo) => combo.id === form.comboAId));
const selectedComboB = computed(() => combosStore.items.find((combo) => combo.id === form.comboBId));
const selectedArena = computed(() => arenasStore.items.find((arena) => arena.id === form.arenaId));

const bladeOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'BLADE' && !part.archived));
const ratchetOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'RATCHET' && !part.archived));
const bitOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'BIT' && !part.archived));

const scoreData = computed(() => {
  const base = { a: 0, b: 0 };
  for (const turn of turns) {
    if (turn.winner === 'COMBO_A') base.a += 1;
    if (turn.winner === 'COMBO_B') base.b += 1;
  }
  return base;
});

const scoreFromTurns = computed(() => `${scoreData.value.a}-${scoreData.value.b}`);

const scorePreview = computed(() => {
  if (scoreFromTurns.value === '0-0' && form.score) return form.score;
  return scoreFromTurns.value;
});

const resultFromTurns = computed(() => {
  if (scoreData.value.a === 0 && scoreData.value.b === 0) return form.result;
  if (scoreData.value.a === scoreData.value.b) return 'DRAW';
  return scoreData.value.a > scoreData.value.b ? 'COMBO_A' : 'COMBO_B';
});

const victorySummary = computed(() => {
  const votes = turns
    .map((turn) => turn.victoryType?.trim())
    .filter(Boolean)
    .reduce((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? form.victoryType;
});

const turnsDigest = computed(() =>
  turns
    .filter((turn) => turn.winner)
    .map((turn, idx) => {
      const winner = winnerBadge(turn.winner, true);
      const detail = turn.victoryType ? ` - ${turn.victoryType}` : '';
      const note = turn.notes ? ` (${turn.notes})` : '';
      return `T${idx + 1}: ${winner}${detail}${note}`;
    })
    .join(' | ')
);

const pageTitle = computed(() => {
  if (isEdit.value) return 'Editar batalha';
  if (isView.value) return 'Detalhes da batalha';
  return 'Nova batalha';
});

function resultLabel(code) {
  if (code === 'COMBO_A') return 'Combo A vence';
  if (code === 'COMBO_B') return 'Combo B vence';
  if (code === 'DRAW') return 'Empate';
  return '—';
}

function resultColor(code) {
  if (code === 'COMBO_A') return 'text-emerald-400';
  if (code === 'COMBO_B') return 'text-rose-400';
  if (code === 'DRAW') return 'text-slate-300';
  return 'text-slate-500';
}

function winnerBadge(code, short = false) {
  if (code === 'COMBO_A') return short ? 'A' : 'Combo A';
  if (code === 'COMBO_B') return short ? 'B' : 'Combo B';
  if (code === 'DRAW') return 'Empate';
  return '—';
}

function assertCombos() {
  if (!form.comboAId || !form.comboBId) {
    throw new Error('Selecione os dois combos para continuar.');
  }
}

async function hydrateBattle(id) {
  const battle = await battlesStore.fetchBattle(id);
  form.comboAId = battle.comboAId;
  form.comboBId = battle.comboBId;
  form.arenaId = battle.arena?.id ?? '';
  form.occurredAt = battle.occurredAt ? battle.occurredAt.slice(0, 10) : form.occurredAt;
  form.result = battle.result;
  form.score = battle.score ?? '';
  form.victoryType = battle.victoryType ?? '';
  form.notes = battle.notes ?? '';
}

async function loadInitialData() {
  await Promise.all([
    combosStore.fetchMetadata(),
    combosStore.fetchCombos(),
    arenasStore.fetchArenas(),
    partsStore.fetchMetadata(),
    partsStore.fetchAllActiveParts(),
  ]);
  if (route.params.id) {
    await hydrateBattle(route.params.id);
  }
  loading.value = false;
}

function slotField(slot) {
  return slot === 'A' ? 'comboAId' : 'comboBId';
}

function setBuilderMode(slot, mode) {
  if (mode === 'builder') {
    form[slotField(slot)] = '';
    resetBuilder(slot, 'builder');
    return;
  }
  resetBuilder(slot, 'existing');
}

function resetBuilder(slot, mode = comboBuilders[slot].mode) {
  const template = createBuilderState();
  template.mode = mode;
  Object.assign(comboBuilders[slot], template);
}

function assertBuilder(slot) {
  const builder = comboBuilders[slot];
  if (!builder.bladeId || !builder.ratchetId || !builder.bitId) {
    throw new Error('Selecione Blade, Ratchet e Bit.');
  }
}

function builderTags(slot) {
  return comboBuilders[slot].tags
    ? comboBuilders[slot].tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    : [];
}

function normalize(text) {
  return text
    ? text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';
}

function extractRatchetCode(name) {
  const digits = name.replace(/\D/g, '');
  if (digits) return digits;
  return normalize(name).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function extractBitInitial(name) {
  const cleaned = normalize(name);
  const match = cleaned.match(/[A-Za-z\d]/);
  return match ? match[0].toUpperCase() : '';
}

function builderPreviewName(slot) {
  const builder = comboBuilders[slot];
  const blade = partsStore.catalog.find((part) => part.id === builder.bladeId);
  const ratchet = partsStore.catalog.find((part) => part.id === builder.ratchetId);
  const bit = partsStore.catalog.find((part) => part.id === builder.bitId);
  if (!blade || !ratchet || !bit) return '';
  const bladeLabel = blade.name?.trim();
  if (!bladeLabel) return '';
  const ratchetCode = extractRatchetCode(ratchet.name || '');
  const bitInitial = extractBitInitial(bit.name || '');
  if (!ratchetCode || !bitInitial) return '';
  return `${bladeLabel}${ratchetCode}${bitInitial}`;
}

function deriveArchetypeFromParts(blade, ratchet, bit) {
  if (!blade || !ratchet || !bit) return '';
  const tally = {};
  [blade, ratchet, bit].forEach((part) => {
    tally[part.archetype] = (tally[part.archetype] ?? 0) + 1;
  });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const topCount = sorted[0]?.[1] ?? 0;
  const candidates = sorted.filter(([, count]) => count === topCount).map(([key]) => key);
  if (candidates.length === 1) return candidates[0];
  if (candidates.includes(blade.archetype)) return blade.archetype;
  if (candidates.includes(ratchet.archetype)) return ratchet.archetype;
  return bit.archetype;
}

function builderPreviewArchetype(slot) {
  const builder = comboBuilders[slot];
  const blade = partsStore.catalog.find((part) => part.id === builder.bladeId);
  const ratchet = partsStore.catalog.find((part) => part.id === builder.ratchetId);
  const bit = partsStore.catalog.find((part) => part.id === builder.bitId);
  if (!blade || !ratchet || !bit) return '';
  return deriveArchetypeFromParts(blade, ratchet, bit);
}

async function createComboInline(slot) {
  try {
    assertBuilder(slot);
    builderLoading[slot] = true;
    const payload = {
      bladeId: comboBuilders[slot].bladeId,
      ratchetId: comboBuilders[slot].ratchetId,
      bitId: comboBuilders[slot].bitId,
      tags: builderTags(slot),
      notes: comboBuilders[slot].notes?.trim() || undefined,
    };
    const combo = await combosStore.createCombo(payload);
    form[slotField(slot)] = combo.id;
    resetBuilder(slot, 'existing');
  } catch (err) {
    window.alert(err.message || 'Erro ao criar combo.');
  } finally {
    builderLoading[slot] = false;
  }
}

async function saveBattle() {
  try {
    assertCombos();
    saving.value = true;
    const payload = {
      comboAId: form.comboAId,
      comboBId: form.comboBId,
      arenaId: form.arenaId || undefined,
      result: resultFromTurns.value,
      score: scoreFromTurns.value !== '0-0' ? scoreFromTurns.value : form.score || undefined,
      victoryType: victorySummary.value || undefined,
      notes: [form.notes?.trim(), turnsDigest.value].filter(Boolean).join(' | ') || undefined,
      occurredAt: form.occurredAt,
    };
    if (isEdit.value && route.params.id) {
      await battlesStore.updateBattle(route.params.id, payload);
    } else {
      await battlesStore.createBattle(payload);
    }
    router.push('/battles');
  } catch (err) {
    window.alert(err.message || 'Erro ao salvar batalha');
  } finally {
    saving.value = false;
  }
}

async function deleteCurrent(event) {
  event.preventDefault();
  if (!route.params.id) return;
  const confirmed = window.confirm('Deseja excluir esta batalha?');
  if (!confirmed) return;
  await battlesStore.deleteBattle(route.params.id);
  router.push('/battles');
}

onMounted(loadInitialData);
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.7);
  border-radius: 0.9rem;
  padding: 0.5rem 0.75rem;
}
</style>
