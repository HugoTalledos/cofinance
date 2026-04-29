<script setup lang="ts">
import Container from '~/components/Container.vue'
import FloatingButton from '~/components/FloatingButton.vue'
import type { ItemProps } from '~/components/ListItem.vue'
import ProgressBarChart from '~/components/ProgressBarChart.vue'
import Toast from '~/components/Toast/Toast.vue'
import { useShowScreen } from '~/composables/useShowScreen'
import { useAuth } from '~/composables/useLogin'

const { showScreen: showBottomSheet, openScreen: openBottomSheet, closeScreen: closeBottomSheet } = useShowScreen()
const { showScreen: showLateralSheet, openScreen: openLateralSheet, closeScreen: closeLateralSheet } = useShowScreen()
const { signInWithGoogle, user } = useAuth()
const { currentTransactions } = useTransactions()
const isFirebaseConfigured = ref<boolean>(false)


const config = useRuntimeConfig()

onMounted(() => {
  // Verifica si Firebase está configurado
  isFirebaseConfigured.value = !!config.public.firebaseProjectId && 
                                config.public.firebaseProjectId !== 'your_project_id'
})

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
  <Toast />
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
      <header>
        <h1 class="mb-4 text-5xl font-bold tracking-tight text-heading">{{ formatCurrency(1226459) }}</h1>
        <input type="month" class="w-full p-2 border border-gray-300 rounded-md">
      </header>
      <article class="w-full">
        <progress-bar-chart />
      </article>
      <article class="w-full">
        <h2 class="text-2xl font-bold tracking-tight text-heading">Hoy: </h2>
        <list :items="currentTransactions" />
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
    @modalDone="closeBottomSheet"
    @modalCancel="closeBottomSheet"
  />
</template>
