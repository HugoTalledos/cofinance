import { describe, expect, it } from 'vitest'
import type { Category, CreditCard, Transaction } from '../types'
import { buildTransactionEdit, hasEditChanges, toEditForm, validateEditForm } from './transaction-edit'

const tx = (o: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  userId: 'u',
  username: 'u',
  categoryId: 'food',
  categoryName: 'Comida',
  amount: 100,
  description: 'Mercado',
  date: '2026-10-25',
  month: '2026-10',
  type: 'expense',
  createdAt: 0,
  ...o,
})
const cat = (id: string, name: string): Category => ({ id, userId: 'u', name, budget: 0, createdAt: 0 })
const card = (id: string, bank: string): CreditCard => ({ id, bank, createdAt: 0 })

const cats = [cat('food', 'Comida'), cat('fun', 'Ocio')]
const cards = [card('nu', 'Nu'), card('rappi', 'Rappi')]
const credit = () => tx({ paymentMethod: 'credit_card', creditCardId: 'nu', creditCardBank: 'Nu' })

describe('buildTransactionEdit', () => {
  it('sin cambios no produce cambios', () => {
    for (const t of [tx(), credit(), tx({ type: 'income', categoryId: '' })]) {
      expect(hasEditChanges(buildTransactionEdit(t, toEditForm(t), cats, cards))).toBe(false)
    }
  })
  it('recorta la descripción y detecta cambio de monto', () => {
    const t = tx()
    const edit = buildTransactionEdit(t, { ...toEditForm(t), description: '  Pan ', amount: 200 }, cats, cards)
    expect(edit.changes).toEqual({ description: 'Pan', amount: 200 })
    expect(edit.removeFields).toEqual([])
  })
  it('cambiar categoría escribe categoryId y categoryName', () => {
    const t = tx()
    const edit = buildTransactionEdit(t, { ...toEditForm(t), categoryId: 'fun' }, cats, cards)
    expect(edit.changes).toEqual({ categoryId: 'fun', categoryName: 'Ocio' })
  })
  it('pasar a débito elimina la tarjeta', () => {
    const t = credit()
    const edit = buildTransactionEdit(t, { ...toEditForm(t), paymentMethod: 'debit_card', creditCardId: null }, cats, cards)
    expect(edit.changes).toEqual({ paymentMethod: 'debit_card' })
    expect(edit.removeFields).toEqual(['creditCardId', 'creditCardBank'])
  })
  it('cambiar de tarjeta escribe id y banco', () => {
    const t = credit()
    const edit = buildTransactionEdit(t, { ...toEditForm(t), creditCardId: 'rappi' }, cats, cards)
    expect(edit.changes).toEqual({ creditCardId: 'rappi', creditCardBank: 'Rappi' })
    expect(edit.removeFields).toEqual([])
  })
  it('sin medio de pago y sin tocarlo no escribe paymentMethod', () => {
    const t = tx()
    const edit = buildTransactionEdit(t, { ...toEditForm(t), description: 'Otro' }, cats, cards)
    expect(edit.changes).toEqual({ description: 'Otro' })
    expect('paymentMethod' in edit.changes).toBe(false)
  })
  it('en ingresos ignora categoría y medio de pago', () => {
    const t = tx({ type: 'income', categoryId: '', categoryName: '' })
    const edit = buildTransactionEdit(
      t,
      { description: 'Sueldo', amount: 300, categoryId: 'fun', paymentMethod: 'debit_card', creditCardId: null },
      cats,
      cards
    )
    expect(edit.changes).toEqual({ description: 'Sueldo', amount: 300 })
    expect(edit.removeFields).toEqual([])
  })
})

describe('validateEditForm', () => {
  it('devuelve los mensajes exactos', () => {
    const t = tx()
    const ok = toEditForm(t)
    expect(validateEditForm(t, ok, cards)).toBeNull()
    expect(validateEditForm(t, { ...ok, description: '   ' }, cards)).toBe('La descripción es obligatoria')
    expect(validateEditForm(t, { ...ok, amount: null }, cards)).toBe('El monto debe ser mayor a 0')
    expect(validateEditForm(t, { ...ok, amount: 0 }, cards)).toBe('El monto debe ser mayor a 0')
    expect(validateEditForm(t, { ...ok, categoryId: '' }, cards)).toBe('Elige una categoría')
    const creditForm = { ...ok, paymentMethod: 'credit_card' as const, creditCardId: null }
    expect(validateEditForm(t, creditForm, cards)).toBe('Elige una tarjeta')
    expect(validateEditForm(t, creditForm, [])).toBeNull()
    const inc = tx({ type: 'income', categoryId: '' })
    expect(validateEditForm(inc, { ...toEditForm(inc), categoryId: '' }, cards)).toBeNull()
  })
})
