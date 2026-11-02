import { ref, computed, type Ref } from 'vue'
import {
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
  getCategories as getCategoriesService,
  getCategoryById as getCategoryByIdService,
  categoryHasTransactions as categoryHasTransactionsService
} from '~/services'
import type { Category, CategoryInput, CategoryUpdate } from '~/types'

// Estado reactivo
const categories: Ref<Category[]> = ref([])
const currentCategory: Ref<Category | null> = ref(null)
const loading: Ref<boolean> = ref(false)
const error: Ref<string | null> = ref(null)

/**
 * Obtiene categorías ordenadas por nombre
 */
const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) => a.name.localeCompare(b.name))
})
/**
 * Composable para gestión de categorías
 * 
 * @example
 * const { 
 *   categories, 
 *   loading, 
 *   error,
 *   fetchCategories,
 *   addCategory 
 * } = useCategories()
 * 
 * await fetchCategories('user123')
 */
export const useCategories = () => {

  // Computed
  const hasCategories = computed(() => categories.value.length > 0)
  const categoriesCount = computed(() => categories.value.length)
  
  /**
   * Obtiene el total de presupuesto de todas las categorías
   */
  const totalBudget = computed(() => {
    return categories.value.reduce((sum, cat) => sum + cat.budget, 0)
  })

  /**
   * Busca una categoría por ID en el estado local
   */
  const findCategoryById = (categoryId: string): Category | undefined => {
    return categories.value.find(cat => cat.id === categoryId)
  }

  /**
   * Busca una categoría por nombre
   */
  const findCategoryByName = (name: string): Category | undefined => {
    return categories.value.find(cat => 
      cat.name.toLowerCase() === name.toLowerCase()
    )
  }

  /**
   * Obtiene todas las categorías de un usuario
   */
  const fetchCategories = async (): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await getCategoriesService()
      if (result.error) {
        error.value = result.error
        return false
      }

      categories.value = result.data || []
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar categorías'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene una categoría específica por ID
   */
  const fetchCategoryById = async (categoryId: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await getCategoryByIdService(categoryId)
      
      if (result.error) {
        error.value = result.error
        return false
      }

      currentCategory.value = result.data
      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar categoría'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Crea una nueva categoría
   */
  const addCategory = async (data: CategoryInput): Promise<string | null> => {
    loading.value = true
    error.value = null

    try {
      // Verificar si ya existe una categoría con el mismo nombre
      const existing = findCategoryByName(data.name)
      if (existing) {
        error.value = 'Ya existe una categoría con ese nombre'
        return null
      }

      const result = await createCategoryService(data)
      
      if (result.error) {
        error.value = result.error
        return null
      }

      // Agregar al estado local
      if (result.data) {
        const newCategory: Category = {
          id: result.data,
          ...data,
          createdAt: Date.now()
        }
        categories.value.push(newCategory)
        return result.data
      }

      return null

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear categoría'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza una categoría existente
   */
  const updateCategory = async (
    categoryId: string, 
    data: CategoryUpdate
  ): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await updateCategoryService(categoryId, data)
      
      if (result.error) {
        error.value = result.error
        return false
      }

      // Actualizar en el estado local
      const index = categories.value.findIndex(cat => cat.id === categoryId)
      if (index !== -1) {
        categories.value[index] = {
          ...categories.value[index],
          ...data
        }
      }

      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar categoría'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Elimina una categoría
   */
  const removeCategory = async (categoryId: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      // Verificar si tiene transacciones asociadas
      const hasTransactions = await categoryHasTransactionsService(categoryId)
      if (hasTransactions) {
        error.value = 'No se puede eliminar una categoría con transacciones asociadas'
        return false
      }

      const result = await deleteCategoryService(categoryId)
      
      if (result.error) {
        error.value = result.error
        return false
      }

      // Eliminar del estado local
      categories.value = categories.value.filter(cat => cat.id !== categoryId)
      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar categoría'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpia el estado de error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Limpia todas las categorías del estado
   */
  const clearCategories = () => {
    categories.value = []
    currentCategory.value = null
    error.value = null
  }

  /**
   * Recarga las categorías (útil después de cambios)
   */
  const refreshCategories = async (): Promise<boolean> => {
    return await fetchCategories()
  }

  return {
    // Estado
    categories,
    currentCategory,
    loading,
    error,
    
    // Computed
    hasCategories,
    categoriesCount,
    totalBudget,
    sortedCategories,
    
    // Métodos de búsqueda
    findCategoryById,
    findCategoryByName,
    
    // Métodos de datos
    fetchCategories,
    fetchCategoryById,
    addCategory,
    updateCategory,
    removeCategory,
    
    // Utilidades
    clearError,
    clearCategories,
    refreshCategories
  }
}
