<script setup lang="ts">
import type { Category } from '@cofinance/core'

const props = defineProps<{
  category: Category | null
  archive: (id: string) => Promise<string | null>
}>()
const emit = defineEmits<{ close: []; done: [] }>()

const working = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  () => props.category,
  () => {
    working.value = false
    errorMessage.value = null
  }
)

const close = () => {
  if (working.value) return
  emit('close')
}

const confirm = async () => {
  if (!props.category || working.value) return
  working.value = true
  errorMessage.value = null
  const err = await props.archive(props.category.id)
  working.value = false
  if (err) {
    errorMessage.value = err
    return
  }
  emit('done')
}
</script>

<template>
  <div
    v-if="category"
    class="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click.self="close"
  >
    <div class="w-full max-w-sm bg-white rounded-xl border border-outline-variant/40 shadow-xl p-5 space-y-3" role="dialog" aria-modal="true">
      <h2 class="text-body-lg font-semibold text-neutral-900">¿Eliminar la categoría {{ category.name }}?</h2>
      <p class="text-body-sm text-neutral-500">
        Los movimientos registrados se conservan. La categoría ya no podrá elegirse al registrar ni al filtrar.
      </p>
      <p v-if="errorMessage" class="text-body-sm text-red-700">{{ errorMessage }}</p>
      <div class="flex justify-end gap-2.5 pt-1">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors text-body-sm disabled:opacity-50"
          :disabled="working"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="px-4 py-1.5 rounded-lg bg-neutral-900 text-white enabled:hover:bg-neutral-800 transition-all text-body-sm font-medium disabled:opacity-40"
          :disabled="working"
          @click="confirm"
        >
          {{ working ? 'Eliminando…' : 'Eliminar' }}
        </button>
      </div>
    </div>
  </div>
</template>
