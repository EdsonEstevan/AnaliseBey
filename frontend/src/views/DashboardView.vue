<template>
  <div class="space-y-8">
    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Seleção tática</p>
          <h2 class="text-2xl font-semibold">Abas focadas por bey</h2>
          <p class="text-sm text-slate-500">Escolha combos testados para comparar métricas específicas sem sair do dashboard.</p>
        </div>
      </header>
      <div class="flex flex-wrap gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          class="px-4 py-2 rounded-2xl text-sm font-semibold transition border"
          :class="activeTab === 'all' ? 'bg-primary/20 border-primary/60 text-white' : 'border-slate-700 text-slate-300 hover:border-primary/40'"
          @click="activeTab = 'all'"
        >
          Visão geral
        </button>
        <button
          v-for="tab in comboTabRenderList"
          :key="tab.id"
          type="button"
          class="px-4 py-2 rounded-2xl border transition min-w-[220px] text-left"
          :class="activeTab === tab.id ? 'bg-emerald-500/10 border-emerald-400/60 text-white' : 'border-slate-800 text-slate-300 hover:border-emerald-400/40'"
          @click="activeTab = tab.id"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <p class="text-sm font-semibold truncate">{{ tab.name }}</p>
              <p class="text-[11px] text-slate-400">{{ tab.total }} batalhas · {{ tab.winrate }}</p>
            </div>
            <span
              class="text-xs text-slate-500 hover:text-rose-400 cursor-pointer px-2"
              title="Remover aba"
              @click.stop="removeComboTab(tab.id)"
            >
              ×
            </span>
          </div>
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-2xl border border-dashed border-slate-700 text-slate-400 text-sm font-semibold hover:border-primary/60 hover:text-white transition"
          @click="toggleTabPicker"
        >
          + Nova aba
        </button>
      </div>
      <div v-if="tabPicker.open" class="pt-2 space-y-2">
        <template v-if="availableTabOptions.length">
          <div class="flex flex-wrap items-center gap-3">
            <select
              v-model="tabPicker.selection"
              class="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm min-w-[240px]"
            >
              <option value="" disabled>Selecione um combo com dados</option>
              <option v-for="option in availableTabOptions" :key="option.id" :value="option.id">
                {{ option.name }} · {{ option.total }} batalhas
              </option>
            </select>
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-primary/80 hover:bg-primary text-white text-sm font-semibold disabled:opacity-50"
              :disabled="!tabPicker.selection"
              @click="addComboTab"
            >
              Adicionar
            </button>
            <button type="button" class="text-xs text-slate-400 underline" @click="toggleTabPicker">
              Cancelar
            </button>
          </div>
        </template>
        <p v-else class="text-xs text-slate-500">
          Nenhum combo com batalhas registradas disponível para adicionar no momento.
        </p>
      </div>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Painel estratégico</p>
          <h2 class="text-2xl font-semibold">Filtros dinâmicos</h2>
          <p class="text-sm text-slate-500">Aplique filtros para focar em períodos, arquétipos ou resultados específicos.</p>
        </div>
        <RouterLink to="/analysis" class="text-sm text-primary hover:underline">Ir para análises completas</RouterLink>
      </header>
      <div class="grid md:grid-cols-3 gap-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Período</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="preset in rangePresets"
              :key="preset.value"
              type="button"
              class="px-3 py-2 rounded-xl text-xs font-semibold border transition"
              :class="filterState.range === preset.value
                ? 'border-primary/70 text-white bg-primary/20'
                : 'border-slate-800 text-slate-400'
              "
              @click="filterState.range = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Arquétipo</p>
          <select
            v-model="filterState.archetype"
            class="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm"
          >
            <option v-for="option in archetypeOptions" :key="option" :value="option">
              {{ option === 'ALL' ? 'Todos' : option }}
            </option>
          </select>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Resultado</p>
          <select
            v-model="filterState.result"
            class="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm"
          >
            <option value="ALL">Todos</option>
            <option value="COMBO_A">Vitória do Combo A</option>
            <option value="COMBO_B">Vitória do Combo B</option>
            <option value="DRAW">Empates</option>
          </select>
        </div>
      </div>
    </section>

    <template v-if="activeTab === 'all'">
      <section class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <article v-for="card in statsCards" :key="card.label" class="bg-slate-900/70 rounded-2xl p-4 border border-slate-800 shadow-lg">
          <p class="text-xs uppercase tracking-wide text-slate-400">{{ card.label }}</p>
          <p class="text-3xl font-semibold">{{ card.value }}</p>
          <p class="text-xs text-slate-500">{{ card.helper }}</p>
        </article>
      </section>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section class="xl:col-span-2 bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
          <header class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">Ranking rápido</p>
              <h3 class="text-xl font-semibold">Top combos por winrate (>=3 batalhas)</h3>
            </div>
            <span class="text-xs text-slate-500">Baseado no filtro atual</span>
          </header>
          <table class="w-full text-sm">
            <thead class="text-left text-slate-400 uppercase text-xs">
              <tr>
                <th class="py-2">Combo</th>
                <th class="py-2">Partidas</th>
                <th class="py-2">Vitórias</th>
                <th class="py-2">Winrate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="combo in topCombos" :key="combo.id" class="border-t border-slate-800/70">
                <td class="py-3">
                  <RouterLink :to="`/combos/${combo.id}`" class="text-primary hover:underline">
                    {{ combo.name }}
                  </RouterLink>
                </td>
                <td>{{ combo.total }}</td>
                <td>{{ combo.wins }}</td>
                <td>{{ combo.winrate }}%</td>
              </tr>
              <tr v-if="topCombos.length === 0">
                <td colspan="4" class="py-4 text-center text-slate-500">
                  Cadastre batalhas ou ajuste os filtros.
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
          <header class="mb-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Distribuição de vitórias</p>
            <h3 class="text-xl font-semibold">Tipos de decisão</h3>
          </header>
          <ul class="space-y-4">
            <li v-for="item in victoryDistribution" :key="item.label">
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span>{{ item.label }}</span>
                <span>{{ item.percent }}% · {{ item.count }}</span>
              </div>
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div class="h-full bg-primary transition-all" :style="{ width: `${item.percent}%` }"></div>
              </div>
            </li>
            <li v-if="victoryDistribution.length === 0" class="text-center text-slate-500 text-sm">
              Sem batalhas no filtro atual.
            </li>
          </ul>
        </section>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section class="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
          <header class="mb-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Eficiência por arquétipo</p>
            <h3 class="text-xl font-semibold">Winrate e empates</h3>
          </header>
          <table class="w-full text-sm">
            <thead class="text-left text-slate-400 uppercase text-xs">
              <tr>
                <th class="py-2">Arquétipo</th>
                <th class="py-2">Partidas</th>
                <th class="py-2">Winrate</th>
                <th class="py-2">Empates</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in archetypePerformance" :key="item.archetype" class="border-t border-slate-800/70">
                <td class="py-3">{{ item.archetype }}</td>
                <td>{{ item.total }}</td>
                <td>{{ item.winrate }}%</td>
                <td>{{ item.drawRate }}%</td>
              </tr>
              <tr v-if="archetypePerformance.length === 0">
                <td colspan="4" class="py-4 text-center text-slate-500">Nenhuma batalha para calcular.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
          <header class="mb-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Arenas mais utilizadas</p>
            <h3 class="text-xl font-semibold">Índice de decisões</h3>
          </header>
          <ul class="space-y-3">
            <li
              v-for="arena in arenaPerformance"
              :key="arena.id"
              class="p-4 rounded-xl border border-slate-800 bg-slate-900/70"
            >
              <div class="flex items-center justify-between text-sm">
                <div>
                  <p class="font-semibold">{{ arena.name }}</p>
                  <p class="text-xs text-slate-500">{{ arena.total }} batalhas</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-semibold">{{ arena.decisiveRate }}%</p>
                  <p class="text-xs text-slate-500">terminaram com vencedor</p>
                </div>
              </div>
              <div class="text-xs text-slate-500 mt-2">Empates: {{ arena.draws }}</div>
            </li>
            <li v-if="arenaPerformance.length === 0" class="text-center text-slate-500 text-sm">
              Cadastre batalhas com arena para popular esta lista.
            </li>
          </ul>
        </section>
      </div>

      <section class="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
        <header class="flex items-center justify-between mb-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Timeline</p>
            <h3 class="text-xl font-semibold">Últimas batalhas filtradas</h3>
          </div>
          <span class="text-xs text-slate-500">{{ latestBattles.length }} registros</span>
        </header>
        <ul class="space-y-4 max-h-[440px] overflow-y-auto pr-2">
          <li
            v-for="battle in latestBattles"
            :key="battle.id"
            class="bg-slate-900/70 p-4 rounded-xl border border-slate-800"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">
                {{ battle.comboA.name }}
                <span class="text-slate-500">vs</span>
                {{ battle.comboB.name }}
              </p>
              <span :class="['text-xs font-semibold', resultColor(battle.result)]">
                {{ labels[battle.result] ?? battle.result }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              {{ battle.occurredAt ? formatDate(battle.occurredAt) : 'Data não informada' }} ·
              {{ battle.arena?.name || 'Arena livre' }} · {{ battle.score || 'placar não informado' }}
            </p>
          </li>
          <li v-if="latestBattles.length === 0" class="text-center text-slate-500 text-sm">
            Ajuste filtros ou cadastre batalhas.
          </li>
        </ul>
      </section>
    </template>

    <template v-else>
      <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-6">
          <div class="space-y-3">
            <p class="text-xs uppercase tracking-wide text-slate-400">Dashboard focado</p>
            <h2 class="text-3xl font-semibold">{{ activeCombo?.name || 'Combo selecionado' }}</h2>
            <p class="text-sm text-slate-500">
              Arquétipo:
              <span class="text-slate-200 font-semibold">{{ activeCombo?.archetype || 'Indefinido' }}</span>
            </p>
            <div class="flex flex-wrap gap-2 text-xs text-slate-400">
              <span
                v-for="tag in activeCombo?.tags || []"
                :key="tag"
                class="px-2 py-1 rounded-lg border border-slate-800"
              >
                {{ tag }}
              </span>
              <span v-if="!(activeCombo?.tags?.length)" class="text-slate-500">Sem tags cadastradas</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-center min-w-[220px]">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">Partidas</p>
              <p class="text-2xl font-semibold">{{ comboFocusStats?.total || 0 }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">Winrate</p>
              <p class="text-2xl font-semibold text-emerald-400">
                {{ comboFocusStats ? `${comboFocusStats.winrate}%` : '0%' }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">Vitórias</p>
              <p class="text-2xl font-semibold text-emerald-300">{{ comboFocusStats?.wins || 0 }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">Derrotas</p>
              <p class="text-2xl font-semibold text-rose-400">{{ comboFocusStats?.losses || 0 }}</p>
            </div>
          </div>
        </header>
        <ul class="flex flex-wrap gap-6 text-sm text-slate-300">
          <li><span class="text-slate-500">Blade:</span> {{ activeCombo?.blade?.name || '—' }}</li>
          <li><span class="text-slate-500">Ratchet:</span> {{ activeCombo?.ratchet?.name || '—' }}</li>
          <li><span class="text-slate-500">Bit:</span> {{ activeCombo?.bit?.name || '—' }}</li>
        </ul>
        <p v-if="!comboFocusBattles.length" class="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-2">
          Nenhuma batalha do combo atual corresponde aos filtros selecionados. Ajuste o período ou resultado para liberar os gráficos.
        </p>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <article v-for="card in comboSummaryCards" :key="card.label" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <p class="text-xs uppercase tracking-wide text-slate-400">{{ card.label }}</p>
          <p class="text-3xl font-semibold">{{ card.value }}</p>
          <p class="text-xs text-slate-500">{{ card.helper }}</p>
        </article>
        <article v-if="!comboSummaryCards.length" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <p class="text-xs uppercase tracking-wide text-slate-400">Painel</p>
          <p class="text-sm text-slate-500">Nenhum dado disponível para o combo e filtro atuais.</p>
        </article>
      </section>

      <div class="grid gap-6 xl:grid-cols-2">
        <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <header class="mb-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Desempenho das peças</p>
            <h3 class="text-xl font-semibold">Impacto individual</h3>
          </header>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-slate-400 uppercase text-xs">
                <tr>
                  <th class="py-2">Peça</th>
                  <th>Tipo</th>
                  <th>Arquétipo</th>
                  <th>Combos</th>
                  <th>Partidas</th>
                  <th>Winrate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="piece in comboPartPerformance" :key="piece.id" class="border-t border-slate-800/60">
                  <td class="py-3">
                    <p class="font-semibold">{{ piece.name }}</p>
                    <p class="text-xs text-slate-500">{{ piece.role }}</p>
                  </td>
                  <td>{{ piece.type }}</td>
                  <td>{{ piece.archetype }}</td>
                  <td>{{ piece.combos }}</td>
                  <td>{{ piece.total }}</td>
                  <td>{{ piece.winrate }}%</td>
                </tr>
                <tr v-if="!comboPartPerformance.length">
                  <td colspan="6" class="py-4 text-center text-slate-500">
                    Selecione um combo válido para calcular o desempenho das peças.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <header class="mb-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Sinergia de peças</p>
            <h3 class="text-xl font-semibold">Combinações que entregam</h3>
          </header>
          <ul class="space-y-3">
            <li
              v-for="pair in comboSynergyOverview"
              :key="pair.label"
              class="p-4 rounded-xl border border-slate-800 bg-slate-950/40"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold">{{ pair.name }}</p>
                  <p class="text-xs text-slate-500">{{ pair.combos }} combos · {{ pair.total }} partidas</p>
                </div>
                <span class="text-lg font-semibold text-emerald-300">{{ pair.winrate }}%</span>
              </div>
            </li>
            <li v-if="!comboSynergyOverview.length" class="text-center text-slate-500 text-sm">
              Sem dados suficientes para calcular sinergia no filtro atual.
            </li>
          </ul>
        </section>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <header class="mb-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Adversários frequentes</p>
            <h3 class="text-xl font-semibold">Histórico recente</h3>
          </header>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-slate-400 uppercase text-xs">
                <tr>
                  <th class="py-2">Combo</th>
                  <th>Partidas</th>
                  <th>Vitórias</th>
                  <th>Derrotas</th>
                  <th>Empates</th>
                  <th>Winrate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="opponent in comboOpponentsFocus" :key="opponent.id" class="border-t border-slate-800/60">
                  <td class="py-3">{{ opponent.name }}</td>
                  <td>{{ opponent.total }}</td>
                  <td>{{ opponent.wins }}</td>
                  <td>{{ opponent.losses }}</td>
                  <td>{{ opponent.draws }}</td>
                  <td>{{ opponent.winrate }}%</td>
                </tr>
                <tr v-if="!comboOpponentsFocus.length">
                  <td colspan="6" class="py-4 text-center text-slate-500">Ainda não há adversários suficientes.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <header class="mb-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Arenas do combo</p>
            <h3 class="text-xl font-semibold">Onde performa melhor</h3>
          </header>
          <ul class="space-y-3">
            <li
              v-for="arena in comboArenaFocus"
              :key="arena.id"
              class="p-4 rounded-xl border border-slate-800 bg-slate-900/70"
            >
              <div class="flex items-center justify-between text-sm">
                <div>
                  <p class="font-semibold">{{ arena.name }}</p>
                  <p class="text-xs text-slate-500">{{ arena.total }} partidas</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-semibold">{{ arena.winrate }}%</p>
                  <p class="text-xs text-slate-500">vitórias registradas</p>
                </div>
              </div>
            </li>
            <li v-if="!comboArenaFocus.length" class="text-center text-slate-500 text-sm">Sem arenas registradas para este filtro.</li>
          </ul>
        </section>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <header class="mb-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Resultados do combo</p>
            <h3 class="text-xl font-semibold">Como as vitórias acontecem</h3>
          </header>
          <ul class="space-y-4">
            <li v-for="item in comboVictoryProfile" :key="item.label">
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span>{{ item.label }}</span>
                <span>{{ item.percent }}% · {{ item.count }}</span>
              </div>
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div class="h-full bg-emerald-400" :style="{ width: `${item.percent}%` }"></div>
              </div>
            </li>
            <li v-if="!comboVictoryProfile.length" class="text-center text-slate-500 text-sm">
              Sem dados suficientes para a distribuição de vitórias.
            </li>
          </ul>
        </section>

        <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <header class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-400">Batalhas do combo</p>
              <h3 class="text-xl font-semibold">Histórico recente</h3>
            </div>
            <span class="text-xs text-slate-500">{{ comboRecentBattles.length }} registros</span>
          </header>
          <ul class="space-y-4 max-h-[360px] overflow-y-auto pr-2">
            <li
              v-for="battle in comboRecentBattles"
              :key="battle.id"
              class="border border-slate-800 rounded-xl p-4 bg-slate-900/70"
            >
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold">
                  {{ battle.comboA.name }}
                  <span class="text-slate-500">vs</span>
                  {{ battle.comboB.name }}
                </p>
                <span class="text-xs font-semibold" :class="resultColor(battle.result)">
                  {{ labels[battle.result] ?? battle.result }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ battle.occurredAt ? formatDate(battle.occurredAt) : 'Data não informada' }} ·
                {{ battle.arena?.name || 'Arena livre' }} · {{ battle.score || 'placar não informado' }} ·
                {{ battle.victoryType || 'Tipo não registrado' }}
              </p>
            </li>
            <li v-if="!comboRecentBattles.length" class="text-center text-slate-500 text-sm">
              Nenhum registro recente para este combo.
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { usePartsStore } from '../stores/parts';
import { useCombosStore } from '../stores/combos';
import { useBattlesStore } from '../stores/battles';
import { formatDate } from '../utils/format';

const partsStore = usePartsStore();
const combosStore = useCombosStore();
const battlesStore = useBattlesStore();

const TAB_STORAGE_KEY = 'dashboard:comboTabs';

const comboTabs = ref([]);
const activeTab = ref('all');
const tabPicker = reactive({
  open: false,
  selection: '',
});

const labels = {
  COMBO_A: 'Vitória do Combo A',
  COMBO_B: 'Vitória do Combo B',
  DRAW: 'Empate',
};

const filterState = reactive({
  range: '30',
  archetype: 'ALL',
  result: 'ALL',
});

const rangePresets = [
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
  { label: 'Tudo', value: 'all' },
];

onMounted(async () => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          comboTabs.value = parsed;
        }
      } catch (err) {
        console.warn('Falha ao carregar abas salvas', err);
      }
    }
  }
  await Promise.all([
    partsStore.fetchParts(),
    combosStore.fetchCombos(),
    battlesStore.fetchBattles({ limit: 250 }),
  ]);
});

