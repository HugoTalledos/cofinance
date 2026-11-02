# App web: Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear `apps/web`, una app Nuxt de solo lectura con la pantalla Dashboard del diseño Stitch "Minimalist", alimentada por Firestore vía `@cofinance/core`.

**Architecture:** Los cálculos (totales del periodo, filtro por tarjeta, comparativa, ranking, % de variación, "pagado en el periodo") son funciones puras nuevas en `packages/core/src/analytics/`, probadas con Vitest; mobile pasa a usar las dos que ya calculaba él mismo. `apps/web` es un Nuxt 3 SSR-off con login de Google (popup), un composable que lee Firestore una vez por periodo y componentes de presentación por sección.

**Tech Stack:** Nuxt 3, Vue 3 `<script setup lang="ts">`, Tailwind (`@nuxtjs/tailwindcss`), Firebase 12 (Firestore + Auth web), Vitest (solo en `packages/core`).

**Spec:** `docs/superpowers/specs/2026-11-01-web-dashboard-design.md`

**Referencia visual:** `docs/design/stitch-web/1-dashboard.html` y `docs/design/stitch-web/1-dashboard.png` (pantalla Stitch `1ab5c8cb32954b67bf6481017e441a0c`).

## Global Constraints

- **Solo lectura:** la web no importa ni llama `create*`, `update*`, `delete*`, `markPaid` ni ningún servicio que escriba.
- Se omite todo lo listado en "No-objetivos" del spec (Filtro Global/carteras, campana, Descargar Reporte, Meta cumplida, vs promedio 90d, ritmo de consumo, columna Estado, "vence en X días", botones Nueva Transacción / Pagar con un toque / Registrar Pago Rápido / Ver todos / Ver todo el historial / Administrar presupuestos, botones Este Mes / Q3 / Año en Curso).
- Moneda: COP con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`. Nunca "USD".
- Periodos de facturación con los helpers de `@cofinance/core` (`BILLING_START_DAY = 24`). Periodo anterior = `getPreviousMonth(periodKey)`.
- Las consultas por periodo usan `getTransactions({ dateFrom: startDate, dateTo: endDate })` con el rango de `getBillingPeriodRangeFromKey`, igual que mobile, para que los números coincidan.
- `Transaction.date` puede venir como ISO completo (`2026-10-30T15:00:00.000Z`): para mostrarla usar `date.substring(0, 10)` + `parseDateString`.
- Gastos = egresos (`type` ausente o `'expense'`) de categorías **no** `isSaving`. Apartado = egresos de categorías `isSaving`. Restante = Ingresos − Gastos − Apartado.
- Con tarjeta seleccionada: solo egresos no-ahorro con ese `creditCardId`; Ingresos, Apartado y Restante siguen globales.
- `% variación` se omite (null) si el valor anterior es ≤ 0.
- Mobile no cambia de comportamiento.
- Rama de trabajo: `feat/web-dashboard` desde `main`.

## Review Focus

1. **Tarjeta seleccionada + gastos viejos sin `creditCardId`** → quedan fuera. Test `getSpendingTransactions excluye egresos sin tarjeta cuando hay tarjeta` (Task 1).
2. **Apartado pagado con la tarjeta seleccionada** → no aparece como gasto de la tarjeta. Test `getSpendingTransactions excluye categorías de ahorro aunque tengan la tarjeta` (Task 1).
3. **Periodo anterior en 0 o Restante anterior negativo** → sin %. Tests `percentChange devuelve null si previous <= 0` (Task 1).
4. **Cambiar periodo o tarjeta estando en la página 3 de movimientos** → vuelve a la página 1 y el contador "Mostrando" es correcto. Verificación manual en Task 5 Step 4.
5. **Transacción cuya categoría ya no existe** → la fila de comparativa usa `categoryName` de la transacción, no se pierde el gasto. Test `buildCategoryComparison usa categoryName si la categoría no existe` (Task 1).

---

### Task 1: Funciones de análisis en `@cofinance/core` (TDD)

**Files:**
- Create: `packages/core/src/analytics/period.ts`, `packages/core/src/analytics/index.ts`
- Test: `packages/core/src/analytics/period.test.ts`
- Modify: `packages/core/package.json` (devDependency `vitest`, script `"test": "vitest run"`), `packages/core/src/index.ts` (`export * from './analytics'`), `packages/core/tsconfig.json` (excluir `**/*.test.ts` no es necesario; los tests deben compilar con el mismo tsconfig)

**Interfaces:**
- Produces (todo exportado desde `@cofinance/core`):
  - `isExpense(tx: Transaction): boolean` — `(tx.type ?? 'expense') === 'expense'`.
  - `interface PeriodTotals { income: number; spent: number; saved: number; remaining: number; spentByCategory: Record<string, number> }`
  - `computePeriodTotals(transactions: Transaction[], categories: Category[]): PeriodTotals` — misma lógica que `buildSummaryFromTransactions` de mobile; `spentByCategory` **incluye** categorías de ahorro (como mobile hoy) y omite egresos sin `categoryId`.
  - `getSpendingTransactions(transactions: Transaction[], categories: Category[], creditCardId: string | null): Transaction[]` — egresos de categorías no-ahorro; si `creditCardId` no es null, solo los que tienen ese `creditCardId`.
  - `percentChange(current: number, previous: number): number | null` — `((current - previous) / previous) * 100`, o `null` si `previous <= 0`.
  - `interface CategoryComparisonRow { categoryId: string; name: string; icon?: string; current: number; previous: number; change: number | null }`
  - `buildCategoryComparison(current: Transaction[], previous: Transaction[], categories: Category[]): CategoryComparisonRow[]` — recibe transacciones ya filtradas por `getSpendingTransactions`; una fila por `categoryId` con gasto en cualquiera de los dos periodos; `name`/`icon` de la categoría o, si no existe, `categoryName` de la transacción más reciente; orden por `current` desc.
  - `interface RankingRow extends CategoryComparisonRow { budget: number | null; percentUsed: number | null }`
  - `buildSpendingRanking(rows: CategoryComparisonRow[], categories: Category[], limit = 4): RankingRow[]` — filas con `current > 0`, top `limit`; `budget = category.budget > 0 ? budget : null`; `percentUsed = budget ? (current / budget) * 100 : null`.
  - `isPaidInPeriod(expense: RecurringExpense, periodKey: string): boolean` — `lastPaidAt != null && getBillingPeriodRange(new Date(lastPaidAt)).periodKey === periodKey`.

- [ ] **Step 1: Instalar Vitest en core**

```bash
git checkout -b feat/web-dashboard
npm install -D vitest -w packages/core
```
Expected: instala una versión compatible con el Vite de la raíz (8.x); `npm ls vite` sin `invalid`.

- [ ] **Step 2: Escribir los tests** en `period.test.ts` con fábricas mínimas `tx({...})` y `cat({...})`. Casos y aserciones:

```ts
// categorías: food (budget 1000), rent (budget 0), savings (isSaving: true)
// computePeriodTotals
expect(computePeriodTotals([inc(500), exp('food', 100), exp('savings', 50), expNoType('rent', 20)], cats))
  .toEqual({ income: 500, spent: 120, saved: 50, remaining: 330, spentByCategory: { food: 100, savings: 50, rent: 20 } })
// getSpendingTransactions
it('sin tarjeta devuelve egresos no-ahorro')              // excluye income y savings
it('excluye egresos sin tarjeta cuando hay tarjeta')       // creditCardId 'nu' → solo los de 'nu'
it('excluye categorías de ahorro aunque tengan la tarjeta')
// percentChange
expect(percentChange(150, 100)).toBe(50)
expect(percentChange(50, 0)).toBeNull()
expect(percentChange(50, -10)).toBeNull()
// buildCategoryComparison
it('combina ambos periodos y ordena por current desc')    // food cur 100 prev 80 → change 25; rent cur 0 prev 40 → change -100
it('usa categoryName si la categoría no existe')          // categoryId 'gone', categoryName 'Viejo' → name 'Viejo'
// buildSpendingRanking
it('top 4 con presupuesto solo si budget > 0')            // food: budget 1000, percentUsed 10; rent: budget null, percentUsed null
it('excluye filas con current 0')
// isPaidInPeriod
expect(isPaidInPeriod({ lastPaidAt: new Date(2026, 9, 25).getTime() } as RecurringExpense, '2026-10')).toBe(true)
expect(isPaidInPeriod({ lastPaidAt: new Date(2026, 9, 20).getTime() } as RecurringExpense, '2026-10')).toBe(false) // cae en 2026-09
expect(isPaidInPeriod({} as RecurringExpense, '2026-10')).toBe(false)
```

- [ ] **Step 3: Ver fallar**

Run: `npm test -w packages/core`
Expected: FAIL — no se puede resolver `./period`.

- [ ] **Step 4: Implementar `period.ts` e `index.ts`** con las firmas de Interfaces.

- [ ] **Step 5: Ver pasar y tipar**

Run: `npm test -w packages/core && npm run typecheck -w packages/core`
Expected: todos los tests PASS; typecheck sin errores.

- [ ] **Step 6: Commit**

```bash
git add packages/core package-lock.json
git commit -m "feat(core): funciones de análisis de periodo para el dashboard"
```

---

### Task 2: Mobile usa las funciones compartidas

**Files:**
- Modify: `apps/mobile/composables/useSummary.ts` (`buildSummaryFromTransactions` usa `computePeriodTotals`)
- Modify: `apps/mobile/composables/useRecurringExpenses.ts` (`isPaidThisPeriod(e)` = `isPaidInPeriod(e, getCurrentBillingPeriodKey())`)

**Interfaces:**
- Consumes: `computePeriodTotals`, `isPaidInPeriod` (Task 1).

- [ ] **Step 1: Refactor** — `buildSummaryFromTransactions` conserva su firma y su `MonthlySummary` de salida (`categories[id].spent` = `spentByCategory[id]`, categorías sin gasto con `spent: 0`, categorías desconocidas con `budget: 0`); asigna `currentTotalIncome = totals.income`, `currentTotalSaved = totals.saved`, `totalSpent = totals.spent`.

- [ ] **Step 2: Verificar**

Run: `npm test -w packages/core && cd apps/mobile && npx vue-tsc --noEmit && npx nuxi generate`
Expected: todo sin errores. Luego `npm run dev`, abrir el móvil en el navegador y anotar Restante/Gastado/Apartado del periodo actual; deben ser idénticos a los de `main` (comparar con `git stash` o con la app instalada).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/composables
git commit -m "refactor(mobile): usar computePeriodTotals e isPaidInPeriod de core"
```

---

### Task 3: Esqueleto de `apps/web` con login

**Files:**
- Create: `apps/web/package.json` (name `cofinance-web`, private, `type: module`; scripts `dev`, `build`, `generate`, `preview`, `postinstall: nuxt prepare`; dependencias `nuxt`, `vue`, `vue-router`, `firebase`, `@nuxtjs/tailwindcss`, `typescript`, `vue-tsc` con los mismos rangos que `apps/mobile/package.json`, y `"@cofinance/core": "*"`)
- Create: `apps/web/nuxt.config.ts` (`ssr: false`, `typescript.strict`, `build.transpile: ['@cofinance/core']`, mismo bloque `runtimeConfig.public.firebase*` que mobile, `app.head.link` con Google Fonts Geist + JetBrains Mono + Material Symbols Outlined copiados del `<head>` de `1-dashboard.html`, `app.head.title: 'Cofinance'`)
- Create: `apps/web/tailwind.config.ts` — `theme.extend` con `colors`, `borderRadius`, `spacing`, `fontFamily`, `fontSize` copiados literalmente del `tailwind.config` embebido en `docs/design/stitch-web/1-dashboard.html`
- Create: `apps/web/tsconfig.json` (igual que mobile), `apps/web/.env` (copia de `apps/mobile/.env`), `apps/web/.env.example` (copia de mobile)
- Create: `apps/web/plugins/firebase.client.ts` (igual que mobile)
- Create: `apps/web/composables/useAuth.ts`
- Create: `apps/web/app.vue`, `apps/web/components/LoginScreen.vue`, `apps/web/components/AppShell.vue`, `apps/web/pages/index.vue` (placeholder "Dashboard General" dentro del shell)
- Create: `apps/web/utils/format.ts`
- Modify: `package.json` raíz (scripts `"dev:web": "npm run dev -w apps/web"`, `"generate:web": "npm run generate -w apps/web"`), `CLAUDE.md` (sección Monorepo: `apps/web` = dashboard web de solo lectura)

**Interfaces:**
- Produces:
  - `useAuth(): { user: Ref<User | null>; authLoading: Ref<boolean>; signInWithGoogle(): Promise<void>; signOut(): Promise<void> }` — estado a nivel de módulo; `onAuthStateChanged` se registra una sola vez; login con `signInWithPopup(auth, new GoogleAuthProvider())`.
  - `formatCOP(value: number): string` (formato de Global Constraints) y `formatPercent(value: number): string` (`+6.0%` / `-18.0%`, una decimal, signo siempre) en `utils/format.ts` (auto-importados).
  - `<AppShell>`: sidebar fijo `w-64` con marca "Cofinance", un ítem activo "Dashboard General" (icono `dashboard`) y tarjeta de usuario abajo (foto, `displayName`, botón "Cerrar sesión"); slot `header` (barra superior `h-16`) y slot default (contenido).
  - `app.vue`: `authLoading` → pantalla de carga; sin `user` → `<LoginScreen>` (botón "Iniciar sesión con Google"); con `user` → `<NuxtPage>`.

- [ ] **Step 1: Crear archivos e instalar**

Run: `npm install` (desde la raíz; si `~/.npm` da EACCES, añadir `--cache` a un directorio temporal)
Expected: `apps/web/.nuxt/` creado; `npm ls firebase` sigue mostrando una sola versión.

- [ ] **Step 2: Verificar tipos y build**

Run: `cd apps/web && npx vue-tsc --noEmit && npx nuxi generate`
Expected: sin errores; existe `apps/web/.output/public/index.html`.

- [ ] **Step 3: Verificar login (manual)**

`npm run dev:web` → abrir la URL. Sin sesión: solo `LoginScreen`. Login con Google → shell con sidebar, foto y nombre. "Cerrar sesión" → vuelve a `LoginScreen`. Tipografías Geist/JetBrains Mono y fondo `#f8f9ff` como en `1-dashboard.png`.

- [ ] **Step 4: Commit**

```bash
git add apps/web package.json package-lock.json CLAUDE.md docs/design/stitch-web
git commit -m "feat(web): esqueleto de la app web con login de Google"
```
(`apps/web/.env` queda ignorado por el `.gitignore` raíz; comprobar con `git status` que no se sube.)

---

### Task 4: Datos del dashboard

**Files:**
- Create: `apps/web/composables/useDashboardData.ts`

**Interfaces:**
- Consumes: Task 1 (`computePeriodTotals`, `getSpendingTransactions`, `percentChange`, `buildCategoryComparison`, `buildSpendingRanking`, `isPaidInPeriod`, `isExpense`), servicios `getTransactions`, `getCategories`, `getCreditCards`, `getRecurringExpenses`.
- Produces: `useDashboardData(periodKey: Ref<string>, creditCardId: Ref<string | null>)` que devuelve:
  - `loading: Ref<boolean>`
  - `errors: Ref<{ transactions: string | null; recurring: string | null }>` — fallo de transacciones afecta KPIs/comparativa/ranking/movimientos; fallo de recurrentes solo a esa sección.
  - `creditCards: Ref<CreditCard[]>`
  - `kpis: ComputedRef<{ income: Kpi; spent: Kpi; saved: Kpi; remaining: Kpi }>` con `interface Kpi { value: number; change: number | null }`; `spent.value` = suma de `getSpendingTransactions(current, cats, creditCardId)`; el resto de `computePeriodTotals` global.
  - `comparison: ComputedRef<CategoryComparisonRow[]>`, `ranking: ComputedRef<RankingRow[]>`
  - `movements: ComputedRef<Transaction[]>` — periodo actual, fecha desc; sin tarjeta: todas; con tarjeta: `getSpendingTransactions(...)`.
  - `recurring: ComputedRef<Array<RecurringExpense & { paid: boolean; displayAmount: number | null }>>` — `paid = isPaidInPeriod(e, getCurrentBillingPeriodKey())`; `displayAmount = fixedAmount ?? lastPaidAmount ?? null`.
  - Carga: categorías, tarjetas y recurrentes una vez; transacciones con **una** consulta `getTransactions({ dateFrom: rangoAnterior.startDate, dateTo: rangoActual.endDate })` cada vez que cambia `periodKey`, separadas luego por rango (`date.substring(0,10)` vs `startDate` del periodo actual). Cambiar `creditCardId` no vuelve a consultar.

- [ ] **Step 1: Implementar** según Interfaces.

- [ ] **Step 2: Verificar**

Run: `cd apps/web && npx vue-tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/composables
git commit -m "feat(web): composable de datos del dashboard"
```

---

### Task 5: Pantalla Dashboard

**Files:**
- Create: `apps/web/components/dashboard/PeriodSelect.vue`, `CardSelect.vue`, `KpiCards.vue`, `CategoryComparison.vue`, `SpendingRanking.vue`, `RecentMovements.vue`, `RecurringPayments.vue`
- Modify: `apps/web/pages/index.vue`

**Interfaces:**
- Consumes: `useDashboardData` (Task 4), `formatCOP`/`formatPercent`, `AppShell` (Task 3).
- Contenido de cada sección (estructura y clases tomadas de `1-dashboard.html`, con las omisiones de Global Constraints):
  - `PeriodSelect`: `<select>` con `getRecentBillingPeriodKeys(12)`, etiqueta `formatBillingPeriodLabel`, por defecto `getCurrentBillingPeriodKey()`. En la cabecera.
  - `CardSelect`: "Todas las tarjetas" (`null`) + `creditCards` por `bank`. En la cabecera.
  - Cabecera (slot `header` de `AppShell`): `PeriodSelect`, `CardSelect` y, a la derecha, el avatar (`user.photoURL`) del usuario.
  - Título "Dashboard General" + subtítulo `formatBillingPeriodLabel(periodKey)`.
  - `KpiCards`: 4 tarjetas en este orden y con estas etiquetas: "Restante", "Ingresos del periodo", "Gastos del periodo" (con sufijo "· {bank}" si hay tarjeta), "Apartado". Pie "vs periodo anterior" con `formatPercent(change)` o nada si `change === null`. En Gastos, subir es malo (rojo) y bajar es bueno (verde); en las demás al revés.
  - `CategoryComparison`: fila resumen con las 5 primeras filas (nombre + %), y una fila por categoría: `icon` (emoji) + nombre, `formatCOP(current) vs formatCOP(previous)`, barra (ancho relativo al máximo de la lista) y badge de %.
  - `SpendingRanking`: "Ranking: Mayores Gastos", posición `01..04`, nombre, monto, "Presupuesto: $X" y "{n}% consumido" con barra solo si `budget !== null`, y % vs periodo anterior.
  - `RecentMovements`: tabla Concepto | Categoría ("Ingreso" para ingresos) | Fecha | Medio de pago ("Débito", "Crédito · {creditCardBank}", "Crédito" si no hay banco, vacío si no hay `paymentMethod`) | Importe (`+` verde ingresos, `−` egresos). 10 por página, "Mostrando {desde}–{hasta} de {N}", botones Anterior/Siguiente deshabilitados en los extremos. La página vuelve a 1 cuando cambian `periodKey` o `creditCardId`.
  - `RecurringPayments`: título "Pagos habituales" + "Estado de este periodo"; por gasto: nombre, `categoryName`, `formatCOP(displayAmount)` o "Variable", badge "Pagado"/"Pendiente". Sin botones.
  - Estados: `loading` → esqueletos o texto "Cargando…"; listas vacías → "Sin movimientos en este periodo"; `errors.transactions`/`errors.recurring` → mensaje en las secciones afectadas.

- [ ] **Step 1: Implementar** componentes y página.

- [ ] **Step 2: Verificar tipos y build**

Run: `cd apps/web && npx vue-tsc --noEmit && npx nuxi generate`
Expected: sin errores.

- [ ] **Step 3: Verificar números contra el móvil (manual)**

Con `npm run dev:web` y la app móvil en el mismo periodo: Restante, Ingresos, Gastos y Apartado (con "Todas las tarjetas") coinciden exactamente.

- [ ] **Step 4: Verificar comportamiento (manual)**

- Elegir una tarjeta: cambian Gastos, Comparativa, Ranking y Movimientos; Ingresos/Restante/Apartado no cambian; ningún movimiento de categoría de ahorro aparece.
- Ir a la página 3 de movimientos y cambiar periodo o tarjeta: vuelve a la página 1 con el contador correcto.
- Elegir un periodo sin datos: KPIs en $0 y "Sin movimientos en este periodo".
- No hay ningún botón o enlace de los omitidos en Global Constraints; nada se ve clicable sin hacer algo.
- Comparar visualmente con `docs/design/stitch-web/1-dashboard.png`.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): pantalla Dashboard con KPIs, comparativa, ranking, movimientos y pagos habituales"
```
