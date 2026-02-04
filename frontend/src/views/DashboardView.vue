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
          type="button"
          class="px-4 py-2 rounded-2xl text-sm font-semibold transition border"
          :class="activeTab === 'bladers' ? 'bg-amber-500/20 border-amber-400/60 text-white' : 'border-slate-700 text-slate-300 hover:border-amber-400/40'"
          @click="activeTab = 'bladers'"
        >
          Pilotos
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
              <p class="text-[11px] text-slate-400">{{ tab.total }} rodadas · {{ tab.winrate }}</p>
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
                {{ option.name }} · {{ option.total }} rodadas
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
          Nenhum combo com rodadas registradas disponível para adicionar no momento.
        </p>
      </div>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Mode Dashboard</p>
          <h2 class="text-2xl font-semibold">Presets de formato</h2>
          <p class="text-sm text-slate-500">Compare Oficial 3on3, circuitos regionais e treinos longos e salve os recortes que preferir.</p>
        </div>
        <span class="text-xs text-slate-500">{{ defaultModePresets.length + customModePresets.length }} presets</span>
      </header>
      <div class="grid gap-4 xl:grid-cols-3">
        <article
          v-for="preset in modePresetCards"
          :key="preset.id"
          class="rounded-2xl border bg-slate-950/40 p-5 transition focus-within:ring-2 focus-within:ring-primary/20"
          :class="[preset.isActive ? 'border-primary/60 shadow-lg shadow-primary/20' : 'border-slate-800', preset.accentClass]"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">
                {{ preset.isCustom ? 'Preset salvo' : 'Formato base' }}
              </p>
              <h3 class="text-xl font-semibold">{{ preset.label }}</h3>
              <p class="text-sm text-slate-400">{{ preset.description }}</p>
            </div>
            <span class="text-xs text-slate-500">{{ preset.summary.rangeLabel }}</span>
          </div>
          <div class="grid grid-cols-2 gap-4 my-4">
            <div>
              <p class="text-[11px] uppercase text-slate-500">Rodadas</p>
              <p class="text-2xl font-semibold">{{ preset.summary.rounds }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase text-slate-500">Decisões</p>
              <p class="text-2xl font-semibold">{{ preset.summary.decisiveRate }}%</p>
            </div>
            <div>
              <p class="text-[11px] uppercase text-slate-500">Empates</p>
              <p class="text-xl font-semibold">{{ preset.summary.drawRate }}%</p>
            </div>
            <div>
              <p class="text-[11px] uppercase text-slate-500">Ritmo semanal</p>
              <p class="text-xl font-semibold">{{ preset.summary.pace }} /sem</p>
            </div>
          </div>
          <p class="text-xs text-slate-500">{{ preset.summary.caption }}</p>
          <div class="flex flex-wrap gap-3 mt-4 text-sm">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-primary/80 text-white font-semibold"
              :class="preset.isActive ? 'opacity-70 cursor-default' : ''"
              :disabled="preset.isActive"
              @click="applyPresetFilters(preset.filters)"
            >
              {{ preset.isActive ? 'Preset ativo' : 'Aplicar preset' }}
            </button>
            <button
              v-if="preset.isCustom"
              type="button"
              class="px-3 py-2 rounded-xl border border-slate-700 text-slate-400"
              @click="removeCustomPreset(preset.id)"
            >
              Remover
            </button>
          </div>
        </article>
      </div>
      <div class="flex flex-wrap items-center gap-3 pt-5 border-t border-slate-800 mt-6">
        <input
          v-model="presetForm.name"
          class="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm flex-1 min-w-[220px]"
          type="text"
          maxlength="40"
          placeholder="Nome para salvar o filtro atual"
        />
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-emerald-500/80 text-white font-semibold"
          :disabled="!presetForm.name.trim()"
          @click="saveCurrentPreset"
        >
          Salvar preset atual
        </button>
        <p class="text-xs text-slate-500">Armazena formato, intervalo, arquétipo, arena e piloto.</p>
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
          <p class="text-xs uppercase tracking-wide text-slate-400">Formato</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <button
              v-for="option in battleModeFilterOptions"
              :key="option.value"
              type="button"
              class="px-3 py-2 rounded-xl border text-left transition min-w-[180px]"
              :class="filterState.mode === option.value
                ? 'border-primary/70 bg-primary/15 text-white'
                : 'border-slate-800 text-slate-400 hover:border-primary/40'
              "
              @click="filterState.mode = option.value"
            >
              <p class="text-sm font-semibold">{{ option.label }}</p>
              <p v-if="option.helper" class="text-[11px] text-slate-500">{{ option.helper }}</p>
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
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Arena</p>
          <select
            v-model="filterState.arenaId"
            class="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm"
          >
            <option value="ALL">Todas</option>
            <option v-for="arena in arenasStore.items" :key="arena.id" :value="arena.id">
              {{ arena.name }}
            </option>
          </select>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Piloto</p>
          <select
            v-model="filterState.bladerId"
            class="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm"
          >
            <option value="ALL">Todos</option>
            <option v-for="blader in bladersStore.items" :key="blader.id" :value="blader.id">
              {{ blader.name }}
            </option>
          </select>
        </div>
      </div>
    </section>

    <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Análises visuais</p>
          <h2 class="text-2xl font-semibold">Resumo gráfico</h2>
          <p class="text-sm text-slate-500">Comportamento das últimas rodadas, distribuição de vitórias e eficiência por arquétipo.</p>
        </div>
      </header>
      <div class="grid gap-6 lg:grid-cols-3">
        <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Distribuição</p>
            <h3 class="text-lg font-semibold">Tipos de vitória</h3>
          </div>
          <div class="min-h-[220px] flex items-center justify-center">
            <Doughnut v-if="victoryDistributionChartData" :data="victoryDistributionChartData" :options="doughnutOptions" />
            <p v-else class="text-sm text-slate-500">Sem dados suficientes para o gráfico.</p>
          </div>
        </article>
        <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3 lg:col-span-1">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Ritmo</p>
            <h3 class="text-lg font-semibold">Rodadas por dia</h3>
          </div>
          <div class="min-h-[220px] flex items-center justify-center">
            <Line v-if="roundsTimelineChartData" :data="roundsTimelineChartData" :options="lineOptions" />
            <p v-else class="text-sm text-slate-500">Registre batalhas para liberar esta linha do tempo.</p>
          </div>
        </article>
        <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Arquétipos</p>
            <h3 class="text-lg font-semibold">Winrate comparado</h3>
          </div>
          <div class="min-h-[220px] flex items-center justify-center">
            <Bar v-if="archetypeWinrateChartData" :data="archetypeWinrateChartData" :options="barOptions" />
            <p v-else class="text-sm text-slate-500">Precisamos de mais rodadas com arquétipos distintos.</p>
          </div>
        </article>
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
              <h3 class="text-xl font-semibold">Top combos por winrate (>=3 rodadas)</h3>
            </div>
            <span class="text-xs text-slate-500">Baseado no filtro atual</span>
          </header>
          <table class="w-full text-sm">
            <thead class="text-left text-slate-400 uppercase text-xs">
              <tr>
                <th class="py-2">Combo</th>
                <th class="py-2">Rodadas</th>
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
                  Registre rodadas ou ajuste os filtros.
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
              Sem rodadas no filtro atual.
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
                <th class="py-2">Rodadas</th>
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
                <td colspan="4" class="py-4 text-center text-slate-500">Nenhuma rodada para calcular.</td>
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
                  <p class="text-xs text-slate-500">{{ arena.total }} rodadas</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-semibold">{{ arena.decisiveRate }}%</p>
                  <p class="text-xs text-slate-500">terminaram com vencedor</p>
                </div>
              </div>
              <div class="text-xs text-slate-500 mt-2">Empates: {{ arena.draws }}</div>
            </li>
            <li v-if="arenaPerformance.length === 0" class="text-center text-slate-500 text-sm">
              Registre rodadas com arena para popular esta lista.
            </li>
          </ul>
        </section>
      </div>

      <section class="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
        <header class="flex items-center justify-between mb-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Timeline</p>
            <h3 class="text-xl font-semibold">Últimas rodadas filtradas</h3>
          </div>
          <span class="text-xs text-slate-500">{{ latestRounds.length }} registros</span>
        </header>
        <ul class="space-y-4 max-h-[440px] overflow-y-auto pr-2">
          <li
            v-for="round in latestRounds"
            :key="`${round.battleId}-${round.index ?? 0}`"
            class="bg-slate-900/70 p-4 rounded-xl border border-slate-800"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">
                {{ round.comboA?.name || 'Combo A' }}
                <span class="text-slate-500">vs</span>
                {{ round.comboB?.name || 'Combo B' }}
              </p>
              <span :class="['text-xs font-semibold', resultColor(round.winner)]">
                {{ labels[round.winner] ?? round.winner }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              {{ roundDescriptor(round) }} ·
              {{ round.occurredAtTs ? formatDate(round.occurredAtTs) : 'Data não informada' }} ·
              {{ round.arena?.name || 'Arena livre' }} ·
              <span>
                {{ round.type === 'SUMMARY'
                  ? round.score
                    ? `Placar ${round.score}`
                    : 'Placar não informado'
                  : round.victoryType || 'Tipo não informado' }}
              </span>
            </p>
            <p v-if="round.notes" class="text-xs text-slate-500 mt-1 italic">
              {{ round.notes }}
            </p>
          </li>
          <li v-if="latestRounds.length === 0" class="text-center text-slate-500 text-sm">
            Ajuste filtros ou registre rodadas.
          </li>
        </ul>
      </section>

      <section class="bg-slate-900/60 rounded-2xl p-6 border border-slate-800">
        <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Relatório de sinergia</p>
            <h3 class="text-xl font-semibold">Combinações que mais entregam</h3>
            <p class="text-sm text-slate-500">Construído a partir de todas as rodadas filtradas envolvendo pares de peças.</p>
          </div>
        </header>
        <div class="grid gap-6 lg:grid-cols-2">
          <article class="p-4 border border-slate-800 rounded-2xl bg-slate-950/40 min-h-[260px] flex items-center justify-center">
            <Bar v-if="globalSynergyChartData" :data="globalSynergyChartData" :options="barOptions" />
            <p v-else class="text-sm text-slate-500">Registre mais batalhas para liberar o gráfico de sinergia global.</p>
          </article>
          <article class="p-4 border border-slate-800 rounded-2xl bg-slate-950/40">
            <table class="w-full text-sm">
              <thead class="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th class="py-2">Par de peças</th>
                  <th class="py-2">Rodadas</th>
                  <th class="py-2">Winrate</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="entry in globalSynergyReport.slice(0, 6)"
                  :key="entry.id"
                  class="border-t border-slate-800/60"
                >
                  <td class="py-3">
                    <p class="font-semibold">{{ entry.name }}</p>
                    <p class="text-xs text-slate-500">{{ entry.label }}</p>
                  </td>
                  <td>{{ entry.total }}</td>
                  <td>{{ entry.winrate }}%</td>
                </tr>
                <tr v-if="!globalSynergyReport.length">
                  <td colspan="3" class="py-4 text-center text-slate-500">Sem combinações suficientes no filtro atual.</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="isComboTabActive">
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
              <p class="text-xs uppercase tracking-wide text-slate-400">Rodadas</p>
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
          <li><span class="text-slate-500">Assist:</span> {{ activeCombo?.assistBlade?.name || '—' }}</li>
          <li v-if="activeCombo?.ratchet?.type === 'RATCHET_BIT'">
            <span class="text-slate-500">Ratchet + Bit:</span>
            {{ activeCombo?.ratchet?.name || '—' }}
            <span class="text-xs text-primary/80">(Integrado)</span>
          </li>
          <template v-else>
            <li><span class="text-slate-500">Ratchet:</span> {{ activeCombo?.ratchet?.name || '—' }}</li>
            <li><span class="text-slate-500">Bit:</span> {{ activeCombo?.bit?.name || '—' }}</li>
          </template>
        </ul>
        <p v-if="!comboFocusRounds.length" class="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-2">
          Nenhuma rodada do combo atual corresponde aos filtros selecionados. Ajuste o período ou resultado para liberar os gráficos.
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
                  <th>Rodadas</th>
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
                  <p class="text-xs text-slate-500">{{ pair.combos }} combos · {{ pair.total }} rodadas</p>
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
                  <th>Rodadas</th>
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
                  <p class="text-xs text-slate-500">{{ arena.total }} rodadas</p>
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
              <p class="text-xs uppercase tracking-wide text-slate-400">Rodadas do combo</p>
              <h3 class="text-xl font-semibold">Histórico recente</h3>
            </div>
            <span class="text-xs text-slate-500">{{ comboRecentRounds.length }} registros</span>
          </header>
          <ul class="space-y-4 max-h-[360px] overflow-y-auto pr-2">
            <li
              v-for="round in comboRecentRounds"
              :key="`${round.battleId}-${round.index ?? 0}`"
              class="border border-slate-800 rounded-xl p-4 bg-slate-900/70"
            >
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold">
                  {{ round.comboA?.name || 'Combo A' }}
                  <span class="text-slate-500">vs</span>
                  {{ round.comboB?.name || 'Combo B' }}
                </p>
                <span class="text-xs font-semibold" :class="resultColor(round.winner)">
                  {{ labels[round.winner] ?? round.winner }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ roundDescriptor(round) }} ·
                {{ round.occurredAtTs ? formatDate(round.occurredAtTs) : 'Data não informada' }} ·
                {{ round.arena?.name || 'Arena livre' }} ·
                <span>
                  {{ round.type === 'SUMMARY'
                    ? round.score
                      ? `Placar ${round.score}`
                      : 'Placar não informado'
                    : round.victoryType || 'Tipo não registrado' }}
                </span>
              </p>
              <p v-if="round.notes" class="text-xs text-slate-500 mt-1 italic">
                {{ round.notes }}
              </p>
            </li>
            <li v-if="!comboRecentRounds.length" class="text-center text-slate-500 text-sm">
              Nenhum registro recente para este combo.
            </li>
          </ul>
        </section>
      </div>
    </template>

    <template v-else>
      <section class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Pilotos</p>
            <h2 class="text-3xl font-semibold">Desempenho por blader</h2>
            <p class="text-sm text-slate-500">Acompanhe winrate, ritmo e decks vinculados de cada piloto registrado.</p>
          </div>
        </header>
        <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <article v-for="card in bladerSummaryCards" :key="card.label" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">{{ card.label }}</p>
            <p class="text-3xl font-semibold">{{ card.value }}</p>
            <p class="text-xs text-slate-500">{{ card.helper }}</p>
          </article>
          <article v-if="!bladerSummaryCards.length" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <p class="text-xs uppercase tracking-wide text-slate-400">Pilotos</p>
            <p class="text-sm text-slate-500">Cadastre bladers e registre batalhas para liberar o painel.</p>
          </article>
        </section>
        <div class="grid gap-6 lg:grid-cols-2">
          <article class="p-4 border border-slate-800 rounded-2xl bg-slate-950/40 min-h-[280px] flex items-center justify-center">
            <Bar v-if="bladerPerformanceChartData" :data="bladerPerformanceChartData" :options="barOptions" />
            <p v-else class="text-sm text-slate-500">Nenhum piloto com rodadas suficientes.</p>
          </article>
          <article class="p-4 border border-slate-800 rounded-2xl bg-slate-950/40 min-h-[280px] flex items-center justify-center">
            <Doughnut v-if="bladerCountryChartData" :data="bladerCountryChartData" :options="doughnutOptions" />
            <p v-else class="text-sm text-slate-500">Sem distribuição geográfica registrada.</p>
          </article>
        </div>
        <section class="grid gap-6 lg:grid-cols-2">
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
            <header class="mb-4">
              <p class="text-xs uppercase tracking-wide text-slate-400">Leaderboard</p>
              <h3 class="text-xl font-semibold">Top winrate</h3>
            </header>
            <table class="w-full text-sm">
              <thead class="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th class="py-2">Blader</th>
                  <th class="py-2">Rodadas</th>
                  <th class="py-2">Vitórias</th>
                  <th class="py-2">Winrate</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="blader in bladersLeaderboard.slice(0, 6)"
                  :key="blader.id"
                  class="border-t border-slate-800/60"
                >
                  <td class="py-3">
                    <p class="font-semibold">{{ blader.name }}</p>
                    <p class="text-xs text-slate-500">{{ blader.team || 'Sem equipe' }} · {{ blader.country }}</p>
                  </td>
                  <td>{{ blader.stats.total }}</td>
                  <td>{{ blader.stats.wins }}</td>
                  <td>{{ blader.stats.winrate }}%</td>
                </tr>
                <tr v-if="!bladersLeaderboard.length">
                  <td colspan="4" class="py-4 text-center text-slate-500">Nenhum piloto com batalhas registradas.</td>
                </tr>
              </tbody>
            </table>
          </article>
          <article class="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
            <header class="mb-4">
              <p class="text-xs uppercase tracking-wide text-slate-400">Atividade recente</p>
              <h3 class="text-xl font-semibold">Últimas batalhas registradas</h3>
            </header>
            <ul class="space-y-4 max-h-[320px] overflow-y-auto pr-2">
              <li
                v-for="blader in bladerActivityFeed"
                :key="blader.id"
                class="p-4 border border-slate-800 rounded-xl bg-slate-900/70"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold">{{ blader.name }}</p>
                    <p class="text-xs text-slate-500">{{ blader.team || 'Equipe desconhecida' }}</p>
                  </div>
                  <span class="text-xs text-slate-400">{{ blader.lastBattleAt ? formatDate(blader.lastBattleAt) : 'Sem registro' }}</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  {{ blader.stats.wins }} vitórias · {{ blader.stats.losses }} derrotas · {{ blader.stats.draws }} empates
                </p>
                <div class="flex flex-wrap gap-2 mt-2 text-xs text-slate-400">
                  <span
                    v-for="combo in blader.combosUsed"
                    :key="combo.id"
                    class="px-2 py-1 rounded-lg border border-slate-800"
                  >
                    {{ combo.name }} · {{ combo.count }}x
                  </span>
                  <span v-if="!blader.combosUsed.length" class="text-slate-500">Sem combos frequentes</span>
                </div>
              </li>
              <li v-if="!bladerActivityFeed.length" class="text-center text-slate-500 text-sm">
                Nenhuma batalha registrada recentemente para os pilotos.
              </li>
            </ul>
          </article>
        </section>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { Bar, Doughnut, Line } from 'vue-chartjs';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

import { usePartsStore } from '../stores/parts';
import { useCombosStore } from '../stores/combos';
import { useBattlesStore } from '../stores/battles';
import { useBladersStore } from '../stores/bladers';
import { useArenasStore } from '../stores/arenas';
import { formatDate } from '../utils/format';

Chart.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

const partsStore = usePartsStore();
const combosStore = useCombosStore();
const battlesStore = useBattlesStore();
const bladersStore = useBladersStore();
const arenasStore = useArenasStore();

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

const FILTER_DEFAULTS = {
  range: '30',
  archetype: 'ALL',
  result: 'ALL',
  mode: 'ALL',
  arenaId: 'ALL',
  bladerId: 'ALL',
};

const MODE_PRESET_STORAGE_KEY = 'dashboard:modePresets';

const filterState = reactive({ ...FILTER_DEFAULTS });

const rangePresets = [
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
  { label: 'Tudo', value: 'all' },
];

const battleModeFilterOptions = [
  { value: 'ALL', label: 'Todos os formatos', helper: 'Misture todos os registros' },
  { value: 'OFFICIAL_3ON3', label: 'Oficial 3on3', helper: 'Deck fechado • 4 pontos' },
  { value: 'REGIONAL_CIRCUIT', label: 'Torneio regional', helper: 'Decks flex e adaptados' },
  { value: 'LONG_TRAINING', label: 'Treino longo', helper: 'Séries de laboratório' },
  { value: 'CUSTOM', label: 'Custom', helper: 'Testes livres ou convidados' },
];

const battleModeLabelMap = battleModeFilterOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const defaultModePresets = [
  {
    id: 'preset-official',
    label: 'Oficial 3on3',
    description: 'Deck fechado focado em séries rápidas com 4 pontos.',
    accent: 'emerald',
    filters: { mode: 'OFFICIAL_3ON3', range: '30' },
  },
  {
    id: 'preset-regional',
    label: 'Torneio regional',
    description: 'Circuito com decks flex e janelas de 60 dias.',
    accent: 'sky',
    filters: { mode: 'REGIONAL_CIRCUIT', range: '60' },
  },
  {
    id: 'preset-training',
    label: 'Treino longo',
    description: 'Séries abertas e laboratório ilimitado.',
    accent: 'amber',
    filters: { mode: 'LONG_TRAINING', range: 'all' },
  },
];

const customModePresets = ref([]);
const presetForm = reactive({ name: '' });

const arenaIndex = computed(() => {
  const map = new Map();
  arenasStore.items.forEach((arena) => map.set(arena.id, arena));
  return map;
});

const bladerIndex = computed(() => {
  const map = new Map();
  bladersStore.items.forEach((blader) => map.set(blader.id, blader));
  return map;
});

const chartPalette = ['#22c55e', '#a855f7', '#f97316', '#38bdf8', '#f43f5e', '#fde047', '#c084fc'];
const accentPalette = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#2dd4bf', '#c4b5fd'];
const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', day: 'numeric' });

const doughnutOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#94a3b8',
        usePointStyle: true,
      },
    },
    tooltip: {
      callbacks: {
        label(context) {
          const label = context.label ?? '';
          const value = context.parsed ?? 0;
          return `${label}: ${value}`;
        },
      },
    },
  },
};

