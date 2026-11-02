<script setup lang="ts">
import { formatBillingPeriodLabel, getCurrentBillingPeriodKey } from '@cofinance/core'

const { user } = useAuth()

const periodKey = ref(getCurrentBillingPeriodKey())
const creditCardId = ref<string | null>(null)

const { loading, errors, creditCards, kpis, comparison, ranking, movements, recurring } =
  useDashboardData(periodKey, creditCardId)

// Sin categorías no se distingue ahorro de gasto: KPIs, comparativa y ranking no son confiables
const amountsError = computed(() => errors.value.transactions ?? errors.value.categories)

const cardBank = computed(() => creditCards.value.find(c => c.id === creditCardId.value)?.bank ?? null)
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex items-center justify-between w-full gap-2">
        <div class="flex items-center gap-2">
          <DashboardPeriodSelect v-model="periodKey" />
          <DashboardCardSelect v-model="creditCardId" :cards="creditCards" />
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
      <section class="flex flex-col gap-0.5 border-b border-slate-200 pb-4">
        <h1 class="text-headline-lg font-headline-lg text-neutral-900 tracking-tight font-semibold">Dashboard General</h1>
        <p class="text-body-sm text-neutral-500">{{ formatBillingPeriodLabel(periodKey) }}</p>
      </section>
      <DashboardKpiCards :kpis="kpis" :card-bank="cardBank" :loading="loading" :error="amountsError" />
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <DashboardCategoryComparison :rows="comparison" :loading="loading" :error="amountsError" />
        <DashboardSpendingRanking :rows="ranking" :period-key="periodKey" :loading="loading" :error="amountsError" />
      </section>
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <DashboardRecentMovements
          :movements="movements"
          :period-key="periodKey"
          :credit-card-id="creditCardId"
          :loading="loading"
          :error="errors.transactions"
        />
        <DashboardRecurringPayments :items="recurring" :loading="loading" :error="errors.recurring" />
      </section>
    </div>
  </AppShell>
</template>
