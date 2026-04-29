<script setup lang="ts">
import Container from '~/components/Container.vue'
import FloatingButton from '~/components/FloatingButton.vue'
import type { ItemProps } from '~/components/ListItem.vue'
import ProgressBarChart from '~/components/ProgressBarChart.vue'
import { useExampleStore } from '~/stores/example'
import { useShowScreen } from '~/composables/useShowScreen'

const store = useExampleStore()
const { showScreen: showBottomSheet, openScreen: openBottomSheet, closeScreen: closeBottomSheet } = useShowScreen()
const { showScreen: showLateralSheet, openScreen: openLateralSheet, closeScreen: closeLateralSheet } = useShowScreen()
const title = ref<string>('Bienvenido a Cofinance')
const isFirebaseConfigured = ref<boolean>(false)


const config = useRuntimeConfig()

onMounted(() => {
  // Verifica si Firebase está configurado
  isFirebaseConfigured.value = !!config.public.firebaseProjectId && 
                                config.public.firebaseProjectId !== 'your_project_id'
})

const items = ref<ItemProps[]>([
  {
    id: '1',
    title: 'Transacción 1',
    description: 'Descripción 1',
    amount: {
      value: formatCurrency(100),
      short: shortFormatCurrency(100)
    },
    author: 'Juan Perez',
    icon: {
      icon: '🍔',
      color: 'bg-orange-100'
    },
    date: '2026-01-01'
  },
  {
    id: '1',
    title: 'Transacción 1',
    description: 'Descripción 1',
    amount: {
      value: formatCurrency(100),
      short: shortFormatCurrency(100)
    },
    author: 'Juan Perez',
    icon: {
      icon: '🍔',
      color: 'bg-orange-100'
    },
    date: '2026-01-01'
  },
  {
    id: '1',
    title: 'Transacción 1',
    description: 'Descripción 1',
    amount: {
      value: formatCurrency(100),
      short: shortFormatCurrency(100)
    },
    author: 'Juan Perez',
    icon: {
      icon: '🍔',
      color: 'bg-orange-100'
    },
    date: '2026-01-01'
  },
  {
    id: '1',
    title: 'Transacción 1',
    description: 'Descripción 1',
    amount: {
      value: formatCurrency(100),
      short: shortFormatCurrency(100)
    },
    author: 'Juan Perez',
    icon: {
      icon: '🍔',
      color: 'bg-orange-100'
    },
    date: '2026-01-01'
  },
  {
    id: '1',
    title: 'Transacción 1',
    description: 'Descripción 1',
    amount: {
      value: formatCurrency(100),
      short: shortFormatCurrency(100)
    },
    author: 'Juan Perez',
    icon: {
      icon: '🍔',
      color: 'bg-orange-100'
    },
    date: '2026-01-01'
  },
  {
    id: '1',
    title: 'Transacción 1',
    description: 'Descripción 1',
    amount: {
      value: formatCurrency(100),
      short: shortFormatCurrency(100)
    },
    author: 'Juan Perez',
    icon: {
      icon: '🍔',
      color: 'bg-orange-100'
    },
    date: '2026-01-01'
  },
  {
    id: '1',
    title: 'Transacción 1',
    description: 'Descripción 1',
    amount: {
      value: formatCurrency(100),
      short: shortFormatCurrency(100)
    },
    author: 'Juan Perez',
    icon: {
      icon: '🍔',
      color: 'bg-orange-100'
    },
    date: '2026-01-01'
  },
  {
    id: '2',
    title: 'Transacción 2',
    description: 'Descripción 2',
    amount: {
      value: formatCurrency(7000000),
      short: shortFormatCurrency(7000000)
    },
    author: 'Maria Lopez',
    icon: {
      icon: '🍔',
      color: 'bg-orange-100'
    },
    date: '2026-01-02'
  }
])
</script>

<template>
  <lateral-sheet
    title="Configuración"
    :isOpen="showLateralSheet"
    @sidebar-close="closeLateralSheet"
  />
  <floating-button label="Config" color="blue" size="md" position="top-right" @click="openLateralSheet" />
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
        <list :items="items" />
      </article>
    </container>
  </main>
  <floating-button label="Agregar" color="blue" size="md" @click="openBottomSheet" />
  <bottom-sheet
    title="Agregar Transacción"
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
