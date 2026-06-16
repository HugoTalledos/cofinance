import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { useFirestoreDb, COLLECTIONS } from './firebase'
import type { RecurringExpense, RecurringExpenseInput, RecurringExpenseUpdate, ApiResponse } from '~/types'
import { getCurrentTimestamp } from '~/types'

export const createRecurringExpense = async (
  data: RecurringExpenseInput
): Promise<ApiResponse<string>> => {
  const response: ApiResponse<string> = { data: null, error: null, loading: false }
  try {
    const db = useFirestoreDb()
    if (!db) throw new Error('Firestore no disponible')
    const ref = collection(db, COLLECTIONS.RECURRING_EXPENSES)
    const docRef = await addDoc(ref, { ...data, createdAt: getCurrentTimestamp() })
    response.data = docRef.id
  } catch (error) {
    response.error = error instanceof Error ? error.message : 'Error al crear gasto recurrente'
  }
  return response
}

export const updateRecurringExpense = async (
  id: string,
  data: RecurringExpenseUpdate
): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = { data: null, error: null, loading: false }
  try {
    const db = useFirestoreDb()
    if (!db) throw new Error('Firestore no disponible')
    await updateDoc(doc(db, COLLECTIONS.RECURRING_EXPENSES, id), data as Record<string, unknown>)
    response.data = true
  } catch (error) {
    response.error = error instanceof Error ? error.message : 'Error al actualizar gasto recurrente'
  }
  return response
}

export const deleteRecurringExpense = async (id: string): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = { data: null, error: null, loading: false }
  try {
    const db = useFirestoreDb()
    if (!db) throw new Error('Firestore no disponible')
    await deleteDoc(doc(db, COLLECTIONS.RECURRING_EXPENSES, id))
    response.data = true
  } catch (error) {
    response.error = error instanceof Error ? error.message : 'Error al eliminar gasto recurrente'
  }
  return response
}

export const getRecurringExpenses = async (userId: string): Promise<ApiResponse<RecurringExpense[]>> => {
  const response: ApiResponse<RecurringExpense[]> = { data: null, error: null, loading: false }
  try {
    const db = useFirestoreDb()
    if (!db) throw new Error('Firestore no disponible')
    const ref = collection(db, COLLECTIONS.RECURRING_EXPENSES)
    const q = query(ref, where('userId', '==', userId), orderBy('createdAt', 'asc'))
    const snapshot = await getDocs(q)
    response.data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as RecurringExpense[]
  } catch (error) {
    response.error = error instanceof Error ? error.message : 'Error al obtener gastos recurrentes'
  }
  return response
}
