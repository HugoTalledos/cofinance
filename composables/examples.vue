<script setup lang="ts">
/**
 * EJEMPLOS DE USO DE COMPOSABLES
 * 
 * Este archivo demuestra cómo usar los composables en componentes Vue
 * NO es para uso en producción, solo para referencia
 */

import { useCategories, useTransactions, useSummary } from '~/composables'
import { onMounted, watch } from 'vue'
import { getCurrentDate, extractMonthFromDate, getCurrentMonth } from '~/types'

// ============================================
// EJEMPLO 1: Dashboard Completo
// ============================================

const userId = 'user123'

// Instanciar composables
const categories = useCategories()
const transactions = useTransactions()
const summary = useSummary()

// Cargar datos iniciales
onMounted(async () => {
  const month = getCurrentMonth()
  
  // Cargar todo en paralelo
  await Promise.all([
    categories.fetchCategories(userId),
    transactions.fetchTransactions({ userId, month }),
    summary.fetchSummary(userId, month)
  ])
})

// ============================================
// EJEMPLO 2: Crear Categoría con Validación
// ============================================

const handleCreateCategory = async (name: string, budget: number) => {
  // Verificar si ya existe
  const existing = categories.findCategoryByName(name)
  if (existing) {
    alert('Ya existe una categoría con ese nombre')
    return
  }

  const categoryId = await categories.addCategory({
    userId,
    name,
    budget
  })

  if (categoryId) {
    console.log('Categoría creada:', categoryId)
    // Actualizar resumen
    await summary.refreshSummary(userId)
  } else if (categories.error.value) {
    alert(categories.error.value)
  }
}

// ============================================
// EJEMPLO 3: Registrar Gasto
// ============================================

const handleAddExpense = async (
  categoryId: string,
  amount: number,
  description: string
) => {
  const today = getCurrentDate()
  const month = extractMonthFromDate(today)
  
  // Obtener nombre de categoría
  const category = categories.findCategoryById(categoryId)
  if (!category) {
    alert('Categoría no encontrada')
    return
  }

  const transactionId = await transactions.addTransaction({
    userId,
    categoryId,
    categoryName: category.name,
    amount,
    description,
    date: today,
    month
  })

  if (transactionId) {
    console.log('Gasto registrado:', transactionId)
    
    // El summary se actualiza automáticamente en el backend
    // Solo necesitamos refrescar el estado local
    await summary.refreshSummary(userId, month)
  } else if (transactions.error.value) {
    alert(transactions.error.value)
  }
}

// ============================================
// EJEMPLO 4: Actualizar Presupuesto
// ============================================

const handleUpdateBudget = async (categoryId: string, newBudget: number) => {
  const success = await categories.updateCategory(categoryId, { 
    budget: newBudget 
  })

  if (success) {
    console.log('Presupuesto actualizado')
    // Refrescar categorías y resumen
    await Promise.all([
      categories.refreshCategories(userId),
      summary.refreshSummary(userId)
    ])
  }
}

// ============================================
// EJEMPLO 5: Filtrar Transacciones
// ============================================

const handleFilterByCategory = (categoryId: string) => {
  const filtered = transactions.filterByCategory(categoryId)
  console.log('Transacciones de la categoría:', filtered)
}

const handleSearchTransactions = (query: string) => {
  const results = transactions.searchByDescription(query)
  console.log('Resultados de búsqueda:', results)
}

// ============================================
// EJEMPLO 6: Ver Estadísticas
// ============================================

const showStatistics = () => {
  // Estadísticas de transacciones
  const txStats = transactions.getStatistics()
  console.log('Estadísticas de transacciones:', txStats)

  // Estadísticas del resumen
  if (summary.stats.value) {
    console.log('Resumen mensual:', {
      totalSpent: summary.totalSpent.value,
      totalBudget: summary.totalBudget.value,
      percentage: summary.budgetPercentage.value,
      overBudget: summary.isOverBudget.value
    })
  }
}

// ============================================
// EJEMPLO 7: Watch para Cambios
// ============================================

// Reaccionar cuando cambian las categorías
watch(() => categories.categories.value, (newCategories) => {
  console.log('Categorías actualizadas:', newCategories.length)
})

// Reaccionar cuando cambia el total gastado
watch(() => summary.totalSpent.value, (newTotal) => {
  console.log('Total gastado actualizado:', newTotal)
  
  // Alertar si está sobre presupuesto
  if (summary.isOverBudget.value) {
    console.warn('⚠️ Estás sobre presupuesto!')
  }
})

// ============================================
// EJEMPLO 8: Comparar Meses
// ============================================

const compareTwoMonths = async (month1: string, month2: string) => {
  // Cargar resúmenes
  await summary.fetchSummaries({
    userId,
    monthFrom: month1,
    monthTo: month2
  })

  if (summary.summaries.value.length === 2) {
    const [first, second] = summary.summaries.value
    const comparison = summary.compareWithPreviousMonth(second)
    
    if (comparison) {
      console.log('Comparación:', {
        difference: comparison.difference,
        percentageChange: comparison.percentageChange,
        trend: comparison.increased ? '📈' : '📉'
      })
    }
  }
}

// ============================================
// EJEMPLO 9: Top Categorías
// ============================================

const showTopCategories = () => {
  const top3 = summary.getTopCategories(3)
  console.log('Top 3 categorías por gasto:', top3)
}

// ============================================
// EJEMPLO 10: Manejo de Errores Global
// ============================================

