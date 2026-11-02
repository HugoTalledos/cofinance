import type { Category, CategoryInput, CategoryUpdate } from '../types'

export const isCategoryActive = (category: Category): boolean => category.archivedAt == null

export const activeCategories = (categories: Category[]): Category[] => categories.filter(isCategoryActive)

export interface CategoryCreateForm {
  name: string
  icon: string
  budget: number | null
  isSaving: boolean
}

const normalizeName = (name: string): string => name.trim().toLowerCase()

export const validateCategoryCreate = (form: CategoryCreateForm, existing: Category[]): string | null => {
  const name = normalizeName(form.name)
  if (!name) return 'El nombre es obligatorio'
  if (existing.some((c) => normalizeName(c.name) === name)) return 'Ya existe una categoría con ese nombre'
  if (!form.icon.trim()) return 'Elige un icono'
  if (form.budget != null && form.budget < 0) return 'El presupuesto no puede ser negativo'
  return null
}

export const buildCategoryInput = (form: CategoryCreateForm, userId: string): CategoryInput => ({
  userId,
  name: form.name.trim(),
  icon: form.icon.trim(),
  budget: form.budget ?? 0,
  isSaving: form.isSaving,
})

export interface CategoryEditForm {
  icon: string
  budget: number | null
}

export const toCategoryEditForm = (category: Category): CategoryEditForm => ({
  icon: category.icon ?? '',
  budget: category.budget > 0 ? category.budget : null,
})

export const validateCategoryEdit = (form: CategoryEditForm): string | null =>
  form.budget != null && form.budget < 0 ? 'El presupuesto no puede ser negativo' : null

export const buildCategoryUpdate = (category: Category, form: CategoryEditForm): CategoryUpdate => {
  const update: CategoryUpdate = {}
  const icon = form.icon.trim()
  if (icon && icon !== (category.icon ?? '')) update.icon = icon
  const budget = form.budget ?? 0
  if (budget !== category.budget) update.budget = budget
  return update
}