const barOptions = {
  responsive: true,
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: '#1e293b' },
    },
    y: {
      ticks: { color: '#94a3b8', callback: (value) => `${value}%` },
      grid: { color: '#1e293b' },
      beginAtZero: true,
      suggestedMax: 100,
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(context) {
          return `${context.parsed.y ?? context.parsed}% de winrate`;
        },
      },
    },
  },
};

const lineOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: '#1e293b' },
      beginAtZero: true,
    },
  },
};

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
    const presetPayload = window.localStorage.getItem(MODE_PRESET_STORAGE_KEY);
    if (presetPayload) {
      try {
        const parsedPresets = JSON.parse(presetPayload);
        if (Array.isArray(parsedPresets)) {
          customModePresets.value = parsedPresets.filter((entry) => entry?.id && entry?.filters);
        }
      } catch (err) {
        console.warn('Falha ao carregar presets salvos', err);
      }
    }
  }
  await Promise.all([
    partsStore.fetchParts(),
    combosStore.fetchCombos(),
    battlesStore.fetchBattles({ limit: 250 }),
    bladersStore.fetchBladers(),
    arenasStore.fetchArenas(),
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

watch(
  customModePresets,
  (value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODE_PRESET_STORAGE_KEY, JSON.stringify(value));
    }
  },
  { deep: true },
);

