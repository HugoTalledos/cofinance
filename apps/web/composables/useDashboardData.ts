import { computed, ref, watch, type Ref } from 'vue'
import {
  buildCategoryComparison,
  buildSpendingRanking,
  computePeriodTotals,
  getBillingPeriodRangeFromKey,
  getCategories,
  getCreditCards,
  getCurrentBillingPeriodKey,
  getPreviousMonth,
  getRecurringExpenses,
  getSpendingTransactions,
  getTransactions,
  isPaidInPeriod,
  percentChange,
  type Category,
  type CreditCard,
  type RecurringExpense,
  type Transaction
} from '@cofinance/core'

/** Cuántas categorías muestra el ranking de mayores gastos */
const RANKING_LIMIT = 5

export interface Kpi {
  value: number
  change: number | null
}

const sumAmounts = (txs: Transaction[]): number => txs.reduce((acc, tx) => acc + tx.amount, 0)

export function useDashboardData(periodKey: Ref<string>, creditCardId: Ref<string | null>) {
  const loading = ref(true)
  const errors = ref<{
    transactions: string | null
    categories: string | null
    recurring: string | null
  }>({
    transactions: null,
    categories: null,
    recurring: null
  })
  const categories = ref<Category[]>([])
  const creditCards = ref<CreditCard[]>([])
  const recurringRaw = ref<RecurringExpense[]>([])
  const currentTxs = ref<Transaction[]>([])
  const previousTxs = ref<Transaction[]>([])

  // Categorías, tarjetas y recurrentes se cargan una sola vez
  const staticLoad = Promise.all([getCategories(), getCreditCards(), getRecurringExpenses()]).then(
    ([cats, cards, rec]) => {
      categories.value = cats.data ?? []
      errors.value.categories = cats.error
      creditCards.value = cards.data ?? []
      recurringRaw.value = rec.data ?? []
      errors.value.recurring = rec.error
    }
  )

  // Evita que una respuesta antigua pise a una más reciente
  let requestId = 0

  const loadTransactions = async (key: string) => {
    const id = ++requestId
    loading.value = true
    errors.value.transactions = null
    const currentRange = getBillingPeriodRangeFromKey(key)
    const previousRange = getBillingPeriodRangeFromKey(getPreviousMonth(key))
    const result = await getTransactions({
      dateFrom: previousRange.startDate,
      dateTo: currentRange.endDate
    })
    await staticLoad
    if (id !== requestId) return

    const all = result.data ?? []
    currentTxs.value = all.filter(tx => tx.date.substring(0, 10) >= currentRange.startDate)
    // Paridad con móvil: su consulta del periodo anterior usa `date <= endDate` (comparación
    // de strings completos), así que un ISO completo del último día queda fuera.
    previousTxs.value = all.filter(
      tx => tx.date.substring(0, 10) < currentRange.startDate && tx.date <= previousRange.endDate
    )
    errors.value.transactions = result.error
    loading.value = false
  }

  watch(periodKey, key => loadTransactions(key), { immediate: true })

  const currentTotals = computed(() => computePeriodTotals(currentTxs.value, categories.value))
  const previousTotals = computed(() => computePeriodTotals(previousTxs.value, categories.value))

  const currentSpending = computed(() =>
    getSpendingTransactions(currentTxs.value, categories.value, creditCardId.value)
  )
  const previousSpending = computed(() =>
    getSpendingTransactions(previousTxs.value, categories.value, creditCardId.value)
  )

  const kpis = computed(() => {
    const cur = currentTotals.value
    const prev = previousTotals.value
    const spent = sumAmounts(currentSpending.value)
    const prevSpent = sumAmounts(previousSpending.value)
    return {
      income: { value: cur.income, change: percentChange(cur.income, prev.income) },
      spent: { value: spent, change: percentChange(spent, prevSpent) },
      saved: { value: cur.saved, change: percentChange(cur.saved, prev.saved) },
      remaining: { value: cur.remaining, change: percentChange(cur.remaining, prev.remaining) }
    }
  })

  const comparison = computed(() =>
    buildCategoryComparison(currentSpending.value, previousSpending.value, categories.value)
  )
  const ranking = computed(() => buildSpendingRanking(comparison.value, categories.value, RANKING_LIMIT))

  const movements = computed(() =>
    (creditCardId.value === null ? [...currentTxs.value] : [...currentSpending.value]).sort(
      (a, b) => b.date.localeCompare(a.date)
    )
  )

  const recurring = computed(() => {
    const currentKey = getCurrentBillingPeriodKey()
    return recurringRaw.value.map(e => ({
      ...e,
      paid: isPaidInPeriod(e, currentKey),
      displayAmount: e.fixedAmount ?? e.lastPaidAmount ?? null
    }))
  })

  return { loading, errors, creditCards, kpis, comparison, ranking, movements, recurring }
}
