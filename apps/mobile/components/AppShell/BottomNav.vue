<script setup lang="ts">
import type { IconName } from '~/components/AppIcon.vue'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Resumen', icon: 'dashboard' },
  { to: '/registrar', label: 'Registrar', icon: 'add-circle' },
  { to: '/recurrentes', label: 'Recurrentes', icon: 'sync' },
]

const route = useRoute()
</script>

<template>
  <nav class="bg-surface fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-5 py-1 h-16 shadow-[0_-1px_3px_rgba(15,23,42,0.06)]">
    <NuxtLink
      v-for="tab in TABS"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-col items-center justify-center rounded-xl px-2 py-1.5 active:scale-[0.98] transition-transform duration-150"
      :class="route.path === tab.to
        ? 'bg-primary-container text-white'
        : 'text-on-surface-variant hover:bg-surface-container-low'"
    >
      <app-icon :name="tab.icon" :size="22" />
      <span class="text-label-sm mt-0.5">{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>
