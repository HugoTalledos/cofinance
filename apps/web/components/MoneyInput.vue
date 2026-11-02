<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const props = defineProps<{ modelValue: number | null; id?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()
const formatted = computed({
  get: () => props.modelValue === null ? '' : new Intl.NumberFormat('es-CO').format(props.modelValue),
  set: (raw: string) => {
    const numeric = parseInt(raw.replace(/\D/g, ''), 10)
    emit('update:modelValue', isNaN(numeric) ? null : numeric)
  }
})
</script>

<template>
  <div class="relative">
    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-body-sm">$</span>
    <input
      :id="id"
      v-model="formatted"
      v-bind="$attrs"
      type="text"
      inputmode="numeric"
      placeholder="0"
      class="w-full h-9 px-2.5 pl-6 bg-white border border-outline-variant/50 rounded-lg text-body-sm text-neutral-900 focus:border-neutral-900 focus:ring-0 outline-none transition-all font-numeric-md tabular-nums"
    >
  </div>
</template>
