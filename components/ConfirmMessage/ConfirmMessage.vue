<script setup lang="ts">
import { useConfirmMessage } from './useConfirmMessage'

const { isDialogVisible, dialogOptions, onConfirm, onCancel } = useConfirmMessage()
</script>

<template>
  <!-- Usamos un transition para un efecto suave de aparición -->
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <!-- Modal Overlay -->
    <div
      v-if="isDialogVisible"
      class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
      @click.self="onCancel"
    >
      <!-- El panel de diálogo en sí -->
      <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <h3 class="text-lg font-bold text-gray-900">{{ dialogOptions.title }}</h3>
        
        <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <!-- Usamos v-html para permitir negritas u otro formato simple en el mensaje -->
          <p class="text-sm text-red-800" v-html="dialogOptions.message"></p>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="onCancel"
            class="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {{ dialogOptions.cancelText }}
          </button>
          <button
            @click="onConfirm"
            class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            {{ dialogOptions.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
