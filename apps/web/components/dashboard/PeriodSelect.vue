<script setup lang="ts">
import { formatBillingPeriodLabel, getRecentBillingPeriodKeys } from '@cofinance/core'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const keys = getRecentBillingPeriodKeys(12)
const onChange = (e: Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value)
</script>

<template>
  <select aria-label="Periodo" class="h-8 px-2.5 rounded-md bg-white border border-slate-200 text-neutral-800 font-label-md text-label-md" :value="modelValue" @change="onChange">
    <option v-for="key in keys" :key="key" :value="key">{{ formatBillingPeriodLabel(key) }}</option>
  </select>
</template>
