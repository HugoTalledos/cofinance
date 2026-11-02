import { describe, expect, it, vi } from 'vitest'
import { computed, createSSRApp, onBeforeUnmount, ref, watch } from 'vue'
import { renderToString } from '@vue/server-renderer'
import RecurringPanel from './RecurringPanel.vue'
import MoneyInput from '../MoneyInput.vue'

for (const [name, value] of Object.entries({ computed, ref, watch, onBeforeUnmount })) vi.stubGlobal(name, value)
vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} })
const expense = { id: 'r1', userId: 'u1', name: 'Arriendo', fixedAmount: 1500000, categoryId: 'home', categoryName: 'Hogar', createdAt: 1 }
const categories = [{ id: 'home', userId: 'u1', name: 'Hogar', budget: 0, createdAt: 1, archivedAt: 2 }]
const render = (props = {}) => {
  const app = createSSRApp(RecurringPanel, {
    mode: 'edit', expense, categories, creditCards: [],
    create: async () => null, update: async () => null, ...props
  })
  app.component('MoneyInput', MoneyInput)
  return renderToString(app)
}

describe('RecurringPanel', () => {
  it('editar uno antiguo exige medio de pago y conserva la categoría archivada', async () => {
    const html = await render()
    expect(html).toContain('Elige un medio de pago')
    expect(html).toContain('Hogar (eliminada)')
    expect(html).toMatch(/<button[^>]*form="recurring-form"[^>]*disabled/)
    expect(html).toContain('Solo se guarda; aún no envía recordatorios.')
    expect(html).toContain('value="1.500.000"')
  })
  it('no permite guardar una edición válida sin cambios', async () => {
    const html = await render({ expense: { ...expense, paymentMethod: 'debit_card' } })
    expect(html).not.toContain('Elige un medio de pago')
    expect(html).toMatch(/<button[^>]*form="recurring-form"[^>]*disabled/)
  })
  it('crear solo ofrece categorías activas y comienza sin monto ni medio', async () => {
    const html = await render({ mode: 'create', expense: null })
    expect(html).toContain('Crear pago recurrente')
    expect(html).not.toContain('Hogar (eliminada)')
    expect(html).not.toContain('value="home"')
    expect(html).toContain('El nombre es obligatorio')
  })
  it('crédito sin tarjetas permite conservar el medio sin elegir tarjeta', async () => {
    const html = await render({ expense: { ...expense, paymentMethod: 'credit_card' } })
    expect(html).toContain('Sin tarjetas disponibles')
    expect(html).not.toContain('>Elige una tarjeta<')
  })
})
