import { describe, expect, it } from 'vitest'
import type { Category, CreditCard, RecurringExpense } from '../types'
import { toRecurringForm, validateRecurringForm, buildRecurringInput, buildRecurringUpdate, hasRecurringChanges, recurringPaymentFields, type RecurringForm } from './recurring-form'

const rec = (fields: Partial<RecurringExpense> = {}): RecurringExpense => ({
  id: 'r1', userId: 'owner', name: 'Arriendo', categoryId: 'home', categoryName: 'Hogar',
  fixedAmount: 1500000, createdAt: 1, ...fields
})
const cat = (): Category => ({ id: 'home', userId: 'u1', name: 'Hogar', budget: 0, createdAt: 1 })
const card = (): CreditCard => ({ id: 'nu', bank: 'Nu', createdAt: 1 })
const form = (fields: Partial<RecurringForm> = {}): RecurringForm => ({
  name: ' Arriendo ', description: ' ', categoryId: 'home', amountMode: 'fixed', fixedAmount: 1500000,
  paymentMethod: 'credit_card', creditCardId: 'nu', reminderDay: 5, ...fields
})

describe('recurrentes', () => {
  it('toRecurringForm(null) devuelve un formulario vacío fijo', () => {
    expect(toRecurringForm(null)).toEqual({ name: '', description: '', categoryId: '', amountMode: 'fixed', fixedAmount: null, paymentMethod: null, creditCardId: null, reminderDay: null })
  })
  it('toRecurringForm usa variable cuando fixedAmount es null', () => {
    expect(toRecurringForm(rec({ fixedAmount: null }))).toEqual({ name: 'Arriendo', description: '', categoryId: 'home', amountMode: 'variable', fixedAmount: null, paymentMethod: null, creditCardId: null, reminderDay: null })
  })
  it('validateRecurringForm exige nombre, categoría y monto en ese orden', () => {
    expect(validateRecurringForm(form({ name: ' ', categoryId: '', fixedAmount: 0 }), [])).toBe('El nombre es obligatorio')
    expect(validateRecurringForm(form({ categoryId: '', fixedAmount: 0 }), [])).toBe('Elige una categoría')
    for (const fixedAmount of [0, -1, null, NaN]) expect(validateRecurringForm(form({ fixedAmount }), [])).toBe('El monto debe ser mayor a 0')
    expect(validateRecurringForm(form({ amountMode: 'variable', fixedAmount: null }), [])).toBeNull()
  })
  it('validateRecurringForm: exige medio de pago', () => {
    expect(validateRecurringForm(toRecurringForm(rec()), [])).toBe('Elige un medio de pago')
  })
  it('validateRecurringForm exige tarjeta solo si hay tarjetas', () => {
    expect(validateRecurringForm(form({ creditCardId: null }), [card()])).toBe('Elige una tarjeta')
    expect(validateRecurringForm(form({ creditCardId: null }), [])).toBeNull()
    expect(validateRecurringForm(form({ paymentMethod: 'debit_card', creditCardId: null }), [card()])).toBeNull()
  })
  it('validateRecurringForm valida el día 1–31', () => {
    for (const reminderDay of [0, 32, 2.5, NaN]) expect(validateRecurringForm(form({ reminderDay }), [])).toBe('El día de recordatorio debe estar entre 1 y 31')
    for (const reminderDay of [null, 1, 31]) expect(validateRecurringForm(form({ reminderDay }), [])).toBeNull()
  })
  it('buildRecurringInput incluye medio, tarjeta y día sin undefined', () => {
    expect(buildRecurringInput(form(), 'u1', [cat()], [card()])).toEqual({ userId: 'u1', name: 'Arriendo', categoryId: 'home', categoryName: 'Hogar', fixedAmount: 1500000, paymentMethod: 'credit_card', creditCardId: 'nu', creditCardBank: 'Nu', reminderDay: 5 })
  })
  it('buildRecurringInput variable sin descripción ni día no incluye esas claves', () => {
    expect(buildRecurringInput(form({ amountMode: 'variable', paymentMethod: 'debit_card', reminderDay: null }), 'u1', [cat()], [card()])).toEqual({ userId: 'u1', name: 'Arriendo', categoryId: 'home', categoryName: 'Hogar', fixedAmount: null, paymentMethod: 'debit_card' })
  })
  it('buildRecurringUpdate sin cambios no produce cambios', () => {
    const expense = rec({ paymentMethod: 'credit_card', creditCardId: 'nu', creditCardBank: 'Nu', reminderDay: 5 })
    const edit = buildRecurringUpdate(expense, toRecurringForm(expense), [cat()], [card()])
    expect(edit).toEqual({ changes: {}, removeFields: [] })
    expect(hasRecurringChanges(edit)).toBe(false)
  })
  it('buildRecurringUpdate: pasar a débito elimina la tarjeta', () => {
    const expense = rec({ paymentMethod: 'credit_card', creditCardId: 'nu', creditCardBank: 'Nu' })
    const edit = buildRecurringUpdate(expense, { ...toRecurringForm(expense), paymentMethod: 'debit_card' }, [cat()], [card()])
    expect(edit).toEqual({ changes: { paymentMethod: 'debit_card' }, removeFields: ['creditCardId', 'creditCardBank'] })
    expect(hasRecurringChanges(edit)).toBe(true)
  })
  it('buildRecurringUpdate: vaciar el día lo elimina', () => {
    const expense = rec({ reminderDay: 5, paymentMethod: 'debit_card' })
    expect(buildRecurringUpdate(expense, { ...toRecurringForm(expense), reminderDay: null }, [cat()], [])).toEqual({ changes: {}, removeFields: ['reminderDay'] })
  })
  it('buildRecurringUpdate cambia categoría con su nombre y pasa a variable', () => {
    const expense = rec({ paymentMethod: 'debit_card' })
    expect(buildRecurringUpdate(expense, { ...toRecurringForm(expense), categoryId: 'other', amountMode: 'variable' }, [{ ...cat(), id: 'other', name: 'Otra' }], [])).toEqual({ changes: { categoryId: 'other', categoryName: 'Otra', fixedAmount: null }, removeFields: [] })
  })
  it('buildRecurringUpdate: nunca toca el estado de pago', () => {
    const expense = rec({ lastPaidAt: 123, lastPaidAmount: 800, description: 'vieja' })
    expect(buildRecurringUpdate(expense, form({ name: ' Internet ', description: ' Nueva ' }), [cat()], [card()])).toEqual({ changes: { name: 'Internet', description: 'Nueva', paymentMethod: 'credit_card', creditCardId: 'nu', creditCardBank: 'Nu', reminderDay: 5 }, removeFields: [] })
  })
  it('buildRecurringUpdate elimina la descripción vacía', () => {
    const expense = rec({ description: 'Vieja', paymentMethod: 'debit_card' })
    expect(buildRecurringUpdate(expense, { ...toRecurringForm(expense), description: ' ' }, [cat()], [])).toEqual({ changes: {}, removeFields: ['description'] })
  })
  it('buildRecurringUpdate cambia tarjeta con su banco', () => {
    const expense = rec({ paymentMethod: 'credit_card', creditCardId: 'old', creditCardBank: 'Otro' })
    expect(buildRecurringUpdate(expense, { ...toRecurringForm(expense), creditCardId: 'nu' }, [cat()], [card()])).toEqual({ changes: { creditCardId: 'nu', creditCardBank: 'Nu' }, removeFields: [] })
  })
  it('recurringPaymentFields: sin medio de pago devuelve {}', () => {
    expect(recurringPaymentFields(rec())).toEqual({})
  })
  it('recurringPaymentFields copia medio y tarjeta', () => {
    expect(recurringPaymentFields(rec({ paymentMethod: 'credit_card', creditCardId: 'nu', creditCardBank: 'Nu' }))).toEqual({ paymentMethod: 'credit_card', creditCardId: 'nu', creditCardBank: 'Nu' })
    expect(recurringPaymentFields(rec({ paymentMethod: 'debit_card' }))).toEqual({ paymentMethod: 'debit_card' })
  })
})
