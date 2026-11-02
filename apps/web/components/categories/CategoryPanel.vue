<script setup lang="ts">
import {
  buildCategoryUpdate,
  toCategoryEditForm,
  validateCategoryCreate,
  validateCategoryEdit,
  type Category,
  type CategoryCreateForm,
  type CategoryEditForm
} from '@cofinance/core'

// mode null = cerrado
const props = defineProps<{
  mode: 'create' | 'edit' | null
  category: Category | null
  categories: Category[]
  create: (form: CategoryCreateForm) => Promise<string | null>
  update: (category: Category, form: CategoryEditForm) => Promise<string | null>
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const SUGGESTED_ICONS = ['🛒', '🍔', '🏠', '🚗', '💡', '🎬', '💊', '🎓', '👕', '✈️', '🐶', '💰']

const createForm = ref<CategoryCreateForm>({ name: '', icon: '', budget: null, isSaving: false })
const editForm = ref<CategoryEditForm>({ icon: '', budget: null })
const saving = ref(false)
const saveError = ref<string | null>(null)

watch(
  () => [props.mode, props.category] as const,
  () => {
    createForm.value = { name: '', icon: '', budget: null, isSaving: false }
    editForm.value = props.category ? toCategoryEditForm(props.category) : { icon: '', budget: null }
    saving.value = false
    saveError.value = null
  },
  { immediate: true }
)

const isEdit = computed(() => props.mode === 'edit')
const form = computed(() => (isEdit.value ? editForm.value : createForm.value))

const validationMessage = computed(() => {
  if (props.mode === 'create') {
    // Un formulario vacío no muestra mensaje hasta que se escriba algo
    const f = createForm.value
    if (!f.name && !f.icon) return null
    return validateCategoryCreate(f, props.categories)
  }
  if (props.mode === 'edit') return validateCategoryEdit(editForm.value)
  return null
})

const canSave = computed(() => {
  if (saving.value) return false
  if (props.mode === 'create') return validateCategoryCreate(createForm.value, props.categories) === null
  if (props.mode === 'edit' && props.category) {
    if (validateCategoryEdit(editForm.value)) return false
    return Object.keys(buildCategoryUpdate(props.category, editForm.value)).length > 0
  }
  return false
})

const close = () => {
  if (saving.value) return
  emit('close')
}

const save = async () => {
  if (!canSave.value) return
  saving.value = true
  saveError.value = null
  let err: string | null = null
  if (props.mode === 'create') err = await props.create(createForm.value)
  else if (props.mode === 'edit' && props.category) err = await props.update(props.category, editForm.value)
  saving.value = false
  if (err) {
    saveError.value = err
    return
  }
  emit('saved')
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close()
}
watch(
  () => props.mode !== null,
  open => {
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
  { immediate: true }
)
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const inputClass =
  'w-full h-9 px-2.5 bg-white border border-outline-variant/50 rounded-lg text-body-sm text-neutral-900 focus:border-neutral-900 focus:ring-0 outline-none transition-all'
const readonlyClass =
  'h-9 px-2.5 flex items-center bg-neutral-50 border border-outline-variant/30 rounded-lg text-body-sm text-neutral-500'
</script>

<template>
  <div
    v-if="mode"
    class="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex justify-end"
    @click.self="close"
  >
    <div class="w-full max-w-md bg-white h-full border-l border-outline-variant/40 shadow-xl flex flex-col justify-between">
      <div class="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-white">
        <div>
          <span class="text-label-sm text-outline uppercase tracking-wider block">Categoría</span>
          <h2 class="text-body-lg font-semibold text-neutral-900">{{ isEdit ? 'Editar Categoría' : 'Crear categoría' }}</h2>
        </div>
        <button
          type="button"
          class="p-1 rounded-lg text-outline hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          title="Cerrar ventana"
          :disabled="saving"
          @click="close"
        >
          <span class="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <form class="px-5 py-4 flex-1 overflow-y-auto space-y-4" @submit.prevent="save">
        <div>
          <label for="cat-name" class="block text-label-sm font-medium text-neutral-700 mb-1">Nombre</label>
          <p v-if="isEdit" :class="readonlyClass">{{ category?.name }}</p>
          <input v-else id="cat-name" v-model="createForm.name" type="text" :class="inputClass">
        </div>

        <div>
          <label for="cat-icon" class="block text-label-sm font-medium text-neutral-700 mb-1">Icono</label>
          <input id="cat-icon" v-model="form.icon" type="text" placeholder="🛒" :class="inputClass">
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="emoji in SUGGESTED_ICONS"
              :key="emoji"
              type="button"
              class="w-8 h-8 rounded-lg border border-outline-variant/40 hover:bg-neutral-100 text-lg"
              :class="form.icon === emoji ? 'bg-neutral-100 border-neutral-900' : ''"
              @click="form.icon = emoji"
            >
              {{ emoji }}
            </button>
          </div>
        </div>

        <div>
          <label for="cat-budget" class="block text-label-sm font-medium text-neutral-700 mb-1">Presupuesto (opcional)</label>
          <MoneyInput id="cat-budget" v-model="form.budget" />
        </div>

        <div v-if="isEdit">
          <p class="block text-label-sm font-medium text-neutral-700 mb-1">Ahorro</p>
          <p :class="readonlyClass">{{ category?.isSaving ? 'Sí' : 'No' }}</p>
        </div>
        <div v-else>
          <label class="flex items-center gap-2 text-body-sm font-medium text-neutral-700 cursor-pointer">
            <input v-model="createForm.isSaving" type="checkbox" class="rounded border-outline-variant/50">
            Es de ahorro
          </label>
          <p class="text-body-sm text-neutral-500 mt-1">Su dinero se aparta del restante y no cuenta como gasto.</p>
        </div>

        <p v-if="validationMessage" class="text-body-sm text-neutral-500">{{ validationMessage }}</p>
        <p v-if="saveError" class="text-body-sm text-red-700">{{ saveError }}</p>
      </form>

      <div class="px-5 py-3 border-t border-outline-variant/30 bg-neutral-50/70 flex items-center justify-end gap-2.5">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors text-body-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="saving"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="!canSave"
          class="px-4 py-1.5 rounded-lg bg-neutral-900 text-white enabled:hover:bg-neutral-800 transition-all text-body-sm font-medium enabled:active:scale-95 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          @click="save"
        >
          <span class="material-symbols-outlined text-base">check</span>
          <span>{{ saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
