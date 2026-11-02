<script setup lang="ts">
import type { RecurringExpense } from '@cofinance/core'
const props = defineProps<{
  expense: RecurringExpense | null
  remove: (id: string) => Promise<string | null>
}>()
const emit = defineEmits<{ close: []; done: [] }>()
const working = ref(false)
const errorMessage = ref<string | null>(null)
watch(() => props.expense, () => { errorMessage.value = null })
const close = () => { if (!working.value) emit('close') }
const confirm = async () => {
  if (!props.expense || working.value) return
  working.value = true
  errorMessage.value = null
  try {
    const error = await props.remove(props.expense.id)
    if (error) errorMessage.value = error
    else emit('done')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Error al eliminar el pago recurrente'
  } finally {
    working.value = false
  }
}
const onKeydown = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
watch(() => props.expense !== null, open => {
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="expense" class="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="close">
    <div class="w-full max-w-sm bg-white rounded-xl border border-outline-variant/40 shadow-xl p-5 space-y-3" role="dialog" aria-modal="true" aria-labelledby="delete-recurring-title" :aria-busy="working">
      <h2 id="delete-recurring-title" class="text-body-lg font-semibold text-neutral-900">¿Eliminar el pago recurrente {{ expense.name }}?</h2>
      <p class="text-body-sm text-neutral-500">Los movimientos ya registrados se conservan.</p>
      <p v-if="errorMessage" class="text-body-sm text-red-700" role="alert">{{ errorMessage }}</p>
      <div class="flex justify-end gap-2.5 pt-1">
        <button type="button" :disabled="working" class="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 text-neutral-700 hover:bg-neutral-100 text-body-sm disabled:opacity-50" @click="close">Cancelar</button>
        <button type="button" :disabled="working" class="px-4 py-1.5 rounded-lg bg-neutral-900 text-white enabled:hover:bg-neutral-800 text-body-sm font-medium disabled:opacity-40" @click="confirm">{{ working ? 'Eliminando…' : 'Eliminar' }}</button>
      </div>
    </div>
  </div>
</template>
