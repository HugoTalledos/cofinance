import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useFirestoreDb, COLLECTIONS } from './firebase'
import type { CreditCard, ApiResponse } from '../types'

/**
 * Servicio de consulta y configuración de seguimiento para tarjetas de crédito.
 * Las tarjetas se crean en Firestore; la app permite configurar su seguimiento.
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

/** Guarda el punto inicial del seguimiento y los días informativos. */
export const updateCreditCardSettings = async (id: string, input: import('../cards/balance').CardSettingsInput): Promise<ApiResponse<boolean>> => {
  try {
    const { validateCardSettings, cardToday } = await import('../cards/balance')
    const validation = validateCardSettings(input, cardToday())
    if (validation) throw new Error(validation)
    const { doc, updateDoc, deleteField } = await import('firebase/firestore')
    const db = useFirestoreDb()
    if (!db) throw new Error('Firestore no disponible')
    await updateDoc(doc(db, COLLECTIONS.CREDIT_CARDS, id), { ...input, statementDay: input.statementDay ?? deleteField(), paymentDay: input.paymentDay ?? deleteField() })
    return { data:true,error:null,loading:false }
  } catch (err) { return {data:null,error:err instanceof Error ? err.message : 'Error al configurar tarjeta',loading:false} }
}
