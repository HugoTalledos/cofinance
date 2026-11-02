<script setup lang="ts">
const { user, signOut } = useAuth()
const route = useRoute()

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard General' },
  { to: '/historial', icon: 'receipt_long', label: 'Historial de Transacciones' }
]

const adminItems = [
  { to: '/tarjetas', icon: 'credit_card', label: 'Tarjetas' },
  { to: '/categorias', icon: 'pie_chart', label: 'Categorías' },
  { to: '/recurrentes', icon: 'event_repeat', label: 'Pagos recurrentes' }
]
</script>

<template>
  <div class="min-h-screen bg-background text-on-surface font-body-md text-body-md">
    <aside class="fixed top-0 left-0 h-screen w-64 flex flex-col justify-between bg-surface-container-lowest border-r border-slate-200 p-space-md z-40">
      <div class="flex flex-col gap-space-md">
        <div class="flex items-center gap-space-sm px-space-xs py-space-xs">
          <div class="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-base">account_balance_wallet</span>
          </div>
          <span class="font-headline-sm text-headline-sm text-neutral-900">Cofinance</span>
        </div>
        <nav class="flex flex-col gap-space-xs">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-space-sm px-space-md h-9 rounded-lg"
            :class="route.path === item.to ? 'bg-surface-container text-on-surface font-medium' : 'text-on-surface-variant hover:bg-surface-container-low'"
          >
            <span class="material-symbols-outlined text-base">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </NuxtLink>
          <details class="group" :open="adminItems.some(item => route.path === item.to)">
            <summary
              class="flex items-center gap-space-sm px-space-md h-9 rounded-lg cursor-pointer list-none hover:bg-surface-container-low [&::-webkit-details-marker]:hidden"
              :class="adminItems.some(item => route.path === item.to) ? 'text-on-surface font-medium' : 'text-on-surface-variant'"
            >
              <span class="material-symbols-outlined text-base">settings</span>
              <span>Administración</span>
              <span class="material-symbols-outlined text-base ml-auto transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div class="ml-space-md pl-space-sm border-l border-slate-200 mt-space-xs flex flex-col gap-space-xs">
              <NuxtLink
                v-for="item in adminItems"
                :key="item.to"
                :to="item.to"
                :aria-current="route.path === item.to ? 'page' : undefined"
                class="flex items-center gap-space-sm px-space-sm h-9 rounded-lg text-body-sm"
                :class="route.path === item.to ? 'bg-surface-container text-on-surface font-medium' : 'text-on-surface-variant hover:bg-surface-container-low'"
              >
                <span class="material-symbols-outlined text-base">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </NuxtLink>
            </div>
          </details>
        </nav>
      </div>
      <div class="flex items-center gap-space-sm p-space-sm border-t border-slate-200">
        <img
          v-if="user?.photoURL"
          :src="user.photoURL"
          alt=""
          referrerpolicy="no-referrer"
          class="w-9 h-9 rounded-full object-cover"
        >
        <div class="flex flex-col min-w-0">
          <span class="truncate font-body-sm text-body-sm font-medium text-on-surface">{{ user?.displayName }}</span>
          <button class="text-left font-label-md text-label-md text-on-surface-variant hover:text-on-surface" @click="signOut">
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
    <div class="ml-64 min-h-screen flex flex-col">
      <header class="sticky top-0 z-30 h-16 flex items-center px-margin-tablet bg-surface-container-lowest/90 backdrop-blur-sm border-b border-slate-200">
        <slot name="header" />
      </header>
      <main class="flex-1 p-margin-tablet">
        <slot />
      </main>
    </div>
  </div>
</template>
