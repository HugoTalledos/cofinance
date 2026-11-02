# Administración de pagos recurrentes (web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar a `apps/web` la pantalla `/recurrentes` para crear, editar y eliminar pagos recurrentes con medio de pago y día de recordatorio, y hacer que el móvil copie el medio de pago al movimiento cuando se paga un recurrente.

**Architecture:** Los campos nuevos de `RecurringExpense` son opcionales. Validación, armado de creación/edición y los campos de pago para el movimiento son funciones puras en `@cofinance/core` con Vitest; `updateRecurringExpense` acepta campos a borrar (`deleteField`). La web agrega pantalla, composable, panel y diálogo; el input de monto COP se extrae a un componente compartido.

**Tech Stack:** Nuxt 3 (SSR off), Vue 3 `<script setup lang="ts">`, Tailwind (tokens Stitch), Firebase 12, Vitest (en `packages/core`).

**Spec:** `docs/superpowers/specs/2026-11-01-web-recurrentes-design.md`

**Referencia visual (solo estilo):** `docs/design/stitch-web/3-tarjetas.png` (tabla "Atajos de Pagos Habituales").

## Global Constraints

- El día de recordatorio solo se guarda: nada lo usa (sin avisos ni cálculos).
- Eliminar es definitivo (`deleteRecurringExpense`), con confirmación dentro de la página, nunca `window.confirm`.
- Editar: todos los campos; nunca toca `lastPaidAt`, `lastPaidAmount` ni `userId`.
- Medio de pago obligatorio al crear y al guardar una edición (mensaje `Elige un medio de pago`). Con Crédito, tarjeta obligatoria solo si hay tarjetas (`Elige una tarjeta`); sin tarjetas se guarda Crédito sin tarjeta.
- Pasar a Débito elimina `creditCardId`/`creditCardBank`; vaciar el día elimina `reminderDay`; vaciar la descripción elimina `description`. Nunca se escribe `undefined`.
- Cambiar la categoría escribe `categoryId` y `categoryName`. Solo se ofrecen categorías activas; la categoría archivada actual se muestra como `{nombre} (eliminada)`.
- Variable = `fixedAmount: null`; Fijo exige monto > 0 (`El monto debe ser mayor a 0`).
- Sin filtro por usuario; crear guarda el `userId` actual.
- Del diseño se omiten tarjetas con cupo, totales, "Registrar Pago", "Atajo rápido", "+ Nueva Tarjeta / Suscripción", "Filtro Global", "Descargar Reporte", campana. COP.
- Móvil: solo cambia que el movimiento creado al pagar copia `paymentMethod`, `creditCardId`, `creditCardBank` cuando existen. Dashboard sin cambios.
- Rama de trabajo: `feat/web-recurrentes` desde `main`.

## Review Focus

1. **Crédito → Débito** borra la tarjeta del recurrente. Test `buildRecurringUpdate: pasar a débito elimina la tarjeta` (Task 1).
2. **Vaciar el día de recordatorio** lo borra del documento. Test `buildRecurringUpdate: vaciar el día lo elimina` (Task 1).
3. **Editar** nunca escribe `lastPaidAt`/`lastPaidAmount`/`userId`. Test `buildRecurringUpdate: nunca toca el estado de pago` (Task 1).
4. **Recurrente antiguo sin medio de pago**, editado solo en el nombre → no se puede guardar hasta elegir uno. Test `validateRecurringForm: exige medio de pago` (Task 1).
5. **Pagar en el móvil un recurrente sin medio de pago** → el movimiento se crea sin esos campos. Test `recurringPaymentFields: sin medio de pago devuelve {}` (Task 1).

---

### Task 1: Reglas de recurrentes en `@cofinance/core` (TDD)

**Files:**
- Modify: `packages/core/src/types/recurring-expense.ts` (campos opcionales `paymentMethod?: PaymentMethod`, `creditCardId?: string`, `creditCardBank?: string`, `reminderDay?: number` — comentario: "solo se guarda; no se usa todavía"; tipo `RemovableRecurringField = 'creditCardId' | 'creditCardBank' | 'reminderDay' | 'description'`)
- Create: `packages/core/src/editing/recurring-form.ts` (+ export en `editing/index.ts`)
- Test: `packages/core/src/editing/recurring-form.test.ts`
- Modify: `packages/core/src/services/recurring-expenses.service.ts` (`updateRecurringExpense`)

