<script setup lang="ts">
defineProps<{
  label: string
  value: string
  color: 'green' | 'red' | 'yellow'
  sublabel?: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center px-5 py-4 rounded-2xl border min-w-[150px]"
    :class="{
      'bg-green-50 border-green-200': color === 'green',
      'bg-red-50 border-red-200': color === 'red',
      'bg-yellow-50 border-yellow-200': color === 'yellow',
    }"
  >
    <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ label }}</span>
    <span v-if="sublabel" class="text-xs text-gray-400 mt-0.5 max-w-[120px] truncate">{{ sublabel }}</span>
    <span
      class="text-xl font-bold mt-1"
      :class="{
        'text-green-600': color === 'green',
        'text-red-500': color === 'red',
        'text-yellow-600': color === 'yellow',
      }"
    >{{ value }}</span>
  </div>
</template>
