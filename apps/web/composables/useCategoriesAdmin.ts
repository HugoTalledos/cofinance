import { computed, ref } from 'vue'
import {
  activeCategories,
  archiveCategory,
  buildCategoryInput,
  buildCategoryUpdate,
  createCategory,
  getCategories,
  updateCategory,
  type Category,
  type CategoryCreateForm,
  type CategoryEditForm
} from '@cofinance/core'

export function useCategoriesAdmin() {
  const { user } = useAuth()
  const loading = ref(true)
  const error = ref<string | null>(null)
  const categories = ref<Category[]>([])

  const active = computed(() =>
    [...activeCategories(categories.value)].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  )

  // Evita que una respuesta antigua pise a una más reciente
  let requestId = 0

  const reload = async () => {
    const id = ++requestId
    loading.value = true
    error.value = null
    const result = await getCategories()
    if (id !== requestId) return
    categories.value = result.data ?? []
    error.value = result.error
    loading.value = false
  }

  const create = async (form: CategoryCreateForm): Promise<string | null> => {
    if (!user.value) return 'Inicia sesión para crear categorías'
    const result = await createCategory(buildCategoryInput(form, user.value.uid))
    if (result.error) return result.error
    await reload()
    return null
  }

  const update = async (category: Category, form: CategoryEditForm): Promise<string | null> => {
    const result = await updateCategory(category.id, buildCategoryUpdate(category, form))
    if (result.error) return result.error
    await reload()
    return null
  }

  const archive = async (id: string): Promise<string | null> => {
    const result = await archiveCategory(id)
    if (result.error) return result.error
    await reload()
    return null
  }

  reload()

  return { loading, error, categories, active, reload, create, update, archive }
}
