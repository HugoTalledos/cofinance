import { ref, computed, type Ref } from 'vue'
import {
  createTransaction as createTransactionService,
  getTransactions as getTransactionsService,
  getRecentTransactions as getRecentTransactionsService,
  getCategorySpentInMonth as getCategorySpentInMonthService,
  getMonthlyTotal as getMonthlyTotalService,
  countTransactions as countTransactionsService,
  getCategories
} from '~/services'
import type {
  Transaction,
  TransactionInput,
  TransactionFilters,
  Category
} from '~/types'
import {
  getCurrentBillingPeriodKey,
  extractMonthFromDate,
  formatDateToString,
} from '~/types'

/**
 * Composable para gestión de transacciones
 * 
 * @example
 * const { 
 *   transactions, 
 *   loading, 
 *   error,
 *   fetchTransactions,
 *   addTransaction 
 * } = useTransactions()
 * 
 * await fetchTransactions({ userId: 'user123', month: '2026-04' })
 */
export const useTransactions = () => {
  // Estado reactivo
  const transactions: Ref<Transaction[]> = ref([])
  const loading: Ref<boolean> = ref(false)
  const error: Ref<string | null> = ref(null)
  const currentMonth: Ref<string> = ref(getCurrentBillingPeriodKey())

  // Computed
  const hasTransactions = computed(() => transactions.value.length > 0)
  const transactionsCount = computed(() => transactions.value.length)
  
  /**
   * Total de todas las transacciones cargadas
   */
  const totalAmount = computed(() => {
    return transactions.value.reduce((sum, t) => sum + t.amount, 0)
  })

  /**
   * Total formateado como moneda
   */
  const totalAmountFormatted = computed(() => {
    return formatCurrency(totalAmount.value)
  })

  /**
   * Transacciones agrupadas por categoría
   */
  const transactionsByCategory = computed(() => {
    const grouped: Record<string, Transaction[]> = {}
    
    transactions.value.forEach(transaction => {
      if (!grouped[transaction.categoryId]) {
        grouped[transaction.categoryId] = []
      }
      grouped[transaction.categoryId].push(transaction)
    })
    
    return grouped
  })

  /**
   * Transacciones agrupadas por fecha
   */
  const transactionsByDate = computed(() => {
    const grouped: Record<string, Transaction[]> = {}
    
    transactions.value.forEach(transaction => {
      if (!grouped[transaction.date]) {
        grouped[transaction.date] = []
      }
      grouped[transaction.date].push(transaction)
    })
    
    return grouped
  })

  /**
   * Últimas 5 transacciones
   */
  const recentTransactions = computed(() => {
    return transactions.value.slice(0, 5)
  })

  /**
   * Obtiene transacciones con filtros
   */
  const fetchTransactions = async (filters: TransactionFilters): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await getTransactionsService(filters)
      const categories = await getCategoriesMap()
      if (result.error) {
        error.value = result.error
        return false
      }

      transactions.value = (result.data || []).map((transaction) => ({
        ...transaction,
        category: categories[transaction.categoryId],
      }))
      
      if (filters.periodKey) {
        currentMonth.value = filters.periodKey
      } else if (filters.month) {
        currentMonth.value = filters.month
      }

      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar transacciones'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene las N transacciones más recientes
   */
  const fetchRecentTransactions = async (
    limit: number = 10
  ): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await getRecentTransactionsService(limit)
      const categories = await getCategoriesMap()
      
      if (result.error) {
        error.value = result.error
        return false
      }

      transactions.value = (result.data || []).map((transaction) => ({
        ...transaction,
        category: categories[transaction.categoryId],
      }))
      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar transacciones recientes'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Crea una nueva transacción
   * IMPORTANTE: También actualiza el monthly_summary automáticamente
   */
  const addTransaction = async (data: TransactionInput): Promise<string | null> => {
    loading.value = true
    error.value = null

    const body = {
      ...data,
      month: extractMonthFromDate(data.date)
    }
    try {
      const result = await createTransactionService(body)
      if (result.error) {
        error.value = result.error
        return null
      }

      // Agregar al estado local
      if (result.data) {
        const newTransaction: Transaction = {
          id: result.data,
          ...data,
          createdAt: Date.now()
        }
        
        // Agregar al inicio del array (más reciente primero)
        transactions.value.unshift(newTransaction)
        return result.data
      }

      return null

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear transacción'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene el total gastado en una categoría en un mes
   */
  const getCategorySpent = async (
    userId: string,
    categoryId: string,
    month: string
  ): Promise<number> => {
    try {
      return await getCategorySpentInMonthService(userId, categoryId, month)
    } catch (err) {
      console.error('Error al calcular gasto de categoría:', err)
      return 0
    }
  }

  /**
   * Obtiene el total gastado en un mes
   */
  const getMonthTotal = async (
    month: string
  ): Promise<number> => {
    try {
      return await getMonthlyTotalService(month)
    } catch (err) {
      console.error('Error al calcular total mensual:', err)
      return 0
    }
  }

  /**
   * Cuenta transacciones que cumplen los filtros
   */
  const countTransactions = async (filters: TransactionFilters): Promise<number> => {
    try {
      return await countTransactionsService(filters)
    } catch (err) {
      console.error('Error al contar transacciones:', err)
      return 0
    }
  }

  /**
   * Filtra transacciones por categoría (en el estado local)
   */
  const filterByCategory = (categoryId: string): Transaction[] => {
    return transactions.value.filter(t => t.categoryId === categoryId)
  }

  /**
   * Filtra transacciones por rango de fechas (en el estado local)
   */
  const filterByDateRange = (startDate: string, endDate: string): Transaction[] => {
    return transactions.value.filter(t => 
      t.date >= startDate && t.date <= endDate
    )
  }

  /**
   * Filtra transacciones por mes (en el estado local)
   */
  const filterByMonth = (month: string): Transaction[] => {
    return transactions.value.filter(t => t.month === month)
  }

  /**
   * Busca transacciones por descripción (en el estado local)
   */
  const searchByDescription = (query: string): Transaction[] => {
    const lowerQuery = query.toLowerCase()
    return transactions.value.filter(t => 
      t.description.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Calcula estadísticas de las transacciones cargadas
   */
  const getStatistics = () => {
    if (transactions.value.length === 0) {
      return {
        count: 0,
        total: 0,
        average: 0,
        min: 0,
        max: 0
      }
    }

    const amounts = transactions.value.map(t => t.amount)
    
    return {
      count: transactions.value.length,
      total: totalAmount.value,
      average: totalAmount.value / transactions.value.length,
      min: Math.min(...amounts),
      max: Math.max(...amounts)
    }
  }

  /**
   * Limpia el estado de error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Limpia todas las transacciones del estado
   */
  const clearTransactions = () => {
    transactions.value = []
    error.value = null
  }

  /**
   * Recarga las transacciones (útil después de cambios)
   */
  const refreshTransactions = async (filters: TransactionFilters): Promise<boolean> => {
    return await fetchTransactions(filters)
  }

  const formatedTransactions = computed(() => {
    return transactions.value.map(transaction => {
      return {
        id: transaction.id,
        categoryId: transaction.categoryId,
        title: transaction.description,
        description: transaction.categoryName,
        icon: { icon: transaction.category?.icon , color: transaction.category?.color },
        amount: { value: formatCurrency(transaction.amount), short: shortFormatCurrency(transaction.amount) },
        author: transaction.username,
        date: formatDateToString(new Date(transaction.date)),
        clickable: true
      }
    })
  })


  async function getCategoriesMap(): Promise<Record<string, Category>> {
    const categories = await getCategories();
    return (categories.data || []).reduce((map, category) => {
      (map as Record<string, typeof category>)[category.id] = category;
 
      return map;
    }, {});
  }

  return {
    // Estado
    transactions,
    loading,
    error,
    currentMonth,
    transactionsList: formatedTransactions,
    
    // Computed
    hasTransactions,
    transactionsCount,
    totalAmount,
    totalAmountFormatted,
    transactionsByCategory,
    transactionsByDate,
    recentTransactions,
    
    // Métodos de datos
    fetchTransactions,
    fetchRecentTransactions,
    addTransaction,
    getCategorySpent,
    getMonthTotal,
    countTransactions,
    
    // Métodos de filtrado local
    filterByCategory,
    filterByDateRange,
    filterByMonth,
    searchByDescription,
    
    // Utilidades
    getStatistics,
    clearError,
    clearTransactions,
    refreshTransactions
  }
}
