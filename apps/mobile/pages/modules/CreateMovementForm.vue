<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import type { Category, MovementPayload, MovementFormValue } from './CreateMovementForm.type'
import { useToast } from '~/components/Toast/useToast'
import { formatDateToString, cardToday, validateCardPayment, isCardConfigured } from '@cofinance/core'
import type { PaymentMethod, CreditCard } from '@cofinance/core'

const { showToast } = useToast()

const props = defineProps<{
  categories: Category[]
  creditCards: CreditCard[]
  initialValue?: MovementFormValue
  lockType?: boolean
}>()

const TYPE_OPTIONS = [
  { label: 'Egreso', value: 'expense', icon: 'arrow-up-right' },
  { label: 'Ingreso', value: 'income', icon: 'arrow-down' },
  { label: 'Pago de tarjeta', value: 'card_payment', icon: 'wallet' },
] as const

const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Crédito', value: 'credit_card' },
  { label: 'Débito', value: 'debit_card' },
]

const initialState = () => ({
  type: props.initialValue?.type ?? 'expense' as 'income' | 'expense' | 'card_payment',
  categoryId: props.initialValue?.categoryId ?? '',
  detail: props.initialValue?.detail ?? '',
  value: props.initialValue?.value ?? null as number | null,
  date: props.initialValue?.date ?? '',
  paymentMethod: props.initialValue?.paymentMethod ?? 'credit_card' as PaymentMethod,
  creditCardId: props.initialValue?.creditCardId ?? ''
})

const form = reactive(initialState())

const selectedCategory = computed(() =>
  props.categories.find(category => category.id === form.categoryId)
)

// Con una sola tarjeta no hay nada que elegir: se usa esa
const selectedCreditCard = computed(() =>
  props.creditCards.length === 1
    ? props.creditCards[0]
    : props.creditCards.find(card => card.id === form.creditCardId)
)

const requiresCreditCard = computed(() =>
  form.type === 'card_payment' || (form.type === 'expense' && form.paymentMethod === 'credit_card' && props.creditCards.length > 0)
)

const categorySearch = ref('')

const filteredCategories = computed(() => {
  const query = categorySearch.value.trim().toLowerCase()
  if (!query) return props.categories
  return props.categories.filter(category => category.name.toLowerCase().includes(query))
})

const formattedValue = computed({
  get() {
    return form.value === null ? '' : new Intl.NumberFormat('es-CO').format(form.value)
  },
  set(raw: string) {
    const numericValue = parseInt(raw.replace(/\D/g, ''), 10)
    form.value = isNaN(numericValue) ? null : numericValue
  }
})

const dateLabel = computed(() => {
  const today = formatDateToString(new Date())
  const date = form.date || today
  const [year, month, day] = date.split('-').map(Number)
  const label = new Date(year, month - 1, day).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
  return date === today ? `Hoy, ${label}` : label
})

const paymentError = computed(() => {
  if (!selectedCreditCard.value) return 'Elige una tarjeta'
  return validateCardPayment({amount:form.value ?? 0,date:form.date || cardToday(),description:form.detail},selectedCreditCard.value,cardToday())
})

const isValid = computed(() => {
  if (form.type === 'card_payment') return paymentError.value === null
  if (form.type === 'income') {
    return Boolean(form.detail && form.value && form.value > 0)
  }
  if (requiresCreditCard.value && !selectedCreditCard.value) return false
  return Boolean(selectedCategory.value && form.detail && form.value && form.value > 0)
})

const submit = (): MovementPayload | null => {
  if (!isValid.value) {
    showToast(form.type === 'card_payment' ? paymentError.value || 'Revisa el abono' : 'Por favor, completa los campos requeridos', 'error')
    return null
  }

  const submissionDate = form.date ? new Date(form.date) : new Date()

  return {
    category: selectedCategory.value ?? { id: '', name: '' },
    detail: form.detail,
    value: form.value || 0,
    date: submissionDate,
    dateKey: form.date || cardToday(),
    type: form.type,
    ...(form.type === 'expense' && { paymentMethod: form.paymentMethod }),
    ...(requiresCreditCard.value && selectedCreditCard.value && {
      creditCard: { id: selectedCreditCard.value.id, bank: selectedCreditCard.value.bank }
    }),
  }
}