**Interfaces:**
- Produces (exportado desde `@cofinance/core`):
  - `interface RecurringForm { name: string; description: string; categoryId: string; amountMode: 'fixed' | 'variable'; fixedAmount: number | null; paymentMethod: PaymentMethod | null; creditCardId: string | null; reminderDay: number | null }`
  - `toRecurringForm(expense: RecurringExpense | null): RecurringForm` — `null` → formulario vacío (`amountMode: 'fixed'`, todo vacío/null); existente → `amountMode` según `fixedAmount === null`, `description ?? ''`, resto `?? null`.
  - `validateRecurringForm(form: RecurringForm, creditCards: CreditCard[]): string | null` — en orden: `'El nombre es obligatorio'`, `'Elige una categoría'`, `'El monto debe ser mayor a 0'` (fijo y no > 0), `'Elige un medio de pago'`, `'Elige una tarjeta'` (crédito, hay tarjetas, sin tarjeta), `'El día de recordatorio debe estar entre 1 y 31'` (no null y no entero 1–31).
  - `buildRecurringInput(form: RecurringForm, userId: string, categories: Category[], creditCards: CreditCard[]): RecurringExpenseInput` — `name`/`description` recortados (sin `description` si queda vacía), `categoryId` + `categoryName`, `fixedAmount` (variable → null), `paymentMethod`, con crédito y tarjeta `creditCardId` + `creditCardBank`, `reminderDay` si no es null; sin claves `undefined`.
  - `interface RecurringEdit { changes: RecurringExpenseUpdate; removeFields: RemovableRecurringField[] }`
  - `buildRecurringUpdate(expense: RecurringExpense, form: RecurringForm, categories: Category[], creditCards: CreditCard[]): RecurringEdit` — solo lo que cambió; nunca `lastPaidAt`, `lastPaidAmount`, `userId`.
  - `hasRecurringChanges(edit: RecurringEdit): boolean`
  - `recurringPaymentFields(expense: RecurringExpense): Pick<Transaction, 'paymentMethod' | 'creditCardId' | 'creditCardBank'>` — solo las claves presentes en el recurrente.
  - `updateRecurringExpense(id: string, data: RecurringExpenseUpdate, removeFields: RemovableRecurringField[] = []): Promise<ApiResponse<boolean>>` — campos a borrar como `deleteField()` en el mismo `updateDoc`; llamadas de 2 argumentos siguen igual.

- [ ] **Step 1: Crear rama** — `git checkout -b feat/web-recurrentes`
- [ ] **Step 2: Escribir los tests** (fábricas `rec()`, `cat()`, `card()`):

```ts
it('toRecurringForm(null) devuelve un formulario vacío fijo')
it('toRecurringForm usa variable cuando fixedAmount es null')
it('validateRecurringForm exige nombre, categoría y monto en ese orden')
it('validateRecurringForm: exige medio de pago')            // recurrente viejo sin paymentMethod → 'Elige un medio de pago'
it('validateRecurringForm exige tarjeta solo si hay tarjetas')
it('validateRecurringForm valida el día 1–31')               // 0, 32, 2.5 → mensaje; 31 → null
expect(buildRecurringInput(formCreditNu, 'u1', cats, cards)).toEqual({
  userId: 'u1', name: 'Arriendo', categoryId: 'home', categoryName: 'Hogar', fixedAmount: 1500000,
  paymentMethod: 'credit_card', creditCardId: 'nu', creditCardBank: 'Nu', reminderDay: 5
})
it('buildRecurringInput variable sin descripción ni día no incluye esas claves')
it('buildRecurringUpdate sin cambios no produce cambios')
it('buildRecurringUpdate: pasar a débito elimina la tarjeta') // removeFields ['creditCardId','creditCardBank']
it('buildRecurringUpdate: vaciar el día lo elimina')          // removeFields ['reminderDay']
it('buildRecurringUpdate cambia categoría con su nombre y pasa a variable') // { categoryId, categoryName, fixedAmount: null }
it('buildRecurringUpdate: nunca toca el estado de pago')      // ninguna clave lastPaidAt/lastPaidAmount/userId en changes
it('recurringPaymentFields: sin medio de pago devuelve {}')
it('recurringPaymentFields copia medio y tarjeta')
```

