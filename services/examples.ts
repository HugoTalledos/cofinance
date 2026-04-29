/**
 * Ejemplos de uso de los servicios de Firebase
 * 
 * Este archivo contiene ejemplos completos de cómo usar los servicios
 * en diferentes escenarios de la aplicación.
 */

import {
  createCategory,
  getCategories,
  updateCategory,
  createTransaction,
  getTransactions,
  getMonthlySummary,
  calculateSummaryStats
} from '~/services'

import {
  getCurrentDate,
  extractMonthFromDate,
  getCurrentMonth,
  formatCurrency
} from '~/types'

import type {
  CategoryInput,
  TransactionInput,
  TransactionFilters
} from '~/types'

/**
 * EJEMPLO 1: Crear categorías iniciales para un nuevo usuario
 */
export async function setupInitialCategories(userId: string) {
  const defaultCategories: CategoryInput[] = [
    { userId, name: 'Comida', budget: 5000 },
    { userId, name: 'Transporte', budget: 2000 },
    { userId, name: 'Entretenimiento', budget: 1500 },
    { userId, name: 'Servicios', budget: 3000 },
    { userId, name: 'Otros', budget: 1000 }
  ]

  const categoryIds: Record<string, string> = {}

  for (const category of defaultCategories) {
    const result = await createCategory(category)
    
    if (result.error) {
      console.error(`Error creando categoría ${category.name}:`, result.error)
      continue
    }
    
    if (result.data) {
      categoryIds[category.name] = result.data
      console.log(`✓ Categoría creada: ${category.name} (${result.data})`)
    }
  }

  return categoryIds
}

/**
 * EJEMPLO 2: Registrar un gasto diario
 */
export async function registerExpense(
  userId: string,
  categoryId: string,
  categoryName: string,
  amount: number,
  description: string
) {
  const today = getCurrentDate()
  const currentMonth = extractMonthFromDate(today)

  const transaction: TransactionInput = {
    userId,
    categoryId,
    categoryName,
    amount,
    description,
    date: today,
    month: currentMonth
  }

  const result = await createTransaction(transaction)

  if (result.error) {
    console.error('Error al registrar gasto:', result.error)
    return null
  }

  console.log(`✓ Gasto registrado: ${formatCurrency(amount)} en ${categoryName}`)
  return result.data
}

/**
 * EJEMPLO 3: Obtener resumen del mes actual
 */
export async function getCurrentMonthSummary(userId: string) {
  const currentMonth = getCurrentMonth()
  const result = await getMonthlySummary(userId, currentMonth)

  if (result.error) {
    console.error('Error al obtener resumen:', result.error)
    return null
  }

  if (!result.data) {
    console.log('No hay datos para este mes')
    return null
  }

  const summary = result.data
  const stats = calculateSummaryStats(summary)

  console.log(`\n📊 Resumen de ${currentMonth}:`)
  console.log(`   Total gastado: ${formatCurrency(stats.totalSpent)}`)
  console.log(`   Presupuesto total: ${formatCurrency(stats.totalBudget)}`)
  console.log(`   Restante: ${formatCurrency(stats.remainingBudget)}`)
  console.log(`   Usado: ${stats.percentageUsed}%`)
  
  if (stats.categoriesOverBudget.length > 0) {
    console.log(`   ⚠️  Categorías sobre presupuesto: ${stats.categoriesOverBudget.length}`)
  }

  return { summary, stats }
}

/**
 * EJEMPLO 4: Listar transacciones del mes con detalles
 */
export async function listMonthTransactions(userId: string, month?: string) {
  const targetMonth = month || getCurrentMonth()
  
  const filters: TransactionFilters = {
    userId,
    month: targetMonth
  }

  const result = await getTransactions(filters)

  if (result.error) {
    console.error('Error al obtener transacciones:', result.error)
    return []
  }

  const transactions = result.data || []
  
  console.log(`\n💳 Transacciones de ${targetMonth} (${transactions.length}):`)
  
  transactions.forEach((transaction, index) => {
    console.log(`   ${index + 1}. ${transaction.date} - ${transaction.categoryName}`)
    console.log(`      ${formatCurrency(transaction.amount)} - ${transaction.description}`)
  })

  return transactions
}

/**
 * EJEMPLO 5: Actualizar presupuesto de una categoría
 */
export async function updateCategoryBudget(
  categoryId: string,
  newBudget: number
) {
  const result = await updateCategory(categoryId, { budget: newBudget })

  if (result.error) {
    console.error('Error al actualizar presupuesto:', result.error)
    return false
  }

  console.log(`✓ Presupuesto actualizado: ${formatCurrency(newBudget)}`)
  return true
}

/**
 * EJEMPLO 6: Dashboard completo del mes
 */