const handleErrors = () => {
  if (categories.error.value) {
    console.error('Error en categorías:', categories.error.value)
    categories.clearError()
  }
  
  if (transactions.error.value) {
    console.error('Error en transacciones:', transactions.error.value)
    transactions.clearError()
  }
  
  if (summary.error.value) {
    console.error('Error en resumen:', summary.error.value)
    summary.clearError()
  }
}

// ============================================
// EJEMPLO 11: Limpiar Estado
// ============================================

const cleanupOnLogout = () => {
  categories.clearCategories()
  transactions.clearTransactions()
  summary.clearSummaries()
}
</script>

<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Ejemplos de Composables</h1>
    
    <!-- Loading States -->
    <div v-if="categories.loading.value || transactions.loading.value || summary.loading.value" 
         class="bg-blue-100 p-4 rounded mb-4">
      <p>Cargando datos...</p>
    </div>
    
    <!-- Error Display -->
    <div v-if="categories.error.value || transactions.error.value || summary.error.value" 
         class="bg-red-100 p-4 rounded mb-4">
      <p class="text-red-700">
        {{ categories.error.value || transactions.error.value || summary.error.value }}
      </p>
      <button @click="handleErrors" class="mt-2 px-4 py-2 bg-red-600 text-white rounded">
        Cerrar
      </button>
    </div>
    
    <!-- Categories Section -->
    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Categorías ({{ categories.categoriesCount.value }})</h2>
      <p class="mb-2">Presupuesto total: {{ categories.totalBudget.value }}</p>
      
      <div class="grid grid-cols-3 gap-4">
        <div 
          v-for="category in categories.sortedCategories.value" 
          :key="category.id"
          class="bg-white p-4 rounded shadow"
        >
          <h3 class="font-semibold">{{ category.name }}</h3>
          <p>Presupuesto: ${{ category.budget }}</p>
          <button 
            @click="handleFilterByCategory(category.id)"
            class="mt-2 text-blue-600 hover:underline text-sm"
          >
            Ver gastos
          </button>
        </div>
      </div>
      
      <button 
        @click="handleCreateCategory('Nueva Categoría', 1000)"
        class="mt-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        Agregar Categoría
      </button>
    </section>
    
    <!-- Transactions Section -->
    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">
        Transacciones ({{ transactions.transactionsCount.value }})
      </h2>
      <p class="mb-2">Total: {{ transactions.totalAmountFormatted.value }}</p>
      
      <div class="space-y-2">
        <div 
          v-for="transaction in transactions.recentTransactions.value" 
          :key="transaction.id"
          class="bg-white p-4 rounded shadow flex justify-between"
        >
          <div>
            <p class="font-semibold">{{ transaction.description }}</p>
            <p class="text-sm text-gray-600">{{ transaction.categoryName }} - {{ transaction.date }}</p>
          </div>
          <p class="font-bold">${{ transaction.amount }}</p>
        </div>
      </div>
      
      <button 
        @click="handleAddExpense(categories.categories.value[0]?.id || '', 100, 'Gasto de prueba')"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        :disabled="!categories.hasCategories.value"
      >
        Agregar Gasto
      </button>
    </section>
    
    <!-- Summary Section -->
    <section v-if="summary.hasSummary.value" class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Resumen de {{ summary.currentMonth.value }}</h2>
      
      <div class="bg-white p-6 rounded shadow">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p class="text-gray-600">Total Gastado</p>
            <p class="text-2xl font-bold">{{ summary.totalSpentFormatted.value }}</p>
          </div>
          <div>
            <p class="text-gray-600">Presupuesto Total</p>
            <p class="text-2xl font-bold">{{ summary.totalBudgetFormatted.value }}</p>
          </div>
          <div>
            <p class="text-gray-600">Restante</p>
            <p class="text-2xl font-bold" :class="summary.isOverBudget.value ? 'text-red-600' : 'text-green-600'">
              {{ summary.remainingBudgetFormatted.value }}
            </p>
          </div>
          <div>
            <p class="text-gray-600">Porcentaje Usado</p>
            <p class="text-2xl font-bold">{{ summary.budgetPercentage.value }}%</p>
          </div>
        </div>
        
        <div v-if="summary.isOverBudget.value" class="bg-red-100 p-4 rounded">
          <p class="text-red-700 font-semibold">⚠️ Estás sobre presupuesto</p>
        </div>
        
        <div class="mt-4">
          <h3 class="font-semibold mb-2">Por Categoría</h3>
          <div 
            v-for="cat in summary.categoriesData.value" 
            :key="cat.categoryId"
            class="flex justify-between items-center p-2 border-b"
          >
            <span>Categoría {{ cat.categoryId }}</span>
            <div class="text-right">
              <p :class="cat.isOverBudget ? 'text-red-600' : 'text-gray-900'">
                ${{ cat.spent }} / ${{ cat.budget }}
              </p>
              <p class="text-sm text-gray-600">{{ cat.percentage }}%</p>
            </div>
          </div>
        </div>
        
        <button 
          @click="showTopCategories"
          class="mt-4 px-4 py-2 bg-purple-600 text-white rounded"
        >
          Ver Top Categorías
        </button>
        
        <button 
          @click="showStatistics"
          class="mt-4 ml-2 px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Ver Estadísticas
        </button>
      </div>
    </section>
    
    <!-- Actions -->
    <section class="flex gap-4">
      <button 
        @click="cleanupOnLogout"
        class="px-4 py-2 bg-gray-600 text-white rounded"
      >
        Limpiar Estado
      </button>
      
      <button 
        @click="compareTwoMonths('2026-03', '2026-04')"
        class="px-4 py-2 bg-yellow-600 text-white rounded"
      >
        Comparar Meses
      </button>
    </section>
  </div>
</template>
