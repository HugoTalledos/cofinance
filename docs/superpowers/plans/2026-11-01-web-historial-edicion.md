# Historial y edición de movimientos (web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar a `apps/web` la pantalla `/historial` (filtros, resumen y tabla de movimientos del periodo) con un panel lateral para editar descripción, monto, categoría, medio de pago y tarjeta de un movimiento.

**Architecture:** La lógica pura (filtros del historial, resumen y cálculo de qué cambia al editar) vive en `@cofinance/core` con tests de Vitest; el servicio `updateTransaction` se extiende para poder borrar los campos de tarjeta. La web agrega navegación entre Dashboard e Historial, un composable de datos del historial, un composable de paginación compartido con el dashboard y el panel de edición, que guarda con el servicio de core y recarga el periodo.

**Tech Stack:** Nuxt 3 (SSR off), Vue 3 `<script setup lang="ts">`, Tailwind (tokens Stitch "Minimalist"), Firebase 12, Vitest (en `packages/core`).

**Spec:** `docs/superpowers/specs/2026-11-01-web-historial-edicion-design.md`

**Referencia visual:** Stitch screen `3ae01214132e4f8587ee8b2a95774130` ("2. Historial de Transacciones (Minimalist)"). Task 2 la guarda en `docs/design/stitch-web/2-historial.html` y `.png`.

## Global Constraints

- **Solo editar:** no hay eliminar (ni icono de basura ni botón "Eliminar Movimiento"). La fecha y el tipo no se editan.
- La edición vive solo en `/historial`; el dashboard sigue siendo de solo lectura. El móvil no cambia.
- Se omite del diseño: "Nueva Transacción", "Registrar Movimiento", "Descargar CSV", "Descargar Reporte", "Filtro Global", campana, icono de tarjetas de la cabecera, columna "Estado", hora y código bajo el concepto, "Al día y revisado", "Tasa de ahorro", "Notas personales", selector "Tipo" del panel, filtro de fechas "Últimos 30 días / Mes actual / T3 / Rango personalizado". Moneda: COP (`formatCOP`), nunca USD.
- Periodos de facturación con los helpers de core; consulta del periodo igual que mobile: `getTransactions({ dateFrom: startDate, dateTo: endDate })` con `getBillingPeriodRangeFromKey(periodKey)`.
- Resumen del historial sobre los movimientos filtrados: Movimientos (cantidad), Ingresos, Egresos (todos los egresos, incluidos los de ahorro), Flujo neto = Ingresos − Egresos. Sin comparación con el periodo anterior.
- Con filtro de categoría o de medio de pago/tarjeta activo, los ingresos quedan fuera. El filtro de una tarjeta no incluye créditos sin `creditCardId`.
- Al pasar a Débito se **eliminan** `creditCardId` y `creditCardBank` del documento (no se escriben como vacío ni `undefined`).
- Cambiar categoría escribe `categoryId` y `categoryName`; cambiar tarjeta escribe `creditCardId` y `creditCardBank`.
- Movimiento sin `paymentMethod`: si el usuario no elige uno, no se escribe `paymentMethod`.
- Firestore solo vía servicios de `@cofinance/core`.
- Rama de trabajo: `feat/web-historial` desde `main`.

## Review Focus

1. **Crédito → Débito** borra la tarjeta del documento. Test `buildTransactionEdit: pasar a débito elimina la tarjeta` (Task 1).
2. **Movimiento viejo sin medio de pago** editado solo en la descripción → no aparece `paymentMethod` en los cambios. Test `buildTransactionEdit: sin medio de pago y sin tocarlo no escribe paymentMethod` (Task 1).
3. **Ingreso** → aunque el formulario traiga categoría o medio de pago, solo cambian descripción y monto. Test `buildTransactionEdit: en ingresos ignora categoría y medio de pago` (Task 1).
4. **Fallo al guardar** → el panel sigue abierto con el mensaje y los valores escritos. Verificación manual en Task 3 (forzar error, p. ej. sin red).
5. **Cambiar un filtro estando en la página 3** → vuelve a la página 1 con contador correcto. Cubierto por `usePagination` (Task 2) y verificación manual.

---

### Task 1: Lógica de historial y edición en `@cofinance/core` (TDD)

**Files:**
- Create: `packages/core/src/analytics/history.ts` (+ export en `packages/core/src/analytics/index.ts`)
- Create: `packages/core/src/editing/transaction-edit.ts`, `packages/core/src/editing/index.ts` (+ `export * from './editing'` en `packages/core/src/index.ts`)
- Test: `packages/core/src/analytics/history.test.ts`, `packages/core/src/editing/transaction-edit.test.ts`
- Modify: `packages/core/src/types/transaction.ts` (tipo `RemovableTransactionField`), `packages/core/src/services/transactions.service.ts` (`updateTransaction`)