- [ ] **Step 3: Ver fallar** — `npm test -w packages/core` → FAIL (módulo inexistente).
- [ ] **Step 4: Implementar** según Interfaces.
- [ ] **Step 5: Verificar** — `npm test -w packages/core && npm run typecheck -w packages/core && (cd apps/mobile && npx vue-tsc --noEmit) && (cd apps/web && npx vue-tsc --noEmit)` → todo verde.
- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat(core): medio de pago y día de recordatorio en pagos recurrentes"
```

---

### Task 2: El móvil copia el medio de pago al pagar un recurrente

**Files:**
- Modify: `apps/mobile/components/RecurringExpenseList/useRecurringList.ts` (`createTransactionFromExpense`)

**Interfaces:**
- Consumes: `recurringPaymentFields` (Task 1).
- El objeto que se pasa a `addTransaction` agrega `...recurringPaymentFields(expense)`; nada más cambia.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: Verificar** — `cd apps/mobile && npx vue-tsc --noEmit && npx nuxi generate` → sin errores.
- [ ] **Step 3: Commit**

```bash
git add apps/mobile
git commit -m "feat(mobile): copiar el medio de pago del recurrente al registrar su pago"
```

---

### Task 3: Pantalla `/recurrentes`

**Files:**
- Create: `apps/web/components/MoneyInput.vue` (input COP con separador de miles extraído de `EditTransactionPanel.vue`; `v-model: number | null`) y usarlo en `components/history/EditTransactionPanel.vue` y `components/categories/CategoryPanel.vue` sin cambiar su comportamiento
- Create: `apps/web/composables/useRecurringAdmin.ts`, `apps/web/pages/recurrentes.vue`, `apps/web/components/recurring/RecurringTable.vue`, `RecurringPanel.vue`, `DeleteRecurringDialog.vue`
- Modify: `apps/web/components/AppShell.vue` (ítem "Pagos recurrentes", `/recurrentes`, icono `event_repeat`, después de "Categorías")
- Commit también: `docs/design/stitch-web/3-tarjetas.png` (copiado por el controlador)

**Interfaces:**
- Consumes: Task 1 (`toRecurringForm`, `validateRecurringForm`, `buildRecurringInput`, `buildRecurringUpdate`, `hasRecurringChanges`, `updateRecurringExpense`), `activeCategories`, `isCategoryActive`, servicios `getRecurringExpenses`, `createRecurringExpense`, `deleteRecurringExpense`, `getCategories`, `getCreditCards`; `useAuth().user`; `formatCOP`, `paymentMethodLabel`-style texto.
- Produces: `useRecurringAdmin(): { loading; error; expenses: Ref<RecurringExpense[]> /* por nombre */; categories: Ref<Category[]> /* todas */; creditCards: Ref<CreditCard[]>; reload(); create(form): Promise<string | null>; update(expense, form): Promise<string | null>; remove(id): Promise<string | null> }` — acciones devuelven `null` o el mensaje; recargan al terminar bien; guarda contra respuestas obsoletas.
- Pantalla:
  - Título "Pagos recurrentes" + botón "+ Nuevo pago recurrente" (deshabilitado mientras carga o si hubo error).
  - `RecurringTable`: Nombre (+ descripción), Categoría (icono + nombre actual por id, o `categoryName`), Monto (`formatCOP` o "Variable"), Medio de pago ("Débito", "Crédito · {banco}", "Crédito", o "Sin medio de pago" resaltado en ámbar), Recordatorio ("Día N" o "—"), Acciones (lápiz `title="Editar"`, basura `title="Eliminar"`). Estados "Cargando…", "Aún no hay pagos recurrentes", error.
  - `RecurringPanel` (crear/editar, patrón de `EditTransactionPanel.vue`): Nombre, Descripción, Categoría (activas + la archivada actual como "(eliminada)"), Monto (Fijo/Variable + `MoneyInput`), Medio de pago (Débito/Crédito) y Tarjeta (solo con Crédito), Día de recordatorio (número 1–31, opcional, con la nota "Solo se guarda; aún no envía recordatorios."). Botón "Crear pago recurrente" / "Guardar cambios" (este último deshabilitado sin cambios). Mensaje de validación, error del servicio visible, no se cierra mientras guarda.
  - `DeleteRecurringDialog`: "¿Eliminar el pago recurrente {nombre}?" y "Los movimientos ya registrados se conservan." Botones "Cancelar" / "Eliminar"; no se cierra mientras elimina; error visible.

- [ ] **Step 1: Implementar** según Interfaces.
- [ ] **Step 2: Verificar** — `cd apps/web && npx vue-tsc --noEmit && npx nuxi generate` → sin errores; dev server: `/recurrentes`, `/historial` y `/categorias` responden 200.
- [ ] **Step 3: Verificación manual (usuario, con sesión)** — crear un recurrente fijo con crédito y otro variable con débito y día; completar el medio de pago de uno viejo; pasar uno a débito y vaciar su día (en Firebase ya no tiene tarjeta ni `reminderDay`); eliminar con confirmación; en el móvil, pagar un recurrente con medio de pago y ver que el movimiento lo trae; el monto en "Editar Transacción" y en categorías sigue funcionando igual.
- [ ] **Step 4: Commit**

```bash
git add apps/web docs/design/stitch-web/3-tarjetas.png
git commit -m "feat(web): pantalla de administración de pagos recurrentes"
```
