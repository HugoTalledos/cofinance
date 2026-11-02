<script setup lang="ts">
import type { CreditCard } from '@cofinance/core'

defineProps<{ modelValue: string | null; cards: CreditCard[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const onChange = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  emit('update:modelValue', v === '' ? null : v)
}
</script>

<template>
  <select aria-label="Tarjeta" class="h-8 px-2.5 rounded-md bg-white border border-slate-200 text-neutral-800 font-label-md text-label-md" :value="modelValue ?? ''" @change="onChange">
    <option value="">Todas las tarjetas</option>
    <option v-for="card in cards" :key="card.id" :value="card.id">{{ card.bank }}</option>
  </select>
</template>
