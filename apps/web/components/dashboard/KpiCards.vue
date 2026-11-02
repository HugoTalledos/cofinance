<script setup lang="ts">
import type { Kpi } from '~/composables/useDashboardData'

const props = defineProps<{
  kpis: { income: Kpi; spent: Kpi; saved: Kpi; remaining: Kpi }
  cardBank: string | null
  loading: boolean
}>()

const items = computed(() => [
  { label: 'Restante', icon: 'account_balance', kpi: props.kpis.remaining, upIsBad: false },
  { label: 'Ingresos del periodo', icon: 'arrow_downward', kpi: props.kpis.income, upIsBad: false },
  {
    label: `Gastos del periodo${props.cardBank ? ` · ${props.cardBank}` : ''}`,
    icon: 'arrow_upward',
    kpi: props.kpis.spent,
    upIsBad: true
  },
  { label: 'Apartado', icon: 'savings', kpi: props.kpis.saved, upIsBad: false }
])

const tone = (change: number, upIsBad: boolean) => {
  if (change === 0) return 'text-neutral-500'
  return (change > 0) !== upIsBad ? 'text-emerald-700' : 'text-red-700'
}
</script>

<template>
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="item in items"
      :key="item.label"
      class="bg-surface-container-lowest rounded-lg border border-slate-200 p-4 flex flex-col justify-between"
    >
      <div class="flex items-center justify-between">
        <span class="text-label-sm font-label-sm text-neutral-400 uppercase tracking-wider">{{ item.label }}</span>
        <span class="material-symbols-outlined text-base text-neutral-400">{{ item.icon }}</span>
      </div>
      <div class="my-3">
        <div v-if="loading" class="h-7 w-32 bg-slate-100 rounded animate-pulse" />
        <div v-else class="text-numeric-lg font-numeric-lg text-neutral-900 font-semibold tracking-tight">
          {{ formatCOP(item.kpi.value) }}
        </div>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-slate-100 min-h-[2rem]">
        <template v-if="!loading && item.kpi.change !== null">
          <span class="text-label-sm font-label-sm font-medium" :class="tone(item.kpi.change, item.upIsBad)">
            {{ formatPercent(item.kpi.change) }}
          </span>
          <span class="text-body-sm text-neutral-400 text-xs">vs periodo anterior</span>
        </template>
      </div>
    </div>
  </section>
</template>
