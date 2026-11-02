<script setup lang="ts">
import type { RecurringExpense } from '@cofinance/core'

type Item = RecurringExpense & { paid: boolean; displayAmount: number | null }
defineProps<{ items: Item[]; loading: boolean; error: string | null }>()
</script>

<template>
  <div class="lg:col-span-4 bg-surface-container-lowest rounded-lg border border-slate-200 p-4 flex flex-col">
    <div class="border-b border-slate-100 pb-3">
      <h2 class="text-headline-sm font-headline-sm font-semibold text-neutral-900">Pagos habituales</h2>
      <p class="text-body-sm text-neutral-500">Estado de este periodo</p>
    </div>

    <p v-if="error" class="py-6 text-body-sm text-red-700">No se pudieron cargar los pagos habituales.</p>
    <p v-else-if="loading" class="py-6 text-body-sm text-neutral-400">Cargando…</p>
    <p v-else-if="items.length === 0" class="py-6 text-body-sm text-neutral-400">Sin pagos habituales</p>
    <div v-else class="flex flex-col gap-3 mt-3">
      <div v-for="item in items" :key="item.id" class="rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="text-body-md font-medium text-neutral-900 truncate">{{ item.name }}</div>
          <div class="text-body-sm text-neutral-400 truncate">{{ item.categoryName }}</div>
        </div>
        <div class="text-right shrink-0 flex flex-col items-end gap-1">
          <span class="text-label-md font-label-md font-semibold text-neutral-900">
            {{ item.displayAmount !== null ? formatCOP(item.displayAmount) : 'Variable' }}
          </span>
          <span
            class="px-2 py-0.5 rounded text-[11px] border"
            :class="item.paid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-700 border-slate-200'"
          >
            {{ item.paid ? 'Pagado' : 'Pendiente' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
