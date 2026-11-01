/**
 * Interfaces para la colección 'credit_cards'
 * Solo lectura desde la app: las tarjetas se administran directamente en Firestore
 */

export interface CreditCard {
  id: string
  /** Banco emisor; identifica la tarjeta en la UI (no hay dos tarjetas del mismo banco) */
  bank: string
  createdAt: number
}
