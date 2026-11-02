<script setup lang="ts">
import {
  buildTransactionEdit,
  hasEditChanges,
  toEditForm,
  updateTransaction,
  validateEditForm,
  type Category,
  type CreditCard,
  type PaymentMethod,
  type Transaction,
  type TransactionEditForm
} from '@cofinance/core'

const props = defineProps<{
  transaction: Transaction | null
  categories: Category[]
  creditCards: CreditCard[]
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Débito', value: 'debit_card' },
  { label: 'Crédito', value: 'credit_card' }
]

const emptyForm = (): TransactionEditForm => ({
  description: '',
  amount: null,
  categoryId: '',
  paymentMethod: null,
  creditCardId: null
})

const form = ref<TransactionEditForm>(emptyForm())
const saving = ref(false)
const saveError = ref<string | null>(null)

// El formulario se reinicia cada vez que cambia el movimiento
watch(
  () => props.transaction,
  tx => {
    form.value = tx ? toEditForm(tx) : emptyForm()
    saving.value = false
    saveError.value = null
  },
  { immediate: true }
)

const isIncome = computed(() => props.transaction?.type === 'income')

const formattedAmount = computed({
  get() {
    return form.value.amount === null ? '' : new Intl.NumberFormat('es-CO').format(form.value.amount)
  },
  set(raw: string) {
    const numeric = parseInt(raw.replace(/\D/g, ''), 10)
    form.value.amount = isNaN(numeric) ? null : numeric
  }
})

const validationMessage = computed(() =>
  props.transaction ? validateEditForm(props.transaction, form.value, props.creditCards) : null
)

const edit = computed(() =>
  props.transaction
    ? buildTransactionEdit(props.transaction, form.value, props.categories, props.creditCards)
    : null
)

const canSave = computed(() =>
  !saving.value && !validationMessage.value && edit.value !== null && hasEditChanges(edit.value)
)

const selectMethod = (method: PaymentMethod) => {
  form.value.paymentMethod = method
  if (method !== 'credit_card') form.value.creditCardId = null
}

const close = () => {
  if (saving.value) return
  emit('close')
}

const save = async () => {
  const tx = props.transaction
  if (!tx || !edit.value || !canSave.value) return
  saving.value = true
  saveError.value = null
  const result = await updateTransaction(tx.id, edit.value.changes, edit.value.removeFields)
  saving.value = false
  if (result.error) {
    saveError.value = result.error
    return
  }
  emit('saved')
}

// Escape cierra el panel: el listener existe solo mientras está abierto
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close()
}
watch(
  () => props.transaction !== null,
  open => {
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
  { immediate: true }
)
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const inputClass =
  'w-full h-9 px-2.5 bg-white border border-outline-variant/50 rounded-lg text-body-sm text-neutral-900 focus:border-neutral-900 focus:ring-0 outline-none transition-all'
</script>

<template>
  <div
    v-if="transaction"
    class="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex justify-end"
    @click.self="close"
  >
    <div class="w-full max-w-md bg-white h-full border-l border-outline-variant/40 shadow-xl flex flex-col justify-between">
      <div class="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-white">
        <div>
          <span class="text-label-sm text-outline uppercase tracking-wider block">Movimiento</span>
          <h2 class="text-body-lg font-semibold text-neutral-900">Editar Transacción</h2>
        </div>
        <button
          type="button"
          class="p-1 rounded-lg text-outline hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          title="Cerrar ventana"
          :disabled="saving"
          @click="close"
        >
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <form class="px-5 py-4 flex-1 overflow-y-auto space-y-4" @submit.prevent="save">
        <div>
          <label for="edit-description" class="block text-label-sm font-medium text-neutral-700 mb-1">Descripción</label>
          <input id="edit-description" v-model="form.description" type="text" :class="inputClass">
        </div>

        <div>
          <label for="edit-amount" class="block text-label-sm font-medium text-neutral-700 mb-1">Monto (COP)</label>
          <div class="relative">
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-body-sm">$</span>
            <input
              id="edit-amount"
              v-model="formattedAmount"
              type="text"
              inputmode="numeric"
              placeholder="0"
              :class="[inputClass, 'pl-6 font-numeric-md tabular-nums']"
            >
          </div>
        </div>

        <template v-if="!isIncome">
          <div>
            <label for="edit-category" class="block text-label-sm font-medium text-neutral-700 mb-1">Categoría</label>
            <select id="edit-category" v-model="form.categoryId" :class="[inputClass, 'cursor-pointer']">
              <option value="" disabled>Elige una categoría</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
          </div>

          <div>
            <p class="block text-label-sm font-medium text-neutral-700 mb-1">Medio de pago</p>
            <div role="radiogroup" aria-label="Medio de pago" class="bg-neutral-100 p-1 rounded-lg flex items-center gap-1">
              <button
                v-for="option in PAYMENT_METHOD_OPTIONS"
                :key="option.value"
                type="button"
                role="radio"
                :aria-checked="form.paymentMethod === option.value"
                class="flex-1 py-1.5 px-3 rounded-md text-body-sm font-semibold transition-all"
                :class="form.paymentMethod === option.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'"
                @click="selectMethod(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div v-if="form.paymentMethod === 'credit_card'">
            <label for="edit-card" class="block text-label-sm font-medium text-neutral-700 mb-1">Tarjeta</label>
            <select id="edit-card" v-model="form.creditCardId" :class="[inputClass, 'cursor-pointer']">
              <option :value="null" disabled>Elige una tarjeta</option>
              <option v-for="card in creditCards" :key="card.id" :value="card.id">{{ card.bank }}</option>
            </select>
          </div>
        </template>

        <div>
          <p class="block text-label-sm font-medium text-neutral-700 mb-1">Fecha</p>
          <p class="h-9 px-2.5 flex items-center bg-neutral-50 border border-outline-variant/30 rounded-lg text-body-sm text-neutral-500">
            {{ formatTxDate(transaction) }}
          </p>
        </div>

        <p v-if="validationMessage" class="text-body-sm text-neutral-500">{{ validationMessage }}</p>
        <p v-if="saveError" class="text-body-sm text-red-700">{{ saveError }}</p>
      </form>

      <div class="px-5 py-3 border-t border-outline-variant/30 bg-neutral-50/70 flex items-center justify-end gap-2.5">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors text-body-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="saving"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="!canSave"
          class="px-4 py-1.5 rounded-lg bg-neutral-900 text-white enabled:hover:bg-neutral-800 transition-all text-body-sm font-medium enabled:active:scale-95 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          @click="save"
        >
          <span class="material-symbols-outlined text-base">check</span>
          <span>{{ saving ? 'Guardando…' : 'Guardar cambios' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
