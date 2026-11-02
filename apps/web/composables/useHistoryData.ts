import { ref, watch, type Ref } from 'vue'
import {
  getBillingPeriodRangeFromKey,
  getCategories,
  getCreditCards,
  getTransactions,
  type Category,
  type CreditCard,
  type Transaction
} from '@cofinance/core'

export function useHistoryData(periodKey: Ref<string>) {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const transactions = ref<Transaction[]>([])
  const categories = ref<Category[]>([])
  const creditCards = ref<CreditCard[]>([])

  // Categorías y tarjetas se cargan una sola vez
  let staticError: string | null = null
  const staticLoad = Promise.all([getCategories(), getCreditCards()]).then(([cats, cards]) => {
    categories.value = cats.data ?? []
    creditCards.value = cards.data ?? []
    staticError = cats.error ?? cards.error ?? null
  })

  // Evita que una respuesta antigua pise a una más reciente
  let requestId = 0

  const reload = async () => {
    const id = ++requestId
    loading.value = true
    error.value = null
    const { startDate, endDate } = getBillingPeriodRangeFromKey(periodKey.value)
    const result = await getTransactions({ dateFrom: startDate, dateTo: endDate })
    await staticLoad
    if (id !== requestId) return
    transactions.value = [...(result.data ?? [])].sort((a, b) => b.date.localeCompare(a.date))
    error.value = result.error ?? staticError
    loading.value = false
  }

  watch(periodKey, reload, { immediate: true })

  return { loading, error, transactions, categories, creditCards, reload }
}
