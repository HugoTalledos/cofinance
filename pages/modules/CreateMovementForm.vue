<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { PropType } from 'vue'

// Componentes que ya tienes
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import InputForm from '~/components/InputForm/InputForm.vue'
import type { Category, MovementPayload } from './CreateMovementForm.type'
import { useToast } from '~/components/Toast/useToast'

const { showToast } = useToast()

const props = defineProps({
  categories: {
    type: Array as PropType<Category[]>,
    required: true
  }
})

const formError = ref<string | null>(null)
const form = reactive({
  category: {} as Category,
  detail: '',
  value: null as number | null,
  date: ''
})


const isValid = computed(() => {
  return form.category.id && form.detail && form.value && form.value > 0;
})

const submit = (): MovementPayload | null => {
  formError.value = null;

  if (!isValid.value) {
    console.log('AAAAAAAA')
    showToast('Porfavor, completa los campos requeridos', 'error')
    return null;
  }

  const submissionDate = form.date ? new Date(form.date) : new Date();

  return {
    category: form.category,
    detail: form.detail,
    value: form.value || 0,
    date: submissionDate
  };
}

defineExpose({ submit });
</script>

<template>
  <form @submit.prevent>
    <div class="space-y-4">
      <div>
        <label for="category" class="block text-sm font-medium text-gray-700">Categoría</label>
        <select
          id="category"
          v-model="form.category"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option disabled value="">Selecciona una categoría</option>
          <option v-for="category in categories" :key="category.id" :value="category">
            {{ category.name }}
          </option>
        </select>
      </div>

      <InputForm
        id="detail"
        v-model="form.detail"
        label="Detalle"
        placeholder="Ej: Almuerzo de trabajo"
      />

      <InputCurrency
        id="value"
        v-model="form.value"
        label="Valor del Movimiento"
      />

      <InputForm
        id="date"
        v-model="form.date"
        label="Fecha (opcional)"
        type="date"
      />
    </div>
    <div v-if="formError" class="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
      {{ formError }}
    </div>
  </form>
</template>