watch(
  comboTabs,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(value));
    }
  },
  { deep: true },
);

const archetypeOptions = computed(() => {
  const unique = Array.from(new Set(combosStore.items.map((combo) => combo.archetype)));
  return ['ALL', ...unique];
});

const filteredBattles = computed(() => {
  const now = Date.now();
  const daysLimit = filterState.range === 'all' ? null : Number(filterState.range);
  const minTimestamp = daysLimit ? now - daysLimit * 24 * 60 * 60 * 1000 : null;

  return battlesStore.items.filter((battle) => {
    const occurredAt = battle.occurredAt ? new Date(battle.occurredAt).getTime() : null;
    if (minTimestamp && occurredAt && occurredAt < minTimestamp) {
      return false;
    }
    if (filterState.archetype !== 'ALL') {
      const matchesArchetype =
        battle.comboA?.archetype === filterState.archetype ||
        battle.comboB?.archetype === filterState.archetype;
      if (!matchesArchetype) return false;
    }
    if (filterState.result !== 'ALL' && battle.result !== filterState.result) {
      return false;
    }
    return true;
  });
});

const filteredRangeDays = computed(() => {
  if (filterState.range !== 'all') {
    return Number(filterState.range);
  }
  const timestamps = filteredBattles.value
    .map((battle) => (battle.occurredAt ? new Date(battle.occurredAt).getTime() : null))
    .filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!timestamps.length) return 30;
  const span = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.ceil(span));
});

