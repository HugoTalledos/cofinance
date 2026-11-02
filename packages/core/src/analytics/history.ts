import type { Transaction } from '../types'
import { isExpense } from './period'

export type PaymentFilter =
  | { kind: 'all' }
  | { kind: 'debit' }
  | { kind: 'card'; creditCardId: string }

export interface HistoryFilters {
  search: string
  categoryId: string | null
  payment: PaymentFilter
  type: 'all' | 'expense' | 'income'
}

export interface HistorySummary {
  count: number
  income: number
  expenses: number
  net: number
}

/** Filtra conservando el orden. Categoría y medio de pago aplican solo a egresos. */
export const filterHistory = (transactions: Transaction[], filters: HistoryFilters): Transaction[] => {
  const search = filters.search.trim().toLowerCase()
  return transactions.filter(tx => {
    const expense = isExpense(tx)
    if (filters.type === 'expense' && !expense) return false
    if (filters.type === 'income' && expense) return false
    if (search && !tx.description.toLowerCase().includes(search)) return false
    if (filters.categoryId !== null && !(expense && tx.categoryId === filters.categoryId)) return false
    if (filters.payment.kind === 'debit' && !(expense && tx.paymentMethod === 'debit_card')) return false
    if (filters.payment.kind === 'card' && !(expense && tx.creditCardId === filters.payment.creditCardId)) {
      return false
    }
    return true
  })
}

export const summarizeHistory = (transactions: Transaction[]): HistorySummary => {
  let income = 0
  let expenses = 0
  for (const tx of transactions) {
    if (isExpense(tx)) expenses += tx.amount
    else income += tx.amount
  }
  return { count: transactions.length, income, expenses, net: income - expenses }
}
