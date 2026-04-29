<script setup lang="ts">
import { useToast } from './useToast' // Asegúrate de que la ruta sea correcta

// Obtenemos el estado del composable
const { show, message, type } = useToast()
</script>

<template>
  <div
    v-if="show"
    class="fixed z-50 top-5 right-5 p-4 rounded-md shadow-lg overflow-x-auto"
    :class="type === 'success' ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'"
  >
    <div class="flex">
      <div class="flex-shrink-0">
        <!-- Icono para Éxito -->
        <svg v-if="type === 'success'" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <!-- Icono para Error -->
        <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <p class="text-sm" :class="type === 'success' ? 'text-green-700' : 'text-red-700'">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>