function normalizeFilters(rawFilters = {}) {
  return {
    range: rawFilters.range ?? FILTER_DEFAULTS.range,
    archetype: rawFilters.archetype ?? FILTER_DEFAULTS.archetype,
    result: rawFilters.result ?? FILTER_DEFAULTS.result,
    mode: rawFilters.mode ?? FILTER_DEFAULTS.mode,
    arenaId: rawFilters.arenaId ?? FILTER_DEFAULTS.arenaId,
    bladerId: rawFilters.bladerId ?? FILTER_DEFAULTS.bladerId,
  };
}

function evaluateFilterWindow(rawFilters = {}) {
  const normalized = normalizeFilters(rawFilters);
  const rangeValue = normalized.range;
  const daysLimit = rangeValue === 'all' ? null : Number(rangeValue);
  const minTimestamp =
    daysLimit && Number.isFinite(daysLimit) ? Date.now() - daysLimit * 24 * 60 * 60 * 1000 : null;
  return { normalized, minTimestamp };
}

function battleMatchesFilters(battle, normalizedFilters, minTimestamp) {
  const occurredAt = battle.occurredAt ? new Date(battle.occurredAt).getTime() : null;
  if (minTimestamp && occurredAt && occurredAt < minTimestamp) {
    return false;
  }
  if (normalizedFilters.mode !== 'ALL') {
    const battleMode = battle.mode ?? 'OFFICIAL_3ON3';
    if (battleMode !== normalizedFilters.mode) return false;
  }
  if (normalizedFilters.archetype !== 'ALL') {
    const matchesArchetype =
      battle.comboA?.archetype === normalizedFilters.archetype ||
      battle.comboB?.archetype === normalizedFilters.archetype;
    if (!matchesArchetype) return false;
  }
  if (normalizedFilters.result !== 'ALL' && battle.result !== normalizedFilters.result) {
    return false;
  }
  if (normalizedFilters.arenaId !== 'ALL') {
    const arenaId = battle.arena?.id ?? battle.arenaId ?? null;
    if (arenaId !== normalizedFilters.arenaId) return false;
  }
  if (normalizedFilters.bladerId !== 'ALL') {
    const bladerAId = battle.bladerA?.id ?? battle.bladerAId ?? null;
    const bladerBId = battle.bladerB?.id ?? battle.bladerBId ?? null;
    if (bladerAId !== normalizedFilters.bladerId && bladerBId !== normalizedFilters.bladerId) {
      return false;
    }
  }
  return true;
}

