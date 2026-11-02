import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { getCategories, getCreditCards, getRecurringExpenses, createRecurringExpense, updateRecurringExpense, deleteRecurringExpense, toRecurringForm, type RecurringExpense, type ApiResponse } from '@cofinance/core'
import { useRecurringAdmin } from './useRecurringAdmin'

vi.mock('@cofinance/core', async importOriginal => ({
  ...await importOriginal<typeof import('@cofinance/core')>(),
  getCategories: vi.fn(), getCreditCards: vi.fn(), getRecurringExpenses: vi.fn(),
  createRecurringExpense: vi.fn(), updateRecurringExpense: vi.fn(), deleteRecurringExpense: vi.fn()
}))
const expense = (name = 'Arriendo'): RecurringExpense => ({ id: name, name, userId: 'original', fixedAmount: 10, categoryId: 'home', categoryName: 'Hogar', paymentMethod: 'debit_card', createdAt: 1 })
const ok = <T>(data: T): ApiResponse<T> => ({ data, error: null, loading: false })
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)) }
const user = ref<{ uid: string } | null>({ uid: 'u1' })

beforeEach(() => {
  vi.resetAllMocks()
  user.value = { uid: 'u1' }
  vi.stubGlobal('useAuth', () => ({ user }))
  vi.mocked(getCategories).mockResolvedValue(ok([{ id: 'home', name: 'Hogar', userId: 'u1', budget: 0, createdAt: 1 }]))
  vi.mocked(getCreditCards).mockResolvedValue(ok([]))
  vi.mocked(getRecurringExpenses).mockResolvedValue(ok([expense('Zeta'), expense('Arriendo')]))
  vi.mocked(createRecurringExpense).mockResolvedValue(ok('new'))
  vi.mocked(updateRecurringExpense).mockResolvedValue(ok(true))
  vi.mocked(deleteRecurringExpense).mockResolvedValue(ok(true))
})

describe('useRecurringAdmin', () => {
  it('carga los datos y ordena por nombre sin filtrar por usuario', async () => {
    const admin = useRecurringAdmin()
    await flush()
    expect(admin.loading.value).toBe(false)
    expect(admin.expenses.value.map(e => e.name)).toEqual(['Arriendo', 'Zeta'])
    expect(admin.categories.value[0]?.name).toBe('Hogar')
    expect(admin.error.value).toBeNull()
  })
  it('una respuesta antigua no pisa la recarga más reciente', async () => {
    let finish!: (value: ApiResponse<RecurringExpense[]>) => void
    vi.mocked(getRecurringExpenses).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const admin = useRecurringAdmin()
    await admin.reload()
    finish(ok([expense('Obsoleto')]))
    await flush()
    expect(admin.expenses.value.map(e => e.name)).toEqual(['Arriendo', 'Zeta'])
  })
  it('expone errores de carga y termina el estado de carga', async () => {
    vi.mocked(getCreditCards).mockResolvedValue({ data: null, error: 'Sin conexión', loading: false })
    const admin = useRecurringAdmin()
    await flush()
    expect(admin.error.value).toBe('Sin conexión')
    expect(admin.loading.value).toBe(false)
  })
  it('crear valida, usa el usuario actual y recarga', async () => {
    const admin = useRecurringAdmin()
    await flush()
    expect(await admin.create(toRecurringForm(null))).toBe('El nombre es obligatorio')
    expect(createRecurringExpense).not.toHaveBeenCalled()
    expect(await admin.create(toRecurringForm(expense()))).toBeNull()
    expect(createRecurringExpense).toHaveBeenCalledWith({ userId: 'u1', name: 'Arriendo', fixedAmount: 10, categoryId: 'home', categoryName: 'Hogar', paymentMethod: 'debit_card' })
    expect(getRecurringExpenses).toHaveBeenCalledTimes(2)
  })
  it('crear sin sesión no escribe datos', async () => {
    const admin = useRecurringAdmin()
    await flush()
    user.value = null
    expect(await admin.create(toRecurringForm(expense()))).toBe('Inicia sesión para crear pagos recurrentes')
    expect(createRecurringExpense).not.toHaveBeenCalled()
  })
  it('editar envía los campos a borrar al servicio sin tocar el dueño', async () => {
    const admin = useRecurringAdmin()
    await flush()
    const original = { ...expense(), reminderDay: 5, paymentMethod: 'credit_card' as const, creditCardId: 'nu', creditCardBank: 'Nu' }
    expect(await admin.update(original, { ...toRecurringForm(original), paymentMethod: 'debit_card', creditCardId: null, reminderDay: null })).toBeNull()
    expect(updateRecurringExpense).toHaveBeenCalledWith('Arriendo', { paymentMethod: 'debit_card' }, ['creditCardId', 'creditCardBank', 'reminderDay'])
  })
  it('eliminar conserva el error del servicio sin recargar', async () => {
    const admin = useRecurringAdmin()
    await flush()
    vi.mocked(deleteRecurringExpense).mockResolvedValue({ data: null, error: 'No se pudo eliminar', loading: false })
    expect(await admin.remove('r1')).toBe('No se pudo eliminar')
    expect(getRecurringExpenses).toHaveBeenCalledTimes(1)
  })
})
