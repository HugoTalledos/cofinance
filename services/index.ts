/**
 * Exportación centralizada de todos los servicios de Firebase
 */

// Firebase core
export { initializeFirebase, getFirestoreInstance, useFirestoreDb, COLLECTIONS } from './firebase'

// Servicios de categorías
export {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  categoryHasTransactions
} from './categories.service'

// Servicios de transacciones
export {
  createTransaction,
  getTransactions,
  getRecentTransactions,
  getCategorySpentInMonth,
  getMonthlyTotal,
  countTransactions
} from './transactions.service'

// Servicios de resúmenes mensuales
export {
  updateMonthlySummaryIncremental,
  getMonthlySummary,
  getMonthlySummaries,
  calculateSummaryStats,
  syncCategoryBudget,
  recalculateMonthlySummary,
  deleteMonthlySummary
} from './summary.service'
