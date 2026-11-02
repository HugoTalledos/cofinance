<script setup lang="ts">
import type { Category } from '@cofinance/core'

defineProps<{ category: Category }>()
defineEmits<{ edit: []; remove: [] }>()
</script>

<template>
  <div class="bg-white border border-outline-variant/40 rounded-xl p-4 flex items-start justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <div class="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-xl shrink-0">
        {{ category.icon }}
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-body-md font-semibold text-neutral-900 truncate">{{ category.name }}</p>
          <span
            v-if="category.isSaving"
            class="text-label-sm px-1.5 py-0.5 rounded bg-neutral-100 border border-outline-variant/30 text-neutral-700"
          >Ahorro</span>
        </div>
        <p class="text-body-sm text-neutral-500 tabular-nums">
          {{ category.budget > 0 ? `Presupuesto: ${formatCOP(category.budget)}` : 'Sin presupuesto' }}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-1 shrink-0">
      <button
        type="button"
        title="Editar"
        class="p-1 rounded-lg text-outline hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        @click="$emit('edit')"
      >
        <span class="material-symbols-outlined text-xl">edit</span>
      </button>
      <button
        type="button"
        title="Eliminar"
        class="p-1 rounded-lg text-outline hover:text-red-700 hover:bg-neutral-100 transition-colors"
        @click="$emit('remove')"
      >
        <span class="material-symbols-outlined text-xl">delete</span>
      </button>
    </div>
  </div>
</template>
