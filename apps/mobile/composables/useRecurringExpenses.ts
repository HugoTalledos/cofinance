import { ref, computed, type Ref } from 'vue'
import {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
} from '@cofinance/core'
import type {
  RecurringExpense,
  RecurringExpenseInput,
  RecurringExpenseUpdate,
} from '@cofinance/core'
import { getCurrentBillingPeriodKey, isPaidInPeriod } from '@cofinance/core'

const expenses: Ref<RecurringExpense[]> = ref([])
const loading: Ref<boolean> = ref(false)
const error: Ref<string | null> = ref(null)

/**
 * Un gasto recurrente está pagado si su último pago (guardado en Firestore)
 * cae dentro del periodo de facturación actual. Así el estado es el mismo en
 * cualquier dispositivo y se reinicia solo al empezar un periodo nuevo.
 */
const isPaidThisPeriod = (expense: RecurringExpense): boolean =>
  isPaidInPeriod(expense, getCurrentBillingPeriodKey())

export const useRecurringExpenses = () => {
  const fetchExpenses = async (): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const result = await getRecurringExpenses()
      if (result.error) {
        error.value = result.error
        return false
      }
      expenses.value = result.data || []
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar'
      return false
    } finally {
      loading.value = false
    }
  }

  const addExpense = async (data: RecurringExpenseInput): Promise<string | null> => {
    loading.value = true
    error.value = null
    try {
      const result = await createRecurringExpense(data)
      if (result.error) {
        error.value = result.error
        return null
      }
      if (result.data) {
        expenses.value.push({ id: result.data, ...data, createdAt: Date.now() })
        return result.data
      }
      return null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear'
      return null
    } finally {
      loading.value = false
    }
  }

  const editExpense = async (id: string, data: RecurringExpenseUpdate): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const result = await updateRecurringExpense(id, data)
      if (result.error) {
        error.value = result.error
        return false
      }
      const idx = expenses.value.findIndex(e => e.id === id)
      if (idx !== -1) expenses.value[idx] = { ...expenses.value[idx], ...data }
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al editar'
      return false
    } finally {
      loading.value = false
    }
  }

  const removeExpense = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const result = await deleteRecurringExpense(id)
      if (result.error) {
        error.value = result.error
        return false
      }
      expenses.value = expenses.value.filter(e => e.id !== id)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar'
      return false
    } finally {
      loading.value = false
    }
  }

  const markPaid = async (id: string, amount: number | null): Promise<boolean> => {
    const idx = expenses.value.findIndex(e => e.id === id)
    if (idx === -1) return false

    const previous = expenses.value[idx]
    const lastPaid = { lastPaidAt: Date.now(), lastPaidAmount: amount }
    expenses.value[idx] = { ...previous, ...lastPaid }

    const result = await updateRecurringExpense(id, lastPaid)
    if (result.error) {
      // Revertimos para no mostrar como pagado algo que no quedó guardado
      expenses.value[idx] = previous
      error.value = result.error
      return false
    }
    return true
  }

  const findExpense = (id: string) => expenses.value.find(e => e.id === id)

  const isPaid = computed(() => (id: string) => {
    const expense = findExpense(id)
    return expense ? isPaidThisPeriod(expense) : false
  })
  const paidAmount = computed(() => (id: string) => {
    const expense = findExpense(id)
    return expense && isPaidThisPeriod(expense) ? expense.lastPaidAmount ?? null : null
  })
  const paidAt = computed(() => (id: string) => {
    const expense = findExpense(id)
    return expense && isPaidThisPeriod(expense) ? expense.lastPaidAt ?? null : null
  })

  const paidExpenses = computed(() => expenses.value.filter(isPaidThisPeriod))

  const pendingExpenses = computed(() =>
    expenses.value.filter(e => !isPaidThisPeriod(e))
  )

  const paidCount = computed(() => paidExpenses.value.length)

  // Los gastos de monto variable se estiman con su último pago registrado
  const pendingTotal = computed(() =>
    pendingExpenses.value.reduce(
      (sum, e) => sum + (e.fixedAmount ?? e.lastPaidAmount ?? 0),
      0
    )
  )

  return {
    expenses,
    loading,
    error,
    isPaid,
    paidAmount,
    paidAt,
    paidCount,
    pendingExpenses,
    paidExpenses,
    pendingTotal,
    fetchExpenses,
    addExpense,
    editExpense,
    removeExpense,
    markPaid,
  }
}
