/**
 * Tipos e interfaces base del proyecto
 */

// Exportar todos los tipos de modelos de datos
export * from './category'
export * from './transaction'
export * from './monthly-summary'
export * from './recurring-expense'

// Exportar funciones helper
export * from './helpers'

/**
 * Usuario del sistema
 */
export interface User {
  id: string
  name: string
  email: string
  createdAt: number
}

/**
 * Respuesta genérica de API
 */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * Documento base de Firestore
 */
export interface FirestoreDocument {
  id: string
  createdAt: number
  updatedAt?: number
}

/**
 * Estado de la aplicación
 */
export interface AppState {
  isLoading: boolean
  error: string | null
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  limit?: number
  offset?: number
  lastDocId?: string
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  lastDocId?: string
}
