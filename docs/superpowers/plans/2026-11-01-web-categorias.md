# Administración de categorías (web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar a `apps/web` la pantalla `/categorias` para crear categorías, editar su presupuesto e icono y archivarlas ("eliminar"), y ocultar las archivadas en todo selector de categoría de la web y el móvil.

**Architecture:** El campo opcional `archivedAt` marca una categoría archivada. Las reglas (activas, validación y armado de creación/edición) son funciones puras en `@cofinance/core` con Vitest, más un servicio `archiveCategory`. La web agrega la pantalla y su composable; los selectores (historial web y registro móvil) filtran con `activeCategories`, mientras los cálculos siguen recibiendo todas.

**Tech Stack:** Nuxt 3 (SSR off), Vue 3 `<script setup lang="ts">`, Tailwind (tokens Stitch), Firebase 12, Vitest (en `packages/core`).

**Spec:** `docs/superpowers/specs/2026-11-01-web-categorias-design.md`

**Referencia visual (solo estilo):** `docs/design/stitch-web/4-categorias.html` y `.png` (screen `7116d380a6114762bfd6a48c8ea4931b`).

## Global Constraints

- Sin administración de tarjetas.
- El nombre y la marca de ahorro no se editan después de crear; editar solo cambia **icono** y **presupuesto**.
- Eliminar = archivar (`archivedAt`); nunca borrado real (`deleteCategory` no se usa) ni cambios a movimientos.
- Categoría sin `archivedAt` = activa.
- El nombre no puede repetir el de **ninguna** categoría (activa o archivada), recortado y sin distinguir mayúsculas. Mensaje: `Ya existe una categoría con ese nombre`.
- Los cálculos (`computePeriodTotals`, comparativa, ranking, dashboard) reciben **todas** las categorías; solo los selectores usan las activas. `getCategories` no filtra.
- Presupuesto en COP, entero; vacío = sin presupuesto, se guarda `0`.
- Icono obligatorio solo al crear; al editar, un icono vacío no se escribe (categorías viejas sin icono pueden cambiar solo el presupuesto).
- Del diseño Stitch se omite todo lo de gasto vs presupuesto, resúmenes, "Tabla de gestión", "Ajustar Presupuestos", selector de mes, "Filtro Global", "Descargar Reporte", campana.
- Confirmación de eliminar dentro de la página, nunca `window.confirm`.
- El móvil solo cambia en que su formulario de registro ofrece categorías activas.
- Rama de trabajo: `feat/web-categorias` desde `main`.

## Review Focus

1. **Nombre igual a una categoría archivada** ("comida " con "Comida" archivada) → bloqueado. Test `validateCategoryCreate rechaza nombres de categorías archivadas` (Task 1).
2. **Categoría de ahorro archivada** con movimientos de periodos pasados → sigue contando como Apartado. Test `computePeriodTotals cuenta como ahorro una categoría de ahorro archivada` (Task 1).
3. **Editar un movimiento cuya categoría está archivada** → se ve seleccionada como "{nombre} (eliminada)" y guardar sin tocarla no cambia nada. Verificación manual (Task 2).
4. **Categoría vieja sin icono, solo cambia el presupuesto** → se guarda y no se escribe `icon`. Test `buildCategoryUpdate no escribe un icono vacío` (Task 1).
5. **Borrar el presupuesto al editar** → se guarda `0` y la tarjeta dice "Sin presupuesto". Test `buildCategoryUpdate guarda 0 al vaciar el presupuesto` (Task 1).

---

### Task 1: Reglas de categorías en `@cofinance/core` (TDD)

**Files:**
- Modify: `packages/core/src/types/category.ts` (campo `archivedAt?: number` con comentario: ausente = activa)
- Create: `packages/core/src/editing/category-form.ts` (+ export en `packages/core/src/editing/index.ts`)
- Test: `packages/core/src/editing/category-form.test.ts`; agregar un caso a `packages/core/src/analytics/period.test.ts`
- Modify: `packages/core/src/services/categories.service.ts` (+ `archiveCategory`), `packages/core/src/services/index.ts` (exportarlo)