**Interfaces:**
- Produces (todo exportado desde `@cofinance/core`):
  - `type RemovableTransactionField = 'creditCardId' | 'creditCardBank'` (en `types/transaction.ts`).
  - `updateTransaction(id: string, data: TransactionUpdate, removeFields: RemovableTransactionField[] = []): Promise<ApiResponse<boolean>>` — cada campo de `removeFields` se envía como `deleteField()` en el mismo `updateDoc`; el `after` usado para `adjustSummaryForChange` no contiene esos campos. Llamadas existentes con 2 argumentos siguen igual.
  - `type PaymentFilter = { kind: 'all' } | { kind: 'debit' } | { kind: 'card'; creditCardId: string }`
  - `interface HistoryFilters { search: string; categoryId: string | null; payment: PaymentFilter; type: 'all' | 'expense' | 'income' }`
  - `filterHistory(transactions: Transaction[], filters: HistoryFilters): Transaction[]` — conserva el orden de entrada. `search`: recortado, sin distinguir mayúsculas, sobre `description`; vacío = sin filtro. `categoryId` ≠ null: solo egresos con ese `categoryId`. `payment` debit: solo egresos con `paymentMethod === 'debit_card'`; card: solo egresos con ese `creditCardId`. `type` usa `isExpense`.
  - `interface HistorySummary { count: number; income: number; expenses: number; net: number }`
  - `summarizeHistory(transactions: Transaction[]): HistorySummary` — `expenses` incluye todos los egresos (también ahorro).
  - `interface TransactionEditForm { description: string; amount: number | null; categoryId: string; paymentMethod: PaymentMethod | null; creditCardId: string | null }`
  - `interface TransactionEdit { changes: TransactionUpdate; removeFields: RemovableTransactionField[] }`
  - `toEditForm(tx: Transaction): TransactionEditForm` — `paymentMethod: tx.paymentMethod ?? null`, `creditCardId: tx.creditCardId ?? null`.
  - `validateEditForm(tx: Transaction, form: TransactionEditForm, creditCards: CreditCard[]): string | null` — mensajes exactos: `'La descripción es obligatoria'` (vacía tras recortar), `'El monto debe ser mayor a 0'` (null o ≤ 0), y solo en egresos: `'Elige una categoría'` (categoryId vacío), `'Elige una tarjeta'` (crédito, hay tarjetas y `creditCardId` null).
  - `buildTransactionEdit(tx: Transaction, form: TransactionEditForm, categories: Category[], creditCards: CreditCard[]): TransactionEdit` — solo lo que cambió: `description` (recortada), `amount`; en egresos además `categoryId`+`categoryName`, `paymentMethod` (solo si form no es null y difiere), con crédito `creditCardId`+`creditCardBank` si difiere la tarjeta, con débito `removeFields: ['creditCardId','creditCardBank']` si el movimiento tenía alguno de los dos. En ingresos, categoría y medio de pago se ignoran.
  - `hasEditChanges(edit: TransactionEdit): boolean` — true si `changes` tiene alguna clave o `removeFields` no está vacío.

- [ ] **Step 1: Crear rama** — `git checkout -b feat/web-historial`

- [ ] **Step 2: Escribir los tests** (fábricas `tx()`, `cat()`, `card()` en cada archivo de test). Casos y aserciones:

```ts
// history.test.ts — datos: inc 'Sueldo' 1000; exp 'Mercado' food debit 100; exp 'Netflix' fun credit nu 50; exp 'Ahorro' savings credit (sin creditCardId) 30
it('busca por descripción sin distinguir mayúsculas')       // search ' mer ' → ['Mercado']
it('filtro de categoría excluye ingresos')                  // categoryId 'food' → ['Mercado']
it('filtro débito solo egresos con débito')                  // → ['Mercado']
it('filtro tarjeta excluye créditos sin tarjeta')            // card 'nu' → ['Netflix']
it('filtro de tipo')                                         // income → ['Sueldo']; expense → 3 egresos
it('combina filtros')                                        // type expense + search 'net' → ['Netflix']
expect(summarizeHistory(all)).toEqual({ count: 4, income: 1000, expenses: 180, net: 820 })

// transaction-edit.test.ts
it('sin cambios no produce cambios')                         // hasEditChanges(buildTransactionEdit(tx, toEditForm(tx), ...)) === false
it('recorta la descripción y detecta cambio de monto')       // changes = { description: 'Pan', amount: 200 }
it('cambiar categoría escribe categoryId y categoryName')
it('pasar a débito elimina la tarjeta')                      // tx credit nu → changes { paymentMethod: 'debit_card' }, removeFields ['creditCardId','creditCardBank']
it('cambiar de tarjeta escribe id y banco')                  // nu → rappi: { creditCardId: 'rappi', creditCardBank: 'Rappi' }, removeFields []
it('sin medio de pago y sin tocarlo no escribe paymentMethod')
it('en ingresos ignora categoría y medio de pago')           // form con categoryId/paymentMethod distintos → solo description/amount
it('validateEditForm devuelve los mensajes exactos')         // los 4 mensajes + null cuando es válido; 'Elige una tarjeta' solo si hay tarjetas
```