const combosActive = computed(() => combosStore.items.filter((c) => c.status === 'ACTIVE').length);
const partsTotal = computed(() => partsStore.items.length);

const combosInFilter = computed(() => {
  const ids = new Set();
  roundsDataset.value.forEach((round) => {
    if (round.comboAId) ids.add(round.comboAId);
    if (round.comboBId) ids.add(round.comboBId);
  });
  return ids.size || combosActive.value;
});

const uniqueArenaCount = computed(() => {
  const ids = new Set();
  filteredBattles.value.forEach((battle) => {
    if (battle.arena?.id) ids.add(battle.arena.id);
  });
  return ids.size;
});

const resultSummary = computed(() => {
  return roundsDataset.value.reduce(
    (acc, round) => {
      if (round.winner === 'COMBO_A') acc.comboA += 1;
      else if (round.winner === 'COMBO_B') acc.comboB += 1;
      else acc.draws += 1;
      return acc;
    },
    { comboA: 0, comboB: 0, draws: 0 },
  );
});

function buildStatsFromRounds(sourceRounds) {
  const stats = new Map();
  for (const combo of combosStore.items) {
    stats.set(combo.id, { id: combo.id, name: combo.name, wins: 0, total: 0, draws: 0 });
  }
  for (const round of sourceRounds) {
    const entryA = stats.get(round.comboAId);
    const entryB = stats.get(round.comboBId);
    if (entryA) entryA.total += 1;
    if (entryB) entryB.total += 1;
    if (round.winner === 'DRAW') {
      if (entryA) entryA.draws += 1;
      if (entryB) entryB.draws += 1;
      continue;
    }
    const winnerIsA = round.winner === 'COMBO_A';
    if (winnerIsA && entryA) entryA.wins += 1;
    if (!winnerIsA && entryB) entryB.wins += 1;
  }
  return [...stats.values()].map((item) => ({
    ...item,
    winrate: item.total - item.draws > 0 ? ((item.wins / (item.total - item.draws)) * 100).toFixed(1) : '0.0',
  }));
}

