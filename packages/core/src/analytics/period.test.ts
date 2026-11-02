import { describe, expect, it } from 'vitest'
import type { Category, RecurringExpense, Transaction } from '../types'
import {
  buildCategoryComparison,
  buildSpendingRanking,
  computePeriodTotals,
  getSpendingTransactions,
  isPaidInPeriod,
  percentChange,
} from './period'

let seq = 0
const tx = (o: Partial<Transaction>): Transaction => ({
  id: `t${seq++}`,
  userId: 'u',
  username: 'u',
  categoryId: 'food',
  categoryName: 'Comida',
  amount: 0,
  description: '',
  date: '2026-10-25',
  month: '2026-10',
  type: 'expense',
  createdAt: 0,
  ...o,
})
const cat = (o: Partial<Category> & { id: string }): Category => ({
  userId: 'u',
  name: o.id,
  budget: 0,
  createdAt: 0,
  ...o,
})

const cats = [
  cat({ id: 'food', name: 'Comida', icon: 'f', budget: 1000 }),
  cat({ id: 'rent', name: 'Arriendo', budget: 0 }),
  cat({ id: 'savings', name: 'Ahorro', isSaving: true }),
]
const inc = (amount: number) => tx({ type: 'income', categoryId: '', amount })
const exp = (categoryId: string, amount: number, o: Partial<Transaction> = {}) =>
  tx({ categoryId, amount, ...o })
const expNoType = (categoryId: string, amount: number) => {
  const t = exp(categoryId, amount)
  delete t.type
  return t
}

describe('computePeriodTotals', () => {
  it('separa ingresos, gastado y apartado', () => {
    expect(
      computePeriodTotals([inc(500), exp('food', 100), exp('savings', 50), expNoType('rent', 20)], cats)
    ).toEqual({ income: 500, spent: 120, saved: 50, remaining: 330, spentByCategory: { food: 100, savings: 50, rent: 20 } })
  })
  it('cuenta como gastado un egreso sin categoryId pero no lo agrupa', () => {
    const r = computePeriodTotals([exp('', 30)], cats)
    expect(r.spent).toBe(30)
    expect(r.spentByCategory).toEqual({})
  })
})

describe('getSpendingTransactions', () => {
  const list = [
    inc(900),
    exp('food', 10),
    exp('food', 20, { creditCardId: 'nu' }),
    exp('savings', 30),
    exp('savings', 40, { creditCardId: 'nu' }),
  ]
  it('sin tarjeta devuelve egresos no-ahorro', () => {
    expect(getSpendingTransactions(list, cats, null).map(t => t.amount)).toEqual([10, 20])
  })
  it('excluye egresos sin tarjeta cuando hay tarjeta', () => {
    expect(getSpendingTransactions(list, cats, 'nu').map(t => t.amount)).toEqual([20])
  })
  it('excluye categorías de ahorro aunque tengan la tarjeta', () => {
    expect(getSpendingTransactions(list, cats, 'nu').some(t => t.categoryId === 'savings')).toBe(false)
  })
})

describe('percentChange', () => {
  it('calcula la variación', () => expect(percentChange(150, 100)).toBe(50))
  it('null si previo es 0', () => expect(percentChange(50, 0)).toBeNull())
  it('null si previo es negativo', () => expect(percentChange(50, -10)).toBeNull())
})

describe('buildCategoryComparison', () => {
  it('combina ambos periodos y ordena por current desc', () => {
    const rows = buildCategoryComparison(
      [exp('food', 100)],
      [exp('food', 80), exp('rent', 40)],
      cats
    )
    expect(rows).toEqual([
      { categoryId: 'food', name: 'Comida', icon: 'f', current: 100, previous: 80, change: 25 },
      { categoryId: 'rent', name: 'Arriendo', icon: undefined, current: 0, previous: 40, change: -100 },
    ])
  })
  it('usa categoryName si la categoría no existe', () => {
    const rows = buildCategoryComparison([exp('gone', 5, { categoryName: 'Viejo' })], [], cats)
    expect(rows[0].name).toBe('Viejo')
  })
})

describe('buildSpendingRanking', () => {
  it('top 4 con presupuesto solo si budget > 0', () => {
    const rows = buildCategoryComparison([exp('food', 100), exp('rent', 50)], [], cats)
    const ranking = buildSpendingRanking(rows, cats)
    expect(ranking[0]).toMatchObject({ categoryId: 'food', budget: 1000, percentUsed: 10 })
    expect(ranking[1]).toMatchObject({ categoryId: 'rent', budget: null, percentUsed: null })
  })
  it('limita al top indicado', () => {
    const many = Array.from({ length: 6 }, (_, i) => exp(`c${i}`, 10 + i))
    expect(buildSpendingRanking(buildCategoryComparison(many, [], cats), cats)).toHaveLength(4)
  })
  it('excluye filas con current 0', () => {
    const rows = buildCategoryComparison([], [exp('food', 80)], cats)
    expect(buildSpendingRanking(rows, cats)).toEqual([])
  })
})

describe('isPaidInPeriod', () => {
  it('pagado dentro del periodo', () =>
    expect(isPaidInPeriod({ lastPaidAt: new Date(2026, 9, 25).getTime() } as RecurringExpense, '2026-10')).toBe(true))
  it('pagado antes del corte cae en el periodo anterior', () =>
    expect(isPaidInPeriod({ lastPaidAt: new Date(2026, 9, 20).getTime() } as RecurringExpense, '2026-10')).toBe(false))
  it('sin lastPaidAt', () => expect(isPaidInPeriod({} as RecurringExpense, '2026-10')).toBe(false))
})
