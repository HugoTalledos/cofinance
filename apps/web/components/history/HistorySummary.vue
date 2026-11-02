<script setup lang="ts">
import type { HistorySummary } from '@cofinance/core'

const props = defineProps<{ summary: HistorySummary; loading: boolean }>()

const items = computed(() => [
  { label: 'Movimientos', icon: 'receipt_long', value: String(props.summary.count), tone: 'text-neutral-900' },
  { label: 'Ingresos', icon: 'arrow_downward', value: formatCOP(props.summary.income), tone: 'text-emerald-700' },
  { label: 'Egresos', icon: 'arrow_upward', value: formatCOP(props.summary.expenses), tone: 'text-neutral-900' },
  {
    label: 'Flujo neto',
    icon: 'account_balance',
    value: formatCOP(props.summary.net),
    tone: props.summary.net < 0 ? 'text-red-700' : 'text-neutral-900'
  }
])
</script>

<template>
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="item in items"
      :key="item.label"
      class="bg-surface-container-lowest rounded-lg border border-slate-200 p-4 flex flex-col gap-2"
    >
      <div class="flex items-center justify-between text-neutral-500">
        <span class="text-label-md font-label-md">{{ item.label }}</span>
        <span class="material-symbols-outlined text-base">{{ item.icon }}</span>
      </div>
      <span v-if="loading" class="text-numeric-lg font-numeric-lg text-neutral-300">…</span>
      <span v-else class="text-numeric-lg font-numeric-lg" :class="item.tone">{{ item.value }}</span>
    </div>
  </section>
</template>
