<script setup lang="ts">
import type { Category, CreditCard, HistoryFilters, PaymentFilter } from '@cofinance/core'

const props = defineProps<{
  modelValue: HistoryFilters
  categories: Category[]
  creditCards: CreditCard[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: HistoryFilters] }>()

const update = (patch: Partial<HistoryFilters>) => emit('update:modelValue', { ...props.modelValue, ...patch })

const paymentValue = computed(() => {
  const p = props.modelValue.payment
  return p.kind === 'card' ? `card:${p.creditCardId}` : p.kind
})
const onPayment = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  const payment: PaymentFilter =
    v === 'debit' ? { kind: 'debit' } : v.startsWith('card:') ? { kind: 'card', creditCardId: v.slice(5) } : { kind: 'all' }
  update({ payment })
}
const onCategory = (e: Event) => update({ categoryId: (e.target as HTMLSelectElement).value || null })

const types = [
  { value: 'all', label: 'Todos' },
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' }
] as const

const selectClass =
  'h-9 pl-2.5 pr-7 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-sm text-neutral-800 focus:border-neutral-900 focus:ring-0 outline-none cursor-pointer'
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-[220px] max-w-sm">
      <span class="material-symbols-outlined text-base absolute left-2 top-1/2 -translate-y-1/2 text-outline">search</span>
      <input
        class="w-full h-9 pl-8 pr-3 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-sm text-neutral-900 placeholder:text-outline focus:border-neutral-900 focus:ring-0 outline-none transition-all"
        type="text"
        placeholder="Buscar por descripción…"
        :value="modelValue.search"
        @input="update({ search: ($event.target as HTMLInputElement).value })"
      >
    </div>
    <select aria-label="Categoría" :class="selectClass" :value="modelValue.categoryId ?? ''" @change="onCategory">
      <option value="">Todas las categorías</option>
      <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>
    <select aria-label="Medio de pago" :class="selectClass" :value="paymentValue" @change="onPayment">
      <option value="all">Todos los medios</option>
      <option value="debit">Débito</option>
      <option v-for="card in creditCards" :key="card.id" :value="`card:${card.id}`">{{ card.bank }}</option>
    </select>
    <div class="flex items-center gap-1 p-0.5 rounded-lg bg-surface-container">
      <button
        v-for="t in types"
        :key="t.value"
        type="button"
        class="px-3 h-8 rounded-md text-label-md font-label-md"
        :class="modelValue.type === t.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'"
        @click="update({ type: t.value })"
      >
        {{ t.label }}
      </button>
    </div>
  </div>
</template>