const comboStatsIndex = computed(() => {
  const map = new Map();
  buildStatsFromRounds(roundsDataset.value).forEach((entry) => {
    map.set(entry.id, entry);
  });
  return map;
});

const combosWithBattles = computed(() =>
  combosStore.items
    .map((combo) => {
      const stats = comboStatsIndex.value.get(combo.id);
      if (!stats || !stats.total) return null;
      return {
        id: combo.id,
        combo,
        total: stats.total,
        winrate: stats.winrate,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.total - a.total),
);

const comboTabMeta = computed(() => {
  const map = new Map();
  combosWithBattles.value.forEach((entry) => map.set(entry.id, entry));
  return map;
});

const comboTabRenderList = computed(() =>
  comboTabs.value
    .map((id) => {
      const entry = comboTabMeta.value.get(id);
      if (!entry) return null;
      return {
        id,
        name: entry.combo.name,
        total: entry.total,
        winrate: `${entry.winrate}%`,
      };
    })
    .filter(Boolean),
);

const availableTabOptions = computed(() =>
  combosWithBattles.value
    .filter((entry) => !comboTabs.value.includes(entry.id))
    .map((entry) => ({
      id: entry.id,
      name: entry.combo.name,
      total: entry.total,
    })),
);

watch(
  () => combosWithBattles.value.map((entry) => entry.id),
  (ids) => {
    const idSet = new Set(ids);
    const filtered = comboTabs.value.filter((id) => idSet.has(id));
    if (filtered.length !== comboTabs.value.length) {
      comboTabs.value = filtered;
    }
    if (!comboTabs.value.length && ids.length) {
      comboTabs.value = ids.slice(0, 3);
    }
    if (activeTab.value !== 'all' && !idSet.has(activeTab.value)) {
      activeTab.value = comboTabs.value[0] ?? 'all';
    }
  },
  { immediate: true },
);

function toggleTabPicker() {
  tabPicker.open = !tabPicker.open;
  if (!tabPicker.open) tabPicker.selection = '';
}

function addComboTab() {
  if (!tabPicker.selection) return;
  if (!comboTabs.value.includes(tabPicker.selection)) {
    comboTabs.value = [...comboTabs.value, tabPicker.selection];
  }
  activeTab.value = tabPicker.selection;
  tabPicker.selection = '';
  tabPicker.open = false;
}

function removeComboTab(id) {
  comboTabs.value = comboTabs.value.filter((tabId) => tabId !== id);
  if (activeTab.value === id) {
    activeTab.value = comboTabs.value[0] ?? 'all';
  }
}

const topCombos = computed(() =>
  buildStatsFromRounds(roundsDataset.value)
    .filter((c) => c.total >= 3)
    .sort((a, b) => Number(b.winrate) - Number(a.winrate))
    .slice(0, 5),
);

const leaderWinrate = computed(() => topCombos.value[0]?.winrate ?? '0.0');

const averagePerWeek = computed(() => {
  const days = filteredRangeDays.value || 7;
  if (!filteredBattles.value.length) return '0.0';
  return ((filteredBattles.value.length / days) * 7).toFixed(1);
});

const victoryDistribution = computed(() => {
  const total = roundsDataset.value.length;
  const counts = roundsDataset.value.reduce((acc, round) => {
    const key = round.victoryType || (round.winner === 'DRAW' ? 'Empate' : 'Sem registro');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([label, count]) => ({
    label,
    count,
    percent: total ? Math.round((count / total) * 100) : 0,
  }));
});

const archetypePerformance = computed(() => {
  const map = new Map();
  roundsDataset.value.forEach((round) => {
    const comboA = comboIndex.value.get(round.comboAId);
    const comboB = comboIndex.value.get(round.comboBId);
    const archA = comboA?.archetype ?? 'Indefinido';
    const archB = comboB?.archetype ?? 'Indefinido';
    if (!map.has(archA)) map.set(archA, { archetype: archA, wins: 0, total: 0, draws: 0 });
    if (!map.has(archB)) map.set(archB, { archetype: archB, wins: 0, total: 0, draws: 0 });
    const entryA = map.get(archA);
    const entryB = map.get(archB);
    if (entryA) entryA.total += 1;
    if (entryB) entryB.total += 1;
    if (round.winner === 'DRAW') {
      if (entryA) entryA.draws += 1;
      if (entryB) entryB.draws += 1;
    } else {
      const winnerIsA = round.winner === 'COMBO_A';
      if (winnerIsA && entryA) entryA.wins += 1;
      if (!winnerIsA && entryB) entryB.wins += 1;
    }
  });
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      winrate: entry.total ? ((entry.wins / entry.total) * 100).toFixed(1) : '0.0',
      drawRate: entry.total ? Math.round((entry.draws / entry.total) * 100) : 0,
    }))
    .sort((a, b) => Number(b.winrate) - Number(a.winrate));
});

