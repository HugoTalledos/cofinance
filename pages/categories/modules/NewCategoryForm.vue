<script setup lang="ts">
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import { useToast } from '~/components/Toast/useToast'


const { addCategory, loading } = useCategories()
const { showToast } = useToast()

const formData = ref({
  name: '',
  budget: 0
})

const userId = ref('user123')

// Validación del formulario
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 && formData.value.budget > 0
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
    showToast(`Categoría "${formData.value.name}" creada exitosamente`, 'success')
    formData.value = {
      name: '',
      budget: 0
    }
  }
}
</script>
<template>
  <card title="Nueva Categoría">
    <template #content>
      <form @submit.prevent="handleCreateCategory" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name Input -->
          <input-form
            v-model="formData.name"
            label="Nombre"
            id="name"
            type="text"
            placeholder="Ej: Comida, Transporte"
          />
          <input-currency v-model="formData.budget" label="Presupuesto Mensual" id="budget" />
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
    </template>
  </card>
</template>