<script setup lang="ts">
import RecurringExpenseList from '~/components/RecurringExpenseList/RecurringExpenseList.vue'
import { useSummary } from '~/composables/useSummary'
import { useRecurringExpenses } from '~/composables/useRecurringExpenses'

const {
  totalRemaining,
  totalRemainingFormatted,
  totalSpentFormatted,
  fetchCurrentMonthSummary,
  refreshSummary,
} = useSummary()
const { fetchExpenses } = useRecurringExpenses()

onMounted(async () => {
  await Promise.all([fetchCurrentMonthSummary(), fetchExpenses()])
})

function handlePaid() {
  setTimeout(async () => await refreshSummary(), 500)
}
</script>

<template>
  <section class="w-full flex flex-col gap-3">
    <!-- Card protagonista: libre para gastar -->
    <div
      class="w-full rounded-3xl border px-6 py-8 flex flex-col items-center"
      :class="totalRemaining >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'"
    >
      <span class="text-sm font-light text-gray-500 tracking-wide">Libre para gastar</span>
      <span
        class="text-4xl font-bold mt-2"
        :class="totalRemaining >= 0 ? 'text-green-600' : 'text-red-500'"
      >{{ totalRemainingFormatted }}</span>
    </div>

    <!-- Card secundaria: gastado -->
    <div class="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-3 flex items-center justify-between">
      <span class="text-sm text-gray-500">Gastado</span>
      <span class="text-lg font-semibold text-gray-700">{{ totalSpentFormatted }}</span>
    </div>
  </section>

  <section class="w-full">
    <h2 class="text-lg font-semibold text-heading mb-3">Pagos recurrentes</h2>
    <recurring-expense-list :show-edit="false" @paid="handlePaid" />
  </section>
</template>
