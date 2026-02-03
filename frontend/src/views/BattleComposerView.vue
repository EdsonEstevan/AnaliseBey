<template>
  <div class="space-y-8" v-if="!loading">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Fluxo de batalha</p>
        <h1 class="text-3xl font-semibold">{{ pageTitle }}</h1>
        <p class="text-sm text-slate-400">Configure os combos, registre cada round e mantenha o histórico rico em detalhes.</p>
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

      <div v-if="!isEdit && !isView" class="flex flex-wrap gap-4 w-full text-sm mt-4">
        <label class="flex-1 min-w-[220px]">
          <span class="text-xs uppercase tracking-wide text-slate-500">Deck para Combo A</span>
          <select v-model="deckSelections.A" class="input mt-1">
            <option value="">Nenhum deck</option>
            <option v-for="deck in decksStore.items" :key="deck.id" :value="deck.id">
              {{ deck.name }}
            </option>
          </select>
        </label>
        <label class="flex-1 min-w-[220px]">
          <span class="text-xs uppercase tracking-wide text-slate-500">Deck para Combo B</span>
          <select v-model="deckSelections.B" class="input mt-1">
            <option value="">Nenhum deck</option>
            <option v-for="deck in decksStore.items" :key="deck.id" :value="deck.id">
              {{ deck.name }}
            </option>
          </select>
        </label>
        <RouterLink
          to="/decks"
          class="self-end px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white"
        >
          Gerenciar decks
        </RouterLink>
        <p class="text-xs text-slate-500 w-full">
          Não quer escolher um deck agora? Preencha de 3 a {{ MAX_MULTI_BATTLES }} batalhas simultâneas e nós geramos e
          vinculamos o deck automaticamente para cada lado.
        </p>
      </div>
      <div class="grid gap-4 w-full md:grid-cols-2 mt-4">
        <label class="text-sm">
          <span class="text-xs uppercase tracking-wide text-slate-500">Blader do Combo A</span>
          <select v-model="bladerSelections.A" class="input mt-1" :disabled="isView">
            <option value="">Selecione um blader</option>
            <option v-for="blader in bladersStore.items" :key="blader.id" :value="blader.id">
              {{ blader.nickname || blader.name }}
            </option>
          </select>
        </label>
        <label class="text-sm">
          <span class="text-xs uppercase tracking-wide text-slate-500">Blader do Combo B</span>
          <select v-model="bladerSelections.B" class="input mt-1" :disabled="isView">
            <option value="">Selecione um blader</option>
            <option v-for="blader in bladersStore.items" :key="`b-${blader.id}`" :value="blader.id">
              {{ blader.nickname || blader.name }}
            </option>
          </select>
        </label>
      </div>
      <p class="text-xs text-slate-500 mt-2">
        Precisa cadastrar alguém? <RouterLink to="/bladers" class="text-primary hover:underline">Gerenciar bladers</RouterLink>
      </p>
    </section>

    <div class="grid xl:grid-cols-[2fr,1fr] gap-6">
      <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <header>
          <p class="text-xs uppercase tracking-wide text-slate-500">Rounds</p>
          <h3 class="text-xl font-semibold">Sequência de rounds</h3>
          <p class="text-sm text-slate-500">Defina o vencedor e o tipo de vitória de cada round para gerar o placar automaticamente.</p>
        </header>
        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="(turn, index) in turns"
            :key="turn.id"
            class="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm text-slate-400">Round {{ index + 1 }}</p>
                <span class="text-xs text-slate-500">{{ winnerBadge(turn.winner) }}</span>
              </div>
              <button
                v-if="turns.length > 1 && !isView"
                type="button"
                class="text-xs text-rose-300 hover:text-rose-200"
                @click="removeTurn(index)"
              >
                Remover
              </button>
            </div>
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Vencedor do round
              <select v-model="turn.winner" class="input mt-1" :disabled="isView">
                <option value="">—</option>
                <option value="COMBO_A">Combo A</option>
                <option value="COMBO_B">Combo B</option>
                <option value="DRAW">Empate</option>
              </select>
            </label>
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Tipo de vitória do round
              <select v-model="turn.victoryType" class="input mt-1" :disabled="isView">
                <option value="">—</option>
                <option v-for="kind in victoryKinds" :key="kind" :value="kind">{{ kind }}</option>
              </select>
            </label>
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Observações do round
              <textarea v-model="turn.notes" class="input mt-1" rows="2" :disabled="isView"></textarea>
            </label>
          </article>
        </div>
        <button
          type="button"
          class="w-full border border-dashed border-slate-700 rounded-xl py-2 text-sm text-slate-300 hover:text-white"
          :disabled="isView || turns.length >= MAX_TURNS"
          @click="addTurn"
        >
          + Adicionar round (máx. {{ MAX_TURNS }})
        </button>
        <div class="grid gap-4 lg:grid-cols-2">
          <label class="text-sm">
            <span class="text-slate-400">Tipo geral de vitória</span>
            <input
              v-model="form.victoryType"
              class="input mt-1"
              :disabled="isView"
              placeholder="ex.: Burst / Xtreme"
            />
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
              <li><span class="text-slate-500">Assist:</span> {{ selectedComboA?.assistBlade?.name || '—' }}</li>
              <li><span class="text-slate-500">Lock Chip:</span> {{ selectedComboB?.lockChip?.name || '—' }}</li>
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
              <span class="text-slate-400">Assist Blade (CX)</span>
              <select
                v-model="comboBuilders.A.assistBladeId"
                class="input mt-1"
                :disabled="isView || !assistEnabled('A')"
              >
                <option value="">Opcional</option>
                <option v-for="assist in assistOptions" :key="assist.id" :value="assist.id">
                  {{ assist.name }}
                </option>
              </select>
              <p class="text-xs" :class="assistEnabled('A') ? 'text-slate-500' : 'text-amber-400'">
                {{ assistEnabled('A') ? 'Disponível para blades CX.' : 'Selecione uma blade CX para habilitar.' }}
              </p>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Lock Chip (CX)</span>
              <select
                v-model="comboBuilders.A.lockChipId"
                class="input mt-1"
                :disabled="isView || !lockChipEnabled('A')"
              >
                <option value="">Selecione um Lock Chip CX</option>
                <option v-for="chip in lockChipOptions" :key="chip.id" :value="chip.id">
                  {{ chip.name }}
                </option>
              </select>
              <p class="text-xs" :class="lockChipEnabled('A') ? 'text-slate-500' : 'text-amber-400'">
                {{ lockChipEnabled('A') ? 'Obrigatório para blades CX.' : 'Selecione uma blade CX para habilitar.' }}
              </p>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Ratchet</span>
              <select
                v-model="comboBuilders.A.ratchetId"
                class="input mt-1"
                :disabled="isView || isIntegratedActive('A')"
              >
                <option value="" disabled>Selecione</option>
                <option v-for="part in ratchetOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Bit</span>
              <select
                v-model="comboBuilders.A.bitId"
                class="input mt-1"
                :disabled="isView || isIntegratedActive('A')"
              >
                <option value="" disabled>Selecione</option>
                <option v-for="part in bitOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <div class="border border-slate-800 rounded-xl p-3 space-y-2 bg-slate-950/30">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-400">Ratchet + Bit integrados (CX)</span>
                <button
                  v-if="isIntegratedActive('A') && !isView"
                  type="button"
                  class="text-xs text-primary"
                  @click="clearIntegrated('A')"
                >
                  Remover
                </button>
              </div>
              <select
                v-model="comboBuilders.A.integratedPartId"
                class="input"
                :disabled="isView || !integratedEnabled('A')"
              >
                <option value="">Usar peças separadas</option>
                <option v-for="unit in integratedOptions" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
              </select>
              <p class="text-xs" :class="integratedEnabled('A') ? 'text-slate-500' : 'text-amber-400'">
                {{ integratedEnabled('A') ? 'Sincroniza automaticamente Ratchet e Bit.' : 'Selecione uma blade CX para liberar.' }}
              </p>
            </div>
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
              <li><span class="text-slate-500">Assist:</span> {{ selectedComboB?.assistBlade?.name || '—' }}</li>
              <li><span class="text-slate-500">Lock Chip:</span> {{ selectedComboA?.lockChip?.name || '—' }}</li>
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
              <span class="text-slate-400">Assist Blade (CX)</span>
              <select
                v-model="comboBuilders.B.assistBladeId"
                class="input mt-1"
                :disabled="isView || !assistEnabled('B')"
              >
                <option value="">Opcional</option>
                <option v-for="assist in assistOptions" :key="assist.id" :value="assist.id">
                  {{ assist.name }}
                </option>
              </select>
              <p class="text-xs" :class="assistEnabled('B') ? 'text-slate-500' : 'text-amber-400'">
                {{ assistEnabled('B') ? 'Disponível para blades CX.' : 'Selecione uma blade CX para habilitar.' }}
              </p>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Lock Chip (CX)</span>
              <select
                v-model="comboBuilders.B.lockChipId"
                class="input mt-1"
                :disabled="isView || !lockChipEnabled('B')"
              >
                <option value="">Selecione um Lock Chip CX</option>
                <option v-for="chip in lockChipOptions" :key="chip.id" :value="chip.id">
                  {{ chip.name }}
                </option>
              </select>
              <p class="text-xs" :class="lockChipEnabled('B') ? 'text-slate-500' : 'text-amber-400'">
                {{ lockChipEnabled('B') ? 'Obrigatório para blades CX.' : 'Selecione uma blade CX para habilitar.' }}
              </p>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Ratchet</span>
              <select
                v-model="comboBuilders.B.ratchetId"
                class="input mt-1"
                :disabled="isView || isIntegratedActive('B')"
              >
                <option value="" disabled>Selecione</option>
                <option v-for="part in ratchetOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <label class="text-sm">
              <span class="text-slate-400">Bit</span>
              <select
                v-model="comboBuilders.B.bitId"
                class="input mt-1"
                :disabled="isView || isIntegratedActive('B')"
              >
                <option value="" disabled>Selecione</option>
                <option v-for="part in bitOptions" :key="part.id" :value="part.id">{{ part.name }}</option>
              </select>
            </label>
            <div class="border border-slate-800 rounded-xl p-3 space-y-2 bg-slate-950/30">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-slate-400">Ratchet + Bit integrados (CX)</span>
                <button
                  v-if="isIntegratedActive('B') && !isView"
                  type="button"
                  class="text-xs text-primary"
                  @click="clearIntegrated('B')"
                >
                  Remover
                </button>
              </div>
              <select
                v-model="comboBuilders.B.integratedPartId"
                class="input"
                :disabled="isView || !integratedEnabled('B')"
              >
                <option value="">Usar peças separadas</option>
                <option v-for="unit in integratedOptions" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
              </select>
              <p class="text-xs" :class="integratedEnabled('B') ? 'text-slate-500' : 'text-amber-400'">
                {{ integratedEnabled('B') ? 'Sincroniza automaticamente Ratchet e Bit.' : 'Selecione uma blade CX para liberar.' }}
              </p>
            </div>
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
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Formato (Mode Dashboard)</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                v-for="option in battleModeOptions"
                :key="option.value"
                type="button"
                class="px-3 py-2 rounded-xl border text-left transition min-w-[170px]"
                :class="form.mode === option.value ? 'border-primary/70 bg-primary/10 text-white' : 'border-slate-800 text-slate-400 hover:border-primary/40'"
                :disabled="isView"
                @click="form.mode = option.value"
              >
                <p class="text-sm font-semibold">{{ option.label }}</p>
                <p class="text-[11px] text-slate-400">{{ option.helper }}</p>
              </button>
            </div>
          </div>
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

    <section
      v-if="!isEdit && !isView"
      class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4"
    >
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-slate-500">Simultâneo</p>
          <h3 class="text-2xl font-semibold">Console 3on3</h3>
          <p class="text-sm text-slate-400">Gerencie até {{ MAX_MULTI_BATTLES }} batalhas em paralelo usando os decks selecionados.</p>
        </div>
        <span class="text-xs text-slate-500">{{ multiBattles.length }} / {{ MAX_MULTI_BATTLES }} batalhas</span>
      </header>

      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="(battle, index) in multiBattles"
          :key="battle.id"
          class="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">{{ battle.title }}</p>
              <p class="text-2xl font-mono">{{ multiBattleScore(battle) }}</p>
              <span :class="['text-xs uppercase font-semibold', resultColor(battle.winner)]">
                {{ resultLabel(battle.winner) }}
              </span>
              <p class="text-[11px] text-slate-500 mt-1">Formato: {{ modeLabel(battle.mode) }}</p>
            </div>
            <button
              v-if="multiBattles.length > 1"
              type="button"
              class="text-xs text-rose-300 hover:text-rose-200"
              @click="removeMultiBattle(index)"
            >
              Remover
            </button>
          </div>

          <div class="grid gap-3">
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Combo A
              <select v-model="battle.comboAId" class="input mt-1">
                <option value="">Selecione um combo</option>
                <option v-for="combo in combosStore.items" :key="combo.id" :value="combo.id">
                  {{ combo.name }}
                </option>
              </select>
            </label>
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Combo B
              <select v-model="battle.comboBId" class="input mt-1">
                <option value="">Selecione um combo</option>
                <option v-for="combo in combosStore.items" :key="`b-${combo.id}`" :value="combo.id">
                  {{ combo.name }}
                </option>
              </select>
            </label>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="text-xs uppercase tracking-wide text-slate-500">
                Vencedor
                <select v-model="battle.winner" class="input mt-1">
                  <option value="COMBO_A">Combo A</option>
                  <option value="COMBO_B">Combo B</option>
                  <option value="DRAW">Empate</option>
                </select>
              </label>
              <label class="text-xs uppercase tracking-wide text-slate-500">
                Tipo de vitória
                <select v-model="battle.victoryType" class="input mt-1">
                  <option value="">—</option>
                  <option v-for="kind in victoryKinds" :key="`multi-${kind}`" :value="kind">
                    {{ kind }}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <label class="text-xs uppercase tracking-wide text-slate-500">
            Formato
            <select v-model="battle.mode" class="input mt-1">
              <option v-for="option in battleModeOptions" :key="`multi-mode-${option.value}`" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Data
              <input type="date" v-model="battle.occurredAt" class="input mt-1" />
            </label>
            <label class="text-xs uppercase tracking-wide text-slate-500">
              Arena
              <select v-model="battle.arenaId" class="input mt-1">
                <option value="">Mesma da batalha principal</option>
                <option v-for="arena in arenasStore.items" :key="arena.id" :value="arena.id">
                  {{ arena.name }}
                </option>
              </select>
            </label>
          </div>

          <label class="text-xs uppercase tracking-wide text-slate-500">
            Notas
            <textarea v-model="battle.notes" class="input mt-1" rows="2"></textarea>
          </label>
        </article>
      </div>

      <div class="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          class="px-4 py-2 rounded-xl border border-dashed border-slate-700 text-sm text-slate-300"
          :disabled="multiBattles.length >= MAX_MULTI_BATTLES"
          @click="addMultiBattle"
        >
          + Adicionar batalha
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-sm font-semibold text-white"
          :disabled="multiSaving"
          @click="saveMultiBattles"
        >
          {{ multiSaving ? 'Salvando...' : 'Registrar batalhas simultâneas' }}
        </button>
      </div>
    </section>
  </div>

  <div v-else class="flex items-center justify-center py-20 text-slate-400">
    Carregando dados da batalha...
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useBattlesStore } from '../stores/battles';
import { useCombosStore } from '../stores/combos';
import { useArenasStore } from '../stores/arenas';
import { usePartsStore } from '../stores/parts';
import { useDecksStore } from '../stores/decks';
import { useBladersStore } from '../stores/bladers';

