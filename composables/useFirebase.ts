/**
 * Composable genérico para operaciones con Firestore
 * 
 * NOTA: Para operaciones específicas de categorías, transacciones y resúmenes,
 * se recomienda usar los servicios en /services/*.service.ts
 * 
 * Este composable es útil para operaciones CRUD genéricas en colecciones personalizadas.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  type QueryConstraint,
  type DocumentData,
  type FirestoreError
} from 'firebase/firestore'
import { useFirestoreDb } from '~/services/firebase'
import type { ApiResponse } from '~/types'
import { getCurrentTimestamp } from '~/types'

/**
 * Composable genérico para operaciones CRUD con Firestore
 * 
 * @param collectionName Nombre de la colección de Firestore
 * @returns Funciones para operaciones CRUD
 * 
 * @example
 * // Para colecciones genéricas
 * const notesCollection = useFirebaseCollection<Note>('notes')
 * await notesCollection.create({ title: 'Mi nota' })
 * 
 * // Para categorías, transacciones y resúmenes, usa los servicios:
 * import { createCategory, createTransaction } from '~/services'
 */
export const useFirebaseCollection = <T extends DocumentData>(collectionName: string) => {
  const db = useFirestoreDb()
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  const collectionRef = collection(db, collectionName)

  /**
   * Obtiene todos los documentos de una colección
   */
  const getAll = async (): Promise<ApiResponse<T[]>> => {
    const response: ApiResponse<T[]> = {
      data: null,
      error: null,
      loading: false
    }

    try {
      const snapshot = await getDocs(collectionRef)
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]

      response.data = documents
    } catch (error) {
      const firestoreError = error as FirestoreError
      response.error = firestoreError.message
    }

    return response
  }

  /**
   * Obtiene un documento por ID
   */
  const getById = async (id: string): Promise<ApiResponse<T>> => {
    const response: ApiResponse<T> = {
      data: null,
      error: null,
      loading: false
    }

    try {
      const docRef = doc(db, collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        response.data = {
          id: docSnap.id,
          ...docSnap.data()
        } as T
      } else {
        response.error = 'Documento no encontrado'
      }
    } catch (error) {
      const firestoreError = error as FirestoreError
      response.error = firestoreError.message
    }

    return response
  }

  /**
   * Busca documentos con condiciones
   */
  const queryDocuments = async (constraints: QueryConstraint[]): Promise<ApiResponse<T[]>> => {
    const response: ApiResponse<T[]> = {
      data: null,
      error: null,
      loading: false
    }

    try {
      const q = query(collectionRef, ...constraints)
      const snapshot = await getDocs(q)
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]

      response.data = documents
    } catch (error) {
      const firestoreError = error as FirestoreError
      response.error = firestoreError.message
    }

    return response
  }

  /**
   * Crea un nuevo documento
   */
  const create = async (data: Partial<T>): Promise<ApiResponse<string>> => {
    const response: ApiResponse<string> = {
      data: null,
      error: null,
      loading: false
    }

    try {
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: getCurrentTimestamp()
      })

      response.data = docRef.id
    } catch (error) {
      const firestoreError = error as FirestoreError
      response.error = firestoreError.message
    }

    return response
  }

  /**
   * Actualiza un documento existente
   */
  const update = async (id: string, data: Partial<T>): Promise<ApiResponse<boolean>> => {
    const response: ApiResponse<boolean> = {
      data: null,
      error: null,
      loading: false
    }

    try {
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: getCurrentTimestamp()
      })

      response.data = true
    } catch (error) {
      const firestoreError = error as FirestoreError
      response.error = firestoreError.message
    }

    return response
  }

  /**
   * Elimina un documento
   */
  const remove = async (id: string): Promise<ApiResponse<boolean>> => {
    const response: ApiResponse<boolean> = {
      data: null,
      error: null,
      loading: false
    }

    try {
      const docRef = doc(db, collectionName, id)
      await deleteDoc(docRef)

      response.data = true
    } catch (error) {
      const firestoreError = error as FirestoreError
      response.error = firestoreError.message
    }

    return response
  }

  return {
    getAll,
    getById,
    queryDocuments,
    create,
    update,
    remove
  }
}
