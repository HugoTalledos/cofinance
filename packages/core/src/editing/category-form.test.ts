import { describe, expect, it } from 'vitest'
import type { Category } from '../types'
import {
  activeCategories,
  buildCategoryInput,
  buildCategoryUpdate,
  toCategoryEditForm,
  validateCategoryCreate,
  validateCategoryEdit,
  type CategoryCreateForm,
} from './category-form'

const cat = (o: Partial<Category> & { id: string; name: string }): Category => ({
  userId: 'u',
  budget: 0,
  createdAt: 0,
  ...o,
})

const food = cat({ id: 'food', name: 'Comida', icon: '🍔', budget: 1000 })
const old = cat({ id: 'old', name: 'Viejo', icon: '📦', archivedAt: 1 })
const existing = [food, old]
const form = (o: Partial<CategoryCreateForm> = {}): CategoryCreateForm => ({
  name: 'Mascotas',
  icon: '🐶',
  budget: null,
  isSaving: false,
  ...o,
})

describe('activeCategories', () => {
  it('activeCategories excluye archivadas y conserva el orden', () => {
    const b = cat({ id: 'b', name: 'B' })
    expect(activeCategories([b, old, food]).map((c) => c.id)).toEqual(['b', 'food'])
  })
})

describe('validateCategoryCreate', () => {
  it('validateCategoryCreate exige nombre', () => {
    expect(validateCategoryCreate(form({ name: '  ' }), existing)).toBe('El nombre es obligatorio')
  })
  it('validateCategoryCreate rechaza nombres repetidos', () => {
    expect(validateCategoryCreate(form({ name: ' comida ' }), existing)).toBe('Ya existe una categoría con ese nombre')
  })
  it('validateCategoryCreate rechaza nombres de categorías archivadas', () => {
    expect(validateCategoryCreate(form({ name: 'viejo' }), existing)).toBe('Ya existe una categoría con ese nombre')
  })
  it('validateCategoryCreate exige icono', () => {
    expect(validateCategoryCreate(form({ icon: '' }), existing)).toBe('Elige un icono')
  })
  it('validateCategoryCreate rechaza presupuesto negativo', () => {
    expect(validateCategoryCreate(form({ budget: -1 }), existing)).toBe('El presupuesto no puede ser negativo')
  })
  it('acepta un formulario válido', () => {
    expect(validateCategoryCreate(form({ budget: 500 }), existing)).toBeNull()
  })
})

describe('buildCategoryInput', () => {
  it('recorta y usa 0 sin presupuesto', () => {
    expect(buildCategoryInput({ name: ' Mascotas ', icon: ' 🐶 ', budget: null, isSaving: true }, 'u1')).toEqual({
      userId: 'u1',
      name: 'Mascotas',
      icon: '🐶',
      budget: 0,
      isSaving: true,
    })
  })
})

describe('edición', () => {
  it('toCategoryEditForm convierte 0 en null', () => {
    expect(toCategoryEditForm(food)).toEqual({ icon: '🍔', budget: 1000 })
    expect(toCategoryEditForm(cat({ id: 'x', name: 'X' }))).toEqual({ icon: '', budget: null })
  })
  it('validateCategoryEdit rechaza presupuesto negativo', () => {
    expect(validateCategoryEdit({ icon: '', budget: -5 })).toBe('El presupuesto no puede ser negativo')
    expect(validateCategoryEdit({ icon: '', budget: null })).toBeNull()
  })
  it('buildCategoryUpdate sin cambios devuelve {}', () => {
    expect(buildCategoryUpdate(food, toCategoryEditForm(food))).toEqual({})
  })
  it('buildCategoryUpdate no escribe un icono vacío', () => {
    const noIcon = cat({ id: 'x', name: 'X' })
    expect(buildCategoryUpdate(noIcon, { icon: '', budget: 500 })).toEqual({ budget: 500 })
  })
  it('buildCategoryUpdate guarda 0 al vaciar el presupuesto', () => {
    expect(buildCategoryUpdate(food, { icon: '🍔', budget: null })).toEqual({ budget: 0 })
  })
  it('buildCategoryUpdate recorta y detecta cambio de icono', () => {
    expect(buildCategoryUpdate(food, { icon: ' 🍕 ', budget: 1000 })).toEqual({ icon: '🍕' })
  })
})
