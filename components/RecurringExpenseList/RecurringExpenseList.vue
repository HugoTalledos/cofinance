<script setup lang="ts">
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import { useRecurringExpenses } from '~/composables/useRecurringExpenses'
import { useCategories } from '~/composables/useCategories'
import { useRecurringList } from './useRecurringList'
import type { RecurringExpense } from '~/types'

const emit = defineEmits<{
  (e: 'paid', expense: RecurringExpense, amount: number): void
}>()

const { expenses, loading, pendingExpenses, paidExpenses, paidAmount, paidAt } = useRecurringExpenses()
const { categories } = useCategories()
const {
  showAmountPopup,
  popupAmount,
  pendingExpenseName,
  handleTap,
  confirmVariableAmount,
  cancelAmountPopup,
} = useRecurringList((expense, amount) => emit('paid', expense, amount))

const categoryIcon = (expense: RecurringExpense) =>
  categories.value.find(category => category.id === expense.categoryId)?.icon || '🔁'

const formatShortDate = (ts: number) =>
  new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
</script>

<template>
  <section v-if="loading" class="flex justify-center py-8">
    <span class="text-on-surface-variant text-body-md">Cargando...</span>
  </section>

  <section
    v-else-if="expenses.length === 0"
    class="flex flex-col items-center gap-3 py-10 text-center rounded-xl border border-dashed border-outline-variant"
  >
    <span class="text-4xl">🔁</span>
    <p class="text-on-surface-variant text-body-md">No tienes gastos recurrentes.<br>Puedes crearlos desde la app web.</p>
  </section>

  <template v-else>
    <section v-if="pendingExpenses.length" class="flex flex-col gap-2">
      <div class="flex items-center justify-between pb-1">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-error" />
          <h3 class="text-title-md text-on-surface">Pendientes este periodo</h3>
        </div>
        <span class="text-label-sm text-on-surface-variant font-medium">{{ pendingExpenses.length }} programados</span>
      </div>

      <article
        v-for="expense in pendingExpenses"
        :key="expense.id"
        class="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 shadow-sm flex flex-col gap-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
              {{ categoryIcon(expense) }}
            </span>
            <div class="min-w-0">
              <h4 class="text-title-md text-on-surface leading-tight truncate">{{ expense.name }}</h4>
              <span
                v-if="expense.categoryName"
                class="inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-container text-on-surface-variant"
              >{{ expense.categoryName }}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span
              v-if="expense.fixedAmount !== null"
              class="font-display text-headline-sm font-bold tracking-tight tabular-nums"
            >{{ formatCurrency(expense.fixedAmount) }}</span>
            <template v-else>
              <span class="block text-label-md text-on-surface-variant">Monto variable</span>
              <span
                v-if="expense.lastPaidAmount != null"
                class="block text-label-sm text-on-surface-variant font-normal tabular-nums"
              >Último: {{ formatCurrency(expense.lastPaidAmount) }}</span>
            </template>
          </div>
        </div>
        <button
          type="button"
          class="w-full h-11 bg-black text-white rounded-lg text-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all hover:bg-neutral-800 shadow-sm"
          @click="handleTap(expense)"
        >
          <app-icon name="bolt" :size="16" />
          Registrar pago
        </button>
      </article>
    </section>

    <section v-if="paidExpenses.length" class="flex flex-col gap-2 pt-2">
      <div class="flex items-center justify-between pb-1">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-secondary" />
          <h3 class="text-title-md text-on-surface">Ya registrados este periodo</h3>
        </div>
        <span class="text-label-sm text-on-surface-variant font-medium">{{ paidExpenses.length }} completados</span>
      </div>

      <article
        v-for="expense in paidExpenses"
        :key="expense.id"
        class="bg-surface-container-lowest/80 border border-outline-variant/40 rounded-xl p-4 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-10 h-10 rounded-full bg-surface-container-low/60 flex items-center justify-center shrink-0">
            {{ categoryIcon(expense) }}
          </span>
          <div class="min-w-0">
            <h4 class="text-title-md text-on-surface leading-tight truncate">{{ expense.name }}</h4>
            <p v-if="paidAt(expense.id)" class="text-label-md text-on-surface-variant mt-0.5">
              Pagado el {{ formatShortDate(paidAt(expense.id)!) }}
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1 shrink-0">
          <span v-if="paidAmount(expense.id) !== null" class="text-title-md font-bold tabular-nums">
            {{ formatCurrency(paidAmount(expense.id)!) }}
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm bg-secondary-container/40 text-on-secondary-container">
            Registrado
            <app-icon name="check" :size="12" />
          </span>
        </div>
      </article>
    </section>
  </template>

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
