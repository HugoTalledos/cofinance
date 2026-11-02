/**
 * Interfaces para la colección 'transactions'
 * Optimizada para alto volumen de escritura y consultas por mes/categoría
 */

/** Medio de pago de un egreso. Los códigos se guardan tal cual en Firestore */
export type PaymentMethod = 'credit_card' | 'debit_card'

export interface Transaction {
  id: string
  userId: string
  username: string
  categoryId: string
  categoryName: string
  amount: number
  description: string
  /** Fecha en formato YYYY-MM-DD */
  date: string
  /** Mes en formato YYYY-MM para indexación */
  month: string
  /** Tipo de movimiento */
  type?: 'income' | 'expense'
  /** Solo en egresos registrados desde el formulario; ausente en los anteriores */
  paymentMethod?: PaymentMethod
  /** Solo en egresos con crédito: id del doc en 'credit_cards' */
  creditCardId?: string
  /** Banco de la tarjeta, denormalizado para leer sin otra consulta */
  creditCardBank?: string
  createdAt: number
  category?: Record<string, any>
}

/**
 * Datos requeridos para crear una nueva transacción
 */
export type TransactionInput = Omit<Transaction, 'id' | 'createdAt'>

/**
 * Datos permitidos para actualizar una transacción
 */
export type TransactionUpdate = Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>

/**
 * Filtros optimizados para consultas comunes
 */
export interface TransactionFilters {
  userId?: string
  /** Mes en formato YYYY-MM */
  month?: string
  categoryId?: string
  /** Rango de fechas */
  dateFrom?: string
  dateTo?: string
  /** Periodo de facturación (YYYY-MM del mes de inicio), para estado del UI */
  periodKey?: string
}

/**
 * Opciones de ordenamiento para transacciones
 */
export type TransactionOrderBy = 'date' | 'amount' | 'createdAt'
export type TransactionOrderDirection = 'asc' | 'desc'

export interface TransactionQueryOptions {
  filters: TransactionFilters
  orderBy?: TransactionOrderBy
  orderDirection?: TransactionOrderDirection
  limit?: number
}

/** Campos opcionales de tarjeta que se pueden borrar del documento */
export type RemovableTransactionField = 'creditCardId' | 'creditCardBank'
