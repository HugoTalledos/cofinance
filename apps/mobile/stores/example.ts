import { defineStore } from 'pinia'
import type { AppState } from '~/types'

/**
 * Store de ejemplo usando Pinia con Composition API
 */
export const useExampleStore = defineStore('example', () => {
  // Estado
  const count = ref<number>(0)
  const message = ref<string>('Hola desde Pinia!')
  const appState = ref<AppState>({
    isLoading: false,
    error: null
  })

  // Getters
  const doubleCount = computed(() => count.value * 2)
  const hasError = computed(() => appState.value.error !== null)

  // Actions
  const increment = () => {
    count.value++
  }

  const decrement = () => {
    count.value--
  }

  const setMessage = (newMessage: string) => {
    message.value = newMessage
  }

  const setLoading = (isLoading: boolean) => {
    appState.value.isLoading = isLoading
  }

  const setError = (error: string | null) => {
    appState.value.error = error
  }

  const reset = () => {
    count.value = 0
    message.value = 'Hola desde Pinia!'
    appState.value = {
      isLoading: false,
      error: null
    }
  }

  return {
    // Estado
    count,
    message,
    appState,
    // Getters
    doubleCount,
    hasError,
    // Actions
    increment,
    decrement,
    setMessage,
    setLoading,
    setError,
    reset
  }
})
