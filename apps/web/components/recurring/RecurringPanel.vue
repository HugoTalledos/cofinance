<script setup lang="ts">
import {
  activeCategories, isCategoryActive, toRecurringForm, validateRecurringForm,
  buildRecurringUpdate, hasRecurringChanges,
  type Category, type CreditCard, type RecurringExpense, type RecurringForm, type PaymentMethod
} from '@cofinance/core'

const props = defineProps<{
  mode: 'create' | 'edit' | null
  expense: RecurringExpense | null
  categories: Category[]
  creditCards: CreditCard[]
  create: (form: RecurringForm) => Promise<string | null>
  update: (expense: RecurringExpense, form: RecurringForm) => Promise<string | null>
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const form = ref<RecurringForm>(toRecurringForm(null))
const saving = ref(false)
const saveError = ref<string | null>(null)
const isEdit = computed(() => props.mode === 'edit')
watch(() => [props.mode, props.expense] as const, () => {
  form.value = toRecurringForm(props.mode === 'edit' ? props.expense : null)
  saveError.value = null
}, { immediate: true })

const categoryOptions = computed(() => {
  const options = activeCategories(props.categories).map(c => ({ id: c.id, label: c.name }))
  if (isEdit.value && props.expense) {
    const current = props.categories.find(c => c.id === props.expense?.categoryId)
    if (current && !isCategoryActive(current)) options.push({ id: current.id, label: `${current.name} (eliminada)` })
    else if (!current) options.push({ id: props.expense.categoryId, label: `${props.expense.categoryName} (eliminada)` })
  }
  return options
})
const validationMessage = computed(() => validateRecurringForm(form.value, props.creditCards))
const canSave = computed(() => {
  if (!props.mode || saving.value || validationMessage.value) return false
  if (!isEdit.value) return true
  return props.expense !== null && hasRecurringChanges(buildRecurringUpdate(props.expense, form.value, props.categories, props.creditCards))
})
const selectMethod = (method: PaymentMethod) => {
  form.value.paymentMethod = method
  if (method === 'debit_card') form.value.creditCardId = null
}
const setReminderDay = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.value.reminderDay = input.value === '' && !input.validity.badInput ? null : input.valueAsNumber
}
const close = () => { if (!saving.value) emit('close') }
const save = async () => {
  if (!canSave.value) return
  saving.value = true
  saveError.value = null
  try {
    const error = isEdit.value && props.expense
      ? await props.update(props.expense, form.value)
      : await props.create(form.value)
    if (error) saveError.value = error
    else emit('saved')
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Error al guardar el pago recurrente'
  } finally {
    saving.value = false
  }
}
const onKeydown = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
watch(() => props.mode !== null, open => {
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
const inputClass = 'w-full h-9 px-2.5 bg-white border border-outline-variant/50 rounded-lg text-body-sm text-neutral-900 focus:border-neutral-900 focus:ring-0 outline-none transition-all'
</script>

<template>
  <div v-if="mode" class="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex justify-end" @click.self="close">
    <div class="w-full max-w-md bg-white h-full border-l border-outline-variant/40 shadow-xl flex flex-col" role="dialog" aria-modal="true" aria-labelledby="recurring-panel-title" :aria-busy="saving">
      <div class="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between">
        <div>
          <span class="text-label-sm text-outline uppercase tracking-wider block">Pago recurrente</span>
          <h2 id="recurring-panel-title" class="text-body-lg font-semibold text-neutral-900">{{ isEdit ? 'Editar pago recurrente' : 'Nuevo pago recurrente' }}</h2>
        </div>
        <button type="button" title="Cerrar ventana" :disabled="saving" class="p-1 rounded-lg text-outline hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-50" @click="close">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
      <form id="recurring-form" class="px-5 py-4 flex-1 overflow-y-auto" @submit.prevent="save">
        <fieldset :disabled="saving" class="space-y-4 disabled:opacity-60">
          <div>
            <label for="rec-name" class="block text-label-sm font-medium text-neutral-700 mb-1">Nombre</label>
            <input id="rec-name" v-model="form.name" type="text" :class="inputClass">
          </div>
          <div>
            <label for="rec-description" class="block text-label-sm font-medium text-neutral-700 mb-1">Descripción (opcional)</label>
            <input id="rec-description" v-model="form.description" type="text" :class="inputClass">
          </div>
          <div>
            <label for="rec-category" class="block text-label-sm font-medium text-neutral-700 mb-1">Categoría</label>
            <select id="rec-category" v-model="form.categoryId" :class="inputClass">
              <option value="" disabled>Elige una categoría</option>
              <option v-for="option in categoryOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
          </div>
          <div>
            <p id="rec-amount-label" class="block text-label-sm font-medium text-neutral-700 mb-1">Monto</p>
            <div role="radiogroup" aria-labelledby="rec-amount-label" class="bg-neutral-100 p-1 rounded-lg flex gap-1 mb-2">
              <button v-for="option in ([{ value: 'fixed', label: 'Fijo' }, { value: 'variable', label: 'Variable' }] as const)" :key="option.value" type="button" role="radio" :aria-checked="form.amountMode === option.value" class="flex-1 py-1.5 px-3 rounded-md text-body-sm font-semibold" :class="form.amountMode === option.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'" @click="form.amountMode = option.value">{{ option.label }}</button>
            </div>
            <template v-if="form.amountMode === 'fixed'">
              <label for="rec-amount" class="block text-label-sm text-neutral-500 mb-1">Monto (COP)</label>
              <MoneyInput id="rec-amount" v-model="form.fixedAmount" />
            </template>
          </div>
          <div>
            <p id="rec-payment-label" class="block text-label-sm font-medium text-neutral-700 mb-1">Medio de pago</p>
            <div role="radiogroup" aria-labelledby="rec-payment-label" class="bg-neutral-100 p-1 rounded-lg flex gap-1">
              <button v-for="option in ([{ value: 'debit_card', label: 'Débito' }, { value: 'credit_card', label: 'Crédito' }] as const)" :key="option.value" type="button" role="radio" :aria-checked="form.paymentMethod === option.value" class="flex-1 py-1.5 px-3 rounded-md text-body-sm font-semibold" :class="form.paymentMethod === option.value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'" @click="selectMethod(option.value)">{{ option.label }}</button>
            </div>
          </div>
          <div v-if="form.paymentMethod === 'credit_card'">
            <label for="rec-card" class="block text-label-sm font-medium text-neutral-700 mb-1">Tarjeta</label>
            <select id="rec-card" v-model="form.creditCardId" :class="inputClass">
              <option :value="null" :disabled="creditCards.length > 0">{{ creditCards.length ? 'Elige una tarjeta' : 'Sin tarjetas disponibles' }}</option>
              <option v-if="expense?.creditCardId && !creditCards.some(card => card.id === expense?.creditCardId)" :value="expense.creditCardId">{{ expense.creditCardBank ?? 'Tarjeta actual' }}</option>
              <option v-for="card in creditCards" :key="card.id" :value="card.id">{{ card.bank }}</option>
            </select>
          </div>
          <div>
            <label for="rec-reminder" class="block text-label-sm font-medium text-neutral-700 mb-1">Día de recordatorio (opcional)</label>
            <input id="rec-reminder" type="number" min="1" max="31" step="1" :value="form.reminderDay" :class="inputClass" aria-describedby="rec-reminder-note" @input="setReminderDay">
            <p id="rec-reminder-note" class="text-label-sm text-neutral-500 mt-1">Solo se guarda; aún no envía recordatorios.</p>
          </div>
        </fieldset>
        <p v-if="validationMessage" class="text-body-sm text-neutral-500 mt-4">{{ validationMessage }}</p>
        <p v-if="saveError" class="text-body-sm text-red-700 mt-4" role="alert">{{ saveError }}</p>
      </form>
      <div class="px-5 py-3 border-t border-outline-variant/30 bg-neutral-50/70 flex items-center justify-end gap-2.5">
        <button type="button" :disabled="saving" class="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 text-neutral-700 hover:bg-neutral-100 text-body-sm disabled:opacity-50" @click="close">Cancelar</button>
        <button type="submit" form="recurring-form" :disabled="!canSave" class="px-4 py-1.5 rounded-lg bg-neutral-900 text-white enabled:hover:bg-neutral-800 text-body-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          {{ saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear pago recurrente' }}
        </button>
      </div>
    </div>
  </div>
</template>