const battlesStore = useBattlesStore();
const combosStore = useCombosStore();
const arenasStore = useArenasStore();
const partsStore = usePartsStore();
const decksStore = useDecksStore();
const bladersStore = useBladersStore();

const route = useRoute();
const router = useRouter();

const MAX_TURNS = 10;
const MIN_MULTI_BATTLES = 3;
const MAX_MULTI_BATTLES = 7;
const DEFAULT_BATTLE_MODE = 'OFFICIAL_3ON3';

const battleModeOptions = [
  { value: 'OFFICIAL_3ON3', label: 'Oficial 3on3', helper: 'Deck fechado · 4 pontos' },
  { value: 'REGIONAL_CIRCUIT', label: 'Torneio Regional', helper: 'Circuito com decks mistos' },
  { value: 'LONG_TRAINING', label: 'Treino longo', helper: 'Séries estendidas de laboratório' },
  { value: 'CUSTOM', label: 'Custom', helper: 'Testes livres ou formatos alternativos' },
];

const battleModeLabels = battleModeOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const victoryWeights = {
  burstfinish: 2,
  spinfinish: 1,
  overfinish: 2,
  xtremefinish: 3,
  extremefinish: 3, // legacy support for registros antigos
};

function normalizeVictoryType(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

function pointsForVictory(value) {
  const key = normalizeVictoryType(value);
  if (!key) return 1;
  return victoryWeights[key] ?? 1;
}

const loading = ref(true);
const saving = ref(false);

const form = reactive({
  comboAId: '',
  comboBId: '',
  arenaId: '',
  mode: DEFAULT_BATTLE_MODE,
  occurredAt: new Date().toISOString().slice(0, 10),
  result: 'COMBO_A',
  score: '',
  victoryType: '',
  notes: '',
});

function createTurn(id = Date.now()) {
  return { id, winner: '', victoryType: '', notes: '' };
}

const turns = reactive([createTurn()]);

function createBuilderState() {
  return {
    mode: 'existing',
    bladeId: '',
    ratchetId: '',
    bitId: '',
    assistBladeId: '',
    lockChipId: '',
    integratedPartId: '',
    tags: '',
    notes: '',
  };
}

const comboBuilders = reactive({
  A: createBuilderState(),
  B: createBuilderState(),
});

const builderLoading = reactive({ A: false, B: false });

const cxSlots = ['A', 'B'];

function findPart(partId) {
  return partsStore.catalog.find((part) => part.id === partId);
}

function builderBlade(slot) {
  return findPart(comboBuilders[slot].bladeId);
}

function isCxPart(part) {
  if (!part) return false;
  const variantLabel = (part.variant ?? '').toString().toUpperCase();
  if (variantLabel.includes('CX')) {
    return true;
  }
  const tags = Array.isArray(part.tags) ? part.tags : [];
  return tags.some((tag) => typeof tag === 'string' && tag.toUpperCase().includes('CX'));
}

function assistEnabled(slot) {
  return isCxPart(builderBlade(slot));
}

function lockChipEnabled(slot) {
  return isCxPart(builderBlade(slot));
}

function integratedEnabled(slot) {
  return assistEnabled(slot);
}

function isIntegratedActive(slot) {
  return Boolean(comboBuilders[slot].integratedPartId);
}

function clearIntegrated(slot) {
  comboBuilders[slot].integratedPartId = '';
  comboBuilders[slot].ratchetId = '';
  comboBuilders[slot].bitId = '';
}

cxSlots.forEach((slot) => {
  watch(
    () => comboBuilders[slot].integratedPartId,
    (id) => {
      if (id) {
        comboBuilders[slot].ratchetId = id;
        comboBuilders[slot].bitId = id;
      }
    },
  );

  watch(
    () => [comboBuilders[slot].ratchetId, comboBuilders[slot].bitId],
    ([ratchetId, bitId]) => {
      if (
        comboBuilders[slot].integratedPartId &&
        (comboBuilders[slot].integratedPartId !== ratchetId || comboBuilders[slot].integratedPartId !== bitId)
      ) {
        comboBuilders[slot].integratedPartId = '';
      }
    },
  );

  watch(
    () => comboBuilders[slot].bladeId,
    () => {
      if (!assistEnabled(slot)) {
        comboBuilders[slot].assistBladeId = '';
      }
      if (!lockChipEnabled(slot)) {
        comboBuilders[slot].lockChipId = '';
      }
      if (!integratedEnabled(slot)) {
        comboBuilders[slot].integratedPartId = '';
      }
    },
  );
});

const victoryKinds = ['Burst Finish', 'Spin Finish', 'Over Finish', 'Xtreme Finish'];

const deckSelections = reactive({ A: '', B: '' });
const multiSaving = ref(false);
const bladerSelections = reactive({ A: '', B: '' });

function createMultiBattleCard(index = 1) {
  return {
    id: `${Date.now()}-${index}`,
    title: `Batalha ${index}`,
    comboAId: '',
    comboBId: '',
    winner: 'COMBO_A',
    victoryType: '',
    notes: '',
    arenaId: '',
    occurredAt: new Date().toISOString().slice(0, 10),
    mode: DEFAULT_BATTLE_MODE,
  };
}

const multiBattles = reactive([createMultiBattleCard(1)]);

function refreshMultiLabels() {
  multiBattles.forEach((battle, idx) => {
    battle.title = `Batalha ${idx + 1}`;
  });
}

function addMultiBattle() {
  if (multiBattles.length >= MAX_MULTI_BATTLES) return;
  multiBattles.push(createMultiBattleCard(multiBattles.length + 1));
  refreshMultiLabels();
}

function removeMultiBattle(index) {
  if (multiBattles.length === 1) return;
  multiBattles.splice(index, 1);
  refreshMultiLabels();
}

function applyDeckSelection(side, deckId) {
  if (!deckId) return;
  const deck = decksStore.items.find((entry) => entry.id === deckId);
  if (!deck) return;
  if (deck.blader?.id) {
    bladerSelections[side] = deck.blader.id;
  }
  const combosRegistered = deck.slots.length || 0;
  const baseTurns = Math.max(combosRegistered, MIN_MULTI_BATTLES);
  const configuredTurns = deck.maxTurns ?? baseTurns;
  const targetTurns = Math.min(MAX_MULTI_BATTLES, Math.max(configuredTurns, baseTurns));
  while (multiBattles.length < targetTurns) {
    addMultiBattle();
  }
  deck.slots.slice(0, targetTurns).forEach((slot, index) => {
    if (!slot || !multiBattles[index]) return;
    if (side === 'A') {
      multiBattles[index].comboAId = slot.comboId;
    } else {
      multiBattles[index].comboBId = slot.comboId;
    }
  });
}

watch(
  () => deckSelections.A,
  (value) => {
    applyDeckSelection('A', value);
  },
);

watch(
  () => deckSelections.B,
  (value) => {
    applyDeckSelection('B', value);
  },
);

function combosForSide(side, battles) {
  return battles.map((battle) => (side === 'A' ? battle.comboAId : battle.comboBId)).filter(Boolean);
}

function normalizeDeckKey(ids) {
  return ids.slice().sort().join('|');
}

function findDeckByCombos(side, comboIds) {
  const targetKey = normalizeDeckKey(comboIds);
  return decksStore.items.find((deck) => {
    if (deck.slots.length !== comboIds.length) return false;
    if (side && deck.side && deck.side !== side) return false;
    const deckKey = normalizeDeckKey(deck.slots.map((slot) => slot.comboId));
    return deckKey === targetKey;
  });
}

async function maybeCreateDeckFromBattles(side, battles) {
  if (deckSelections[side]) return null;
  if (battles.length < MIN_MULTI_BATTLES) return null;
  const combos = combosForSide(side, battles);
  if (combos.length < MIN_MULTI_BATTLES) return null;
  const uniqueCombos = new Set(combos);
  if (uniqueCombos.size !== combos.length) return null;
  const existing = findDeckByCombos(side, combos);
  if (existing) return existing;
  const sideLabel = side === 'A' ? 'Alpha' : 'Bravo';
  const dateLabel = new Date().toLocaleDateString('pt-BR');
  const deck = await decksStore.createDeck({
    name: `Deck ${sideLabel} • ${dateLabel}`,
    side,
    notes: 'Gerado automaticamente pelo console simultâneo',
    comboIds: combos,
    maxTurns: combos.length,
  });
  return deck;
}

function addTurn() {
  if (turns.length >= MAX_TURNS) return;
  turns.push(createTurn(Date.now() + turns.length));
}

function removeTurn(index) {
  if (turns.length === 1) return;
  turns.splice(index, 1);
}

const isEdit = computed(() => route.name === 'battle-edit');
const isView = computed(() => route.name === 'battle-view');

const selectedComboA = computed(() => combosStore.items.find((combo) => combo.id === form.comboAId));
const selectedComboB = computed(() => combosStore.items.find((combo) => combo.id === form.comboBId));
const selectedArena = computed(() => arenasStore.items.find((arena) => arena.id === form.arenaId));

const bladeOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'BLADE' && !part.archived));
const ratchetOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'RATCHET' && !part.archived));
const bitOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'BIT' && !part.archived));
const assistOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'ASSIST' && !part.archived));
const lockChipOptions = computed(() => partsStore.catalog.filter((part) => part.type === 'LOCK_CHIP' && !part.archived));
const integratedOptions = computed(() =>
  partsStore.catalog.filter((part) => part.type === 'RATCHET_BIT' && !part.archived),
);

