import type { Category, RecurringExpense, Transaction } from '../types'
import { getBillingPeriodRange } from '../types/helpers'

export const isExpense = (tx: Transaction): boolean => (tx.type ?? 'expense') === 'expense'

export interface PeriodTotals {
  income: number
  spent: number
  saved: number
  remaining: number
  /** Incluye categorías de ahorro; omite egresos sin categoryId */
  spentByCategory: Record<string, number>
}

const savingIds = (categories: Category[]): Set<string> =>
  new Set(categories.filter(c => c.isSaving).map(c => c.id))

export const computePeriodTotals = (
  transactions: Transaction[],
  categories: Category[]
): PeriodTotals => {
  const saving = savingIds(categories)
  let income = 0
  let spent = 0
  let saved = 0
  const spentByCategory: Record<string, number> = {}

  for (const tx of transactions) {
    if (tx.type === 'income') {
      income += tx.amount
      continue
    }
    if (!isExpense(tx)) continue
    if (tx.categoryId && saving.has(tx.categoryId)) saved += tx.amount
    else spent += tx.amount
    if (tx.categoryId) {
      spentByCategory[tx.categoryId] = (spentByCategory[tx.categoryId] ?? 0) + tx.amount
    }
  }

  return { income, spent, saved, remaining: income - spent - saved, spentByCategory }
}

export const getSpendingTransactions = (
  transactions: Transaction[],
  categories: Category[],
  creditCardId: string | null
): Transaction[] => {
  const saving = savingIds(categories)
  return transactions.filter(
    tx =>
      isExpense(tx) &&
      !(tx.categoryId && saving.has(tx.categoryId)) &&
      (creditCardId === null || tx.creditCardId === creditCardId)
  )
}

export const percentChange = (current: number, previous: number): number | null =>
  previous <= 0 ? null : ((current - previous) / previous) * 100

export interface CategoryComparisonRow {
  categoryId: string
  name: string
  icon?: string
  current: number
  previous: number
  change: number | null
}

export const buildCategoryComparison = (
  current: Transaction[],
  previous: Transaction[],
  categories: Category[]
): CategoryComparisonRow[] => {
  const byId = new Map(categories.map(c => [c.id, c]))
  const acc = new Map<string, { current: number; previous: number; latest: Transaction }>()

  const add = (txs: Transaction[], key: 'current' | 'previous') => {
    for (const tx of txs) {
      if (!tx.categoryId) continue
      let entry = acc.get(tx.categoryId)
      if (!entry) {
        entry = { current: 0, previous: 0, latest: tx }
        acc.set(tx.categoryId, entry)
      }
      entry[key] += tx.amount
      if (tx.date > entry.latest.date) entry.latest = tx
    }
  }
  add(current, 'current')
  add(previous, 'previous')

  return [...acc.entries()]
    .map(([categoryId, e]) => {
      const category = byId.get(categoryId)
      return {
        categoryId,
        name: category?.name ?? e.latest.categoryName,
        icon: category?.icon,
        current: e.current,
        previous: e.previous,
        change: percentChange(e.current, e.previous),
      }
    })
    .sort((a, b) => b.current - a.current)
}

export interface RankingRow extends CategoryComparisonRow {
  budget: number | null
  percentUsed: number | null
}

export const buildSpendingRanking = (
  rows: CategoryComparisonRow[],
  categories: Category[],
  limit = 4
): RankingRow[] => {
  const byId = new Map(categories.map(c => [c.id, c]))
  return rows
    .filter(r => r.current > 0)
    .slice(0, limit)
    .map(r => {
      const b = byId.get(r.categoryId)?.budget ?? 0
      const budget = b > 0 ? b : null
      return { ...r, budget, percentUsed: budget ? (r.current / budget) * 100 : null }
    })
}

export const isPaidInPeriod = (expense: RecurringExpense, periodKey: string): boolean =>
  expense.lastPaidAt != null &&
  getBillingPeriodRange(new Date(expense.lastPaidAt)).periodKey === periodKey
