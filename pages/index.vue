<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SummaryCard from '~/components/SummaryCard.vue'
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
import { formatBillingPeriodLabel, getCurrentBillingPeriodKey, formatDateToString } from '~/types'

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
const { totalSpent, totalIncomeFormatted, totalRemainingFormatted, categoriesData, refreshSummary, currentMonth } = useSummary()

const selectedCategoryId = ref<string | null>(null)
const selectedCategoryName = ref<string>('')

function handleCategoryClick(payload: { categoryId: string; categoryName: string }) {
  if (selectedCategoryId.value === payload.categoryId) {
    selectedCategoryId.value = null
    selectedCategoryName.value = ''
  } else {
    selectedCategoryId.value = payload.categoryId
    selectedCategoryName.value = payload.categoryName
  }
}

const selectedCategorySpent = computed(() => {
  if (!selectedCategoryId.value) return null
  return categoriesData.value.find(c => c.categoryId === selectedCategoryId.value)?.spent ?? null
})

const displayedExpense = computed(() =>
  selectedCategorySpent.value !== null ? selectedCategorySpent.value : totalSpent.value
)

const periodLabel = computed(() =>
  formatBillingPeriodLabel(currentMonth.value || getCurrentBillingPeriodKey())
)

const todayTransactionsList = computed(() => {
  const today = formatDateToString(new Date())
  return transactionsList.value.filter(t => t.date === today && (t.type ?? 'expense') === 'expense')
})

const displayedTransactionsList = computed(() => {
  if (selectedCategoryId.value) {
    return transactionsList.value.filter(t => t.categoryId === selectedCategoryId.value)
  }
  return todayTransactionsList.value
})

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
    categoryId: payload.type === 'income' ? '' : payload.category.id,
    categoryName: payload.type === 'income' ? '' : payload.category.name,
    amount: payload.value,
    description: payload.detail,
    date: payload.date.toISOString(),
    month: '',
    type: payload.type,
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
        <header class="w-full">
          <div class="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory">
            <SummaryCard
              label="Ingresos"
              :value="totalIncomeFormatted"
              color="green"
            />
            <SummaryCard
              label="Gastos"
              :value="formatCurrency(displayedExpense)"
              color="red"
              :sublabel="selectedCategoryName || undefined"
            />
            <SummaryCard
              label="Restante"
              :value="totalRemainingFormatted"
              color="yellow"
            />
          </div>
          <p class="text-sm font-normal text-gray-400 text-center mt-1">{{ periodLabel }}</p>
        </header>

        <article class="w-full">
          <bar-char-summary
            :current-month="currentMonth"
            :selected-category-id="selectedCategoryId ?? undefined"
            @category-click="handleCategoryClick"
          />
        </article>

        <article class="w-full">
          <h2 class="text-2xl font-bold tracking-tight text-heading">
            {{ selectedCategoryName || 'Hoy' }}:
          </h2>
          <list :items="displayedTransactionsList" />
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
