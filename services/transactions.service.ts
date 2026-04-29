import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  type QueryConstraint
} from 'firebase/firestore'
import { useFirestoreDb, COLLECTIONS } from './firebase'
import { updateMonthlySummaryIncremental } from './summary.service'
import type { Transaction, TransactionInput, TransactionFilters, ApiResponse } from '~/types'
import { getCurrentTimestamp } from '~/types'

/**
 * Servicio para gestión de transacciones en Firestore
 */

/**
 * Crea una nueva transacción y actualiza el resumen mensual
 * Esta operación es atómica usando transacciones de Firestore
 */
export const createTransaction = async (data: TransactionInput): Promise<ApiResponse<string>> => {
  const response: ApiResponse<string> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()

    // Usar transacción de Firestore para operación atómica
    const transactionId = await runTransaction(db, async (transaction) => {
      // 1. Crear la transacción
      const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS)
      const newTransactionRef = doc(transactionsRef)

      const transactionData = {
        ...data,
        createdAt: getCurrentTimestamp()
      }

      transaction.set(newTransactionRef, transactionData)

      // 2. Actualizar el resumen mensual
      const summaryRef = doc(
        db,
        COLLECTIONS.MONTHLY_SUMMARY,
        `${data.userId}_${data.month}`
      )

      const summaryDoc = await transaction.get(summaryRef)

      if (summaryDoc.exists()) {
        // Actualizar resumen existente
        const summaryData = summaryDoc.data()
        const categories = summaryData.categories || {}
        const categoryData = categories[data.categoryId] || { budget: 0, spent: 0 }

        transaction.update(summaryRef, {
          [`categories.${data.categoryId}.spent`]: categoryData.spent + data.amount,
          totalSpent: (summaryData.totalSpent || 0) + data.amount,
          updatedAt: getCurrentTimestamp()
        })
      } else {
        // Crear nuevo resumen mensual
        transaction.set(summaryRef, {
          id: `${data.userId}_${data.month}`,
          userId: data.userId,
          month: data.month,
          categories: {
            [data.categoryId]: {
              budget: 0, // Se debe actualizar desde la categoría
              spent: data.amount
            }
          },
          totalSpent: data.amount,
          updatedAt: getCurrentTimestamp()
        })
      }

      return newTransactionRef.id
    })

    response.data = transactionId

  } catch (error) {
    console.error('Error creating transaction:', error)
    response.error = error instanceof Error ? error.message : 'Error al crear la transacción'
  }

  return response
}

/**
 * Obtiene transacciones con filtros opcionales
 */
export const getTransactions = async (
  filters: TransactionFilters
): Promise<ApiResponse<Transaction[]>> => {
  const response: ApiResponse<Transaction[]> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS)

    // Construir constraints dinámicamente
    const constraints: QueryConstraint[] = [
      where('userId', '==', filters.userId)
    ]

    // Filtro por mes (más común y eficiente)
    if (filters.month) {
      constraints.push(where('month', '==', filters.month))
    }

    // Filtro por categoría
    if (filters.categoryId) {
      constraints.push(where('categoryId', '==', filters.categoryId))
    }

    // Filtro por rango de fechas
    if (filters.dateFrom) {
      constraints.push(where('date', '>=', filters.dateFrom))
    }
    if (filters.dateTo) {
      constraints.push(where('date', '<=', filters.dateTo))
    }

    // Ordenar por fecha descendente
    constraints.push(orderBy('date', 'desc'))

    const q = query(transactionsRef, ...constraints)
    const snapshot = await getDocs(q)

    const transactions: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[]

    response.data = transactions

  } catch (error) {
    console.error('Error getting transactions:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener las transacciones'
  }

  return response
}

/**
 * Obtiene las transacciones más recientes de un usuario
 */
export const getRecentTransactions = async (
  userId: string,
  limitCount: number = 10
): Promise<ApiResponse<Transaction[]>> => {
  const response: ApiResponse<Transaction[]> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS)

    const { limit } = await import('firebase/firestore')

    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(q)

    const transactions: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[]

    response.data = transactions

  } catch (error) {
    console.error('Error getting recent transactions:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener las transacciones recientes'
  }

  return response
}

/**
 * Obtiene el total gastado en una categoría para un mes específico
 */
export const getCategorySpentInMonth = async (
  userId: string,
  categoryId: string,
  month: string
): Promise<number> => {
  try {
    const filters: TransactionFilters = {
      userId,
      categoryId,
      month
    }

    const result = await getTransactions(filters)
    
    if (!result.data || result.error) {
      return 0
    }

    return result.data.reduce((total, transaction) => total + transaction.amount, 0)

  } catch (error) {
    console.error('Error calculating category spent:', error)
    return 0
  }
}

/**
 * Obtiene el total de transacciones en un mes
 */
export const getMonthlyTotal = async (
  userId: string,
  month: string
): Promise<number> => {
  try {
    const filters: TransactionFilters = {
      userId,
      month
    }

    const result = await getTransactions(filters)
    
    if (!result.data || result.error) {
      return 0
    }

    return result.data.reduce((total, transaction) => total + transaction.amount, 0)

  } catch (error) {
    console.error('Error calculating monthly total:', error)
    return 0
  }
}

/**
 * Cuenta el número de transacciones que cumplen con los filtros
 */
export const countTransactions = async (filters: TransactionFilters): Promise<number> => {
  try {
    const result = await getTransactions(filters)
    return result.data?.length || 0
  } catch (error) {
    console.error('Error counting transactions:', error)
    return 0
  }
}
