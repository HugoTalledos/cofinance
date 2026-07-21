<script setup lang="ts">
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import { useRecurringExpenses } from '~/composables/useRecurringExpenses'
import { useRecurringList } from './useRecurringList'
import type { RecurringExpense } from '~/types'

withDefaults(defineProps<{ showEdit?: boolean }>(), { showEdit: true })

const emit = defineEmits<{
  (e: 'paid', expense: RecurringExpense, amount: number): void
  (e: 'edit', expense: RecurringExpense): void
}>()

const { expenses, loading, isPaid, paidAmount, paidAt } = useRecurringExpenses()
const {
  showAmountPopup,
  popupAmount,
  pendingExpenseName,
  handleTap,
  confirmVariableAmount,
  cancelAmountPopup,
} = useRecurringList((expense, amount) => emit('paid', expense, amount))
</script>

<template>
  <section v-if="loading" class="flex justify-center py-8">
    <span class="text-gray-400 text-sm">Cargando...</span>
  </section>

  <section v-else-if="expenses.length === 0" class="flex flex-col items-center gap-3 py-12 text-center">
    <span class="text-5xl">🔁</span>
    <p class="text-gray-500 text-sm">No tienes gastos recurrentes.<br>Agrega uno con el botón de abajo.</p>
  </section>

  <ul v-else class="flex flex-col gap-3">
    <li
      v-for="expense in expenses"
      :key="expense.id"
      class="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200"
      :class="isPaid(expense.id)
        ? 'bg-gray-50 border-gray-100 opacity-60'
        : 'bg-white border-gray-200 shadow-sm'"
    >
      <!-- Checkbox -->
      <button
        class="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200"
        :class="isPaid(expense.id)
          ? 'bg-gray-400 border-gray-400'
          : 'border-purple-400 hover:border-purple-600'"
        @click="handleTap(expense)"
      >
        <span v-if="isPaid(expense.id)" class="text-white text-xs font-bold">✓</span>
      </button>

      <!-- Info -->
      <div class="flex-1 min-w-0" @click="handleTap(expense)">
        <p
          class="font-semibold text-gray-800 transition-all duration-200"
          :class="{ 'line-through text-gray-400': isPaid(expense.id) }"
        >{{ expense.name }}</p>

        <p class="text-xs text-gray-400 truncate">{{ expense.categoryName }}</p>

        <p v-if="expense.description" class="text-xs text-gray-400 truncate">{{ expense.description }}</p>

        <!-- Monto -->
        <p class="text-xs mt-0.5 font-medium"
          :class="isPaid(expense.id) ? 'text-gray-400' : 'text-purple-600'"
        >
          <template v-if="isPaid(expense.id) && paidAmount(expense.id) !== null">
            {{ formatCurrency(paidAmount(expense.id)!) }}
          </template>
          <template v-else-if="expense.fixedAmount !== null">
            {{ formatCurrency(expense.fixedAmount) }}
          </template>
          <template v-else>
            Monto variable
          </template>
        </p>

        <!-- Fecha de pago -->
        <p v-if="isPaid(expense.id) && paidAt(expense.id)" class="text-xs text-gray-400 mt-0.5">
          Pagado el {{ new Date(paidAt(expense.id)!).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) }}
        </p>
      </div>

      <!-- Editar -->
      <button
        v-if="showEdit"
        class="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors p-1"
        @click.stop="emit('edit', expense)"
      >
        <span class="text-lg">⋯</span>
      </button>
    </li>
  </ul>

  <!-- BottomSheet: monto variable -->
  <bottom-sheet
    :title="`¿Cuánto pagaste por ${pendingExpenseName}?`"
    allowClose
    :visible="showAmountPopup"
    showActionButtons
    :actionButtons="{
      closeButton: { label: 'Cancelar', icon: 'X', enabled: true, show: true },
      doneButton: { label: 'Confirmar', icon: 'X', enabled: true, show: true },
    }"
    @modalClose="cancelAmountPopup"
    @modalDone="confirmVariableAmount"
    @modalCancel="cancelAmountPopup"
  >
    <template #modal-content>
      <div class="pt-2">
        <input-currency
          id="variable-amount"
          label="Monto pagado este periodo"
          v-model="popupAmount"
        />
      </div>
    </template>
  </bottom-sheet>
</template>
