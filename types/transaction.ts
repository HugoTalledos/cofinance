/**
 * Interfaces para la colección 'transactions'
 * Optimizada para alto volumen de escritura y consultas por mes/categoría
 */

export interface Transaction {
  id: string
  userId: string
  categoryId: string
  categoryName: string
  amount: number
  description: string
  /** Fecha en formato YYYY-MM-DD */
  date: string
  /** Mes en formato YYYY-MM para indexación */
  month: string
  createdAt: number
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
  userId: string
  /** Mes en formato YYYY-MM */
  month?: string
  categoryId?: string
  /** Rango de fechas */
  dateFrom?: string
  dateTo?: string
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
