<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { PropType } from 'vue'
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import InputForm from '~/components/InputForm/InputForm.vue'
import PillToggle from '~/components/PillToggle.vue'
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

const TOGGLE_OPTIONS = [
  { label: 'Gasto', value: 'expense' },
  { label: 'Ingreso', value: 'income' },
]

const form = reactive({
  type: 'expense' as 'income' | 'expense',
  category: {} as Category,
  detail: '',
  value: null as number | null,
  date: ''
})

const isValid = computed(() => {
  if (form.type === 'income') {
    return Boolean(form.detail && form.value && form.value > 0)
  }
  return Boolean(form.category.id && form.detail && form.value && form.value > 0)
})

const submit = (): MovementPayload | null => {
  if (!isValid.value) {
    showToast('Porfavor, completa los campos requeridos', 'error')
    return null
  }

  const submissionDate = form.date ? new Date(form.date) : new Date()

  return {
    category: form.category,
    detail: form.detail,
    value: form.value || 0,
    date: submissionDate,
    type: form.type,
  }
}

defineExpose({ submit })
</script>

<template>
  <form @submit.prevent>
    <div class="space-y-4">
      <PillToggle
        v-model="form.type"
        :options="TOGGLE_OPTIONS"
      />

      <SelectForm
        v-if="form.type === 'expense'"
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
        :label="form.type === 'income' ? 'Valor del Ingreso' : 'Valor del Movimiento'"
      />

      <InputForm
        id="date"
        v-model="form.date"
        label="Fecha (opcional)"
        type="date"
      />
    </div>
  </form>
</template>
