<script setup lang="ts">
import AppShell from '~/components/AppShell/AppShell.vue'
import RecurringExpenseList from '~/components/RecurringExpenseList/RecurringExpenseList.vue'
import { useRecurringExpenses } from '~/composables/useRecurringExpenses'
import { useCategories } from '~/composables/useCategories'

const { expenses, pendingExpenses, paidCount, pendingTotal, fetchExpenses } = useRecurringExpenses()
const { fetchCategories } = useCategories()
const { refreshSummary } = useSummary()

onMounted(async () => {
  await Promise.all([fetchExpenses(), fetchCategories()])
})

const paidProgress = computed(() =>
  expenses.value.length ? (paidCount.value / expenses.value.length) * 100 : 0
)

const pendingLabel = computed(() => {
  const count = pendingExpenses.value.length
  if (count === 0) return 'Todo registrado este periodo'
  return `${count} ${count === 1 ? 'pendiente' : 'pendientes'} de registrar este periodo`
})

function handlePaid() {
  setTimeout(async () => await refreshSummary(), 500)
}
</script>

<template>
  <app-shell>
    <div class="pt-2 flex flex-col gap-1">
      <h2 class="font-display text-headline-lg tracking-tight">Pagos Recurrentes</h2>
      <p class="text-body-md text-on-surface-variant">Atajos de 1 toque para registrar tus gastos habituales.</p>
    </div>

    <section
      v-if="expenses.length"
      class="bg-primary-container text-white rounded-xl p-4 shadow-sm border border-white/10"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-surface-container-high/20 flex items-center justify-center text-secondary-fixed shrink-0">
            <app-icon name="sync" :size="16" />
          </span>
          <div>
            <p class="text-label-sm text-on-primary-container uppercase">Balance pendiente</p>
            <p class="text-title-md">{{ pendingLabel }}</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="font-display text-headline-sm font-bold tracking-tight text-secondary-fixed tabular-nums">
            {{ formatCurrency(pendingTotal) }}
          </span>
          <p class="text-label-sm text-on-primary-container">faltantes</p>
        </div>
      </div>
      <div class="mt-3.5 w-full bg-surface-container-high/20 h-1 rounded-full overflow-hidden">
        <div class="bg-secondary-fixed h-full rounded-full transition-all duration-500" :style="{ width: `${paidProgress}%` }" />
      </div>
    </section>

    <recurring-expense-list @paid="handlePaid" />
  </app-shell>
</template>
