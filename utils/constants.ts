import type { ItemProps } from '~/components/ListItem.vue'

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

export const ROUTES_OPTIONS = {
  'lateral-option-1': '/transactions',
  'lateral-option-2': '/categories'
}