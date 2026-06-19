<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  label?: string
}>(), {
  size: 'md'
})

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
}
</script>

<template>
  <button
    :class="[
      'text-gray-600 bg-transparent hover:bg-gray-100 active:bg-gray-200',
      'rounded transition-colors cursor-pointer select-none w-fit h-fit',
      sizeClasses[props.size]
    ]"
    v-bind="$attrs"
  >
    {{ props.label }}
  </button>
</template>
