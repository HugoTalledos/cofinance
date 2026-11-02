import { describe, expect, it, vi } from 'vitest'
import { computed, createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import RecurringTable from './RecurringTable.vue'
import { formatCOP } from '../../utils/format'

vi.stubGlobal('computed', computed)
const expense = { id: 'r1', userId: 'u1', name: 'Arriendo', description: 'Casa', fixedAmount: 1500000, categoryId: 'home', categoryName: 'Antiguo', createdAt: 1 }
const categories = [{ id: 'home', userId: 'u1', name: 'Hogar', icon: '🏠', budget: 0, createdAt: 1 }]
const render = (props = {}) => {
  const app = createSSRApp(RecurringTable, { expenses: [expense], categories, loading: false, error: null, ...props })
  Object.assign(app.config.globalProperties, { formatCOP })
  return renderToString(app)
}

describe('RecurringTable', () => {
  it('muestra categoría actual y destaca un recurrente sin medio de pago', async () => {
    const html = await render()
    expect(html).toContain('Hogar')
    expect(html).not.toContain('Antiguo')
    expect(html).toContain('Sin medio de pago')
    expect(html).toContain('text-amber-800')
    expect(html).toContain('Casa')
    expect(html).toContain('1.500.000')
    expect(html).toContain('title="Editar"')
    expect(html).toContain('title="Eliminar"')
  })
  it('muestra variable, crédito con banco, recordatorio y categoría de respaldo', async () => {
    const html = await render({ expenses: [{ ...expense, fixedAmount: null, paymentMethod: 'credit_card', creditCardBank: 'Nu', reminderDay: 31 }], categories: [] })
    expect(html).toContain('Variable')
    expect(html).toContain('Crédito · Nu')
    expect(html).toContain('Día 31')
    expect(html).toContain('Antiguo')
  })
  it('prioriza carga y error sobre los datos, y muestra el estado vacío', async () => {
    expect(await render({ loading: true })).toContain('Cargando…')
    expect(await render({ error: 'Sin conexión' })).toContain('Sin conexión')
    expect(await render({ expenses: [] })).toContain('Aún no hay pagos recurrentes')
  })
})
