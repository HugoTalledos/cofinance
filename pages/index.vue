<script setup lang="ts">
import Container from '~/components/Container.vue'
import FloatingButton from '~/components/FloatingButton.vue'
import type { ItemProps } from '~/components/ListItem.vue'
import BarCharSummary from './modules/BarCharSummary.vue'
import CreateMovementForm from './modules/CreateMovementForm.vue'
import Toast from '~/components/Toast/Toast.vue'
import { useShowScreen } from '~/composables/useShowScreen'
import { useAuth } from '~/composables/useLogin'
import { useCategories } from '~/composables/useCategories'
import { useToast } from '~/components/Toast/useToast'

const { showScreen: showBottomSheet, openScreen: openBottomSheet, closeScreen: closeBottomSheet } = useShowScreen()
const { showScreen: showLateralSheet, openScreen: openLateralSheet, closeScreen: closeLateralSheet } = useShowScreen()
const { signInWithGoogle, user } = useAuth()
const { showToast } = useToast()
const { sortedCategories, fetchCategories } = useCategories()
const {
  transactionsList,
  error,
  currentMonth,
  addTransaction,
  fetchRecentTransactions,
} = useTransactions()

const { totalSpent, refreshSummary } = useSummary()
const movementFormRef = ref<InstanceType<typeof CreateMovementForm> | null>(null);


onMounted(async () => {
  await fetchCategories()
  await fetchRecentTransactions(50)
})

async function createMovement() {
  if (!movementFormRef.value) return;
  const payload = movementFormRef.value.submit();

  if (!payload) return;

  const body = {
    userId: user.value?.uid || '',
    username: user.value?.displayName || '',
    categoryId: payload.category.id,
    categoryName: payload.category.name,
    amount: payload.value,
    description: payload.detail,
    date: payload.date.toISOString(),
    month: ''
  }
  const success = await addTransaction(body);
  if (success) {
    closeBottomSheet()
    await refreshSummary()
    return
  }

  showToast(error.value || '', 'error')
}

const lateralOptions = computed(() => {
  if (user) {
    return [...LATERAL_OPTIONS, {
      id: LOGIN_OPTION_ID,
      title: `¡Hola, ${user.value?.displayName}!`,
      description: '',
      icon: {
          icon: '👋',
          color: 'bg-green-100'
      },
      clickable: false
    }]
  }

  return [...LATERAL_OPTIONS, USER_UNAUTHENTICATED_OPTION]
})

const handleClick = (item: ItemProps) => {
  const { id } = item

  if (id === LOGIN_OPTION_ID) {
    signInWithGoogle()
    closeLateralSheet()
    return;
  }
  const routeToRedirect = ROUTES_OPTIONS[id as keyof typeof ROUTES_OPTIONS]
  navigateTo(routeToRedirect)
}
</script>

<template>
  <toast />
  <lateral-sheet
    title="Más opciones"
    :isOpen="showLateralSheet"
    @sidebar-close="closeLateralSheet"
  >
  <template #content>
    <list :items="lateralOptions"  @item-click="handleClick" />
  </template>
  </lateral-sheet>
  <floating-button label="+" color="blue" size="md" position="top-right" @click="openLateralSheet" />
  <main class="flex flex-col items-center min-h-screen mt-24">
    <container class="flex flex-col items-center justify-center gap-5">
      <header class="flex flex-col justify-center align-center gap-2">
        <h1 class="text-5xl font-bold tracking-tight text-heading text-center">{{ formatCurrency(totalSpent) }}</h1>
        <h2 class="text-2xl font-bold tracking-tight text-heading text-center text-gray-500">Gasto del mes</h2>
      </header>
      <article class="w-full">
        <bar-char-summary :current-month="currentMonth"   />
      </article>
      <article class="w-full">
        <h2 class="text-2xl font-bold tracking-tight text-heading">Hoy: </h2>
        <list :items="transactionsList" />
      </article>
    </container>
  </main>
  <floating-button label="Agregar" color="blue" size="md" @click="openBottomSheet" />
  <bottom-sheet
    title="Agregar Movimiento"
    allowClose
    :visible="showBottomSheet"
    showActionButtons
    :actionButtons="{
      closeButton: { label: 'Cancelar', icon: 'X', enabled: true, show: true },
      doneButton: { label: 'Guardar', icon: 'X', enabled: true, show: true },
    }"
    @modalClose="closeBottomSheet"
    @modalDone="createMovement"
    @modalCancel="closeBottomSheet"
  >
    <template #modal-content>
      <create-movement-form
        ref="movementFormRef"
        :categories="sortedCategories"
      />
    </template>
  </bottom-sheet>
</template>
