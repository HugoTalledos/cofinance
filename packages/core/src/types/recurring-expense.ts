import type { PaymentMethod } from './transaction'

export interface RecurringExpense {
  id: string
  userId: string
  name: string
  description?: string
  /** Monto fijo. null significa que el monto es variable */
  fixedAmount: number | null
  categoryId: string
  categoryName: string
  paymentMethod?: PaymentMethod
  creditCardId?: string
  creditCardBank?: string
  /** Solo se guarda; no se usa todavía */
  reminderDay?: number
  createdAt: number
  /** Timestamp del último pago registrado (persiste entre periodos) */
  lastPaidAt?: number
  /** Monto del último pago registrado. Útil sobre todo en montos variables */
  lastPaidAmount?: number | null
}

export type RecurringExpenseInput = Omit<RecurringExpense, 'id' | 'createdAt'>
export type RecurringExpenseUpdate = Partial<Omit<RecurringExpense, 'id' | 'userId' | 'createdAt'>>

export type RemovableRecurringField = 'creditCardId' | 'creditCardBank' | 'reminderDay' | 'description'