const scoreData = computed(() => {
  const base = { a: 0, b: 0 };
  for (const turn of turns) {
    const weight = pointsForVictory(turn.victoryType);
    if (turn.winner === 'COMBO_A') base.a += weight;
    if (turn.winner === 'COMBO_B') base.b += weight;
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
      return `Round ${idx + 1}: ${winner}${detail}${note}`;
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

function modeLabel(code) {
  return battleModeLabels[code] ?? 'Custom';
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

function multiBattleScore(battle) {
  const weight = pointsForVictory(battle.victoryType);
  if (battle.winner === 'COMBO_A') return `${weight}-${0}`;
  if (battle.winner === 'COMBO_B') return `${0}-${weight}`;
  return '0-0';
}

function multiBattleSummary(battle) {
  const score = multiBattleScore(battle);
  if (score === '0-0') {
    return { score, result: 'DRAW' };
  }
  return { score, result: battle.winner };
}

function multiBattlePayload(battle) {
  const summary = multiBattleSummary(battle);
  const turn = battle.winner
    ? [
        {
          winner: battle.winner,
          victoryType: battle.victoryType || undefined,
          notes: battle.notes?.trim() || undefined,
        },
      ]
    : [];

  return {
    comboAId: battle.comboAId,
    comboBId: battle.comboBId,
    bladerAId: bladerSelections.A || undefined,
    bladerBId: bladerSelections.B || undefined,
    arenaId: battle.arenaId || form.arenaId || undefined,
    result: summary.result,
    mode: battle.mode || form.mode || DEFAULT_BATTLE_MODE,
    score: summary.score,
    victoryType: battle.victoryType || undefined,
    notes: battle.notes?.trim() || undefined,
    occurredAt: battle.occurredAt || form.occurredAt,
    turns: turn.length ? turn : undefined,
  };
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
  form.mode = battle.mode ?? DEFAULT_BATTLE_MODE;
  form.occurredAt = battle.occurredAt ? battle.occurredAt.slice(0, 10) : form.occurredAt;
  form.result = battle.result;
  form.score = battle.score ?? '';
  form.victoryType = battle.victoryType ?? '';
  form.notes = battle.notes ?? '';
  bladerSelections.A = battle.bladerA?.id ?? '';
  bladerSelections.B = battle.bladerB?.id ?? '';
  const remoteTurns = Array.isArray(battle.turns) && battle.turns.length
    ? battle.turns.map((turn, index) => ({
        id: Date.now() + index,
        winner: turn.winner ?? 'COMBO_A',
        victoryType: turn.victoryType ?? '',
        notes: turn.notes ?? '',
      }))
    : [createTurn()];
  turns.splice(0, turns.length, ...remoteTurns);
}

async function loadInitialData() {
  await Promise.all([
    combosStore.fetchMetadata(),
    combosStore.fetchCombos(),
    arenasStore.fetchArenas(),
    partsStore.fetchMetadata(),
    partsStore.fetchAllActiveParts(),
    decksStore.fetchDecks(),
    bladersStore.fetchBladers(),
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
  if (lockChipEnabled(slot) && !builder.lockChipId) {
    throw new Error('Combos CX precisam de um Lock Chip.');
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
      assistBladeId: comboBuilders[slot].assistBladeId || undefined,
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
    const normalizedTurns = turns
      .filter((turn) => turn.winner)
      .map((turn) => ({
        winner: turn.winner,
        victoryType: turn.victoryType?.trim() || undefined,
        notes: turn.notes?.trim() || undefined,
      }));
    const payload = {
      comboAId: form.comboAId,
      comboBId: form.comboBId,
      bladerAId: bladerSelections.A || undefined,
      bladerBId: bladerSelections.B || undefined,
      arenaId: form.arenaId || undefined,
      result: resultFromTurns.value,
      mode: form.mode,
      score: scoreFromTurns.value !== '0-0' ? scoreFromTurns.value : form.score || undefined,
      victoryType: victorySummary.value || undefined,
      notes: [form.notes?.trim(), turnsDigest.value].filter(Boolean).join(' | ') || undefined,
      occurredAt: form.occurredAt,
      turns: normalizedTurns,
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

async function saveMultiBattles() {
  try {
    const readyBattles = multiBattles.filter((battle) => battle.comboAId && battle.comboBId);
    if (!readyBattles.length) {
      throw new Error('Selecione combos para pelo menos uma batalha simultânea.');
    }
    multiSaving.value = true;
    const autoDecks = [];
    if (readyBattles.length >= MIN_MULTI_BATTLES) {
      const deckA = await maybeCreateDeckFromBattles('A', readyBattles);
      const deckB = await maybeCreateDeckFromBattles('B', readyBattles);
      if (deckA) autoDecks.push(deckA.name);
      if (deckB) autoDecks.push(deckB.name);
    }
    for (const battle of readyBattles) {
      const payload = multiBattlePayload(battle);
      await battlesStore.createBattle(payload);
    }
    await battlesStore.fetchBattles();
    const deckMessage = autoDecks.length ? ` Decks gerados: ${autoDecks.join(', ')}.` : '';
    window.alert(`${readyBattles.length} batalha(s) foram registradas.${deckMessage}`);
  } catch (err) {
    window.alert(err.message || 'Erro ao registrar batalhas simultâneas');
  } finally {
    multiSaving.value = false;
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