const arenaPerformance = computed(() => {
  const map = new Map();
  roundsDataset.value.forEach((round) => {
    if (!round.arena?.id) return;
    const existing = map.get(round.arena.id) ?? {
      id: round.arena.id,
      name: round.arena.name,
      total: 0,
      decisive: 0,
      draws: 0,
    };
    existing.total += 1;
    if (round.winner === 'DRAW') existing.draws += 1;
    else existing.decisive += 1;
    map.set(round.arena.id, existing);
  });
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      decisiveRate: entry.total ? Math.round((entry.decisive / entry.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);
});

const latestBattles = computed(() =>
  [...filteredBattles.value]
    .sort((a, b) => {
      const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
      const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6),
);



const statsCards = computed(() => [
  {
    label: 'Batalhas no período',
    value: roundsDataset.value.length,
    helper: `${filterState.range === 'all' ? 'intervalo completo' : `${filterState.range} dias`} analisados`,
  },
  {
    label: 'Winrate líder',
    value: `${leaderWinrate.value}%`,
    helper: topCombos.value[0]?.name ?? 'Sem dados',
  },
  {
    label: 'Empates',
    value: resultSummary.value.draws,
    helper: `${roundsDataset.value.length ? Math.round((resultSummary.value.draws / roundsDataset.value.length) * 100) : 0}% das batalhas`,
  },
  {
    label: 'Arenas ativas',
    value: uniqueArenaCount.value,
    helper: 'Com partidas registradas',
  },
  {
    label: 'Combos analisados',
    value: combosInFilter.value,
    helper: `${combosActive.value} combos ativos no total`,
  },
  {
    label: 'Batalhas/semana',
    value: averagePerWeek.value,
    helper: `${partsTotal.value} peças disponíveis`,
  },
]);

function resultColor(code) {
  if (code === 'COMBO_A') return 'text-emerald-400';
  if (code === 'COMBO_B') return 'text-rose-400';
  if (code === 'DRAW') return 'text-slate-300';
  return 'text-slate-500';
}

function battleComboIds(battle) {
  return {
    a: battle.comboAId ?? battle.comboA?.id ?? null,
    b: battle.comboBId ?? battle.comboB?.id ?? null,
  };
}

function roundsFromBattle(battle) {
  const ids = battleComboIds(battle);
  const occurredAtTs = battle.occurredAt ? new Date(battle.occurredAt).getTime() : null;
  const baseArena = battle.arena ? { id: battle.arena.id, name: battle.arena.name } : null;
  const turns = Array.isArray(battle.turns) ? battle.turns : [];

  const fallbackRound = {
    battleId: battle.id,
    comboAId: ids.a,
    comboBId: ids.b,
    winner: battle.result,
    victoryType: battle.victoryType?.trim() || (battle.result === 'DRAW' ? 'Empate' : 'Sem registro'),
    occurredAtTs,
    arena: baseArena,
  };

  if (!turns.length) return [fallbackRound];

  return turns
    .filter((turn) => Boolean(turn?.winner))
    .map((turn, index) => ({
      battleId: battle.id,
      index,
      comboAId: ids.a,
      comboBId: ids.b,
      winner: turn.winner,
      victoryType: turn.victoryType?.trim() || (turn.winner === 'DRAW' ? 'Empate' : 'Sem registro'),
      occurredAtTs,
      arena: baseArena,
    }));
}

const roundsDataset = computed(() => filteredBattles.value.flatMap((battle) => roundsFromBattle(battle)));

function aggregateRoundsForComboIds(comboIdsSet, sourceRounds = roundsDataset.value) {
  const stats = { total: 0, wins: 0, losses: 0, draws: 0 };
  if (!comboIdsSet || comboIdsSet.size === 0) return { ...stats, winrate: '0.0' };
  for (const round of sourceRounds) {
    const hasA = round.comboAId && comboIdsSet.has(round.comboAId);
    const hasB = round.comboBId && comboIdsSet.has(round.comboBId);
    if (!hasA && !hasB) continue;
    stats.total += 1;
    if (round.winner === 'DRAW' || (hasA && hasB)) {
      stats.draws += 1;
      continue;
    }
    const winnerIsA = round.winner === 'COMBO_A';
    if ((winnerIsA && hasA) || (!winnerIsA && hasB)) stats.wins += 1;
    else stats.losses += 1;
  }
  const decisive = stats.total - stats.draws;
  return {
    ...stats,
    winrate: decisive > 0 ? ((stats.wins / decisive) * 100).toFixed(1) : '0.0',
  };
}

function aggregateForComboIds(comboIdsSet, sourceBattles = filteredBattles.value) {
  const stats = { total: 0, wins: 0, losses: 0, draws: 0 };
  if (!comboIdsSet || comboIdsSet.size === 0) return { ...stats, winrate: '0.0' };
  for (const battle of sourceBattles) {
    const ids = battleComboIds(battle);
    const hasA = ids.a && comboIdsSet.has(ids.a);
    const hasB = ids.b && comboIdsSet.has(ids.b);
    if (!hasA && !hasB) continue;
    stats.total += 1;
    if (hasA && hasB) {
      stats.draws += 1;
      continue;
    }
    if (battle.result === 'DRAW') {
      stats.draws += 1;
      continue;
    }
    const winnerIsA = battle.result === 'COMBO_A';
    if ((winnerIsA && hasA) || (!winnerIsA && hasB)) stats.wins += 1;
    else stats.losses += 1;
  }
  const decisive = stats.total - stats.draws;
  return {
    ...stats,
    winrate: decisive > 0 ? ((stats.wins / decisive) * 100).toFixed(1) : '0.0',
  };
}

const comboIndex = computed(() => {
  const map = new Map();
  combosStore.items.forEach((combo) => map.set(combo.id, combo));
  return map;
});

const partIndex = computed(() => {
  const map = new Map();
  partsStore.items.forEach((part) => map.set(part.id, part));
  return map;
});

const activeCombo = computed(() => comboIndex.value.get(activeTab.value) ?? null);

const comboFocusBattles = computed(() => {
  if (!activeCombo.value) return [];
  return filteredBattles.value.filter((battle) => {
    const ids = battleComboIds(battle);
    return ids.a === activeCombo.value.id || ids.b === activeCombo.value.id;
  });
});

const comboFocusRounds = computed(() => {
  if (!activeCombo.value) return [];
  return roundsDataset.value.filter((round) => round.comboAId === activeCombo.value.id || round.comboBId === activeCombo.value.id);
});

const comboFocusStats = computed(() => {
  if (!activeCombo.value) return null;
  return aggregateRoundsForComboIds(new Set([activeCombo.value.id]), comboFocusRounds.value);
});

const comboVictoryProfile = computed(() => {
  if (!comboFocusRounds.value.length) return [];
  const total = comboFocusRounds.value.length;
  const counts = comboFocusRounds.value.reduce((acc, round) => {
    const label = round.victoryType || (round.winner === 'DRAW' ? 'Empate' : 'Sem registro');
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
});

const comboArenaFocus = computed(() => {
  if (!activeCombo.value) return [];
  const map = new Map();
  comboFocusRounds.value.forEach((round) => {
    if (!round.arena?.id) return;
    const entry = map.get(round.arena.id) ?? {
      id: round.arena.id,
      name: round.arena.name,
      total: 0,
      wins: 0,
    };
    entry.total += 1;
    if (round.winner !== 'DRAW') {
      const winnerIsA = round.winner === 'COMBO_A';
      const winnerId = winnerIsA ? round.comboAId : round.comboBId;
      if (winnerId === activeCombo.value.id) entry.wins += 1;
    }
    map.set(round.arena.id, entry);
  });
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      winrate: entry.total ? Math.round((entry.wins / entry.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
});

const comboOpponentsFocus = computed(() => {
  if (!activeCombo.value) return [];
  const map = new Map();
  comboFocusRounds.value.forEach((round) => {
    const isA = round.comboAId === activeCombo.value.id;
    const opponentId = isA ? round.comboBId : round.comboAId;
    if (!opponentId) return;
    const opponent = comboIndex.value.get(opponentId);
    const entry = map.get(opponentId) ?? {
      id: opponentId,
      name: opponent?.name ?? 'Combo adversário',
      total: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };
    entry.total += 1;
    if (round.winner === 'DRAW') entry.draws += 1;
    else if ((round.winner === 'COMBO_A' && isA) || (round.winner === 'COMBO_B' && !isA)) entry.wins += 1;
    else entry.losses += 1;
    map.set(opponentId, entry);
  });
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      winrate: entry.total ? ((entry.wins / entry.total) * 100).toFixed(1) : '0.0',
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
});

function combosUsingPart(partId) {
  return combosStore.items.filter((combo) => [combo.bladeId, combo.ratchetId, combo.bitId].includes(partId));
}

const comboPartPerformance = computed(() => {
  if (!activeCombo.value) return [];
  const parts = [
    { role: 'Blade', id: activeCombo.value.bladeId, meta: activeCombo.value.blade },
    { role: 'Ratchet', id: activeCombo.value.ratchetId, meta: activeCombo.value.ratchet },
    { role: 'Bit', id: activeCombo.value.bitId, meta: activeCombo.value.bit },
  ];
  return parts
    .filter((part) => part.id)
    .map((part) => {
      const relatedCombos = combosUsingPart(part.id);
      const comboIds = new Set(relatedCombos.map((combo) => combo.id));
      const stats = aggregateRoundsForComboIds(comboIds);
      const partData = part.meta ?? partIndex.value.get(part.id);
      return {
        role: part.role,
        id: part.id,
        name: partData?.name ?? 'Peça sem nome',
        type: partData?.type ?? '—',
        archetype: partData?.archetype ?? '—',
        combos: comboIds.size,
        ...stats,
      };
    })
    .sort((a, b) => Number(b.winrate) - Number(a.winrate));
});

const comboSynergyOverview = computed(() => {
  if (!activeCombo.value) return [];
  const bladeName = activeCombo.value.blade?.name || 'Blade';
  const ratchetName = activeCombo.value.ratchet?.name || 'Ratchet';
  const bitName = activeCombo.value.bit?.name || 'Bit';
  const pairs = [
    {
      label: 'blade-ratchet',
      name: `${bladeName} + ${ratchetName}`,
      parts: [activeCombo.value.bladeId, activeCombo.value.ratchetId],
    },
    {
      label: 'blade-bit',
      name: `${bladeName} + ${bitName}`,
      parts: [activeCombo.value.bladeId, activeCombo.value.bitId],
    },
    {
      label: 'ratchet-bit',
      name: `${ratchetName} + ${bitName}`,
      parts: [activeCombo.value.ratchetId, activeCombo.value.bitId],
    },
  ];
  return pairs
    .filter((pair) => pair.parts.every(Boolean))
    .map((pair) => {
      const relatedCombos = combosStore.items.filter((combo) => {
        const parts = [combo.bladeId, combo.ratchetId, combo.bitId];
        return pair.parts.every((partId) => parts.includes(partId));
      });
      const comboIds = new Set(relatedCombos.map((combo) => combo.id));
      return {
        ...pair,
        combos: comboIds.size,
        ...aggregateRoundsForComboIds(comboIds),
      };
    })
    .filter((entry) => entry.combos > 0)
    .sort((a, b) => Number(b.winrate) - Number(a.winrate));
});

const comboSummaryCards = computed(() => {
  if (!comboFocusStats.value) return [];
  const stats = comboFocusStats.value;
  const topVictory = comboVictoryProfile.value[0];
  const topArena = comboArenaFocus.value[0];
  return [
    {
      label: 'Batalhas analisadas',
      value: stats.total,
      helper: `${stats.wins} vitórias · ${stats.losses} derrotas`,
    },
    {
      label: 'Winrate',
      value: `${stats.winrate}%`,
      helper: `${stats.draws} empates registrados`,
    },
    {
      label: 'Vitória mais comum',
      value: topVictory?.label ?? '—',
      helper: topVictory ? `${topVictory.percent}% das batalhas` : 'Sem histórico suficiente',
    },
    {
      label: 'Arena mais forte',
      value: topArena?.name ?? '—',
      helper: topArena ? `${topArena.winrate}% de vitórias` : 'Nenhuma arena registrada',
    },
  ];
});

const comboRecentBattles = computed(() =>
  [...comboFocusBattles.value]
    .sort((a, b) => {
      const aTime = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
      const bTime = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 8),
);
</script>