const reset = () => {
  Object.assign(form, initialState())
  categorySearch.value = ''
}

defineExpose({ submit, reset })
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent>
    <section aria-label="Tipo de movimiento" class="bg-surface-container p-1 rounded-xl flex items-center gap-1 shadow-sm">
      <button
        v-for="option in TYPE_OPTIONS"
        :key="option.value"
        type="button"
        :aria-pressed="form.type === option.value"
        :disabled="lockType"
        class="flex-1 min-w-0 py-2 px-1 rounded-lg text-label-md transition-all duration-200 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
        :class="form.type === option.value
          ? 'bg-black text-white shadow-sm'
          : 'text-on-surface-variant hover:text-on-surface'"
        @click="form.type = option.value"
      >
        <app-icon :name="option.icon" :size="18" />
        {{ option.label }}
      </button>
    </section>

    <section class="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm text-center">
      <label for="amount" class="block text-label-sm uppercase text-outline mb-1">
        {{ form.type === 'card_payment' ? 'Monto del abono' : form.type === 'income' ? 'Monto del ingreso' : 'Monto del egreso' }}
      </label>
      <div class="flex items-center justify-center gap-1">
        <span class="font-display text-currency-display text-outline select-none">$</span>
        <input
          id="amount"
          v-model="formattedValue"
          type="text"
          inputmode="numeric"
          placeholder="0"
          class="font-display text-currency-display font-bold text-on-surface text-center bg-transparent border-0 p-0 w-48 tracking-tight tabular-nums outline-none focus:ring-0"
          @focus="($event.target as HTMLInputElement).select()"
        />
      </div>
      <span class="inline-flex mt-1 px-2 py-0.5 rounded-full text-label-sm bg-surface-container text-on-surface-variant">
        COP / Pesos
      </span>
    </section>

    <section v-if="form.type === 'expense'" class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <p class="text-label-sm uppercase text-outline">Categoría</p>
        <span class="text-label-md text-on-surface-variant">
          {{ selectedCategory?.name ?? `${categories.length} disponibles` }}
        </span>
      </div>

      <!-- Card de altura fija: con muchas categorías hace scroll dentro y no empuja el resto del formulario -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-3 shadow-sm flex flex-col h-60 overflow-hidden">
        <div class="relative mb-2.5 shrink-0">
          <app-icon
            name="search"
            :size="16"
            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
          />
          <input
            v-model="categorySearch"
            type="search"
            placeholder="Buscar o filtrar categoría..."
            class="w-full pl-8 pr-3 py-1.5 bg-surface-container-low rounded-lg text-[13px] leading-[18px] text-on-surface placeholder:text-outline border border-transparent focus:border-black focus:bg-surface-container-lowest focus:ring-0 outline-none transition-all"
          />
        </div>

        <div class="overflow-y-auto overscroll-contain flex-1 pr-1 grid grid-cols-4 auto-rows-min gap-2 pb-1 select-none">
          <button
            v-for="category in filteredCategories"
            :key="category.id"
            type="button"
            class="flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-[0.98]"
            :class="form.categoryId === category.id
              ? 'border-2 border-black bg-surface-container-low shadow-sm'
              : 'border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'"
            @click="form.categoryId = category.id"
          >
            <span
              class="w-10 h-10 rounded-full flex items-center justify-center mb-1 text-[20px]"
              :class="form.categoryId === category.id ? 'bg-surface-container' : 'bg-surface-container-low'"
            >{{ category.icon || category.name.charAt(0) }}</span>
            <span
              class="text-label-sm text-on-surface truncate w-full text-center"
              :class="form.categoryId === category.id ? 'font-bold' : 'font-semibold'"
            >{{ category.name }}</span>
          </button>
          <p
            v-if="filteredCategories.length === 0"
            class="col-span-4 py-6 text-center text-body-md text-on-surface-variant"
          >Ninguna categoría coincide</p>
        </div>
      </div>
    </section>

    <section v-if="form.type === 'expense'" class="flex flex-col gap-2">
      <p class="text-label-sm uppercase text-outline">Medio de pago</p>
      <div role="radiogroup" aria-label="Medio de pago" class="bg-surface-container p-1 rounded-xl flex items-center gap-1">
        <button
          v-for="option in PAYMENT_METHOD_OPTIONS"
          :key="option.value"
          type="button"
          role="radio"
          :aria-checked="form.paymentMethod === option.value"
          class="flex-1 py-2 px-3 rounded-lg text-body-md font-semibold transition-all duration-200"
          :class="form.paymentMethod === option.value
            ? 'bg-surface-container-lowest text-on-surface shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'"
          @click="form.paymentMethod = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section v-if="requiresCreditCard" class="flex flex-col gap-2">
      <p class="text-label-sm uppercase text-outline">Tarjeta de crédito</p>
      <p v-if="form.type === 'card_payment'" class="text-body-sm text-on-surface-variant">El abono reduce la deuda y no cuenta como otro gasto.</p>
      <div
        role="radiogroup"
        aria-label="Tarjeta de crédito"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="card in creditCards"
          :key="card.id"
          type="button"
          role="radio"
          :aria-checked="selectedCreditCard?.id === card.id"
          :disabled="form.type === 'card_payment' && !isCardConfigured(card)"
          class="px-3 py-1.5 rounded-full text-label-md font-semibold transition-all active:scale-[0.98]"
          :class="selectedCreditCard?.id === card.id
            ? 'bg-black text-white'
            : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'"
          @click="form.creditCardId = card.id"
        >
          {{ card.bank }}{{ form.type === 'card_payment' && !isCardConfigured(card) ? ' · Configurar en web' : '' }}
        </button>
      </div>
    </section>

    <p v-if="form.type === 'card_payment' && !creditCards.length" role="status" class="text-body-sm text-on-surface-variant">No hay tarjetas disponibles. Configúralas desde Tarjetas en la web.</p>
    <p v-if="form.type === 'card_payment' && selectedCreditCard && !isCardConfigured(selectedCreditCard)" class="text-body-sm text-error">Configura el saldo inicial de esta tarjeta desde la web para registrar abonos.</p>

    <label class="relative flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm">
      <span class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
        <app-icon name="calendar" />
      </span>
      <span class="flex flex-col">
        <span class="text-label-md text-on-surface-variant">Fecha del registro</span>
        <span class="text-title-md text-on-surface">{{ dateLabel }}</span>
      </span>
      <!-- Input nativo invisible encima de la tarjeta: abre el selector del sistema -->
      <input
        v-model="form.date"
        type="date"
        aria-label="Fecha del registro"
        :min="form.type === 'card_payment' ? selectedCreditCard?.trackingStartDate : undefined"
        :max="form.type === 'card_payment' ? cardToday() : undefined"
        class="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
      />
    </label>

    <label class="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm focus-within:border-black">
      <span class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
        <app-icon name="note" />
      </span>
      <input
        v-model="form.detail"
        type="text"
        :placeholder="form.type === 'card_payment' ? 'Descripción del abono (opcional)' : 'Descripción corta (ej: Almuerzo)'"
        class="flex-1 min-w-0 bg-transparent border-0 p-0 text-title-md font-normal text-on-surface placeholder:text-on-surface-variant/70 outline-none focus:ring-0"
      />
    </label>
  </form>
</template>
