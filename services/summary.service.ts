import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  runTransaction
} from 'firebase/firestore'
import { useFirestoreDb, COLLECTIONS } from './firebase'
import type {
  MonthlySummary,
  MonthlySummaryInput,
  MonthlySummaryFilters,
  MonthlySummaryStats,
  CategorySummary,
  ApiResponse
} from '~/types'
import { getCurrentTimestamp, generateMonthlySummaryId } from '~/types'

import { getCategoryById } from '~/services/categories.service'

/**
 * Servicio para gestión de resúmenes mensuales en Firestore
 */

/**
 * Actualiza el resumen mensual de forma incremental
 * Incrementa el gasto de una categoría y el total gastado
 */
export const updateMonthlySummaryIncremental = async (
  month: string,
  categoryId: string,
  amount: number,
): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const summaryId = generateMonthlySummaryId(month)
    const summaryRef = doc(db, COLLECTIONS.MONTHLY_SUMMARY, summaryId)
    const category = await getCategoryById(categoryId);

    await runTransaction(db, async (transaction) => {
      const summaryDoc = await transaction.get(summaryRef)
      const categoryBudget = category.data?.budget || 0
      const categoryIcon = category.data?.icon || '👋'
      const categoryColor = category.data?.color || 'bg-orange-100'

      if (summaryDoc.exists()) {
        // Actualizar resumen existente
        const summaryData = summaryDoc.data()
        const categories = summaryData.categories || {}
        const categoryData = categories[categoryId] || { budget: categoryBudget, spent: 0 }

        transaction.update(summaryRef, {
          [`categories.${categoryId}.spent`]: categoryData.spent + amount,
          [`categories.${categoryId}.budget`]: categoryBudget || categoryData.budget,
          [`categories.${categoryId}.icon`]: categoryIcon,
          [`categories.${categoryId}.color`]: categoryColor,
          totalSpent: (summaryData.totalSpent || 0) + amount,
          updatedAt: getCurrentTimestamp()
        })
      } else {
        category.data?.budget
        const newSummary: MonthlySummaryInput = {
          id: summaryId,
          month,
          categories: {
            [categoryId]: {
              budget: categoryBudget,
              spent: amount,
              color: categoryColor,
              icon: categoryIcon,
            }
          },
          totalSpent: amount
        }

        transaction.set(summaryRef, {
          ...newSummary,
          updatedAt: getCurrentTimestamp()
        })
      }
    })

    response.data = true

  } catch (error) {
    console.error('Error updating monthly summary:', error)
    response.error = error instanceof Error ? error.message : 'Error al actualizar el resumen mensual'
  }

  return response
}

/**
 * Obtiene un resumen mensual específico
 */
export const getMonthlySummary = async (
  month: string
): Promise<ApiResponse<MonthlySummary>> => {
  const response: ApiResponse<MonthlySummary> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const summaryId = generateMonthlySummaryId(month)
    const summaryRef = doc(db, COLLECTIONS.MONTHLY_SUMMARY, summaryId)

    const docSnap = await getDoc(summaryRef)

    if (docSnap.exists()) {
      response.data = {
        id: docSnap.id,
        ...docSnap.data()
      } as MonthlySummary
    } else {
      // Retornar un resumen vacío en lugar de error
      response.data = {
        id: summaryId,
        month,
        categories: {},
        totalSpent: 0,
        updatedAt: getCurrentTimestamp()
      }
    }

  } catch (error) {
    console.error('Error getting monthly summary:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener el resumen mensual'
  }

  return response
}

/**
 * Obtiene múltiples resúmenes mensuales con filtros
 */
