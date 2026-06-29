<script setup lang="ts">
defineProps<{
  options: Array<{ label: string; value: string }>
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="flex rounded-full bg-gray-100 p-1 gap-1">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="flex-1 py-1.5 px-4 rounded-full text-sm font-medium transition-all"
      :class="modelValue === option.value
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
