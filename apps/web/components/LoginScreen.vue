<script setup lang="ts">
const { signInWithGoogle } = useAuth()
const error = ref<string | null>(null)

const login = async () => {
  error.value = null
  try {
    await signInWithGoogle()
  } catch {
    error.value = 'No se pudo iniciar sesión. Inténtalo de nuevo.'
  }
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-background p-margin">
    <div class="w-full max-w-sm bg-surface-container-lowest border border-slate-200 rounded-xl p-space-xl flex flex-col items-center gap-space-lg text-center">
      <div class="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
        <span class="material-symbols-outlined">account_balance_wallet</span>
      </div>
      <div>
        <h1 class="font-headline-md text-headline-md text-on-surface">Cofinance</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">Tu panel de finanzas personales</p>
      </div>
      <button
        class="w-full h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-body-md text-body-md font-medium transition-colors"
        @click="login"
      >
        Iniciar sesión con Google
      </button>
      <p v-if="error" class="font-body-sm text-body-sm text-error">{{ error }}</p>
    </div>
  </main>
</template>
