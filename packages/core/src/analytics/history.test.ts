import { describe, expect, it } from 'vitest'
import type { Category, Transaction } from '../types'
import { filterHistory, summarizeHistory, type HistoryFilters } from './history'

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

const all = [
  tx({ type: 'income', categoryId: '', description: 'Sueldo', amount: 1000 }),
  tx({ description: 'Mercado', categoryId: 'food', paymentMethod: 'debit_card', amount: 100 }),
  tx({ description: 'Netflix', categoryId: 'fun', paymentMethod: 'credit_card', creditCardId: 'nu', amount: 50 }),
  tx({ description: 'Ahorro', categoryId: 'savings', paymentMethod: 'credit_card', amount: 30 }),
]
const base: HistoryFilters = { search: '', categoryId: null, payment: { kind: 'all' }, type: 'all' }
const names = (l: Transaction[]) => l.map(t => t.description)

describe('filterHistory', () => {
  it('busca por descripción sin distinguir mayúsculas', () => {
    expect(names(filterHistory(all, { ...base, search: ' mer ' }))).toEqual(['Mercado'])
  })
  it('filtro de categoría excluye ingresos', () => {
    expect(names(filterHistory(all, { ...base, categoryId: 'food' }))).toEqual(['Mercado'])
  })
  it('filtro débito solo egresos con débito', () => {
    expect(names(filterHistory(all, { ...base, payment: { kind: 'debit' } }))).toEqual(['Mercado'])
  })
  it('filtro tarjeta excluye créditos sin tarjeta', () => {
    expect(names(filterHistory(all, { ...base, payment: { kind: 'card', creditCardId: 'nu' } }))).toEqual(['Netflix'])
  })
  it('filtro de tipo', () => {
    expect(names(filterHistory(all, { ...base, type: 'income' }))).toEqual(['Sueldo'])
    expect(names(filterHistory(all, { ...base, type: 'expense' }))).toEqual(['Mercado', 'Netflix', 'Ahorro'])
  })
  it('combina filtros', () => {
    expect(names(filterHistory(all, { ...base, type: 'expense', search: 'net' }))).toEqual(['Netflix'])
  })
})

describe('summarizeHistory', () => {
  it('resume ingresos, egresos y flujo neto', () => {
    expect(summarizeHistory(all)).toEqual({ count: 4, income: 1000, expenses: 180, savings: 0, net: 820 })
  })
})

const categories = [{ id: 'savings', isSaving: true, archivedAt: 1 }] as Category[]

describe('categorías de ahorro en el histórico', () => {
  it('separa ahorros de egresos y conserva su efecto en el flujo neto', () => {
    expect(summarizeHistory(all, categories)).toEqual({ count: 4, income: 1000, expenses: 150, savings: 30, net: 820 })
  })
  it('permite filtrar ahorros sin incluirlos en gastos', () => {
    expect(names(filterHistory(all, { ...base, type: 'expense' }, categories))).toEqual(['Mercado', 'Netflix'])
    expect(names(filterHistory(all, { ...base, type: 'saving' }, categories))).toEqual(['Ahorro'])
    expect(names(filterHistory(all, { ...base, categoryId: 'savings' }, categories))).toEqual(['Ahorro'])
  })
})
