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
    class="flex flex-col items-center justify-center px-5 py-4 rounded-2xl border w-full"
    :class="{
      'bg-green-50 border-green-100': color === 'green',
      'bg-red-50 border-red-100': color === 'red',
      'bg-yellow-50 border-yellow-100': color === 'yellow',
    }"
  >
    <span class="text-small font-light text-gray-500 tracking-wide">{{ label }}</span>
    <span v-if="sublabel" class="text-xs text-gray-400 mt-0.5 max-w-[120px] truncate">{{ sublabel }}</span>
    <span
      class="text-2xl font-semibold mt-1"
      :class="{
        'text-green-600': color === 'green',
        'text-red-600': color === 'red',
        'text-yellow-600': color === 'yellow',
      }"
    >{{ value }}</span>
  </div>
</template>
