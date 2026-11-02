import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useFirestoreDb, COLLECTIONS } from './firebase'
import type { CreditCard, ApiResponse } from '../types'

/**
 * Servicio de solo lectura para tarjetas de crédito.
 * Las tarjetas se crean y editan directamente en Firestore, no desde la app.
 */

/**
 * Obtiene todas las tarjetas de crédito ordenadas por banco
 */
export const getCreditCards = async (): Promise<ApiResponse<CreditCard[]>> => {
  const response: ApiResponse<CreditCard[]> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    if (!db) {
      throw new Error('Firestore database not initialized')
    }

    const q = query(collection(db, COLLECTIONS.CREDIT_CARDS), orderBy('bank', 'asc'))
    const snapshot = await getDocs(q)

    response.data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CreditCard[]

  } catch (error) {
    console.error('Error getting credit cards:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener las tarjetas de crédito'
  }

  return response
}