- [ ] **Step 3: Ver fallar** — `npm test -w packages/core` → FAIL (módulos inexistentes).

- [ ] **Step 4: Implementar** `history.ts`, `transaction-edit.ts`, el tipo y la extensión de `updateTransaction` según Interfaces.

- [ ] **Step 5: Verificar** — `npm test -w packages/core && npm run typecheck -w packages/core && (cd apps/mobile && npx vue-tsc --noEmit) && (cd apps/web && npx vue-tsc --noEmit)` → todo verde (16 tests previos + nuevos).

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): filtros del historial, edición de movimientos y borrado de campos de tarjeta"
```

---

### Task 2: Pantalla `/historial` (solo lectura)

**Files:**
- Create: `docs/design/stitch-web/2-historial.html` y `2-historial.png` (descargar con el MCP de Stitch: `get_screen` del screen de referencia, luego `download_file` de `htmlCode.name` y `screenshot.name`)
- Create: `apps/web/composables/usePagination.ts`, `apps/web/composables/useHistoryData.ts`
- Create: `apps/web/pages/historial.vue`, `apps/web/components/history/HistoryFilters.vue`, `HistorySummary.vue`, `HistoryTable.vue`
- Modify: `apps/web/components/AppShell.vue` (navegación), `apps/web/utils/format.ts` (helpers de fila), `apps/web/components/dashboard/RecentMovements.vue` (usar los helpers y `usePagination`)

**Interfaces:**
- Consumes: Task 1 (`filterHistory`, `summarizeHistory`, `HistoryFilters`, `PaymentFilter`, `HistorySummary`).
- Produces:
  - `formatTxDate(tx: Transaction): string` (día, mes corto y año en `es-CO`, desde `date.substring(0,10)`) y `paymentMethodLabel(tx: Transaction): string` ("Débito", "Crédito · {creditCardBank}", "Crédito", "") en `utils/format.ts`; `RecentMovements.vue` deja de definirlos localmente.
  - `usePagination<T>(items: Ref<T[]>, pageSize: number, resetOn: WatchSource[]): { page: Ref<number>; pageItems: ComputedRef<T[]>; from: ComputedRef<number>; to: ComputedRef<number>; total: ComputedRef<number>; hasPrev: ComputedRef<boolean>; hasNext: ComputedRef<boolean>; prev(): void; next(): void }` — vuelve a página 1 cuando cambia cualquier fuente de `resetOn`. `RecentMovements.vue` pasa a usarlo con el mismo comportamiento.
  - `useHistoryData(periodKey: Ref<string>): { loading: Ref<boolean>; error: Ref<string | null>; transactions: Ref<Transaction[]>; categories: Ref<Category[]>; creditCards: Ref<CreditCard[]>; reload(): Promise<void> }` — categorías y tarjetas una vez; transacciones del periodo (orden fecha desc) al cambiar `periodKey` o al llamar `reload`; respuestas obsoletas descartadas.
  - `AppShell`: ítems con `NuxtLink` — "Dashboard General" (`/`, icono `dashboard`) e "Historial de Transacciones" (`/historial`, icono `receipt_long`); el activo según la ruta actual (estilo actual del ítem activo).
  - `HistoryTable` recibe la prop `editable: boolean`; con `true` muestra la columna "Acciones" con un botón lápiz (icono `edit`, `title="Editar"`) por fila que emite `edit(tx: Transaction)`. En esta tarea la página pasa `false` (sin columna); Task 3 la activa.
- Contenido de la página (estructura/clases de `2-historial.html`, con las omisiones de Global Constraints):
  - Cabecera (slot `header`): título "Historial de Transacciones", `DashboardPeriodSelect` y avatar.
  - `HistorySummary`: 4 tarjetas "Movimientos", "Ingresos", "Egresos", "Flujo neto".
  - `HistoryFilters` (v-model de `HistoryFilters`): input de búsqueda (placeholder "Buscar por descripción…"), select "Todas las categorías" + categorías, select "Todos los medios" / "Débito" / una opción por tarjeta (`bank`), pastillas "Todos" / "Gasto" / "Ingreso".
  - `HistoryTable`: columnas Fecha, Concepto, Medio de pago, Categoría ("Ingreso" en ingresos), Monto (+ verde ingresos, − egresos); 10 por página, "Mostrando {from}–{to} de {total}", Anterior/Siguiente deshabilitados en los extremos; página 1 al cambiar periodo o cualquier filtro; estados "Cargando…", "Sin movimientos para estos filtros" y "No se pudieron cargar los movimientos.".

- [ ] **Step 1: Descargar la referencia** a `docs/design/stitch-web/` (ver Files).
- [ ] **Step 2: Implementar** según Interfaces.
- [ ] **Step 3: Verificar** — `cd apps/web && npx vue-tsc --noEmit && npx nuxi generate` → sin errores; `npx nuxi dev` arranca y `/historial` responde 200.
- [ ] **Step 4: Verificación manual (usuario, con sesión)** — navegar Dashboard ↔ Historial desde el menú; filtros combinados; resumen coincide con la tabla filtrada; página 3 + cambiar filtro → página 1; dashboard sin cambios de comportamiento.
- [ ] **Step 5: Commit**

```bash
git add apps/web docs/design/stitch-web/2-historial.html docs/design/stitch-web/2-historial.png
git commit -m "feat(web): pantalla de historial de movimientos con filtros"
```

---

### Task 3: Panel "Editar Transacción"

**Files:**
- Create: `apps/web/components/history/EditTransactionPanel.vue`
- Modify: `apps/web/pages/historial.vue`, `apps/web/components/history/HistoryTable.vue` (`editable` true desde la página)

**Interfaces:**
- Consumes: Task 1 (`toEditForm`, `validateEditForm`, `buildTransactionEdit`, `hasEditChanges`, `updateTransaction`), Task 2 (`useHistoryData().reload`, `HistoryTable` evento `edit`, `formatTxDate`).
- Produces: `<EditTransactionPanel :transaction="Transaction | null" :categories :credit-cards @close @saved />` — abierto cuando `transaction` no es null.
- Comportamiento (estructura/clases del panel lateral de `2-historial.html`):
  - Título "Editar Transacción"; X arriba; pie con "Cancelar" y "Guardar cambios".
  - Egreso: "Descripción" (texto), "Monto" (entero COP con separador de miles, como `CreateMovementForm.vue` de mobile), "Categoría" (select), "Medio de pago" (Débito / Crédito, mismo patrón de botones que mobile), "Tarjeta" (select de `creditCards` por `bank`, visible solo con Crédito), "Fecha" (texto `formatTxDate`, no editable). Ingreso: solo Descripción, Monto y Fecha.
  - Formulario inicial = `toEditForm(transaction)`; se reinicia cada vez que cambia `transaction`.
  - "Guardar cambios" deshabilitado si `!hasEditChanges(...)` o `validateEditForm(...)` devuelve mensaje (mostrar el mensaje bajo el formulario); al pulsar: estado "Guardando…", `updateTransaction(tx.id, edit.changes, edit.removeFields)`; éxito → `emit('saved')`; error → mostrar `result.error` y mantener el panel y los valores.
  - X, "Cancelar", Escape y clic en el fondo oscurecido → `emit('close')` sin escribir nada.
  - La página: `editing = ref<Transaction | null>(null)`; `@edit` → `editing = tx`; `@saved` → `editing = null` y `await reload()`.

- [ ] **Step 1: Implementar** según Interfaces.
- [ ] **Step 2: Verificar** — `cd apps/web && npx vue-tsc --noEmit && npx nuxi generate` → sin errores; `npm test -w packages/core` verde.
- [ ] **Step 3: Verificación manual (usuario, con sesión)** — editar descripción, monto y categoría de un egreso y ver tabla y resumen actualizados; crédito → débito y comprobar en Firebase que el documento ya no tiene `creditCardId`/`creditCardBank`; cambiar de tarjeta; editar un ingreso (solo descripción/monto); Cancelar/Escape no guardan; con la red cortada, guardar muestra el error y conserva lo escrito; el dashboard refleja los cambios al volver.
- [ ] **Step 4: Commit**

```bash
git add apps/web
git commit -m "feat(web): editar movimientos desde el historial"
```
