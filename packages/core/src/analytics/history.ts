import type { Category, Transaction } from '../types'
import { computePeriodTotals, isExpense } from './period'

export type PaymentFilter =
  | { kind: 'all' }
  | { kind: 'debit' }
  | { kind: 'card'; creditCardId: string }

export interface HistoryFilters {
  search: string
  categoryId: string | null
  payment: PaymentFilter
  type: 'all' | 'expense' | 'saving' | 'income' | 'card_payment'
}

export interface HistorySummary {
  count: number
  income: number
  expenses: number
  savings: number
  net: number
}

/** Filtra conservando el orden. Categoría y medio de pago aplican solo a egresos. */
export const filterHistory = (transactions: Transaction[], filters: HistoryFilters, categories: Category[] = []): Transaction[] => {
  const savingIds = new Set(categories.filter(c => c.isSaving).map(c => c.id))
  const search = filters.search.trim().toLowerCase()
  return transactions.filter(tx => {
    const expense = isExpense(tx)
    const saving = expense && savingIds.has(tx.categoryId)
    if (filters.type === 'expense' && (!expense || saving)) return false
    if (filters.type === 'saving' && !saving) return false
    if (filters.type === 'income' && tx.type !== 'income') return false
    if (filters.type === 'card_payment' && tx.type !== 'card_payment') return false
    if (search && !tx.description.toLowerCase().includes(search)) return false
    if (filters.categoryId !== null && !(expense && tx.categoryId === filters.categoryId)) return false
    if (filters.payment.kind === 'debit' && !(expense && tx.paymentMethod === 'debit_card')) return false
    if (filters.payment.kind === 'card' && !((expense || tx.type === 'card_payment') && tx.creditCardId === filters.payment.creditCardId)) {
      return false
    }
    return true
  })
}

export const summarizeHistory = (transactions: Transaction[], categories: Category[] = []): HistorySummary => {
  const { income, spent, saved, remaining } = computePeriodTotals(transactions, categories)
  return { count: transactions.length, income, expenses: spent, savings: saved, net: remaining }
}
