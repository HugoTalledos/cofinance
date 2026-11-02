import type {
  Category,
  CreditCard,
  PaymentMethod,
  RemovableTransactionField,
  Transaction,
  TransactionUpdate
} from '../types'
import { isExpense } from '../analytics/period'

export interface TransactionEditForm {
  description: string
  amount: number | null
  categoryId: string
  paymentMethod: PaymentMethod | null
  creditCardId: string | null
}

export interface TransactionEdit {
  changes: TransactionUpdate
  removeFields: RemovableTransactionField[]
}

export const toEditForm = (tx: Transaction): TransactionEditForm => ({
  description: tx.description,
  amount: tx.amount,
  categoryId: tx.categoryId,
  paymentMethod: tx.paymentMethod ?? null,
  creditCardId: tx.creditCardId ?? null
})

export const validateEditForm = (
  tx: Transaction,
  form: TransactionEditForm,
  creditCards: CreditCard[]
): string | null => {
  if (!form.description.trim()) return 'La descripción es obligatoria'
  if (form.amount === null || !(form.amount > 0)) return 'El monto debe ser mayor a 0'
  if (isExpense(tx)) {
    if (!form.categoryId) return 'Elige una categoría'
    if (form.paymentMethod === 'credit_card' && creditCards.length > 0 && form.creditCardId === null) {
      return 'Elige una tarjeta'
    }
  }
  return null
}

export const buildTransactionEdit = (
  tx: Transaction,
  form: TransactionEditForm,
  categories: Category[],
  creditCards: CreditCard[]
): TransactionEdit => {
  const changes: TransactionUpdate = {}
  const removeFields: RemovableTransactionField[] = []

  const description = form.description.trim()
  if (description !== tx.description) changes.description = description
  if (form.amount !== null && form.amount !== tx.amount) changes.amount = form.amount

  if (isExpense(tx)) {
    if (form.categoryId !== tx.categoryId) {
      changes.categoryId = form.categoryId
      changes.categoryName = categories.find(c => c.id === form.categoryId)?.name ?? tx.categoryName
    }
    if (form.paymentMethod !== null) {
      if (form.paymentMethod !== tx.paymentMethod) changes.paymentMethod = form.paymentMethod
      if (form.paymentMethod === 'credit_card') {
        if (form.creditCardId !== null && form.creditCardId !== tx.creditCardId) {
          changes.creditCardId = form.creditCardId
          const bank = creditCards.find(c => c.id === form.creditCardId)?.bank
          if (bank !== undefined) changes.creditCardBank = bank
        }
      } else if (tx.creditCardId !== undefined || tx.creditCardBank !== undefined) {
        removeFields.push('creditCardId', 'creditCardBank')
      }
    }
  }

  return { changes, removeFields }
}

export const hasEditChanges = (edit: TransactionEdit): boolean =>
  Object.keys(edit.changes).length > 0 || edit.removeFields.length > 0
