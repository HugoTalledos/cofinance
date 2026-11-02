import type {
  Category, CreditCard, PaymentMethod, RecurringExpense, RecurringExpenseInput,
  RecurringExpenseUpdate, RemovableRecurringField, Transaction
} from '../types'

export interface RecurringForm {
  name: string
  description: string
  categoryId: string
  amountMode: 'fixed' | 'variable'
  fixedAmount: number | null
  paymentMethod: PaymentMethod | null
  creditCardId: string | null
  reminderDay: number | null
}

export interface RecurringEdit {
  changes: RecurringExpenseUpdate
  removeFields: RemovableRecurringField[]
}

export const toRecurringForm = (expense: RecurringExpense | null): RecurringForm => ({
  name: expense?.name ?? '',
  description: expense?.description ?? '',
  categoryId: expense?.categoryId ?? '',
  amountMode: expense?.fixedAmount === null ? 'variable' : 'fixed',
  fixedAmount: expense?.fixedAmount ?? null,
  paymentMethod: expense?.paymentMethod ?? null,
  creditCardId: expense?.creditCardId ?? null,
  reminderDay: expense?.reminderDay ?? null
})

export const validateRecurringForm = (form: RecurringForm, creditCards: CreditCard[]): string | null => {
  if (!form.name.trim()) return 'El nombre es obligatorio'
  if (!form.categoryId) return 'Elige una categoría'
  if (form.amountMode === 'fixed' && (form.fixedAmount === null || !(form.fixedAmount > 0))) return 'El monto debe ser mayor a 0'
  if (!form.paymentMethod) return 'Elige un medio de pago'
  if (form.paymentMethod === 'credit_card' && creditCards.length > 0 && !form.creditCardId) return 'Elige una tarjeta'
  if (form.reminderDay !== null && (!Number.isInteger(form.reminderDay) || form.reminderDay < 1 || form.reminderDay > 31)) return 'El día de recordatorio debe estar entre 1 y 31'
  return null
}

export const buildRecurringInput = (
  form: RecurringForm, userId: string, categories: Category[], creditCards: CreditCard[]
): RecurringExpenseInput => {
  const input: RecurringExpenseInput = {
    userId,
    name: form.name.trim(),
    categoryId: form.categoryId,
    categoryName: categories.find(c => c.id === form.categoryId)?.name ?? '',
    fixedAmount: form.amountMode === 'variable' ? null : form.fixedAmount
  }
  if (form.description.trim()) input.description = form.description.trim()
  if (form.paymentMethod !== null) input.paymentMethod = form.paymentMethod
  if (form.paymentMethod === 'credit_card' && form.creditCardId) {
    input.creditCardId = form.creditCardId
    const bank = creditCards.find(c => c.id === form.creditCardId)?.bank
    if (bank !== undefined) input.creditCardBank = bank
  }
  if (form.reminderDay !== null) input.reminderDay = form.reminderDay
  return input
}

export const buildRecurringUpdate = (
  expense: RecurringExpense, form: RecurringForm, categories: Category[], creditCards: CreditCard[]
): RecurringEdit => {
  const changes: RecurringExpenseUpdate = {}
  const removeFields: RemovableRecurringField[] = []
  const input = buildRecurringInput(form, expense.userId, categories, creditCards)
  if (input.name !== expense.name) changes.name = input.name
  if (input.description !== expense.description) {
    if (input.description === undefined) removeFields.push('description')
    else changes.description = input.description
  }
  if (input.categoryId !== expense.categoryId) {
    changes.categoryId = input.categoryId
    changes.categoryName = input.categoryName
  }
  if (input.fixedAmount !== expense.fixedAmount) changes.fixedAmount = input.fixedAmount
  if (input.paymentMethod !== undefined && input.paymentMethod !== expense.paymentMethod) changes.paymentMethod = input.paymentMethod
  if (form.paymentMethod === 'credit_card' && input.creditCardId) {
    if (input.creditCardId !== expense.creditCardId) {
      changes.creditCardId = input.creditCardId
      if (input.creditCardBank !== undefined) changes.creditCardBank = input.creditCardBank
      else if (expense.creditCardBank !== undefined) removeFields.push('creditCardBank')
    }
  } else if (form.paymentMethod !== null && (expense.creditCardId !== undefined || expense.creditCardBank !== undefined)) {
    removeFields.push('creditCardId', 'creditCardBank')
  }
  if (input.reminderDay !== expense.reminderDay) {
    if (input.reminderDay === undefined) removeFields.push('reminderDay')
    else changes.reminderDay = input.reminderDay
  }
  return { changes, removeFields }
}

export const hasRecurringChanges = (edit: RecurringEdit): boolean =>
  Object.keys(edit.changes).length > 0 || edit.removeFields.length > 0

export const recurringPaymentFields = (expense: RecurringExpense): Pick<Transaction, 'paymentMethod' | 'creditCardId' | 'creditCardBank'> => {
  const fields: Pick<Transaction, 'paymentMethod' | 'creditCardId' | 'creditCardBank'> = {}
  if (expense.paymentMethod !== undefined) fields.paymentMethod = expense.paymentMethod
  if (expense.creditCardId !== undefined) fields.creditCardId = expense.creditCardId
  if (expense.creditCardBank !== undefined) fields.creditCardBank = expense.creditCardBank
  return fields
}