export const getMonthlySummaries = async (
  filters: MonthlySummaryFilters
): Promise<ApiResponse<MonthlySummary[]>> => {
  const response: ApiResponse<MonthlySummary[]> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const summariesRef = collection(db, COLLECTIONS.MONTHLY_SUMMARY)

    const constraints = [
      where('userId', '==', filters.userId),
      orderBy('month', 'desc')
    ]

    // Filtro por mes específico
    if (filters.month) {
      constraints.push(where('month', '==', filters.month))
    }

    // Filtro por rango de meses
    if (filters.monthFrom) {
      constraints.push(where('month', '>=', filters.monthFrom))
    }
    if (filters.monthTo) {
      constraints.push(where('month', '<=', filters.monthTo))
    }

    const q = query(summariesRef, ...constraints)
    const snapshot = await getDocs(q)

    const summaries: MonthlySummary[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MonthlySummary[]

    response.data = summaries

  } catch (error) {
    console.error('Error getting monthly summaries:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener los resúmenes mensuales'
  }

  return response
}

/**
 * Calcula estadísticas del resumen mensual
 */
export const calculateSummaryStats = (summary: MonthlySummary): MonthlySummaryStats => {
  const categories = summary.categories || {}
  
  let totalBudget = 0
  const categoriesOverBudget: string[] = []

  Object.entries(categories).forEach(([categoryId, data]) => {
    totalBudget += data.budget
    if (data.spent > data.budget) {
      categoriesOverBudget.push(categoryId)
    }
  })

  const totalSpent = summary.totalSpent || 0
  const remainingBudget = totalBudget - totalSpent
  const percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  return {
    totalBudget,
    totalSpent,
    remainingBudget,
    percentageUsed,
    categoriesCount: Object.keys(categories).length,
    categoriesOverBudget
  }
}

/**
 * Sincroniza el presupuesto de una categoría en todos los resúmenes mensuales
 * Útil cuando se actualiza el presupuesto de una categoría
 */
export const syncCategoryBudget = async (
  userId: string,
  categoryId: string,
  newBudget: number,
  months: string[]
): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()

    // Actualizar cada mes en batch
    const { writeBatch } = await import('firebase/firestore')
    const batch = writeBatch(db)

    for (const month of months) {
      const summaryId = generateMonthlySummaryId(userId, month)
      const summaryRef = doc(db, COLLECTIONS.MONTHLY_SUMMARY, summaryId)

      batch.update(summaryRef, {
        [`categories.${categoryId}.budget`]: newBudget,
        updatedAt: getCurrentTimestamp()
      })
    }

    await batch.commit()
    response.data = true

  } catch (error) {
    console.error('Error syncing category budget:', error)
    response.error = error instanceof Error ? error.message : 'Error al sincronizar el presupuesto'
  }

  return response
}

/**
 * Recalcula completamente un resumen mensual desde las transacciones
 * Útil para corregir inconsistencias
 */
export const recalculateMonthlySummary = async (
  userId: string,
  month: string,
  categoriesMap: Record<string, number> // categoryId -> budget
): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    
    // Obtener todas las transacciones del mes
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS)
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      where('month', '==', month)
    )

    const snapshot = await getDocs(q)

    // Calcular totales
    const categories: Record<string, CategorySummary> = {}
    let totalSpent = 0

    snapshot.docs.forEach(doc => {
      const transaction = doc.data()
      const categoryId = transaction.categoryId
      const amount = transaction.amount || 0

      if (!categories[categoryId]) {
        categories[categoryId] = {
          budget: categoriesMap[categoryId] || 0,
          spent: 0
        }
      }

      categories[categoryId].spent += amount
      totalSpent += amount
    })

    // Actualizar o crear el resumen
    const summaryId = generateMonthlySummaryId(userId, month)
    const summaryRef = doc(db, COLLECTIONS.MONTHLY_SUMMARY, summaryId)

    const summaryData: Partial<MonthlySummary> = {
      id: summaryId,
      userId,
      month,
      categories,
      totalSpent,
      updatedAt: getCurrentTimestamp()
    }

    await setDoc(summaryRef, summaryData)
    response.data = true

  } catch (error) {
    console.error('Error recalculating monthly summary:', error)
    response.error = error instanceof Error ? error.message : 'Error al recalcular el resumen mensual'
  }

  return response
}

/**
 * Elimina un resumen mensual
 * CUIDADO: Solo usar si se eliminan todas las transacciones del mes
 */
export const deleteMonthlySummary = async (
  userId: string,
  month: string
): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    const summaryId = generateMonthlySummaryId(userId, month)
    const summaryRef = doc(db, COLLECTIONS.MONTHLY_SUMMARY, summaryId)

    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(summaryRef)

    response.data = true

  } catch (error) {
    console.error('Error deleting monthly summary:', error)
    response.error = error instanceof Error ? error.message : 'Error al eliminar el resumen mensual'
  }

  return response
}