**Interfaces:**
- Produces (exportado desde `@cofinance/core`):
  - `isCategoryActive(category: Category): boolean` — `category.archivedAt == null`.
  - `activeCategories(categories: Category[]): Category[]` — filtra activas, conserva el orden.
  - `interface CategoryCreateForm { name: string; icon: string; budget: number | null; isSaving: boolean }`
  - `validateCategoryCreate(form: CategoryCreateForm, existing: Category[]): string | null` — en este orden: `'El nombre es obligatorio'`, `'Ya existe una categoría con ese nombre'` (contra todas, incluidas archivadas), `'Elige un icono'`, `'El presupuesto no puede ser negativo'`.
  - `buildCategoryInput(form: CategoryCreateForm, userId: string): CategoryInput` — `{ userId, name: trim, icon: trim, budget: budget ?? 0, isSaving }`.
  - `interface CategoryEditForm { icon: string; budget: number | null }`
  - `toCategoryEditForm(category: Category): CategoryEditForm` — `icon: category.icon ?? ''`, `budget: category.budget > 0 ? category.budget : null`.
  - `validateCategoryEdit(form: CategoryEditForm): string | null` — solo `'El presupuesto no puede ser negativo'`.
  - `buildCategoryUpdate(category: Category, form: CategoryEditForm): CategoryUpdate` — solo lo que cambió: `icon` (recortado) si no está vacío y difiere; `budget` (`null` → `0`) si difiere.
  - `archiveCategory(id: string): Promise<ApiResponse<boolean>>` — `updateDoc` con `archivedAt: getCurrentTimestamp()`.

- [ ] **Step 1: Escribir los tests**

```ts
// category-form.test.ts — fixtures: food 'Comida' (activa), old 'Viejo' (archivedAt: 1)
it('activeCategories excluye archivadas y conserva el orden')
it('validateCategoryCreate exige nombre')                       // '  ' → 'El nombre es obligatorio'
it('validateCategoryCreate rechaza nombres repetidos')          // ' comida ' → 'Ya existe una categoría con ese nombre'
it('validateCategoryCreate rechaza nombres de categorías archivadas') // 'viejo' → mismo mensaje
it('validateCategoryCreate exige icono')                         // icon '' → 'Elige un icono'
it('validateCategoryCreate rechaza presupuesto negativo')       // -1 → 'El presupuesto no puede ser negativo'
expect(buildCategoryInput({ name: ' Mascotas ', icon: ' 🐶 ', budget: null, isSaving: true }, 'u1'))
  .toEqual({ userId: 'u1', name: 'Mascotas', icon: '🐶', budget: 0, isSaving: true })
it('buildCategoryUpdate sin cambios devuelve {}')
it('buildCategoryUpdate no escribe un icono vacío')             // category sin icon, form { icon: '', budget: 500 } → { budget: 500 }
it('buildCategoryUpdate guarda 0 al vaciar el presupuesto')     // budget 1000 → form budget null → { budget: 0 }
// period.test.ts
it('computePeriodTotals cuenta como ahorro una categoría de ahorro archivada') // isSaving + archivedAt → saved, no spent
```

- [ ] **Step 2: Ver fallar** — `npm test -w packages/core` → FAIL (módulo inexistente; el caso de period puede pasar ya: es una prueba de no-regresión, anótalo).

- [ ] **Step 3: Implementar** según Interfaces.

