<script setup lang="ts">
import type { CategoryComparisonRow } from '@cofinance/core'

const props = defineProps<{ rows: CategoryComparisonRow[]; loading: boolean; error: string | null }>()

const summary = computed(() => props.rows.slice(0, 5))
const max = computed(() => Math.max(1, ...props.rows.map(r => Math.max(r.current, r.previous))))
const width = (v: number) => `${Math.min(100, (v / max.value) * 100)}%`

// En gastos, subir es malo
const tone = (change: number | null) => {
  if (change === null || change === 0) return 'text-neutral-500'
  return change > 0 ? 'text-red-700' : 'text-emerald-700'
}
const badge = (change: number | null) => {
  if (change === null || change === 0) return 'bg-neutral-100 text-neutral-700 border-slate-200'
  return change > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
}
const pct = (change: number | null) => (change === null ? '—' : formatPercent(change))
</script>

<template>
  <div class="lg:col-span-7 bg-surface-container-lowest rounded-lg border border-slate-200 p-4 flex flex-col">
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
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 py-2 px-3 rounded-md bg-neutral-50 border border-slate-200/70 text-center">
        <div v-for="row in summary" :key="row.categoryId" class="flex flex-col items-center min-w-0">
          <span class="text-label-sm font-label-sm text-neutral-400 truncate max-w-full">{{ row.name }}</span>
          <span class="text-label-md font-label-md font-semibold mt-0.5" :class="tone(row.change)">{{ pct(row.change) }}</span>
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
