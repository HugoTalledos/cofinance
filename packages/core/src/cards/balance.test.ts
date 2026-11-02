import { describe, it, expect } from 'vitest'
import { computeCardBalance, validateCardPayment, validateCardSettings } from './balance'
const card = { id: 'a', bank: 'Banco', createdAt: 0, openingBalance: 0, trackingStartDate: '2026-10-01' }
const tx = (amount: number, type = 'expense', date = '2026-10-01', creditCardId = 'a') => ({ id: 'x', userId: 'u', username: 'u', categoryId: '', categoryName: '', amount, description: '', date, month: date.slice(0, 7), createdAt: 0, type, creditCardId, paymentMethod: 'credit_card' } as any)
describe('seguimiento de tarjeta', () => {
  it('cuenta la compra una vez y resta abonos de otro mes', () => expect(computeCardBalance(card, [tx(100000), tx(60000, 'card_payment', '2026-11-01')], '2026-11-02')).toBe(40000))
  it('admite saldo a favor', () => expect(computeCardBalance(card, [tx(100000), tx(120000, 'card_payment')], '2026-11-02')).toBe(-20000))
  it('omite fuera de rango, otra tarjeta y débito', () => expect(computeCardBalance(card, [tx(10, 'expense', '2026-09-30'), tx(10, 'expense', '2026-12-01'), tx(10, 'expense', '2026-10-01', 'b'), {...tx(10), paymentMethod:'debit_card'}], '2026-11-02')).toBe(0))
  it('no supone saldo sin configuración completa', () => expect(computeCardBalance({...card, openingBalance: undefined}, [], '2026-11-02')).toBeNull())
  it('preserva gastos legados', () => expect(computeCardBalance(card, [{...tx(10), type: undefined}], '2026-11-02')).toBe(10))
  it.each([0, -1, 1.5, NaN, Infinity])('rechaza monto %s', amount => expect(validateCardPayment({amount, date:'2026-10-01', description:''}, card, '2026-11-02')).toBeTruthy())
  it.each(['2026-09-30','2026-11-03','2026-02-30'])('rechaza fecha %s', date => expect(validateCardPayment({amount:1,date,description:''},card,'2026-11-02')).toBeTruthy())
  it('acepta descripción opcional y fecha inicial', () => expect(validateCardPayment({amount:1,date:'2026-10-01',description:''},card,'2026-11-02')).toBeNull())
  it('valida días e inicial', () => {
    expect(validateCardSettings({openingBalance:-10,trackingStartDate:'2026-10-01',statementDay:1,paymentDay:31},'2026-11-02')).toBeNull()
    expect(validateCardSettings({openingBalance:0,trackingStartDate:'2026-10-01',statementDay:32,paymentDay:null},'2026-11-02')).toBeTruthy()
  })
})
