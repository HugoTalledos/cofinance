/**
 * Interfaces para la colección 'credit_cards'
 * Las tarjetas se crean en Firestore; el seguimiento se configura desde la app
 */

export interface CreditCard {
  id: string
  /** Banco emisor; identifica la tarjeta en la UI (no hay dos tarjetas del mismo banco) */
  bank: string
  openingBalance?: number
  trackingStartDate?: string
  statementDay?: number
  paymentDay?: number
  createdAt: number
}
