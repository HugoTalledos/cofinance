<script setup lang="ts">
import AppShell from '~/components/AppShell/AppShell.vue'
import CreateMovementForm from './modules/CreateMovementForm.vue'
import { useAuth } from '~/composables/useLogin'
import { useCategories } from '~/composables/useCategories'
import { useCreditCards } from '~/composables/useCreditCards'
import { useToast } from '~/components/Toast/useToast'
import { activeCategories } from '@cofinance/core'

const { user } = useAuth()
const { showToast } = useToast()
const { sortedCategories, fetchCategories } = useCategories()
const { creditCards, fetchCreditCards } = useCreditCards()
const { error: transactionError, addTransaction } = useTransactions()
const { refreshSummary } = useSummary()

const movementFormRef = ref<InstanceType<typeof CreateMovementForm> | null>(null)
const saving = ref(false)

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchCreditCards()])
})

async function createMovement() {
  if (!movementFormRef.value || saving.value) return
  const payload = movementFormRef.value.submit()
  if (!payload) return

  const body = {
    userId: user.value?.uid || '',
    username: user.value?.displayName || '',
    categoryId: payload.type === 'income' ? '' : payload.category.id,
    categoryName: payload.type === 'income' ? '' : payload.category.name,
    amount: payload.value,
    description: payload.detail,
    date: payload.date.toISOString(),
    month: '',
    type: payload.type,
    // Firestore rechaza campos undefined: en ingresos el campo no se envía
    ...(payload.paymentMethod && { paymentMethod: payload.paymentMethod }),
    ...(payload.creditCard && {
      creditCardId: payload.creditCard.id,
      creditCardBank: payload.creditCard.bank,
    }),
  }
  saving.value = true
  const success = await addTransaction(body)
  saving.value = false
  if (success) {
    showToast('Registro agregado')
    setTimeout(async () => await refreshSummary(), 500)
    navigateTo('/')
    return
  }
  showToast(transactionError.value || '', 'error')
}
</script>

<template>
  <app-shell>
    <template #header>
      <div class="flex items-center gap-2">
        <button
          type="button"
          aria-label="Cancelar y volver"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-[0.98] transition-transform"
          @click="navigateTo('/')"
        >
          <app-icon name="close" />
        </button>
        <h1 class="font-display text-headline-sm font-bold tracking-tight">Nuevo Movimiento</h1>
      </div>
      <button
        type="button"
        class="text-label-md text-on-surface-variant hover:text-on-surface px-1 py-1 rounded transition-colors"
        @click="movementFormRef?.reset()"
      >
        Limpiar
      </button>
    </template>

    <div class="mt-4 pb-16">
      <create-movement-form
        ref="movementFormRef"
        :categories="activeCategories(sortedCategories)"
        :credit-cards="creditCards"
      />
    </div>

    <button
      type="button"
      :disabled="saving"
      class="fixed bottom-20 inset-x-5 mx-auto max-w-[440px] h-12 bg-black text-white rounded-xl text-title-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm disabled:opacity-60 z-40"
      @click="createMovement"
    >
      <app-icon name="check-circle" />
      {{ saving ? 'Guardando...' : 'Guardar Movimiento' }}
    </button>
  </app-shell>
</template>
