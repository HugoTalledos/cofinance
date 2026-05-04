import type { ItemProps } from '~/components/ListItem.vue'
import type { Transaction } from '~/types'

export const LOGIN_OPTION_ID = 'lateral-option-3'
export const LATERAL_OPTIONS: ItemProps[] = [
  {
    id: 'lateral-option-1',
    title: 'Historial de transacciones',
    description: '',
    icon: {
      icon: '💰',
      color: 'bg-orange-100'
    },
    clickable: true
  },
  {
    id: 'lateral-option-2',
    title: 'Administrar categorias',
    description: '',
    icon: {
        icon: '📦',
        color: 'bg-blue-100'
    },
    clickable: true
  }
]

export const USER_UNAUTHENTICATED_OPTION = {
  id: LOGIN_OPTION_ID,
  title: 'Iniciar sesión',
  description: '',
  icon: {
      icon: '🔑',
      color: 'bg-green-100'
  },
  clickable: true
}

export const ROUTES_OPTIONS = {
  'lateral-option-1': '/transactions',
  'lateral-option-2': '/categories'
}


export const categoriesEmojis = {
  'code_comida': '🍔',
  'code_mascotas': '🐕‍🦺'
}