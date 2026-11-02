<script setup lang="ts">
// Iconos de trazo en SVG en línea: evitan depender de la fuente de iconos
// de Google, que no estaría disponible sin conexión en la app Android.
const ICONS = {
  wallet: ['M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M14 10h6v4h-6a2 2 0 0 1 0-4z'],
  dashboard: ['M4 4h6v7H4z', 'M14 4h6v4h-6z', 'M14 12h6v8h-6z', 'M4 15h6v5H4z'],
  'add-circle': ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 8v8', 'M8 12h8'],
  add: ['M12 5v14', 'M5 12h14'],
  sync: ['M4 8h14', 'M14 4l4 4l-4 4', 'M20 16H6', 'M10 12l-4 4l4 4'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  'arrow-up-right': ['M7 17L17 7', 'M8 7h9v9'],
  'arrow-down': ['M12 5v14', 'M6 13l6 6l6-6'],
  calendar: ['M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 10h16', 'M8 2v4', 'M16 2v4'],
  note: ['M4 6h14', 'M4 11h10', 'M4 16h6', 'M14 20l1-3l5-5l2 2l-5 5z'],
  bolt: ['M13 2L5 14h6l-1 8l8-12h-6z'],
  check: ['M5 12l5 5l9-10'],
  'check-circle': ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M8 12l3 3l5-6'],
  user: ['M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z', 'M4 20a8 8 0 0 1 16 0'],
  search: ['M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z', 'M20 20l-4-4'],
} as const

export type IconName = keyof typeof ICONS

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="d in ICONS[name]" :key="d" :d="d" />
  </svg>
</template>
