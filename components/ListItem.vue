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
  title: string
  description: string
  icon: IconProps
  amount: AmountProps
  author: string
  date: string
}

defineProps<ItemProps>()
</script>
<template>
  <li class="flex items-center justify-between w-full">
    <span :class="icon.color" class="text-sm font-medium rounded-full w-12 h-12 flex items-center justify-center">{{ icon.icon }}</span>
    <div>
      <h3 class="text-lg font-bold">{{ title }}</h3>
      <p class="text-sm text-gray-500">{{ description }}</p>
      <p class="text-sm text-gray-500">{{ author }} - {{ date }}</p>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium bg-gray-100 rounded-md p-2">{{ amount.short }}</span>
    </div>
  </li>

</template>