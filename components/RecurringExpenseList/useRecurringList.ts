import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useLogin'
import { useRecurringExpenses } from '~/composables/useRecurringExpenses'
import { useTransactions } from '~/composables/useTransactions'
import type { RecurringExpense } from '~/types'

export const useRecurringList = (
  onPaid?: (expense: RecurringExpense, amount: number) => void
) => {
  const { user } = useAuth()
  const { expenses, isPaid, markPaid } = useRecurringExpenses()
  const { addTransaction } = useTransactions()

  const showAmountPopup = ref(false)
  const pendingExpenseId = ref<string | null>(null)
  const popupAmount = ref<number | null>(null)

  const pendingExpenseName = computed(() => {
    if (!pendingExpenseId.value) return ''
    return expenses.value.find(e => e.id === pendingExpenseId.value)?.name ?? ''
  })

  async function createTransactionFromExpense(expense: RecurringExpense, amount: number) {
    if (!user.value?.uid || amount <= 0) return
    const today = new Date().toISOString().split('T')[0]
    await addTransaction({
      userId: user.value.uid,
      username: user.value.displayName || '',
      categoryId: expense.categoryId,
      categoryName: expense.categoryName,
      amount,
      description: expense.name,
      date: today,
      month: today.substring(0, 7),
    })
  }

  async function handleTap(expense: RecurringExpense) {
    if (isPaid.value(expense.id)) return
    if (expense.fixedAmount !== null) {
      markPaid(expense.id, expense.fixedAmount)
      await createTransactionFromExpense(expense, expense.fixedAmount)
      onPaid?.(expense, expense.fixedAmount)
      return
    }
    pendingExpenseId.value = expense.id
    popupAmount.value = null
    showAmountPopup.value = true
  }

  async function confirmVariableAmount() {
    if (!pendingExpenseId.value || popupAmount.value === null) return
    const id = pendingExpenseId.value
    const amount = popupAmount.value
    const expense = expenses.value.find(e => e.id === id)
    markPaid(id, amount)
    pendingExpenseId.value = null
    showAmountPopup.value = false
    if (expense) {
      await createTransactionFromExpense(expense, amount)
      onPaid?.(expense, amount)
    }
  }

  function cancelAmountPopup() {
    pendingExpenseId.value = null
    showAmountPopup.value = false
  }

  return {
    showAmountPopup,
    popupAmount,
    pendingExpenseName,
    handleTap,
    confirmVariableAmount,
    cancelAmountPopup,
  }
}
