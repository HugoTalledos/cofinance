<script setup lang="ts">
import { parseDateString, type Transaction } from '@cofinance/core'

const props = defineProps<{
  movements: Transaction[]
  periodKey: string
  creditCardId: string | null
  loading: boolean
  error: string | null
}>()

const PAGE_SIZE = 10
const page = ref(1)

watch(() => [props.periodKey, props.creditCardId], () => { page.value = 1 })

const total = computed(() => props.movements.length)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const from = computed(() => (total.value === 0 ? 0 : (page.value - 1) * PAGE_SIZE + 1))
const to = computed(() => Math.min(page.value * PAGE_SIZE, total.value))
const visible = computed(() => props.movements.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const isIncome = (tx: Transaction) => tx.type === 'income'
const formatDate = (tx: Transaction) =>
  parseDateString(tx.date.substring(0, 10)).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
const method = (tx: Transaction) => {
  if (tx.paymentMethod === 'debit_card') return 'Débito'
  if (tx.paymentMethod === 'credit_card') return tx.creditCardBank ? `Crédito · ${tx.creditCardBank}` : 'Crédito'
  return ''
}
</script>

<template>
  <div class="bg-surface-container-lowest rounded-lg border border-slate-200 p-4 flex flex-col">
    <div class="border-b border-slate-100 pb-3">
      <h2 class="text-headline-sm font-headline-sm font-semibold text-neutral-900">Últimos Movimientos</h2>
      <p class="text-body-sm text-neutral-500">Registros del periodo seleccionado.</p>
    </div>

    <p v-if="error" class="py-6 text-body-sm text-red-700">No se pudieron cargar los movimientos.</p>
    <p v-else-if="loading" class="py-6 text-body-sm text-neutral-400">Cargando…</p>
    <p v-else-if="total === 0" class="py-6 text-body-sm text-neutral-400">Sin movimientos en este periodo</p>
    <template v-else>
      <div class="overflow-x-auto mt-2">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-100 text-label-md font-label-md text-neutral-400">
              <th class="py-2 px-2.5 font-medium">Concepto</th>
              <th class="py-2 px-2.5 font-medium">Categoría</th>
              <th class="py-2 px-2.5 font-medium">Fecha</th>
              <th class="py-2 px-2.5 font-medium">Medio de pago</th>
              <th class="py-2 px-2.5 font-medium text-right">Importe</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="tx in visible" :key="tx.id">
              <td class="py-2.5 px-2.5 text-body-sm font-medium text-neutral-900">{{ tx.description }}</td>
              <td class="py-2.5 px-2.5">
                <span class="px-2 py-0.5 rounded text-label-md font-label-md bg-neutral-100 text-neutral-700 border border-slate-200">
                  {{ isIncome(tx) ? 'Ingreso' : tx.categoryName }}
                </span>
              </td>
              <td class="py-2.5 px-2.5 text-body-sm text-neutral-600 whitespace-nowrap">{{ formatDate(tx) }}</td>
              <td class="py-2.5 px-2.5 text-body-sm text-neutral-500">{{ method(tx) }}</td>
              <td
                class="py-2.5 px-2.5 text-right text-numeric-md font-numeric-md whitespace-nowrap"
                :class="isIncome(tx) ? 'text-emerald-700' : 'text-neutral-900'"
              >
                {{ isIncome(tx) ? '+' : '−' }}{{ formatCOP(tx.amount) }}
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
            :disabled="page <= 1"
            @click="page--"
          >
            Anterior
          </button>
          <button
            class="px-3 h-8 rounded-md bg-white border border-slate-200 text-label-md font-label-md disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-neutral-50"
            :disabled="page >= pageCount"
            @click="page++"
          >
            Siguiente
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
