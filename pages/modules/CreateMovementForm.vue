<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { PropType } from 'vue'

// Componentes que ya tienes
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import InputForm from '~/components/InputForm/InputForm.vue'
import type { Category, MovementPayload } from './CreateMovementForm.type'
import { useToast } from '~/components/Toast/useToast'
import SelectForm from '~/components/SelectForm.vue'

const { showToast } = useToast()

defineProps({
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
      <SelectForm
        label="Categoría"
        v-model="form.category"
        :options="categories"
      />

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