function collectBattles(rawFilters = {}) {
  const { normalized, minTimestamp } = evaluateFilterWindow(rawFilters);
  return battlesStore.items.filter((battle) => battleMatchesFilters(battle, normalized, minTimestamp));
}

function collectRounds(rawFilters = {}) {
  return collectBattles(rawFilters).flatMap((battle) => roundsFromBattle(battle));
}

function computeRangeDays(battles, rangeValue) {
  if (rangeValue && rangeValue !== 'all') {
    const parsed = Number(rangeValue);
    return Number.isFinite(parsed) ? parsed : Number(FILTER_DEFAULTS.range);
  }
  const timestamps = battles
    .map((battle) => (battle.occurredAt ? new Date(battle.occurredAt).getTime() : null))
    .filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!timestamps.length) return 30;
  const span = (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.ceil(span));
}

function describePresetFilters(filters) {
  const normalized = normalizeFilters(filters);
  const parts = [];
  parts.push(normalized.mode === 'ALL' ? 'Todos os formatos' : battleModeLabelMap[normalized.mode] ?? normalized.mode);
  parts.push(normalized.range === 'all' ? 'Intervalo completo' : `${normalized.range} dias`);
  if (normalized.archetype !== 'ALL') {
    parts.push(`Arquétipo ${normalized.archetype}`);
  }
  if (normalized.arenaId !== 'ALL') {
    const arenaName = arenaIndex.value.get(normalized.arenaId)?.name ?? 'Arena filtrada';
    parts.push(arenaName);
  }
  if (normalized.bladerId !== 'ALL') {
    const bladerName = bladerIndex.value.get(normalized.bladerId)?.name ?? 'Piloto filtrado';
    parts.push(bladerName);
  }
  return parts.join(' · ');
}

