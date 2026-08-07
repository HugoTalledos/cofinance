<script setup lang="ts">
import { reactive, computed } from 'vue'
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import InputForm from '~/components/InputForm/InputForm.vue'
import PillToggle from '~/components/PillToggle.vue'
import type { Category, MovementPayload, MovementFormValue } from './CreateMovementForm.type'
import { useToast } from '~/components/Toast/useToast'
import SelectForm from '~/components/SelectForm.vue'

const { showToast } = useToast()

const props = defineProps<{
  categories: Category[]
  initialValue?: MovementFormValue
  lockType?: boolean
}>()

const TOGGLE_OPTIONS = [
  { label: 'Gasto', value: 'expense' },
  { label: 'Ingreso', value: 'income' },
]

// `SelectForm` usa el objeto completo como value del <option>, así que el
// <select> nativo compara por identidad de referencia: hay que buscar el
// objeto dentro de `categories`, no construir uno equivalente.
const initialCategory = props.categories.find(
  category => category.id === props.initialValue?.categoryId
)

const form = reactive({
  type: props.initialValue?.type ?? 'expense' as 'income' | 'expense',
  category: (initialCategory ?? {}) as Category,
  detail: props.initialValue?.detail ?? '',
  value: props.initialValue?.value ?? null as number | null,
  date: props.initialValue?.date ?? ''
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
        :disabled="lockType"
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
