import { ref, readonly } from 'vue'

// Definimos el tipo para la notificación para poder reutilizarlo
type ToastType = 'success' | 'error'

// Estado reactivo compartido a través de todos los componentes que usen el composable
const show = ref(false)
const message = ref('')
const type = ref<ToastType>('success')

export function useToast() {

  /**
   * Muestra la notificación con un mensaje y tipo específico.
   * @param newMessage - El mensaje a mostrar.
   * @param newType - El tipo de notificación ('success' o 'error').
   * @param duration - La duración en milisegundos antes de que se oculte automáticamente.
   */
  const showToast = (newMessage: string, newType: ToastType = 'success', duration: number = 4000) => {
    message.value = newMessage
    type.value = newType
    show.value = true

    // Se oculta automáticamente después de la duración especificada
    setTimeout(() => {
      show.value = false
    }, duration)
  }

  return {
    // Usamos 'readonly' para que el estado no pueda ser modificado directamente desde el componente
    show: readonly(show),
    message: readonly(message),
    type: readonly(type),
    showToast
  }
}