function summarizePreset(filters) {
  const normalized = normalizeFilters(filters);
  const battles = collectBattles(normalized);
  const rounds = battles.flatMap((battle) => roundsFromBattle(battle));
  const draws = battles.filter((battle) => battle.result === 'DRAW').length;
  const decisiveRate = battles.length ? Math.round(((battles.length - draws) / battles.length) * 100) : 0;
  const drawRate = battles.length ? Math.round((draws / battles.length) * 100) : 0;
  const rangeLabel = normalized.range === 'all' ? 'Intervalo completo' : `${normalized.range} dias`;
  const paceBase = computeRangeDays(battles, normalized.range);
  const pace = paceBase ? ((rounds.length / paceBase) * 7).toFixed(1) : '0.0';
  return {
    rounds: rounds.length,
    battles: battles.length,
    decisiveRate,
    drawRate,
    pace,
    rangeLabel,
    caption: describePresetFilters(normalized),
  };
}

function filtersMatchCurrent(filters) {
  const normalizedTarget = normalizeFilters(filters);
  const normalizedCurrent = normalizeFilters(filterState);
  return Object.keys(normalizedTarget).every((key) => normalizedTarget[key] === normalizedCurrent[key]);
}

function applyPresetFilters(filters) {
  const normalized = normalizeFilters(filters);
  Object.assign(filterState, normalized);
}

