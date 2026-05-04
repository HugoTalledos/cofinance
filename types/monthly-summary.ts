/**
 * Interfaces para la colección 'monthly_summary'
 * Resumen agregado de gastos por mes
 */

export interface CategorySummary {
  budget: number
  spent: number
}

export interface MonthlySummary {
  /** ID compuesto: userId + month (ej: user123_2026-04) */
  id: string
  /** Mes en formato YYYY-MM */
  month: string
  /** Resumen por categoría, indexado por categoryId */
  categories: Record<string, CategorySummary>
  totalSpent: number
  updatedAt: number
}

/**
 * Datos requeridos para crear un nuevo resumen mensual
 */
export type MonthlySummaryInput = Omit<MonthlySummary, 'updatedAt'>

/**
 * Datos permitidos para actualizar un resumen mensual
 */
export type MonthlySummaryUpdate = Partial<Omit<MonthlySummary, 'id' | 'userId' | 'month'>>

/**
 * Filtros para consultar resúmenes mensuales
 */
export interface MonthlySummaryFilters {
  userId: string
  month?: string
  /** Rango de meses */
  monthFrom?: string
  monthTo?: string
}

/**
 * Estadísticas del resumen mensual
 */
export interface MonthlySummaryStats {
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  percentageUsed: number
  categoriesCount: number
  categoriesOverBudget: string[]
}
