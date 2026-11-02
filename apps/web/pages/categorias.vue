<script setup lang="ts">
import type { Category } from '@cofinance/core'

const { user } = useAuth()
const { loading, error, categories, active, create, update, archive } = useCategoriesAdmin()

const panelMode = ref<'create' | 'edit' | null>(null)
const editing = ref<Category | null>(null)
const removing = ref<Category | null>(null)

// Sin la lista completa no se puede validar el nombre único, así que no se abre el panel
const canCreate = computed(() => !loading.value && !error.value)
const openCreate = () => {
  if (!canCreate.value) return
  editing.value = null
  panelMode.value = 'create'
}
const openEdit = (category: Category) => {
  editing.value = category
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
      <div class="flex items-center justify-between w-full gap-2">
        <h1 class="text-headline-sm font-headline-sm font-semibold text-neutral-900">Categorías</h1>
        <img
          v-if="user?.photoURL"
          :src="user.photoURL"
          alt=""
          referrerpolicy="no-referrer"
          class="w-7 h-7 rounded-full object-cover border border-slate-200"
        >
      </div>
    </template>
    <div class="flex flex-col gap-5 max-w-[1400px] mx-auto w-full">
      <div class="flex justify-end">
        <button
          type="button"
          :disabled="!canCreate"
          class="px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-all text-body-sm font-medium active:scale-95 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-900 disabled:active:scale-100"
          @click="openCreate"
        >
          <span class="material-symbols-outlined text-base">add</span>
          <span>Crear categoría</span>
        </button>
      </div>

      <p v-if="loading" class="text-body-sm text-neutral-500">Cargando…</p>
      <p v-else-if="error" class="text-body-sm text-red-700">{{ error }}</p>
      <p v-else-if="active.length === 0" class="text-body-sm text-neutral-500">Aún no hay categorías</p>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <CategoriesCategoryCard
          v-for="category in active"
          :key="category.id"
          :category="category"
          @edit="openEdit(category)"
          @remove="removing = category"
        />
      </div>
    </div>

    <CategoriesCategoryPanel
      :mode="panelMode"
      :category="editing"
      :categories="categories"
      :create="create"
      :update="update"
      @close="closePanel"
      @saved="closePanel"
    />
    <CategoriesArchiveCategoryDialog
      :category="removing"
      :archive="archive"
      @close="removing = null"
      @done="removing = null"
    />
  </AppShell>
</template>