function saveCurrentPreset() {
  const label = presetForm.name.trim();
  if (!label) return;
  const snapshot = normalizeFilters(filterState);
  const existing = customModePresets.value.filter((preset) => preset.label !== label);
  const entry = { id: `custom-${Date.now()}`, label, filters: snapshot };
  customModePresets.value = [entry, ...existing].slice(0, 6);
  presetForm.name = '';
}

function removeCustomPreset(id) {
  customModePresets.value = customModePresets.value.filter((preset) => preset.id !== id);
}

const presetAccentClasses = {
  emerald: 'hover:border-emerald-400/60 focus-visible:ring-emerald-400/30',
  sky: 'hover:border-sky-400/60 focus-visible:ring-sky-400/30',
  amber: 'hover:border-amber-400/60 focus-visible:ring-amber-400/30',
  rose: 'hover:border-rose-400/60 focus-visible:ring-rose-400/30',
};

const allModePresets = computed(() => [
  ...defaultModePresets,
  ...customModePresets.value.map((preset) => ({ ...preset, accent: 'rose', isCustom: true })),
]);

const modePresetCards = computed(() =>
  allModePresets.value.map((preset) => {
    const summary = summarizePreset(preset.filters);
    return {
      ...preset,
      summary,
      isCustom: Boolean(preset.isCustom),
      isActive: filtersMatchCurrent(preset.filters),
      accentClass: presetAccentClasses[preset.accent] ?? 'hover:border-primary/40 focus-visible:ring-primary/30',
    };
  }),
);

const archetypeOptions = computed(() => {
  const unique = Array.from(new Set(combosStore.items.map((combo) => combo.archetype)));
  return ['ALL', ...unique];
});

const filteredBattles = computed(() => collectBattles(filterState));

const filteredRangeDays = computed(() => computeRangeDays(filteredBattles.value, filterState.range));

const roundsDataset = computed(() => collectRounds(filterState));

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
  roundsDataset.value.forEach((round) => {
    if (round.arena?.id) ids.add(round.arena.id);
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
    if (activeTab.value !== 'all' && activeTab.value !== 'bladers' && !idSet.has(activeTab.value)) {
      activeTab.value = comboTabs.value[0] ?? 'all';
    }
  },
  { immediate: true },
);

const isComboTabActive = computed(() => activeTab.value !== 'all' && activeTab.value !== 'bladers');

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
  if (!roundsDataset.value.length) return '0.0';
  return ((roundsDataset.value.length / days) * 7).toFixed(1);
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

const latestRounds = computed(() =>
  roundsDataset.value
    .map((round) => ({
      ...round,
      comboA: round.comboAId ? comboIndex.value.get(round.comboAId) ?? null : null,
      comboB: round.comboBId ? comboIndex.value.get(round.comboBId) ?? null : null,
    }))
    .sort((a, b) => {
      const aTime = a.occurredAtTs ?? 0;
      const bTime = b.occurredAtTs ?? 0;
      return bTime - aTime;
    })
    .slice(0, 6),
);

const victoryDistributionChartData = computed(() => {
  if (!victoryDistribution.value.length) return null;
  return {
    labels: victoryDistribution.value.map((item) => item.label),
    datasets: [
      {
        data: victoryDistribution.value.map((item) => item.count),
        backgroundColor: chartPalette.slice(0, victoryDistribution.value.length),
        borderWidth: 0,
      },
    ],
  };
});

const roundsTimelineSeries = computed(() => {
  const bucketDays = Math.min(filteredRangeDays.value || 30, 90);
  const map = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = bucketDays - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const iso = date.toISOString().slice(0, 10);
    map.set(iso, { label: shortDateFormatter.format(date), count: 0 });
  }
  filteredBattles.value.forEach((battle) => {
    if (!battle.occurredAt) return;
    const date = new Date(battle.occurredAt);
    date.setHours(0, 0, 0, 0);
    const iso = date.toISOString().slice(0, 10);
    if (!map.has(iso)) {
      map.set(iso, { label: shortDateFormatter.format(date), count: 0 });
    }
    const current = map.get(iso);
    current.count += 1;
  });
  return [...map.entries()]
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([, value]) => value);
});

