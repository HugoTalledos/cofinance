<script setup lang="ts">

interface IconProps {
  icon: string
  color: string
}

interface AmountProps {
  value: string
  short: string
}

export interface ItemProps {
  id: string
  categoryId?: string
  type?: 'income' | 'expense'
  title: string
  description: string
  icon: IconProps
  amount?: AmountProps
  author?: string
  date?: string
  clickable?: boolean
}

const props = defineProps<ItemProps>()
const emit = defineEmits<{
  (e: 'click', id: ItemProps): void
}>()

const isIncome = computed(() => props.type === 'income')
</script>
<template>
  <li
    class="flex items-center justify-start gap-4 w-full rounded-2xl p-2"
    :class="{ 'cursor-pointer active:bg-surface-container-low transition-colors': clickable }"
    @click="clickable && emit('click', props)"
  >
    <span :class="icon.color" class="text-base rounded-2xl w-11 h-11 flex items-center justify-center">{{ icon.icon }}</span>
    <div>
      <h3 class="font-semibold text-on-surface">{{ title }}</h3>
      <p v-if="description" class="text-sm text-on-surface-variant ellipsis">{{ description }}</p>
      <p v-if="author && date" class="text-sm text-on-surface-variant ellipsis">{{ author }} - {{ date }}</p>
    </div>
    <div v-if="amount" class="flex items-center gap-2 ml-auto">
      <span
        class="text-sm font-medium rounded-md p-2 whitespace-nowrap"
        :class="type
          ? (isIncome ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600')
          : 'bg-surface-container'"
      >
        <template v-if="type">{{ isIncome ? '+' : '−' }}</template>{{ amount.short }}
      </span>
    </div>
  </li>

</template>