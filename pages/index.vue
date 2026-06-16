<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Container from '~/components/Container.vue'
import FloatingButton from '~/components/FloatingButton.vue'
import ErrorMessage from '~/components/ErrorMessage.vue'
import type { ItemProps } from '~/components/ListItem.vue'
import BarCharSummary from './modules/BarCharSummary.vue'
import CreateMovementForm from './modules/CreateMovementForm.vue'
import Toast from '~/components/Toast/Toast.vue'
import { useShowScreen } from '~/composables/useShowScreen'
import { useAuth } from '~/composables/useLogin'
import { useCategories } from '~/composables/useCategories'
import { useToast } from '~/components/Toast/useToast'
import { formatBillingPeriodLabel, getCurrentBillingPeriodKey } from '~/types'

const { showScreen: showBottomSheet, openScreen: openBottomSheet, closeScreen: closeBottomSheet } = useShowScreen()
const { showScreen: showLateralSheet, openScreen: openLateralSheet, closeScreen: closeLateralSheet } = useShowScreen()
const { signInWithGoogle, signOut, user } = useAuth()
const { showToast } = useToast()
const { sortedCategories, fetchCategories } = useCategories()
const {
  transactionsList,
  error: transactionError,
  addTransaction,
  fetchRecentTransactions,
} = useTransactions()
const { totalSpent, refreshSummary, currentMonth } = useSummary()

const periodLabel = computed(() =>
  formatBillingPeriodLabel(currentMonth.value || getCurrentBillingPeriodKey())
)

const movementFormRef = ref<InstanceType<typeof CreateMovementForm> | null>(null);

const isErrorVisible = ref(false);
const errorMessage = ref('');

watch(user, (currentUser) => {
  if (!currentUser) {
    errorMessage.value = 'Para usar la aplicación, primero debes iniciar sesión.';
    isErrorVisible.value = true;
  } else {
    isErrorVisible.value = false;
  }
}, { immediate: true });

onMounted(async () => {
  await fetchCategories()
  if (user.value) {
    await fetchRecentTransactions(50)
  }
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
    showToast("Registro agregado")
    closeBottomSheet()
    setTimeout(async () => await refreshSummary(), 500)
    return
  }
  showToast(transactionError.value || '', 'error')
}

const lateralOptions = computed(() => {
  if (user.value) {
    return [{
      id: 'user-info',
      title: `¡Hola, ${user.value?.displayName}!`,
      description: '',
      icon: {
        icon: '👋',
        color: 'bg-green-100'
      },
      clickable: false
    }, ...LATERAL_OPTIONS, LOGOUT_OPTION]
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
  if (id === LOGOUT_OPTION_ID) {
    signOut()
    closeLateralSheet()
    return;
  }
  const routeToRedirect = ROUTES_OPTIONS[id as keyof typeof ROUTES_OPTIONS]
  if (routeToRedirect) {
    navigateTo(routeToRedirect)
  }
}
</script>

<template>
  <toast />

  <lateral-sheet title="Más opciones" :isOpen="showLateralSheet" @sidebar-close="closeLateralSheet">
    <template #content>
      <list :items="lateralOptions" @item-click="handleClick" />
    </template>
  </lateral-sheet>
  <floating-button label="+" color="blue" size="md" position="top-right" @click="openLateralSheet" />
  <template v-if="user">
    <main class="flex flex-col items-center min-h-screen mt-24">
      <container class="flex flex-col items-center justify-center gap-5">
        <header class="flex flex-col justify-center align-center gap-1">
          <h1 class="text-5xl font-bold tracking-tight text-heading text-center">{{ formatCurrency(totalSpent) }}</h1>
          <h2 class="text-2xl font-bold tracking-tight text-heading text-center text-gray-500">
            Gasto del periodo
          </h2>
          <h3 class="font-normal text-gray-400 text-center">{{ periodLabel }}</h3>
        </header>

        <article class="w-full">
          <bar-char-summary :current-month="currentMonth" />
        </article>

        <article class="w-full">
          <h2 class="text-2xl font-bold tracking-tight text-heading">Hoy: </h2>
          <list :items="transactionsList" />
        </article>
      </container>
    </main>

    <floating-action-menu
      :options="[
        { label: 'Agregar gasto', icon: '💸', color: 'bg-green-500' },
        { label: 'Pagos recurrentes', icon: '🔁', color: 'bg-purple-500' },
      ]"
      @option-click="(i) => i === 0 ? openBottomSheet() : navigateTo('/recurring')"
    />

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
      @modalCancel="closeBottomSheet">
      <template #modal-content>
        <create-movement-form ref="movementFormRef" :categories="sortedCategories" />
      </template>
    </bottom-sheet>
  </template>

  <error-message :message="errorMessage" v-model:visible="isErrorVisible" />
</template>
