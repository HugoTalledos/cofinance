<script setup lang="ts">
import type { Category, RecurringExpense } from '@cofinance/core'
const props = defineProps<{
  expenses: RecurringExpense[]
  categories: Category[]
  loading: boolean
  error: string | null
}>()
defineEmits<{ edit: [expense: RecurringExpense]; remove: [expense: RecurringExpense] }>()
const categoryById = computed(() => new Map(props.categories.map(category => [category.id, category])))
const paymentLabel = (expense: RecurringExpense) => {
  if (expense.paymentMethod === 'debit_card') return 'Débito'
  if (expense.paymentMethod === 'credit_card') return expense.creditCardBank ? `Crédito · ${expense.creditCardBank}` : 'Crédito'
  return 'Sin medio de pago'
}
</script>

<template>
  <div class="bg-white border border-outline-variant/40 rounded-xl overflow-hidden">
    <p v-if="loading" class="p-6 text-body-sm text-neutral-500" role="status">Cargando…</p>
    <p v-else-if="error" class="p-6 text-body-sm text-red-700" role="alert">{{ error }}</p>
    <div v-else-if="expenses.length === 0" class="p-10 text-center text-neutral-500">
      <span class="material-symbols-outlined text-3xl mb-2">event_repeat</span>
      <p class="text-body-sm">Aún no hay pagos recurrentes</p>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-body-sm whitespace-nowrap">
        <thead class="bg-neutral-50 text-neutral-500 text-label-sm border-b border-outline-variant/30">
          <tr>
            <th class="px-5 py-3 font-medium" scope="col">Nombre</th>
            <th class="px-5 py-3 font-medium" scope="col">Categoría</th>
            <th class="px-5 py-3 font-medium text-right" scope="col">Monto</th>
            <th class="px-5 py-3 font-medium" scope="col">Medio de pago</th>
            <th class="px-5 py-3 font-medium" scope="col">Recordatorio</th>
            <th class="px-5 py-3 font-medium text-right" scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/20">
          <tr v-for="expense in expenses" :key="expense.id" class="hover:bg-neutral-50/60 transition-colors">
            <td class="px-5 py-4 max-w-xs whitespace-normal break-words">
              <span class="font-medium text-neutral-900">{{ expense.name }}</span>
              <p v-if="expense.description" class="text-label-sm text-neutral-500 mt-0.5">{{ expense.description }}</p>
            </td>
            <td class="px-5 py-4 text-neutral-600">
              <span v-if="categoryById.get(expense.categoryId)?.icon" class="mr-1.5">{{ categoryById.get(expense.categoryId)?.icon }}</span>
              {{ categoryById.get(expense.categoryId)?.name ?? expense.categoryName }}
            </td>
            <td class="px-5 py-4 text-right text-neutral-900 tabular-nums">
              {{ expense.fixedAmount === null ? 'Variable' : formatCOP(expense.fixedAmount) }}
            </td>
            <td class="px-5 py-4">
              <span :class="expense.paymentMethod ? 'text-neutral-600' : 'bg-amber-50 text-amber-800 rounded-md px-2 py-1 text-label-sm'">
                {{ paymentLabel(expense) }}
              </span>
            </td>
            <td class="px-5 py-4 text-neutral-500">{{ expense.reminderDay == null ? '—' : `Día ${expense.reminderDay}` }}</td>
            <td class="px-5 py-4 text-right">
              <button type="button" title="Editar" :aria-label="`Editar ${expense.name}`" class="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100" @click="$emit('edit', expense)">
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button type="button" title="Eliminar" :aria-label="`Eliminar ${expense.name}`" class="p-1.5 rounded-lg text-neutral-500 hover:text-red-700 hover:bg-red-50" @click="$emit('remove', expense)">
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
