import type { CreditCard, Transaction, TransactionInput } from '../types'
export interface CardSettingsInput { openingBalance: number; trackingStartDate: string; statementDay: number | null; paymentDay: number | null }
export interface CardPaymentForm { amount: number; date: string; description: string }
export const cardToday = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const validDate = (s: string): boolean => { if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const d = new Date(`${s}T12:00:00`); return !isNaN(d.getTime()) && `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` === s }
export const isCardConfigured = (card: CreditCard): boolean => Number.isSafeInteger(card.openingBalance) && !!card.trackingStartDate && validDate(card.trackingStartDate)
export const validateCardSettings = (input: CardSettingsInput, today: string): string | null => {
  if (!Number.isSafeInteger(input.openingBalance)) return 'Ingresa un saldo entero válido en COP'
  if (!validDate(input.trackingStartDate) || input.trackingStartDate > today) return 'Ingresa una fecha de inicio válida hasta hoy'
  for (const day of [input.statementDay,input.paymentDay]) if (day !== null && (!Number.isInteger(day) || day < 1 || day > 31)) return 'Los días deben estar entre 1 y 31'
  return null
}
export const validateCardPayment = (form: CardPaymentForm, card: CreditCard, today: string): string | null => {
  if (!isCardConfigured(card)) return 'Configura el saldo inicial de la tarjeta'
  if (!Number.isSafeInteger(form.amount) || form.amount <= 0) return 'El monto debe ser un entero mayor a cero'
  if (!validDate(form.date) || form.date < card.trackingStartDate! || form.date > today) return 'La fecha debe estar entre el inicio del seguimiento y hoy'
  return null
}
export const computeCardBalance = (card: CreditCard, transactions: Transaction[], today: string): number | null => {
  if (!isCardConfigured(card)) return null
  return transactions.reduce((balance, tx) => {
    if (tx.creditCardId !== card.id || tx.date < card.trackingStartDate! || tx.date > today) return balance
    if (tx.type === 'card_payment') return balance - tx.amount
    if ((tx.type ?? 'expense') === 'expense' && tx.paymentMethod === 'credit_card') return balance + tx.amount
    return balance
  }, card.openingBalance!)
}
export const buildCardPaymentInput = (form: CardPaymentForm, card: CreditCard, author: {userId: string; username: string}): TransactionInput => ({ ...author, type:'card_payment', creditCardId:card.id, creditCardBank:card.bank, amount:form.amount, date:form.date, month:form.date.slice(0,7), description:form.description.trim() || 'Pago de tarjeta', categoryId:'', categoryName:'' })