const roundsTimelineChartData = computed(() => {
  if (!roundsTimelineSeries.value.length) return null;
  return {
    labels: roundsTimelineSeries.value.map((item) => item.label),
    datasets: [
      {
        data: roundsTimelineSeries.value.map((item) => item.count),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
});

const archetypeWinrateChartData = computed(() => {
  const dataset = archetypePerformance.value.slice(0, 6);
  if (!dataset.length) return null;
  return {
    labels: dataset.map((item) => item.archetype),
    datasets: [
      {
        data: dataset.map((item) => Number(item.winrate)),
        backgroundColor: accentPalette.slice(0, dataset.length),
      },
    ],
  };
});



const statsCards = computed(() => [
  {
    label: 'Rodadas no período',
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
    helper: `${roundsDataset.value.length ? Math.round((resultSummary.value.draws / roundsDataset.value.length) * 100) : 0}% das rodadas`,
  },
  {
    label: 'Arenas ativas',
    value: uniqueArenaCount.value,
    helper: 'Com rodadas registradas',
  },
  {
    label: 'Combos analisados',
    value: combosInFilter.value,
    helper: `${combosActive.value} combos ativos no total`,
  },
  {
    label: 'Rodadas/semana',
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

function roundDescriptor(round) {
  if (round?.type === 'ROUND' && typeof round.index === 'number') {
    return `Rodada ${round.index + 1}`;
  }
  return 'Resumo da partida';
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
    index: null,
    comboAId: ids.a,
    comboBId: ids.b,
    winner: battle.result,
    victoryType: battle.victoryType?.trim() || (battle.result === 'DRAW' ? 'Empate' : 'Sem registro'),
    occurredAtTs,
    arena: baseArena,
    notes: battle.notes?.trim() || null,
    score: battle.score || null,
    type: 'SUMMARY',
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
      notes: turn.notes?.trim() || null,
      score: null,
      type: 'ROUND',
    }));
}

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

function comboPartIds(combo) {
  const parts = [combo.bladeId, combo.ratchetId, combo.bitId];
  if (combo.assistBladeId) parts.push(combo.assistBladeId);
  return parts.filter(Boolean);
}

function combosUsingPart(partId) {
  return combosStore.items.filter((combo) => comboPartIds(combo).includes(partId));
}

const comboPartPerformance = computed(() => {
  if (!activeCombo.value) return [];
  const parts = [
    { role: 'Blade', id: activeCombo.value.bladeId, meta: activeCombo.value.blade },
    { role: 'Ratchet', id: activeCombo.value.ratchetId, meta: activeCombo.value.ratchet },
    { role: 'Bit', id: activeCombo.value.bitId, meta: activeCombo.value.bit },
    ...(activeCombo.value.assistBladeId
      ? [
          {
            role: 'Assist Blade',
            id: activeCombo.value.assistBladeId,
            meta: activeCombo.value.assistBlade,
          },
        ]
      : []),
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
  const assistName = activeCombo.value.assistBlade?.name || 'Assist';
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
    ...(activeCombo.value.assistBladeId
      ? [
          {
            label: 'blade-assist',
            name: `${bladeName} + ${assistName}`,
            parts: [activeCombo.value.bladeId, activeCombo.value.assistBladeId],
          },
          {
            label: 'assist-ratchet',
            name: `${assistName} + ${ratchetName}`,
            parts: [activeCombo.value.assistBladeId, activeCombo.value.ratchetId],
          },
          {
            label: 'assist-bit',
            name: `${assistName} + ${bitName}`,
            parts: [activeCombo.value.assistBladeId, activeCombo.value.bitId],
          },
        ]
      : []),
  ];
  return pairs
    .filter((pair) => pair.parts.every(Boolean))
    .map((pair) => {
      const relatedCombos = combosStore.items.filter((combo) =>
        pair.parts.every((partId) => comboPartIds(combo).includes(partId)),
      );
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

const globalSynergyReport = computed(() => {
  const map = new Map();
  combosStore.items.forEach((combo) => {
    const stats = comboStatsIndex.value.get(combo.id);
    if (!stats || !stats.total) return;
    const pairs = [
      {
        label: 'Blade + Ratchet',
        ids: [combo.bladeId, combo.ratchetId],
        name: `${combo.blade?.name || 'Blade'} + ${combo.ratchet?.name || 'Ratchet'}`,
      },
      {
        label: 'Blade + Bit',
        ids: [combo.bladeId, combo.bitId],
        name: `${combo.blade?.name || 'Blade'} + ${combo.bit?.name || 'Bit'}`,
      },
      {
        label: 'Ratchet + Bit',
        ids: [combo.ratchetId, combo.bitId],
        name: `${combo.ratchet?.name || 'Ratchet'} + ${combo.bit?.name || 'Bit'}`,
      },
      ...(combo.assistBladeId
        ? [
            {
              label: 'Blade + Assist',
              ids: [combo.bladeId, combo.assistBladeId],
              name: `${combo.blade?.name || 'Blade'} + ${combo.assistBlade?.name || 'Assist'}`,
            },
            {
              label: 'Assist + Ratchet',
              ids: [combo.assistBladeId, combo.ratchetId],
              name: `${combo.assistBlade?.name || 'Assist'} + ${combo.ratchet?.name || 'Ratchet'}`,
            },
            {
              label: 'Assist + Bit',
              ids: [combo.assistBladeId, combo.bitId],
              name: `${combo.assistBlade?.name || 'Assist'} + ${combo.bit?.name || 'Bit'}`,
            },
          ]
        : []),
    ];
    pairs
      .filter((pair) => pair.ids.every(Boolean))
      .forEach((pair) => {
        const key = `${pair.label}:${pair.ids.slice().sort().join('-')}`;
        const entry = map.get(key) ?? {
          id: key,
          label: pair.label,
          name: pair.name,
          total: 0,
          wins: 0,
        };
        entry.total += stats.total;
        entry.wins += stats.wins;
        map.set(key, entry);
      });
  });
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      winrate: entry.total ? Number(((entry.wins / entry.total) * 100).toFixed(1)) : 0,
    }))
    .filter((entry) => entry.total >= 3)
    .sort((a, b) => b.winrate - a.winrate);
});

const globalSynergyChartData = computed(() => {
  const top = globalSynergyReport.value.slice(0, 5);
  if (!top.length) return null;
  return {
    labels: top.map((entry) => entry.name),
    datasets: [
      {
        data: top.map((entry) => entry.winrate),
        backgroundColor: accentPalette.slice(0, top.length),
      },
    ],
  };
});

const comboSummaryCards = computed(() => {
  if (!comboFocusStats.value) return [];
  const stats = comboFocusStats.value;
  const topVictory = comboVictoryProfile.value[0];
  const topArena = comboArenaFocus.value[0];
  return [
    {
      label: 'Rodadas analisadas',
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
      helper: topVictory ? `${topVictory.percent}% das rodadas` : 'Sem histórico suficiente',
    },
    {
      label: 'Arena mais forte',
      value: topArena?.name ?? '—',
      helper: topArena ? `${topArena.winrate}% de vitórias` : 'Nenhuma arena registrada',
    },
  ];
});

const comboRecentRounds = computed(() =>
  comboFocusRounds.value
    .map((round) => ({
      ...round,
      comboA: round.comboAId ? comboIndex.value.get(round.comboAId) ?? null : null,
      comboB: round.comboBId ? comboIndex.value.get(round.comboBId) ?? null : null,
    }))
    .sort((a, b) => {
      const aTime = a.occurredAtTs ?? 0;
      const bTime = b.occurredAtTs ?? 0;
      return bTime - aTime;
    })
    .slice(0, 8),
);

const bladersLeaderboard = computed(() =>
  bladersStore.items
    .map((blader) => {
      const stats = blader.stats ?? {};
      return {
        id: blader.id,
        name: blader.name,
        nickname: blader.nickname,
        team: blader.team,
        country: blader.country || 'Indefinido',
        deckCount: blader.deckCount ?? (blader.decks?.length ?? 0),
        combosUsed: blader.combosUsed ?? [],
        lastBattleAt: blader.lastBattleAt ? new Date(blader.lastBattleAt).getTime() : null,
        stats: {
          total: stats.total ?? 0,
          wins: stats.wins ?? 0,
          losses: stats.losses ?? 0,
          draws: stats.draws ?? 0,
          winrate: stats.winrate ?? 0,
        },
      };
    })
    .filter((entry) => entry.stats.total > 0)
    .sort((a, b) => (b.stats.winrate === a.stats.winrate ? b.stats.total - a.stats.total : b.stats.winrate - a.stats.winrate)),
);

const bladerAggregateStats = computed(() =>
  bladersLeaderboard.value.reduce(
    (acc, entry) => {
      acc.totalRounds += entry.stats.total;
      acc.totalWins += entry.stats.wins;
      acc.totalPilots += 1;
      acc.winrateSum += entry.stats.winrate;
      return acc;
    },
    { totalRounds: 0, totalWins: 0, totalPilots: 0, winrateSum: 0 },
  ),
);

const bladerSummaryCards = computed(() => {
  const aggregate = bladerAggregateStats.value;
  const totalDecks = bladersStore.items.reduce((sum, blader) => sum + (blader.deckCount ?? (blader.decks?.length ?? 0)), 0);
  return [
    {
      label: 'Pilotos ativos',
      value: aggregate.totalPilots,
      helper: `${bladersStore.items.length} cadastrados`,
    },
    {
      label: 'Rodadas acumuladas',
      value: aggregate.totalRounds,
      helper: `${aggregate.totalPilots ? (aggregate.totalRounds / aggregate.totalPilots).toFixed(1) : 0} por piloto`,
    },
    {
      label: 'Winrate médio',
      value: `${aggregate.totalPilots ? (aggregate.winrateSum / aggregate.totalPilots).toFixed(1) : '0.0'}%`,
      helper: `${aggregate.totalWins} vitórias registradas`,
    },
    {
      label: 'Decks vinculados',
      value: totalDecks,
      helper: 'Com pilotos associados',
    },
  ];
});

const bladerPerformanceChartData = computed(() => {
  const top = bladersLeaderboard.value.slice(0, 6);
  if (!top.length) return null;
  return {
    labels: top.map((entry) => entry.name),
    datasets: [
      {
        data: top.map((entry) => entry.stats.winrate),
        backgroundColor: accentPalette.slice(0, top.length),
      },
    ],
  };
});

const bladerCountryBreakdown = computed(() => {
  const map = new Map();
  bladersStore.items.forEach((blader) => {
    const label = blader.country?.trim() || 'Indefinido';
    const stats = blader.stats ?? {};
    const entry = map.get(label) ?? { label, total: 0 };
    entry.total += stats.total ?? 0;
    map.set(label, entry);
  });
  return [...map.values()].filter((entry) => entry.total > 0).sort((a, b) => b.total - a.total).slice(0, 6);
});

const bladerCountryChartData = computed(() => {
  if (!bladerCountryBreakdown.value.length) return null;
  return {
    labels: bladerCountryBreakdown.value.map((entry) => entry.label),
    datasets: [
      {
        data: bladerCountryBreakdown.value.map((entry) => entry.total),
        backgroundColor: chartPalette.slice(0, bladerCountryBreakdown.value.length),
        borderWidth: 0,
      },
    ],
  };
});

const bladerActivityFeed = computed(() =>
  bladersLeaderboard.value
    .filter((entry) => entry.lastBattleAt)
    .sort((a, b) => (b.lastBattleAt ?? 0) - (a.lastBattleAt ?? 0))
    .slice(0, 6),
);
</script>
