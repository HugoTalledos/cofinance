<script setup lang="ts">
import type { CategoryComparisonRow } from '@cofinance/core'

const props = defineProps<{ rows: CategoryComparisonRow[]; loading: boolean; error: string | null }>()

// Resumen: las categorías que más subieron y más bajaron, por diferencia en pesos
const MOVERS_LIMIT = 3
const delta = (row: CategoryComparisonRow) => row.current - row.previous
const wentUp = computed(() =>
  props.rows.filter(r => delta(r) > 0).sort((a, b) => delta(b) - delta(a)).slice(0, MOVERS_LIMIT)
)
const wentDown = computed(() =>
  props.rows.filter(r => delta(r) < 0).sort((a, b) => delta(a) - delta(b)).slice(0, MOVERS_LIMIT)
)
// Sin gasto en el periodo anterior no hay % que calcular: es una categoría nueva
const moverDetail = (row: CategoryComparisonRow) =>
  row.change === null ? 'nuevo' : formatPercent(row.change)
const max = computed(() => Math.max(1, ...props.rows.map(r => Math.max(r.current, r.previous))))
const width = (v: number) => `${Math.min(100, (v / max.value) * 100)}%`

// En gastos, subir es malo
const badge = (change: number | null) => {
  if (change === null || change === 0) return 'bg-neutral-100 text-neutral-700 border-slate-200'
  return change > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
}
const pct = (change: number | null) => (change === null ? '—' : formatPercent(change))
</script>

<template>
  <div class="bg-surface-container-lowest rounded-lg border border-slate-200 p-4 flex flex-col">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-slate-100 pb-3">
      <div>
        <h2 class="text-headline-sm font-headline-sm font-semibold text-neutral-900">Comparativa de Gastos por Periodo</h2>
        <p class="text-body-sm text-neutral-500">Evolución frente al periodo anterior por categoría.</p>
      </div>
      <div class="flex items-center gap-space-xs self-start sm:self-auto">
        <span class="flex items-center gap-1.5 text-label-sm font-label-sm text-neutral-500">
          <span class="w-2 h-2 rounded-full bg-neutral-900" /> Periodo actual
        </span>
        <span class="flex items-center gap-1.5 text-label-sm font-label-sm text-neutral-400 ml-3">
          <span class="w-2 h-2 rounded-full bg-slate-300" /> Periodo anterior
        </span>
      </div>
    </div>

    <p v-if="error" class="py-6 text-body-sm text-red-700">No se pudieron cargar los movimientos.</p>
    <p v-else-if="loading" class="py-6 text-body-sm text-neutral-400">Cargando…</p>
    <p v-else-if="rows.length === 0" class="py-6 text-body-sm text-neutral-400">Sin movimientos en este periodo</p>
    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
        <div
          v-for="group in [
            { title: 'Subieron', rows: wentUp, sign: '+', tone: 'text-red-700', empty: 'Ninguna categoría subió' },
            { title: 'Bajaron', rows: wentDown, sign: '−', tone: 'text-emerald-700', empty: 'Ninguna categoría bajó' },
          ]"
          :key="group.title"
          class="py-2 px-3 rounded-md bg-neutral-50 border border-slate-200/70"
        >
          <p class="text-label-sm font-label-sm uppercase text-neutral-400 mb-1">{{ group.title }}</p>
          <p v-if="group.rows.length === 0" class="text-body-sm text-neutral-400">{{ group.empty }}</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="row in group.rows" :key="row.categoryId" class="flex justify-between items-center gap-2 text-body-sm">
              <span class="text-neutral-800 truncate">{{ row.icon }} {{ row.name }}</span>
              <span class="text-label-md font-label-md font-semibold shrink-0" :class="group.tone">
                {{ group.sign }}{{ formatCOP(Math.abs(delta(row))) }}
                <span class="font-normal text-neutral-400">· {{ moverDetail(row) }}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col gap-3 my-1">
        <div v-for="row in rows" :key="row.categoryId" class="flex flex-col gap-1">
          <div class="flex justify-between items-center text-body-sm gap-2">
            <span class="text-neutral-800 font-medium flex items-center gap-1.5 min-w-0">
              <span>{{ row.icon }}</span>
              <span class="truncate">{{ row.name }}</span>
            </span>
            <div class="flex items-center gap-2 text-label-md font-label-md shrink-0">
              <span class="text-neutral-900 font-semibold">{{ formatCOP(row.current) }}</span>
              <span class="text-neutral-400 text-xs">vs {{ formatCOP(row.previous) }}</span>
              <span class="px-1.5 rounded text-[11px] border" :class="badge(row.change)">{{ pct(row.change) }}</span>
            </div>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div class="bg-neutral-900 h-full rounded-full" :style="{ width: width(row.current) }" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
