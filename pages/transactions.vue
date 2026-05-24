<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useTransactions, useCategories } from '~/composables'
import FloatingButton from '~/components/FloatingButton.vue'
import {
  getCurrentBillingPeriodKey,
  getBillingPeriodRangeFromKey,
  getRecentBillingPeriodKeys,
  formatBillingPeriodLabel,
} from '~/types'
import type { TransactionFilters } from '~/types'

// Mock userId - en producción vendría de autenticación
const userId = ref('user123')

// Composables
const transactions = useTransactions()
const categories = useCategories()

// Estado de filtros
const filters = ref({
  categoryId: '',
  periodKey: getCurrentBillingPeriodKey()
})

const successMessage = ref<string | null>(null)

const availablePeriods = computed(() => getRecentBillingPeriodKeys(12))

// Transacciones agrupadas por fecha
const groupedTransactions = computed(() => {
  const grouped: Record<string, typeof transactions.transactions.value> = {}
  
  transactions.transactions.value.forEach(transaction => {
    if (!grouped[transaction.date]) {
      grouped[transaction.date] = []
    }
    grouped[transaction.date].push(transaction)
  })
  
  return grouped
})

// Fechas ordenadas
const sortedDates = computed(() => {
  return Object.keys(groupedTransactions.value).sort((a, b) => b.localeCompare(a))
})

// Cargar datos iniciales
onMounted(async () => {
  await Promise.all([
    categories.fetchCategories(),
    loadTransactions()
  ])
})

// Cargar transacciones con filtros
const loadTransactions = async () => {
  const { startDate, endDate } = getBillingPeriodRangeFromKey(filters.value.periodKey)

  const transactionFilters: TransactionFilters = {
    userId: userId.value,
    dateFrom: startDate,
    dateTo: endDate,
    periodKey: filters.value.periodKey,
  }
  
  if (filters.value.categoryId) {
    transactionFilters.categoryId = filters.value.categoryId
  }
  
  await transactions.fetchTransactions(transactionFilters)
}

// Watch filtros para recargar
watch(() => filters.value.periodKey, () => {
  loadTransactions()
})

watch(() => filters.value.categoryId, () => {
  loadTransactions()
})

// Formatear fecha para display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Calcular total del día
const getDayTotal = (date: string): number => {
  return groupedTransactions.value[date]?.reduce((sum, t) => sum + t.amount, 0) || 0
}

// Limpiar filtros
const clearFilters = () => {
  filters.value = {
    categoryId: '',
    periodKey: getCurrentBillingPeriodKey()
  }
}

// Cerrar mensajes
const closeError = () => {
  transactions.clearError()
}

const closeSuccessMessage = () => {
  successMessage.value = null
}
</script>

<template>
  <floating-button label="⬅️" @click="navigateTo('/')" />
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Transacciones</h1>
        <p class="mt-2 text-gray-600">
          Registra y consulta tus gastos
        </p>
      </div>

      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded"
      >
        <div class="flex justify-between items-center">
          <div class="flex">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <p class="ml-3 text-sm text-green-700">{{ successMessage }}</p>
          </div>
          <button @click="closeSuccessMessage" class="text-green-400 hover:text-green-500">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="transactions.error.value"
        class="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded"
      >
        <div class="flex justify-between items-center">
          <div class="flex">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <p class="ml-3 text-sm text-red-700">{{ transactions.error.value }}</p>
          </div>
          <button @click="closeError" class="text-red-400 hover:text-red-500">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Form and Filters -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Filters -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Filtros</h2>
            <div class="flex gap-2">
              <!-- Period Filter -->
              <div>
                <label for="filterPeriod" class="block text-sm font-medium text-gray-700 mb-1">
                  Periodo
                </label>
                <select
                  id="filterPeriod"
                  v-model="filters.periodKey"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option
                    v-for="period in availablePeriods"
                    :key="period"
                    :value="period"
                  >
                    {{ formatBillingPeriodLabel(period) }}
                  </option>
                </select>
              </div>

              <!-- Category Filter -->
              <div>
                <label for="filterCategory" class="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  id="filterCategory"
                  v-model="filters.categoryId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  <option
                    v-for="category in categories.sortedCategories.value"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <!-- Clear Filters Button -->
              <button
                v-if="filters.categoryId"
                @click="clearFilters"
                class="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          <!-- Summary Card -->
          <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow rounded-lg p-6 text-white">
            <h3 class="text-lg font-medium mb-2">Total del Periodo</h3>
            <p class="text-3xl font-bold">
              {{ transactions.totalAmountFormatted.value }}
            </p>
            <p class="text-sm text-indigo-100 mt-2">
              {{ transactions.transactionsCount.value }} transacciones
            </p>
          </div>
        </div>

        <!-- Right Column: Transactions List -->
        <div class="lg:col-span-2">
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">
                Historial de Gastos
              </h2>
              <p class="text-sm text-gray-600 mt-1">
                {{ formatBillingPeriodLabel(filters.periodKey) }}
              </p>
            </div>

            <!-- Loading State -->
            <div v-if="transactions.loading.value && !transactions.hasTransactions.value" 
                 class="px-6 py-12 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p class="mt-2 text-gray-600">Cargando transacciones...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!transactions.hasTransactions.value" 
                 class="px-6 py-12 text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No hay transacciones</h3>
              <p class="mt-1 text-sm text-gray-500">
                Comienza registrando tu primer gasto
              </p>
            </div>

            <!-- Transactions List -->
            <div v-else class="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
              <div v-for="date in sortedDates" :key="date" class="px-6 py-4">
                <!-- Date Header -->
                <div class="flex justify-between items-center mb-3">
                  <h3 class="text-sm font-semibold text-gray-900 capitalize">
                    {{ formatDate(date) }}
                  </h3>
                  <span class="text-sm font-bold text-gray-900">
                    {{ formatCurrency(getDayTotal(date)) }}
                  </span>
                </div>

                <!-- Transactions for this date -->
                <div class="space-y-2">
                  <div
                    v-for="transaction in groupedTransactions[date]"
                    :key="transaction.id"
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {{ transaction.categoryName }}
                        </span>
                      </div>
                      <p class="mt-1 text-sm text-gray-900 font-medium">
                        {{ transaction.description }}
                      </p>
                    </div>
                    <div class="text-right ml-4">
                      <p class="text-lg font-bold text-gray-900">
                        {{ formatCurrency(transaction.amount) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
