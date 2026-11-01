import { ref, type Ref } from 'vue'
import { getCreditCards } from '~/services'
import type { CreditCard } from '~/types'

// Estado compartido: las tarjetas casi nunca cambian, se cargan una vez por sesión
const creditCards: Ref<CreditCard[]> = ref([])
const loading: Ref<boolean> = ref(false)
const error: Ref<string | null> = ref(null)

/**
 * Composable de solo lectura para las tarjetas de crédito
 */
export const useCreditCards = () => {
  const fetchCreditCards = async (): Promise<void> => {
    loading.value = true
    error.value = null

    const result = await getCreditCards()
    if (result.data) {
      creditCards.value = result.data
    } else {
      error.value = result.error
    }

    loading.value = false
  }

  return {
    creditCards,
    loading,
    error,
    fetchCreditCards
  }
}
