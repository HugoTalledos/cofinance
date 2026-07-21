<script setup lang="ts">
import { ref, computed } from 'vue'
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import InputForm from '~/components/InputForm/InputForm.vue'
import ColorSelector from '~/components/ColorSelector.vue'
import EmojiSelector from '~/components/EmojiSelector.vue'
import Card from '~/components/Card.vue'
import { useToast } from '~/components/Toast/useToast'
import { useCategories } from '~/composables/useCategories'

const { addCategory, loading } = useCategories()
const { showToast } = useToast()

const formData = ref<{ name: string; budget: number | null; color: string; icon: string }>({
  name: '',
  budget: null,
  color: 'bg-orange-100',
  icon: '🍔'
})

const userId = ref('user123')

const isFormValid = computed(() => {
  return (
    formData.value.name.trim().length > 0 &&
    !!formData.value.color &&
    !!formData.value.icon
  )
})

const handleCreateCategory = async () => {
  if (!isFormValid.value) return

  const categoryId = await addCategory({
    userId: userId.value,
    name: formData.value.name.trim(),
    budget: formData.value.budget ?? 0,
    color: formData.value.color,
    icon: formData.value.icon
  })

  if (categoryId) {
    showToast(`Categoría "${formData.value.name}" creada exitosamente`, 'success')
    formData.value = {
      name: '',
      budget: null,
      color: 'bg-orange-100',
      icon: '🍔'
    }
  }
}
</script>

<template>
  <card title="Nueva Categoría">
    <template #content>
      <form @submit.prevent="handleCreateCategory" class="space-y-6">
      <input-form
          v-model="formData.name"
          label="Nombre"
          id="name"
          type="text"
          placeholder="Ej: Comida, Transporte"
        />
        <input-currency v-model="formData.budget" label="Presupuesto Mensual (opcional)" id="budget" />
        <emoji-selector label="Icono" v-model="formData.icon" />
        <color-selector label="Color" v-model="formData.color" />
        <div class="flex justify-end pt-4">
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