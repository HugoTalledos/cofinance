<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import FloatingButton from '~/components/FloatingButton.vue'
import { useCategories } from '~/composables'
import { formatCurrency } from '~/types'

// Mock userId - en producción vendría de autenticación
const userId = ref('user123')

// Composable de categorías
const {
  categories,
  loading,
  error,
  hasCategories,
  categoriesCount,
  totalBudget,
  sortedCategories,
  fetchCategories,
  addCategory,
  updateCategory,
  removeCategory,
  clearError
} = useCategories()

// Estado del formulario
const formData = ref({
  name: '',
  budget: 0
})

// Estado de edición inline
const editingId = ref<string | null>(null)
const editingBudget = ref<number>(0)

// Estado de mensajes
const successMessage = ref<string | null>(null)
const showDeleteConfirm = ref<string | null>(null)

// Validación del formulario
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 && formData.value.budget > 0
})

// Cargar categorías al montar
onMounted(async () => {
  await fetchCategories(userId.value)
})

// Crear nueva categoría
const handleCreateCategory = async () => {
  if (!isFormValid.value) return

  const categoryId = await addCategory({
    userId: userId.value,
    name: formData.value.name.trim(),
    budget: formData.value.budget
  })

  if (categoryId) {
    successMessage.value = `Categoría "${formData.value.name}" creada exitosamente`
    
    // Limpiar formulario
    formData.value = {
      name: '',
      budget: 0
    }

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  }
}

// Iniciar edición de presupuesto
const startEditBudget = (categoryId: string, currentBudget: number) => {
  editingId.value = categoryId
  editingBudget.value = currentBudget
}

// Cancelar edición
const cancelEdit = () => {
  editingId.value = null
  editingBudget.value = 0
}

// Guardar presupuesto editado
const saveEditedBudget = async (categoryId: string) => {
  if (editingBudget.value <= 0) return

  const success = await updateCategory(categoryId, {
    budget: editingBudget.value
  })

  if (success) {
    successMessage.value = 'Presupuesto actualizado'
    editingId.value = null
    editingBudget.value = 0

    setTimeout(() => {
      successMessage.value = null
    }, 2000)
  }
}

// Confirmar eliminación
const confirmDelete = (categoryId: string) => {
  showDeleteConfirm.value = categoryId
}

// Cancelar eliminación
const cancelDelete = () => {
  showDeleteConfirm.value = null
}

// Eliminar categoría
const handleDeleteCategory = async (categoryId: string) => {
  const success = await removeCategory(categoryId)

  if (success) {
    successMessage.value = 'Categoría eliminada'
    showDeleteConfirm.value = null

    setTimeout(() => {
      successMessage.value = null
    }, 2000)
  } else if (error.value) {
    // El error ya está en el estado del composable
    setTimeout(() => {
      clearError()
    }, 4000)
  }
}

// Cerrar mensaje de error
const handleCloseError = () => {
  clearError()
}
</script>

<template>
  <floating-button label="⬅️" @click="navigateTo('/')" />
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Categorías</h1>
        <p class="mt-2 text-gray-600">
          Administra tus categorías de gastos y presupuestos
        </p>
      </div>

      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-700">{{ successMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
          <div class="ml-auto pl-3">
            <button
              @click="handleCloseError"
              class="inline-flex text-red-400 hover:text-red-500"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Create Category Form -->
      <div class="bg-white shadow rounded-lg p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Nueva Categoría</h2>
        
        <form @submit.prevent="handleCreateCategory" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Name Input -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                placeholder="Ej: Comida, Transporte"
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Budget Input -->
            <div>
              <label for="budget" class="block text-sm font-medium text-gray-700 mb-1">
                Presupuesto Mensual
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  id="budget"
                  v-model.number="formData.budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="!isFormValid || loading"
              class="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ loading ? 'Guardando...' : 'Crear Categoría' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Categories List -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">
              Mis Categorías ({{ categoriesCount }})
            </h2>
            <div class="text-right">
              <p class="text-sm text-gray-600">Presupuesto Total</p>
              <p class="text-2xl font-bold text-indigo-600">
                {{ formatCurrency(totalBudget) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && !hasCategories" class="px-6 py-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-600">Cargando categorías...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!hasCategories" class="px-6 py-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No hay categorías</h3>
          <p class="mt-1 text-sm text-gray-500">
            Comienza creando tu primera categoría de gastos
          </p>
        </div>

        <!-- Categories List -->
        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="category in sortedCategories"
            :key="category.id"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <!-- Category Info -->
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ category.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  Creado: {{ new Date(category.createdAt).toLocaleDateString('es-MX') }}
                </p>
              </div>

              <!-- Budget Display/Edit -->
              <div class="flex items-center space-x-4">
                <div v-if="editingId !== category.id" class="text-right">
                  <p class="text-sm text-gray-600">Presupuesto</p>
                  <p class="text-xl font-bold text-gray-900">
                    {{ formatCurrency(category.budget) }}
                  </p>
                </div>

                <!-- Edit Mode -->
                <div v-else class="flex items-center space-x-2">
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      v-model.number="editingBudget"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-32 pl-8 pr-4 py-2 border border-indigo-500 rounded-md focus:ring-2 focus:ring-indigo-500"
                      @keyup.enter="saveEditedBudget(category.id)"
                      @keyup.esc="cancelEdit"
                    />
                  </div>
                  <button
                    @click="saveEditedBudget(category.id)"
                    class="p-2 text-green-600 hover:bg-green-50 rounded-md"
                    title="Guardar"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    @click="cancelEdit"
                    class="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    title="Cancelar"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Action Buttons -->
                <div v-if="editingId !== category.id" class="flex space-x-2">
                  <button
                    @click="startEditBudget(category.id, category.budget)"
                    class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Editar presupuesto"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(category.id)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Eliminar"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Delete Confirmation -->
            <div
              v-if="showDeleteConfirm === category.id"
              class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md"
            >
              <p class="text-sm text-red-800 mb-3">
                ¿Estás seguro de eliminar la categoría "<strong>{{ category.name }}</strong>"?
                Esta acción no se puede deshacer.
              </p>
              <div class="flex space-x-3">
                <button
                  @click="handleDeleteCategory(category.id)"
                  class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Sí, eliminar
                </button>
                <button
                  @click="cancelDelete"
                  class="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
