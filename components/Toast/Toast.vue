<script setup lang="ts">
import { useToast } from './useToast' // Asegúrate de que la ruta sea correcta

// Obtenemos el estado del composable
const { show, message, type } = useToast()
</script>

<template>
  <div
    v-if="show"
    class="fixed z-[1002] top-5 inset-x-5 mx-auto max-w-sm p-4 rounded-2xl shadow-lg ring-1 overflow-x-auto"
    :class="type === 'success' ? 'bg-white ring-secondary-container' : 'bg-white ring-rose-200'"
  >
    <div class="flex">
      <div class="flex-shrink-0">
        <!-- Icono para Éxito -->
        <svg v-if="type === 'success'" class="h-5 w-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <!-- Icono para Error -->
        <svg v-else class="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-on-surface">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>
