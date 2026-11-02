<script setup lang="ts">
import { formatBillingPeriodLabel } from '@cofinance/core'
import type { RankingRow } from '@cofinance/core'

defineProps<{ rows: RankingRow[]; periodKey: string; loading: boolean; error: string | null }>()

const tone = (change: number | null) => {
  if (change === null || change === 0) return 'text-neutral-600'
  return change > 0 ? 'text-red-700' : 'text-emerald-700'
}
</script>

<template>
  <div class="lg:col-span-5 bg-surface-container-lowest rounded-lg border border-slate-200 p-4 flex flex-col">
    <div class="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
      <div>
        <h2 class="text-headline-sm font-headline-sm font-semibold text-neutral-900">Ranking: Mayores Gastos</h2>
        <p class="text-body-sm text-neutral-500">Presupuesto consumido y variación porcentual.</p>
      </div>
      <span class="text-label-sm font-label-sm px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium border border-slate-200 whitespace-nowrap">
        {{ formatBillingPeriodLabel(periodKey) }}
      </span>
    </div>

    <p v-if="error" class="py-6 text-body-sm text-red-700">No se pudieron cargar los movimientos.</p>
    <p v-else-if="loading" class="py-6 text-body-sm text-neutral-400">Cargando…</p>
    <p v-else-if="rows.length === 0" class="py-6 text-body-sm text-neutral-400">Sin movimientos en este periodo</p>
    <div v-else class="flex flex-col divide-y divide-slate-100 mt-2">
      <div v-for="(row, i) in rows" :key="row.categoryId" class="py-2.5 flex flex-col gap-1.5">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-4 text-label-sm font-label-sm text-neutral-400">{{ String(i + 1).padStart(2, '0') }}</span>
            <div class="w-7 h-7 rounded bg-neutral-100 border border-slate-200 flex items-center justify-center text-sm shrink-0">
              {{ row.icon }}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-body-sm font-medium text-neutral-900 truncate">{{ row.name }}</span>
              <span v-if="row.budget !== null" class="text-label-sm font-label-sm text-neutral-400">
                Presupuesto: {{ formatCOP(row.budget) }}
              </span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-label-md font-label-md font-semibold text-neutral-900">{{ formatCOP(row.current) }}</div>
            <span v-if="row.percentUsed !== null" class="text-label-sm font-label-sm text-neutral-500">
              {{ Math.round(row.percentUsed) }}% consumido
            </span>
          </div>
        </div>
        <div v-if="row.budget !== null" class="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
          <div
            class="h-full rounded-full"
            :class="(row.percentUsed ?? 0) > 100 ? 'bg-red-700' : 'bg-neutral-900'"
            :style="{ width: `${Math.min(100, row.percentUsed ?? 0)}%` }"
          />
        </div>
        <div v-if="row.change !== null" class="flex justify-end text-label-sm font-label-sm text-xs">
          <span class="font-medium" :class="tone(row.change)">{{ formatPercent(row.change) }} vs periodo anterior</span>
        </div>
      </div>
    </div>
  </div>
</template>
