import { ref, computed, watchEffect, type Ref } from 'vue'
import {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
} from '~/services'
import type {
  RecurringExpense,
  RecurringExpenseInput,
  RecurringExpenseUpdate,
  RecurringChecklist,
} from '~/types'
import { getCurrentBillingPeriodKey } from '~/types'
import { useAuth } from '~/composables/useLogin'

const expenses: Ref<RecurringExpense[]> = ref([])
const loading: Ref<boolean> = ref(false)
const error: Ref<string | null> = ref(null)

const checklistKey = (userId: string) =>
  `recurring-checklist-${userId}-${getCurrentBillingPeriodKey()}`

const loadChecklist = (userId: string): RecurringChecklist => {
  if (!process.client) return {}
  try {
    const raw = localStorage.getItem(checklistKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const saveChecklist = (userId: string, state: RecurringChecklist) => {
  if (!process.client) return
  localStorage.setItem(checklistKey(userId), JSON.stringify(state))
}

export const useRecurringExpenses = () => {
  const { user } = useAuth()
  const checklist: Ref<RecurringChecklist> = ref({})

  // Carga el checklist en cuanto el usuario esté disponible
  watchEffect(() => {
    const uid = user.value?.uid
    if (uid) checklist.value = loadChecklist(uid)
    else checklist.value = {}
  })

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
      const uid = user.value?.uid
      if (uid) checklist.value = loadChecklist(uid)
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
      const uid = user.value?.uid
      if (uid) {
        const updated = { ...checklist.value }
        delete updated[id]
        checklist.value = updated
        saveChecklist(uid, updated)
      }
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar'
      return false
    } finally {
      loading.value = false
    }
  }

  const markPaid = (id: string, amount: number | null) => {
    const uid = user.value?.uid
    if (!uid) return
    const updated: RecurringChecklist = {
      ...checklist.value,
      [id]: { paid: true, amount, paidAt: Date.now() },
    }
    checklist.value = updated
    saveChecklist(uid, updated)
  }

  const isPaid = computed(() => (id: string) => checklist.value[id]?.paid === true)
  const paidAmount = computed(() => (id: string) => checklist.value[id]?.amount ?? null)
  const paidAt = computed(() => (id: string) => checklist.value[id]?.paidAt ?? null)

  const paidCount = computed(() =>
    expenses.value.filter(e => checklist.value[e.id]?.paid).length
  )

  return {
    expenses,
    checklist,
    loading,
    error,
    isPaid,
    paidAmount,
    paidAt,
    paidCount,
    fetchExpenses,
    addExpense,
    editExpense,
    removeExpense,
    markPaid,
  }
}
