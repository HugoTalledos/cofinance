<script setup lang="ts">
import type { Transaction } from '@cofinance/core'

const props = defineProps<{
  transactions: Transaction[]
  resetKeys: unknown[]
  loading: boolean
  error: string | null
  editable: boolean
}>()
defineEmits<{ edit: [tx: Transaction]; remove: [tx: Transaction] }>()

const PAGE_SIZE = 10
const { pageItems, from, to, total, hasPrev, hasNext, prev, next } = usePagination(
  toRef(props, 'transactions'),
  PAGE_SIZE,
  [() => props.resetKeys]
)

const isIncome = (tx: Transaction) => tx.type === 'income'
</script>

<template>
  <div class="bg-surface-container-lowest rounded-lg border border-slate-200 p-4 flex flex-col">
    <p v-if="error" class="py-6 text-body-sm text-red-700">No se pudieron cargar los movimientos.</p>
    <p v-else-if="loading" class="py-6 text-body-sm text-neutral-400">Cargando…</p>
    <p v-else-if="total === 0" class="py-6 text-body-sm text-neutral-400">Sin movimientos para estos filtros</p>
    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-100 text-label-md font-label-md text-neutral-400">
              <th class="py-3 px-4 font-medium">Fecha</th>
              <th class="py-3 px-4 font-medium">Concepto</th>
              <th class="py-3 px-4 font-medium">Medio de pago</th>
              <th class="py-3 px-4 font-medium">Categoría</th>
              <th class="py-3 px-4 font-medium text-right">Monto</th>
              <th v-if="editable" class="py-3 px-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="tx in pageItems" :key="tx.id">
              <td class="py-3 px-4 text-body-sm text-neutral-600 whitespace-nowrap">{{ formatTxDate(tx) }}</td>
              <td class="py-3 px-4 text-body-sm font-medium text-neutral-900">{{ tx.description }}</td>
              <td class="py-3 px-4 text-body-sm text-neutral-500">{{ paymentMethodLabel(tx) }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded text-label-md font-label-md bg-neutral-100 text-neutral-700 border border-slate-200">
                  {{ tx.type === 'card_payment' ? 'Pago de tarjeta' : isIncome(tx) ? 'Ingreso' : tx.categoryName }}
                </span>
              </td>
              <td
                class="py-3 px-4 text-right text-numeric-md font-numeric-md whitespace-nowrap"
                :class="isIncome(tx) ? 'text-emerald-700' : 'text-neutral-900'"
              >
                {{ isIncome(tx) ? '+' : '−' }}{{ formatCOP(tx.amount) }}
              </td>
              <td v-if="editable" class="py-3 px-4 text-right">
                <button
                  type="button"
                  title="Editar"
                  class="w-8 h-8 inline-flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  @click="tx.type === 'card_payment' ? navigateTo('/tarjetas') : $emit('edit', tx)"
                >
                  <span class="material-symbols-outlined text-base">edit</span>
                </button>
                <button type="button" :aria-label="`Eliminar ${tx.description}`" title="Eliminar movimiento" class="w-8 h-8 inline-flex items-center justify-center rounded-md text-red-700 hover:bg-red-50" @click="$emit('remove', tx)">
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-body-sm text-neutral-500">
        <span>Mostrando {{ from }}–{{ to }} de {{ total }}</span>
        <div class="flex gap-2">
          <button
            class="px-3 h-8 rounded-md bg-white border border-slate-200 text-label-md font-label-md disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-neutral-50"
            :disabled="!hasPrev"
            @click="prev"
          >
            Anterior
          </button>
          <button
            class="px-3 h-8 rounded-md bg-white border border-slate-200 text-label-md font-label-md disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-neutral-50"
            :disabled="!hasNext"
            @click="next"
          >
            Siguiente
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
