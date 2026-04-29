<script setup lang="ts">
import { ref, onMounted } from 'vue'
import FloatingButton from '~/components/FloatingButton.vue'
import { useCategories } from '~/composables'
import { formatCurrency } from '~/types'
import { useToast } from '~/components/Toast/useToast'
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import Card from '~/components/Card.vue'
import NewCategoryForm from './modules/NewCategoryForm.vue'

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
  updateCategory,
  removeCategory,
} = useCategories()

const { showToast } = useToast()

// Estado de edición inline
const editingId = ref<string | null>(null)
const editingBudget = ref<number>(0)

const showDeleteConfirm = ref<string | null>(null)


// Cargar categorías al montar
onMounted(async () => {
  await fetchCategories(userId.value)
})

watch(error, (newError) => {
  if (newError) {
    showToast(newError, 'error')
  }
})

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
    showToast('Presupuesto actualizado', 'success')
    editingId.value = null
    editingBudget.value = 0
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
    showToast('Categoría eliminada', 'success')
    showDeleteConfirm.value = null
  } else if (error.value) {
    // TODO: talvez aca toca mostrar el error en el toast
  }
}

</script>

<template>
  <floating-button label="⬅️" @click="navigateTo('/')" />
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col gap-4 max-w-4xl mx-auto">
      <!-- Header -->
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Categorías</h1>
        <p class="mt-2 text-gray-600">
          Administra tus categorías de gastos y presupuestos
        </p>
      </header>

      <new-category-form />

      <card title="Presupuesto Total">
      <template #content>
        <p class="text-2xl font-bold text-indigo-600">
          {{ formatCurrency(totalBudget) }}
        </p>
      </template>
      </card>

      <card title="Mis Categorías">
      <template #content>
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
                  <input-currency v-model="editingBudget" label="Presupuesto Mensual" id="budget" />
                  <button
                    @click="saveEditedBudget(category.id)"
                    class="p-2 text-green-600 hover:bg-green-50 rounded-md"
                    title="Guardar"
                  >
                    <!-- TODO: agregar icono -->
                  </button>
                  <button
                    @click="cancelEdit"
                    class="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    title="Cancelar"
                  >
                    <!-- TODO: agregar icono -->
                  </button>
                </div>
  
                <!-- Action Buttons -->
                <div v-if="editingId !== category.id" class="flex space-x-2">
                  <button
                    @click="startEditBudget(category.id, category.budget)"
                    class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Editar presupuesto"
                  >
                    <!-- TODO: agregar icono -->
                  </button>
                  <button
                    @click="confirmDelete(category.id)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Eliminar"
                  >
                    <!-- TODO: agregar icono -->
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
      </template>
      </card>
    </div>
  </div>
</template>
