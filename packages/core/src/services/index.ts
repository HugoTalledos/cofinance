/**
 * Exportación centralizada de todos los servicios de Firebase
 */

// Firebase core
export { configureFirebase, initializeFirebase, getFirestoreInstance, getAuthInstance, useFirestoreDb, useFirebaseAuth, COLLECTIONS } from './firebase'

// Servicios de categorías
export {
  createCategory,
  updateCategory,
  archiveCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  categoryHasTransactions
} from './categories.service'

// Servicios de transacciones
export {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  getRecentTransactions,
  getCategorySpentInMonth,
  getMonthlyTotal,
  countTransactions
} from './transactions.service'

// Servicios de gastos recurrentes
export {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
} from './recurring-expenses.service'

// Servicios de tarjetas de crédito (solo lectura)
export { getCreditCards, updateCreditCardSettings } from './credit-cards.service'

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
export * from './card-payments.service'
