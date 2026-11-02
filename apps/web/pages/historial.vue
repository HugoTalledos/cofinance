<script setup lang="ts">
import {
  filterHistory,
  formatBillingPeriodLabel,
  getCurrentBillingPeriodKey,
  summarizeHistory,
  type HistoryFilters
} from '@cofinance/core'

const { user } = useAuth()

const periodKey = ref(getCurrentBillingPeriodKey())
const filters = ref<HistoryFilters>({
  search: '',
  categoryId: null,
  payment: { kind: 'all' },
  type: 'all'
})

const { loading, error, transactions, categories, creditCards } = useHistoryData(periodKey)

const filtered = computed(() => filterHistory(transactions.value, filters.value))
const summary = computed(() => summarizeHistory(filtered.value))

// La tabla vuelve a la página 1 al cambiar periodo o cualquier filtro
const resetKeys = computed(() => [
  periodKey.value,
  filters.value.search,
  filters.value.categoryId,
  filters.value.payment.kind,
  filters.value.payment.kind === 'card' ? filters.value.payment.creditCardId : null,
  filters.value.type
])
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex items-center justify-between w-full gap-2">
        <div class="flex items-center gap-4">
          <h1 class="text-headline-sm font-headline-sm font-semibold text-neutral-900">Historial de Transacciones</h1>
          <DashboardPeriodSelect v-model="periodKey" />
        </div>
        <img
          v-if="user?.photoURL"
          :src="user.photoURL"
          alt=""
          referrerpolicy="no-referrer"
          class="w-7 h-7 rounded-full object-cover border border-slate-200"
        >
      </div>
    </template>
    <div class="flex flex-col gap-5 max-w-[1400px] mx-auto w-full">
      <p class="text-body-sm text-neutral-500">{{ formatBillingPeriodLabel(periodKey) }}</p>
      <HistorySummary :summary="summary" :loading="loading" />
      <HistoryFilters v-model="filters" :categories="categories" :credit-cards="creditCards" />
      <HistoryTable
        :transactions="filtered"
        :reset-keys="resetKeys"
        :loading="loading"
        :error="error"
        :editable="false"
      />
    </div>
  </AppShell>
</template>