export async function generateMonthDashboard(userId: string) {
  const currentMonth = getCurrentMonth()

  // 1. Obtener categorías
  const categoriesResult = await getCategories(userId)
  if (categoriesResult.error) {
    console.error('Error al cargar categorías:', categoriesResult.error)
    return null
  }
  const categories = categoriesResult.data || []

  // 2. Obtener resumen mensual
  const summaryResult = await getMonthlySummary(userId, currentMonth)
  if (summaryResult.error) {
    console.error('Error al cargar resumen:', summaryResult.error)
    return null
  }
  const summary = summaryResult.data

  // 3. Obtener transacciones del mes
  const transactionsResult = await getTransactions({
    userId,
    month: currentMonth
  })
  const transactions = transactionsResult.data || []

  // 4. Calcular estadísticas
  const stats = summary ? calculateSummaryStats(summary) : null

  // 5. Generar reporte
  console.log('\n' + '='.repeat(50))
  console.log(`📊 DASHBOARD - ${currentMonth}`)
  console.log('='.repeat(50))

  console.log('\n📁 Categorías:')
  categories.forEach(cat => {
    const spent = summary?.categories[cat.id]?.spent || 0
    const percentage = cat.budget > 0 ? Math.round((spent / cat.budget) * 100) : 0
    const status = spent > cat.budget ? '⚠️' : '✓'
    
    console.log(`   ${status} ${cat.name}:`)
    console.log(`      Gastado: ${formatCurrency(spent)} / ${formatCurrency(cat.budget)} (${percentage}%)`)
  })

  if (stats) {
    console.log('\n💰 Resumen General:')
    console.log(`   Total gastado: ${formatCurrency(stats.totalSpent)}`)
    console.log(`   Presupuesto total: ${formatCurrency(stats.totalBudget)}`)
    console.log(`   Restante: ${formatCurrency(stats.remainingBudget)}`)
    console.log(`   Porcentaje usado: ${stats.percentageUsed}%`)
  }

  console.log(`\n📝 Transacciones: ${transactions.length}`)

  return {
    categories,
    summary,
    transactions,
    stats
  }
}

/**
 * EJEMPLO 7: Flujo completo - Registrar múltiples gastos
 */
export async function registerMultipleExpenses(userId: string) {
  console.log('\n🚀 Iniciando registro de gastos...\n')

  // 1. Obtener categorías existentes
  const categoriesResult = await getCategories(userId)
  if (categoriesResult.error || !categoriesResult.data) {
    console.error('Error: No se pudieron cargar las categorías')
    return
  }

  const categories = categoriesResult.data
  const foodCategory = categories.find(c => c.name === 'Comida')
  const transportCategory = categories.find(c => c.name === 'Transporte')

  if (!foodCategory || !transportCategory) {
    console.error('Error: No se encontraron las categorías necesarias')
    return
  }

  // 2. Registrar gastos
  const expenses = [
    {
      categoryId: foodCategory.id,
      categoryName: foodCategory.name,
      amount: 250,
      description: 'Supermercado'
    },
    {
      categoryId: foodCategory.id,
      categoryName: foodCategory.name,
      amount: 150,
      description: 'Restaurante'
    },
    {
      categoryId: transportCategory.id,
      categoryName: transportCategory.name,
      amount: 80,
      description: 'Gasolina'
    }
  ]

  for (const expense of expenses) {
    await registerExpense(
      userId,
      expense.categoryId,
      expense.categoryName,
      expense.amount,
      expense.description
    )
  }

  // 3. Mostrar resumen actualizado
  console.log('\n📊 Resumen después de registrar gastos:')
  await getCurrentMonthSummary(userId)
}

/**
 * EJEMPLO 8: Comparar gastos entre dos meses
 */
export async function compareMonths(userId: string, month1: string, month2: string) {
  console.log(`\n📊 Comparando ${month1} vs ${month2}\n`)

  const summary1 = await getMonthlySummary(userId, month1)
  const summary2 = await getMonthlySummary(userId, month2)

  if (summary1.error || summary2.error) {
    console.error('Error al cargar resúmenes')
    return
  }

  const stats1 = summary1.data ? calculateSummaryStats(summary1.data) : null
  const stats2 = summary2.data ? calculateSummaryStats(summary2.data) : null

  if (!stats1 || !stats2) {
    console.log('No hay suficientes datos para comparar')
    return
  }

  const difference = stats2.totalSpent - stats1.totalSpent
  const percentageChange = stats1.totalSpent > 0 
    ? Math.round((difference / stats1.totalSpent) * 100)
    : 0

  console.log(`${month1}: ${formatCurrency(stats1.totalSpent)}`)
  console.log(`${month2}: ${formatCurrency(stats2.totalSpent)}`)
  console.log(`Diferencia: ${formatCurrency(Math.abs(difference))} (${percentageChange}%)`)
  
  if (difference > 0) {
    console.log(`📈 Gastaste ${formatCurrency(difference)} más en ${month2}`)
  } else if (difference < 0) {
    console.log(`📉 Ahorraste ${formatCurrency(Math.abs(difference))} en ${month2}`)
  } else {
    console.log('💰 Gastaste lo mismo ambos meses')
  }

  return { stats1, stats2, difference, percentageChange }
}