- [ ] **Step 4: Verificar** — `npm test -w packages/core && npm run typecheck -w packages/core && (cd apps/mobile && npx vue-tsc --noEmit) && (cd apps/web && npx vue-tsc --noEmit)` → todo verde.

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): categorías archivadas y reglas para crear y editar categorías"
```

---

### Task 2: Ocultar categorías archivadas en los selectores

**Files:**
- Modify: `apps/mobile/pages/registrar.vue` (pasar `activeCategories(sortedCategories)` al formulario)
- Modify: `apps/web/components/history/HistoryFilters.vue` (opciones = `activeCategories(categories)`)
- Modify: `apps/web/components/history/EditTransactionPanel.vue` (opciones de categoría)

**Interfaces:**
- Consumes: `activeCategories`, `isCategoryActive` (Task 1).
- Panel "Editar Transacción": opciones = categorías activas; si la categoría actual del movimiento está archivada, se agrega como opción seleccionada con texto `{name} (eliminada)`. Las demás archivadas nunca aparecen. `buildTransactionEdit` sigue recibiendo **todas** las categorías.
- Dashboard, `useHistoryData`, `RecurringExpenseList` del móvil y los cálculos **no** cambian (siguen con todas).

- [ ] **Step 1: Implementar** según Interfaces.
- [ ] **Step 2: Verificar** — `(cd apps/web && npx vue-tsc --noEmit && npx nuxi generate) && (cd apps/mobile && npx vue-tsc --noEmit && npx nuxi generate)` → sin errores.
- [ ] **Step 3: Verificación manual (usuario, con sesión)** — tras archivar una categoría en Task 3: no aparece en el registro móvil ni en los filtros/panel del historial; un movimiento con esa categoría la muestra como "(eliminada)" al editarlo.
- [ ] **Step 4: Commit**

```bash
git add apps/web apps/mobile
git commit -m "feat: ocultar categorías archivadas en los selectores"
```

---

### Task 3: Pantalla `/categorias`

**Files:**
- Create: `apps/web/composables/useCategoriesAdmin.ts`
- Create: `apps/web/pages/categorias.vue`, `apps/web/components/categories/CategoryCard.vue`, `CategoryPanel.vue`, `ArchiveCategoryDialog.vue`
- Modify: `apps/web/components/AppShell.vue` (ítem "Categorías", `/categorias`, icono `pie_chart`, después de "Historial de Transacciones")
- Commit también: `docs/design/stitch-web/4-categorias.html` y `4-categorias.png` (ya copiados por el controlador)

**Interfaces:**
- Consumes: Task 1 (`activeCategories`, `validateCategoryCreate`, `buildCategoryInput`, `toCategoryEditForm`, `validateCategoryEdit`, `buildCategoryUpdate`, `archiveCategory`), servicios `getCategories`, `createCategory`, `updateCategory`; `useAuth().user` (uid para `userId`); input de monto COP con separador de miles como en `EditTransactionPanel.vue`.
- Produces: `useCategoriesAdmin(): { loading: Ref<boolean>; error: Ref<string | null>; categories: Ref<Category[]> /* todas */; active: ComputedRef<Category[]> /* activas, por nombre */; reload(): Promise<void>; create(form: CategoryCreateForm): Promise<string | null>; update(category: Category, form: CategoryEditForm): Promise<string | null>; archive(id: string): Promise<string | null> }` — cada acción devuelve `null` si salió bien o el mensaje de error, y recarga al terminar bien.
- Pantalla (estilo de `4-categorias.html`):
  - Título "Categorías" + botón "+ Crear categoría".
  - Grilla de `CategoryCard`: icono, nombre, etiqueta "Ahorro" si `isSaving`, "Presupuesto: {formatCOP}" o "Sin presupuesto"; botones lápiz (`title="Editar"`) y basura (`title="Eliminar"`).
  - Estados: "Cargando…", "Aún no hay categorías", error.
  - `CategoryPanel` (panel lateral como "Editar Transacción"; modo `create` o `edit`):
    - Crear: Nombre, Icono (texto con una fila de emojis sugeridos para tocar), Presupuesto (opcional), "Es de ahorro" (casilla) con el texto "Su dinero se aparta del restante y no cuenta como gasto." Botón "Crear categoría".
    - Editar: Nombre y "Ahorro" visibles como texto no editable; Icono y Presupuesto editables; botón "Guardar cambios", deshabilitado si `buildCategoryUpdate` devuelve `{}` o hay error de validación.
    - Mensaje de validación bajo el formulario; error del servicio visible y panel abierto; no se cierra mientras guarda (mismo patrón que `EditTransactionPanel.vue`).
  - `ArchiveCategoryDialog`: "¿Eliminar la categoría {name}?" y "Los movimientos registrados se conservan. La categoría ya no podrá elegirse al registrar ni al filtrar." Botones "Cancelar" y "Eliminar"; al confirmar `archive(id)`; error visible en el diálogo.

- [ ] **Step 1: Implementar** según Interfaces.
- [ ] **Step 2: Verificar** — `cd apps/web && npx vue-tsc --noEmit && npx nuxi generate` → sin errores; `npx nuxi dev` arranca y `/categorias` responde 200.
- [ ] **Step 3: Verificación manual (usuario, con sesión)** — crear una categoría normal y una de ahorro; intentar repetir un nombre (también de una eliminada); editar icono y presupuesto; vaciar presupuesto → "Sin presupuesto"; eliminar con confirmación y ver que desaparece; la nueva categoría aparece en el registro móvil y en los filtros del historial.
- [ ] **Step 4: Commit**

```bash
git add apps/web docs/design/stitch-web/4-categorias.html docs/design/stitch-web/4-categorias.png
git commit -m "feat(web): pantalla de administración de categorías"
```
