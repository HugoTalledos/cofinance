import { ref, computed, type Ref } from 'vue'
import {
  getMonthlySummary as getMonthlySummaryService,
  getMonthlySummaries as getMonthlySummariesService,
  calculateSummaryStats as calculateSummaryStatsService,
  recalculateMonthlySummary as recalculateMonthlySummaryService
} from '~/services'
import type {
  MonthlySummary,
  MonthlySummaryFilters,
  MonthlySummaryStats,
  CategorySummary
} from '~/types'
import {
  getCurrentMonth,
  isOverBudget as isOverBudgetHelper
} from '~/types'


const currentSummary: Ref<MonthlySummary | null> = ref(null)

/**
 * Composable para gestión de resúmenes mensuales
 * 
 * @example
 * const { 
 *   currentSummary, 
 *   loading, 
 *   error,
 *   fetchSummary,
 *   stats 
 * } = useSummary()
 * 
 * await fetchSummary('user123', '2026-04')
 */
export const useSummary = () => {
  // Estado reactivo
  const summaries: Ref<MonthlySummary[]> = ref([])
  const loading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)
  const currentMonth: Ref<string> = ref(getCurrentMonth())

  // Computed - Estadísticas del resumen actual
  const stats = computed<MonthlySummaryStats | null>(() => {
    if (!currentSummary.value) return null
    return calculateSummaryStatsService(currentSummary.value)
  })

  /**
   * Verifica si hay un resumen cargado
   */
  const hasSummary = computed(() => currentSummary.value !== null)

  /**
   * Total gastado del resumen actual
   */
  const totalSpent = computed(() => {
    return currentSummary.value?.totalSpent || 0
  })

  /**
   * Total gastado formateado
   */
  const totalSpentFormatted = computed(() => {
    return formatCurrency(totalSpent.value)
  })

  /**
   * Total de presupuesto
   */
  const totalBudget = computed(() => {
    return stats.value?.totalBudget || 0
  })

  /**
   * Total de presupuesto formateado
   */
  const totalBudgetFormatted = computed(() => {
    return formatCurrency(totalBudget.value)
  })

  /**
   * Presupuesto restante
   */
  const remainingBudget = computed(() => {
    return stats.value?.remainingBudget || 0
  })

  /**
   * Presupuesto restante formateado
   */
  const remainingBudgetFormatted = computed(() => {
    return formatCurrency(remainingBudget.value)
  })

  /**
   * Porcentaje de presupuesto usado
   */
  const budgetPercentage = computed(() => {
    return stats.value?.percentageUsed || 0
  })

  /**
   * Verifica si está sobre presupuesto
   */
  const isOverBudget = computed(() => {
    return totalSpent.value > totalBudget.value
  })

  /**
   * Número de categorías en el resumen
   */
  const categoriesCount = computed(() => {
    return stats.value?.categoriesCount || 0
  })

  /**
   * Categorías que están sobre presupuesto
   */
  const categoriesOverBudget = computed(() => {
    return stats.value?.categoriesOverBudget || []
  })

  /**
   * Categorías con sus datos de resumen (array)
   */
  const categoriesData = computed(() => {
    if (!currentSummary.value) return []
    
    return Object.entries(currentSummary.value.categories)
    .map(([categoryId, data]) => ({
      categoryId,
      ...data,
      percentage: data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0,
      remaining: data.budget - data.spent,
      isOverBudget: data.spent > data.budget,
    }))
    .sort((a, b) => b.budget - a.budget);
  
  })

  /**
   * Categorías ordenadas por gasto (mayor a menor)
   */
  const categoriesBySpent = computed(() => {
    return [...categoriesData.value].sort((a, b) => b.spent - a.spent)
  })

  /**
   * Obtiene el resumen de un mes específico
   */
  const fetchSummary = async (month: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await getMonthlySummaryService(month)
      
      if (result.error) {
        error.value = result.error
        return false
      }

      currentSummary.value = result.data
      currentMonth.value = month
      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar resumen'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene el resumen del mes actual
   */
  const fetchCurrentMonthSummary = async (): Promise<boolean> => {
    const month = getCurrentMonth()
    return await fetchSummary(month)
  }

  /**
   * Obtiene múltiples resúmenes mensuales
   */
  const fetchSummaries = async (filters: MonthlySummaryFilters): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await getMonthlySummariesService(filters)
      
      if (result.error) {
        error.value = result.error
        return false
      }

      summaries.value = result.data || []
      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar resúmenes'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Recalcula el resumen mensual desde las transacciones
   */
  const recalculateSummary = async (
    userId: string,
    month: string,
    categoriesMap: Record<string, number>
  ): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await recalculateMonthlySummaryService(
        userId,
        month,
        categoriesMap
      )
      
      if (result.error) {
        error.value = result.error
        return false
      }

      // Recargar el resumen después de recalcular
      await fetchSummary(month)
      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al recalcular resumen'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene datos de una categoría específica del resumen actual
   */
  const getCategoryData = (categoryId: string): CategorySummary | null => {
    if (!currentSummary.value) return null
    return currentSummary.value.categories[categoryId] || null
  }

  /**
   * Verifica si una categoría específica está sobre presupuesto
   */
  const isCategoryOverBudget = (categoryId: string): boolean => {
    const data = getCategoryData(categoryId)
    if (!data) return false
    return isOverBudgetHelper(data.spent, data.budget)
  }

  /**
   * Obtiene el porcentaje de presupuesto usado de una categoría
   */
  const getCategoryPercentage = (categoryId: string): number => {
    const data = getCategoryData(categoryId)
    if (!data || data.budget === 0) return 0
    return Math.round((data.spent / data.budget) * 100)
  }

  /**
   * Compara el mes actual con el anterior
   */
  const compareWithPreviousMonth = (previousSummary: MonthlySummary) => {
    if (!currentSummary.value) return null

    const currentStats = calculateSummaryStatsService(currentSummary.value)
    const previousStats = calculateSummaryStatsService(previousSummary)

    const difference = currentStats.totalSpent - previousStats.totalSpent
    const percentageChange = previousStats.totalSpent > 0
      ? Math.round((difference / previousStats.totalSpent) * 100)
      : 0

    return {
      current: currentStats,
      previous: previousStats,
      difference,
      percentageChange,
      increased: difference > 0,
      decreased: difference < 0,
      unchanged: difference === 0
    }
  }

  /**
   * Obtiene el top N de categorías por gasto
   */
  const getTopCategories = (limit: number = 5) => {
    return categoriesBySpent.value.slice(0, limit)
  }

  /**
   * Calcula tendencia de gasto (requiere múltiples resúmenes cargados)
   */
  const getSpendingTrend = () => {
    if (summaries.value.length < 2) return null

    const trend = summaries.value.map(summary => ({
      month: summary.month,
      totalSpent: summary.totalSpent,
      totalBudget: Object.values(summary.categories).reduce(
        (sum, cat) => sum + cat.budget,
        0
      )
    }))

    return trend.sort((a, b) => a.month.localeCompare(b.month))
  }

  /**
   * Limpia el estado de error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Limpia el resumen actual
   */
  const clearSummary = () => {
    currentSummary.value = null
    error.value = null
  }

  /**
   * Limpia todos los resúmenes
   */
  const clearSummaries = () => {
    summaries.value = []
    clearSummary()
  }

  /**
   * Recarga el resumen actual (útil después de cambios)
   */
  const refreshSummary = async (month?: string): Promise<boolean> => {
    const targetMonth = month || currentMonth.value
    return await fetchSummary(targetMonth)
  }

  return {
    // Estado
    currentSummary,
    summaries,
    loading,
    error,
    currentMonth,
    
    // Computed - Estadísticas
    stats,
    hasSummary,
    totalSpent,
    totalSpentFormatted,
    totalBudget,
    totalBudgetFormatted,
    remainingBudget,
    remainingBudgetFormatted,
    budgetPercentage,
    isOverBudget,
    categoriesCount,
    categoriesOverBudget,
    categoriesData,
    categoriesBySpent,
    
    // Métodos de datos
    fetchSummary,
    fetchCurrentMonthSummary,
    fetchSummaries,
    recalculateSummary,
    
    // Métodos de consulta
    getCategoryData,
    isCategoryOverBudget,
    getCategoryPercentage,
    compareWithPreviousMonth,
    getTopCategories,
    getSpendingTrend,
    
    // Utilidades
    clearError,
    clearSummary,
    clearSummaries,
    refreshSummary
  }
}
