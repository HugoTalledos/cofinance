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
  type QueryConstraint
} from 'firebase/firestore'
import { useFirestoreDb, COLLECTIONS } from './firebase'
import type { Category, CategoryInput, CategoryUpdate, ApiResponse } from '~/types'
import { getCurrentTimestamp } from '~/types'

/**
 * Servicio para gestión de categorías en Firestore
 */

/**
 * Crea una nueva categoría
 */
export const createCategory = async (data: CategoryInput): Promise<ApiResponse<string>> => {
  const response: ApiResponse<string> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    
    // Verificar que Firebase esté disponible (SSR compatible)
    if (!db) {
      response.error = 'Firebase no está disponible en el servidor'
      return response
    }
    
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES)

    const categoryData = {
      ...data,
      categoryCode: getCategoryCode(data),
      createdAt: getCurrentTimestamp()
    }

    const docRef = await addDoc(categoriesRef, categoryData)
    response.data = docRef.id

  } catch (error) {
    console.error('Error creating category:', error)
    response.error = error instanceof Error ? error.message : 'Error al crear la categoría'
  }

  return response
}

/**
 * Actualiza una categoría existente
 */
export const updateCategory = async (
  categoryId: string,
  data: CategoryUpdate
): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const categoryRef = doc(db, COLLECTIONS.CATEGORIES, categoryId)

    await updateDoc(categoryRef, data as Record<string, any>)
    response.data = true

  } catch (error) {
    console.error('Error updating category:', error)
    response.error = error instanceof Error ? error.message : 'Error al actualizar la categoría'
  }

  return response
}

/**
 * Elimina una categoría
 * NOTA: Verifica que no haya transacciones asociadas antes de llamar esta función
 */
export const deleteCategory = async (categoryId: string): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const categoryRef = doc(db, COLLECTIONS.CATEGORIES, categoryId)

    await deleteDoc(categoryRef)
    response.data = true

  } catch (error) {
    console.error('Error deleting category:', error)
    response.error = error instanceof Error ? error.message : 'Error al eliminar la categoría'
  }

  return response
}

/**
 * Obtiene todas las categorías de un usuario
 */
export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  const response: ApiResponse<Category[]> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES)

    const constraints: QueryConstraint[] = [
      orderBy('name', 'asc')
    ]

    const q = query(categoriesRef, ...constraints)
    const snapshot = await getDocs(q)

    const categories: Category[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[]

    response.data = categories

  } catch (error) {
    console.error('Error getting categories:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener las categorías'
  }

  return response
}

/**
 * Obtiene una categoría por ID
 */
export const getCategoryById = async (categoryId: string): Promise<ApiResponse<Category>> => {
  const response: ApiResponse<Category> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const categoryRef = doc(db, COLLECTIONS.CATEGORIES, categoryId)
    
    const { getDoc } = await import('firebase/firestore')
    const docSnap = await getDoc(categoryRef)

    if (docSnap.exists()) {
      response.data = {
        id: docSnap.id,
        ...docSnap.data()
      } as Category
    } else {
      response.error = 'Categoría no encontrada'
    }

  } catch (error) {
    console.error('Error getting category:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener la categoría'
  }

  return response
}

/**
 * Verifica si una categoría tiene transacciones asociadas
 */
export const categoryHasTransactions = async (categoryId: string): Promise<boolean> => {
  try {
    const db = useFirestoreDb()
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS)

    const q = query(
      transactionsRef,
      where('categoryId', '==', categoryId),
      orderBy('createdAt', 'desc')
    )

    const { limit } = await import('firebase/firestore')
    const limitedQuery = query(q, limit(1))
    const snapshot = await getDocs(limitedQuery)

    return !snapshot.empty

  } catch (error) {
    console.error('Error checking category transactions:', error)
    return false
  }
}
