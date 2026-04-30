import { ref, reactive, readonly } from 'vue'

// Define la estructura de las opciones del diálogo
interface DialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

// Estado reactivo para ser compartido
const isVisible = ref(false)
const options = reactive<DialogOptions>({
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar'
})

// Promise para manejar la respuesta del usuario
let promiseResolver: ((value: boolean) => void) | null = null

export function useConfirmMessage() {
  /**
   * Muestra el diálogo de confirmación y retorna una promesa.
   * La promesa se resuelve a `true` si el usuario confirma, y `false` si cancela.
   * @param newOptions - Objeto con el título y mensaje a mostrar.
   */
  const showDialog = (newOptions: DialogOptions): Promise<boolean> => {
    options.title = newOptions.title
    options.message = newOptions.message
    options.confirmText = newOptions.confirmText || 'Sí, confirmar'
    options.cancelText = newOptions.cancelText || 'Cancelar'
    isVisible.value = true

    return new Promise((resolve) => {
      promiseResolver = resolve
    })
  }

  // Función para manejar la confirmación desde el componente
  const onConfirm = () => {
    if (promiseResolver) {
      promiseResolver(true)
    }
    isVisible.value = false
  }

  // Función para manejar la cancelación desde el componente
  const onCancel = () => {
    if (promiseResolver) {
      promiseResolver(false)
    }
    isVisible.value = false
  }

  return {
    // Estado (solo lectura para prevenir modificaciones accidentales)
    isDialogVisible: readonly(isVisible),
    dialogOptions: readonly(options),

    // Métodos para el componente padre
    showDialog,

    // Métodos para el componente del diálogo
    onConfirm,
    onCancel
  }
}
