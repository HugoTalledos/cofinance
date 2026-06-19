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
</script>
<template>
  <li
    class="flex items-center justify-start gap-4 w-full"
    :class="{ 'cursor-pointer': clickable }"
    @click="clickable && emit('click', props)"
  >
    <span :class="icon.color" class="text-sm font-medium rounded-full w-12 h-12 flex items-center justify-center">{{ icon.icon }}</span>
    <div>
      <h3 class="text-lg font-bold">{{ title }}</h3>
      <p v-if="description" class="text-sm text-gray-500 ellipsis">{{ description }}</p>
      <p v-if="author && date" class="text-sm text-gray-500 ellipsis">{{ author }} - {{ date }}</p>
    </div>
    <div v-if="amount" class="flex items-center gap-2 ml-auto">
      <span class="text-sm font-medium bg-gray-100 rounded-md p-2">{{ amount.short }}</span>
    </div>
  </li>

</template>