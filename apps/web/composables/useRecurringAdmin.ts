import { ref } from 'vue'
import {
  buildRecurringInput, buildRecurringUpdate, validateRecurringForm, hasRecurringChanges,
  getRecurringExpenses, getCategories, getCreditCards, createRecurringExpense,
  updateRecurringExpense, deleteRecurringExpense,
  type RecurringExpense, type RecurringForm, type Category, type CreditCard
} from '@cofinance/core'

export function useRecurringAdmin() {
  const { user } = useAuth()
  const loading = ref(true)
  const error = ref<string | null>(null)
  const expenses = ref<RecurringExpense[]>([])
  const categories = ref<Category[]>([])
  const creditCards = ref<CreditCard[]>([])
  let requestId = 0

  const reload = async () => {
    const id = ++requestId
    loading.value = true
    error.value = null
    try {
      const [recurring, cats, cards] = await Promise.all([
        getRecurringExpenses(), getCategories(), getCreditCards()
      ])
      if (id !== requestId) return
      expenses.value = [...(recurring.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'es'))
      categories.value = cats.data ?? []
      creditCards.value = cards.data ?? []
      error.value = recurring.error ?? cats.error ?? cards.error
    } catch (err) {
      if (id === requestId) error.value = err instanceof Error ? err.message : 'Error al cargar pagos recurrentes'
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  const create = async (form: RecurringForm): Promise<string | null> => {
    if (!user.value) return 'Inicia sesión para crear pagos recurrentes'
    const validation = validateRecurringForm(form, creditCards.value)
    if (validation) return validation
    const result = await createRecurringExpense(buildRecurringInput(form, user.value.uid, categories.value, creditCards.value))
    if (result.error) return result.error
    await reload()
    return null
  }

  const update = async (expense: RecurringExpense, form: RecurringForm): Promise<string | null> => {
    const validation = validateRecurringForm(form, creditCards.value)
    if (validation) return validation
    const edit = buildRecurringUpdate(expense, form, categories.value, creditCards.value)
    if (!hasRecurringChanges(edit)) return null
    const result = await updateRecurringExpense(expense.id, edit.changes, edit.removeFields)
    if (result.error) return result.error
    await reload()
    return null
  }

  const remove = async (id: string): Promise<string | null> => {
    const result = await deleteRecurringExpense(id)
    if (result.error) return result.error
    await reload()
    return null
  }

  reload()
  return { loading, error, expenses, categories, creditCards, reload, create, update, remove }
}
