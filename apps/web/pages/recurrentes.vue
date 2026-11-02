<script setup lang="ts">
import type { RecurringExpense } from '@cofinance/core'
const { loading, error, expenses, categories, creditCards, reload, create, update, remove } = useRecurringAdmin()
const panelMode = ref<'create' | 'edit' | null>(null)
const editing = ref<RecurringExpense | null>(null)
const removing = ref<RecurringExpense | null>(null)
const canCreate = computed(() => !loading.value && !error.value)
const openCreate = () => {
  if (!canCreate.value) return
  editing.value = null
  panelMode.value = 'create'
}
const openEdit = (expense: RecurringExpense) => {
  editing.value = expense
  panelMode.value = 'edit'
}
const closePanel = () => {
  panelMode.value = null
  editing.value = null
}
</script>

<template>
  <AppShell>
    <template #header>
      <h1 class="text-headline-sm font-headline-sm font-semibold text-neutral-900">Pagos recurrentes</h1>
    </template>
    <div class="flex flex-col gap-5 max-w-[1400px] mx-auto w-full">
      <div class="flex justify-end">
        <button type="button" :disabled="!canCreate" class="px-4 py-1.5 rounded-lg bg-neutral-900 text-white enabled:hover:bg-neutral-800 transition-all text-body-sm font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed" @click="openCreate">
          <span class="material-symbols-outlined text-base">add</span>
          <span>Nuevo pago recurrente</span>
        </button>
      </div>
      <RecurringTable :expenses="expenses" :categories="categories" :loading="loading" :error="error" @edit="openEdit" @remove="removing = $event" />
      <button v-if="error && !loading" type="button" class="self-start text-body-sm text-neutral-700 underline" @click="reload">Reintentar</button>
    </div>
    <RecurringPanel :mode="panelMode" :expense="editing" :categories="categories" :credit-cards="creditCards" :create="create" :update="update" @close="closePanel" @saved="closePanel" />
    <RecurringDeleteRecurringDialog :expense="removing" :remove="remove" @close="removing = null" @done="removing = null" />
  </AppShell>
</template>
