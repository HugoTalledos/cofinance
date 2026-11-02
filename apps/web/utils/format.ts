import { parseDateString, type Transaction } from '@cofinance/core'

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export const formatCOP = (value: number): string => copFormatter.format(value)

/** +6.0% / -18.0%: una decimal y signo siempre */
export const formatPercent = (value: number): string => {
  const sign = value < 0 ? '-' : '+'
  return `${sign}${Math.abs(value).toFixed(1)}%`
}

/** Día, mes corto y año en es-CO a partir de `date` (YYYY-MM-DD[...]) */
export const formatTxDate = (tx: Transaction): string =>
  parseDateString(tx.date.substring(0, 10)).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

export const paymentMethodLabel = (tx: Transaction): string => {
  if (tx.type === 'card_payment') return `Pago de tarjeta · ${tx.creditCardBank ?? ''}`
  if (tx.paymentMethod === 'debit_card') return 'Débito'
  if (tx.paymentMethod === 'credit_card') return tx.creditCardBank ? `Crédito · ${tx.creditCardBank}` : 'Crédito'
  return ''
}
