<script setup lang="ts">
import type { ItemProps } from '~/components/ListItem.vue'
import Toast from '~/components/Toast/Toast.vue'
import ErrorMessage from '~/components/ErrorMessage.vue'
import BottomNav from './BottomNav.vue'
import { useShowScreen } from '~/composables/useShowScreen'
import { useAuth } from '~/composables/useLogin'

const { showScreen: showLateralSheet, openScreen: openLateralSheet, closeScreen: closeLateralSheet } = useShowScreen()
const { signInWithGoogle, signOut, user } = useAuth()

const isErrorVisible = ref(false)
const errorMessage = ref('')

watch(user, (currentUser) => {
  if (!currentUser) {
    errorMessage.value = 'Para usar la aplicación, primero debes iniciar sesión.'
    isErrorVisible.value = true
  } else {
    isErrorVisible.value = false
  }
}, { immediate: true })

const lateralOptions = computed(() => {
  if (user.value) {
    return [{
      id: 'user-info',
      title: `¡Hola, ${user.value?.displayName}!`,
      description: '',
      icon: {
        icon: '👋',
        color: 'bg-surface-container'
      },
      clickable: false
    }, LOGOUT_OPTION]
  }
  return [USER_UNAUTHENTICATED_OPTION]
})

const handleClick = (item: ItemProps) => {
  const { id } = item
  if (id === LOGIN_OPTION_ID) {
    signInWithGoogle()
    closeLateralSheet()
    return
  }
  if (id === LOGOUT_OPTION_ID) {
    signOut()
    closeLateralSheet()
  }
}
</script>

<template>
  <toast />

  <lateral-sheet title="Cuenta" :isOpen="showLateralSheet" @sidebar-close="closeLateralSheet">
    <template #content>
      <list :items="lateralOptions" @item-click="handleClick" />
    </template>
  </lateral-sheet>

  <header class="bg-surface fixed top-0 left-0 w-full z-40 flex justify-between items-center px-5 h-14 shadow-sm">
    <slot name="header">
      <div class="flex items-center gap-2">
        <app-icon name="wallet" :size="24" />
        <span class="font-display text-headline-sm font-bold">Cofinance</span>
      </div>
      <button
        type="button"
        aria-label="Cuenta"
        class="p-2 rounded-full text-on-surface-variant hover:bg-surface-container active:scale-[0.98] transition-transform duration-150"
        @click="openLateralSheet"
      >
        <app-icon name="user" :size="22" />
      </button>
    </slot>
  </header>

  <main class="w-full max-w-[480px] mx-auto px-5 pt-16 pb-24 flex flex-col gap-6">
    <slot v-if="user" />
  </main>

  <bottom-nav />

  <error-message :message="errorMessage" v-model:visible="isErrorVisible" />
</template>
