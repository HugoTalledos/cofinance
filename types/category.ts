/**
 * Interfaces para la colección 'categories'
 */

export interface Category {
  id: string
  userId: string
  name: string
  budget: number
  createdAt: number
  icon?: string
  color?: string
}

/**
 * Datos requeridos para crear una nueva categoría
 */
export type CategoryInput = Omit<Category, 'id' | 'createdAt'>

/**
 * Datos permitidos para actualizar una categoría
 */
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'userId' | 'createdAt'>>

/**
 * Filtros para consultar categorías
 */
export interface CategoryFilters {
  userId: string
  name?: string
}
