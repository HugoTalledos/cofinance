import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import AppShell from './AppShell.vue'

afterEach(() => vi.unstubAllGlobals())

it.each(['/', '/tarjetas', '/categorias', '/recurrentes'])('agrupa la administración y la abre cuando corresponde: %s', async path => {
  vi.stubGlobal('useAuth', () => ({ user: null, signOut: vi.fn() }))
  vi.stubGlobal('useRoute', () => ({ path }))
  const app = createSSRApp(AppShell)
  app.component('NuxtLink', defineComponent({
    props: ['to'],
    setup: (props, { slots }) => () => h('a', { href: props.to }, slots.default?.())
  }))
  const html = await renderToString(app)
  const group = html.match(/<details\b[\s\S]*?<\/details>/)?.[0]
  expect(group).toBeDefined()
  expect(group).toContain('Administración')
  for (const route of ['/tarjetas', '/categorias', '/recurrentes']) expect(group).toContain(`href="${route}"`)
  expect(group).not.toContain('href="/historial"')
  expect(group?.match(/<details[^>]*>/)?.[0].includes(' open')).toBe(path !== '/')
})
