# Edición y eliminación de movimientos — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que el usuario edite (monto, detalle, categoría, fecha) y elimine definitivamente un movimiento desde el historial, manteniendo `monthly_summary` consistente.

**Architecture:** Se agregan `updateTransaction` y `deleteTransaction` al servicio de transacciones, que ajustan `monthly_summary` con deltas incrementales (reutilizando `updateMonthlySummaryIncremental` con montos negativos). El composable `useTransactions` los envuelve y muta el array local. `pages/transactions.vue` abre un `BottomSheet` con `CreateMovementForm` reutilizado en modo edición, más un botón de eliminar que pasa por el diálogo de confirmación existente.

**Tech Stack:** Nuxt 3 (SSR off), Vue 3 `<script setup lang="ts">`, Firebase/Firestore v9 modular, Tailwind CSS.

## Global Constraints

- Siempre `<script setup lang="ts">`. Nunca Options API.
- Servicios devuelven `ApiResponse<T>` = `{ data, error, loading }`. Nunca llamar a Firestore fuera de `services/`.
- Los servicios nuevos se exportan desde `services/index.ts`.
- Auto-imports activos: no importar `ref`, `computed`, `navigateTo`, `formatCurrency`, `shortFormatCurrency`.
- **Orden de escritura, invariante:** primero se escribe/borra el movimiento, después se ajusta el summary.
- **Un fallo al ajustar el summary NO revierte la operación** ni la reporta como error al usuario: el documento de la transacción es la fuente de verdad, el summary es derivado. El fallo va a `console.error`.
- El tipo (`income`/`expense`) **no** es editable.
- Eliminación es hard delete.
- **No hay runner de tests en este proyecto.** No inventes uno ni agregues dependencias de testing. La verificación de cada tarea es `npx vue-tsc --noEmit` más los pasos manuales indicados en la tarea. Cuando una tarea diga "verificación manual", ejecútala de verdad contra `npm run dev` antes de dar la tarea por terminada; si no tienes forma de correr la app, deja la tarea marcada como pendiente de verificación manual y dilo explícitamente en vez de asumir que pasa.
- Commits al final de cada tarea, en español, con prefijo `feat:` / `fix:` / `refactor:`.

---

### Task 1: Blindar el summary contra deltas negativos y arreglar la escritura fire-and-forget

Esta tarea no agrega funcionalidad visible; deja el terreno seguro para que edición y borrado puedan restar del summary.

**Files:**
- Modify: `services/summary.service.ts` (función `updateMonthlySummaryIncremental`, rama "el documento no existe")
- Modify: `services/transactions.service.ts` (función `createTransaction`)

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces: `updateMonthlySummaryIncremental(month: string, categoryId: string, amount: number): Promise<ApiResponse<boolean>>` — misma firma que hoy, pero ahora acepta `amount` negativo de forma segura. Las tareas siguientes la usan para revertir.

- [ ] **Step 1: Guardar el caso "delta negativo sin summary previo"**

En `services/summary.service.ts`, dentro de `runTransaction`, la rama `else` (cuando `summaryDoc.exists()` es `false`) hoy crea un summary nuevo con `totalSpent: amount`. Si `amount` es negativo eso produciría un summary corrupto con totales negativos. Antes de construir `newSummary`, agrega la guarda:

```ts
      } else {
        if (amount < 0) {
          console.warn(
            `Se intentó revertir ${amount} sobre el mes ${month} pero no existe summary. Ajuste ignorado.`
          )
          return
        }

        const newSummary: MonthlySummaryInput = {
```

Nota: elimina también la línea suelta `category.data?.budget` que está justo encima de `const newSummary` — es código muerto sin efecto.

- [ ] **Step 2: Sacar la actualización del summary fuera del `runTransaction`**

En `services/transactions.service.ts`, `createTransaction` hoy invoca `updateMonthlySummaryIncremental` sin `await` y **dentro** del `runTransaction` (transacciones anidadas, resultado no esperado). Reemplaza el cuerpo del `try` por:

```ts
    const db = useFirestoreDb();
    if (!db) {
      throw new Error('Firestore database not initialized');
    }
    const transactionId = await runTransaction(db, async (transaction) => {
      const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
      const newTransactionRef = doc(transactionsRef);
      const transactionData = {
        ...data,
        createdAt: getCurrentTimestamp()
      };
      transaction.set(newTransactionRef, transactionData);
      return newTransactionRef.id;
    });

    // El summary es un agregado derivado: se ajusta después de confirmar la
    // escritura y su fallo no invalida el movimiento del usuario.
    if ((data.type ?? 'expense') === 'expense') {
      const summaryResult = await updateMonthlySummaryIncremental(
        data.month,
        data.categoryId,
        data.amount
      );
      if (summaryResult.error) {
        console.error('Error ajustando el resumen mensual:', summaryResult.error);
      }
    }

    response.data = transactionId;
```

Ojo con el cambio de condición: antes era `if (data.type !== 'income')`, ahora `if ((data.type ?? 'expense') === 'expense')`. Es equivalente para los datos existentes y explícito sobre la retrocompatibilidad de movimientos sin `type`.

- [ ] **Step 3: Verificar tipos**

Run: `npx vue-tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 4: Verificación manual — la creación sigue funcionando**

Con `npm run dev`, crea un gasto nuevo desde el home. Debe aparecer en la lista y el gasto total del periodo debe subir por ese monto (recarga la página para confirmar que el summary quedó persistido, no solo el estado local).

- [ ] **Step 5: Commit**

```bash
git add services/summary.service.ts services/transactions.service.ts
git commit -m "fix: esperar el ajuste del resumen mensual fuera de la transaccion de Firestore"
```

---

### Task 2: Servicios `updateTransaction` y `deleteTransaction`

**Files:**
- Modify: `services/transactions.service.ts`
- Modify: `services/index.ts`

**Interfaces:**
- Consumes: `updateMonthlySummaryIncremental(month, categoryId, amount)` de Task 1.
- Produces:
  - `updateTransaction(id: string, data: TransactionUpdate): Promise<ApiResponse<boolean>>`
  - `deleteTransaction(id: string): Promise<ApiResponse<boolean>>`

  `TransactionUpdate` ya existe en `types/transaction.ts` y es `Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>`.

- [ ] **Step 1: Ampliar los imports de Firestore**

En la cabecera de `services/transactions.service.ts`, agrega `getDoc`, `updateDoc` y `deleteDoc` a la lista importada de `firebase/firestore`, y `TransactionUpdate` al import de tipos desde `~/types`:

```ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  type QueryConstraint
} from 'firebase/firestore'
```

```ts
import type {
  Transaction,
  TransactionInput,
  TransactionUpdate,
  TransactionFilters,
  ApiResponse
} from '~/types'
```

- [ ] **Step 2: Escribir el helper de deltas**

Agrega esta función privada (no se exporta) en `services/transactions.service.ts`, después de `createTransaction`. Concentra toda la aritmética del summary en un solo lugar para que update y delete no la dupliquen.

```ts
type SummaryBucket = Pick<Transaction, 'month' | 'categoryId' | 'amount' | 'type'>

/**
 * Ajusta el resumen mensual al pasar un movimiento de un estado a otro.
 * `after` en `null` significa que el movimiento se eliminó.
 *
 * Solo los egresos viven en el resumen: los ingresos se ignoran en ambos lados.
 * Un fallo aquí se registra pero no se propaga: el resumen es un agregado
 * derivado y el movimiento ya quedó escrito.
 */
const adjustSummaryForChange = async (
  before: SummaryBucket,
  after: SummaryBucket | null
): Promise<void> => {
  const isExpense = (t: SummaryBucket) => (t.type ?? 'expense') === 'expense'
  const beforeCounts = isExpense(before)
  const afterCounts = after !== null && isExpense(after)

  const apply = async (month: string, categoryId: string, amount: number) => {
    if (amount === 0) return
    const result = await updateMonthlySummaryIncremental(month, categoryId, amount)
    if (result.error) {
      console.error('Error ajustando el resumen mensual:', result.error)
    }
  }

  // Mismo bucket (mes + categoría): un solo ajuste con la diferencia.
  if (
    beforeCounts &&
    afterCounts &&
    after.month === before.month &&
    after.categoryId === before.categoryId
  ) {
    await apply(after.month, after.categoryId, after.amount - before.amount)
    return
  }

  if (beforeCounts) {
    await apply(before.month, before.categoryId, -before.amount)
  }
  if (afterCounts) {
    await apply(after.month, after.categoryId, after.amount)
  }
}
```

- [ ] **Step 3: Escribir `updateTransaction`**

Debajo del helper:

```ts
/**
 * Actualiza una transacción existente y reajusta el resumen mensual.
 * El tipo (income/expense) no es editable: si viene en `data`, se ignora.
 */
export const updateTransaction = async (
  id: string,
  data: TransactionUpdate
): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, id)
    const snapshot = await getDoc(transactionRef)

    if (!snapshot.exists()) {
      throw new Error('El movimiento que intentas editar ya no existe')
    }

    const before = snapshot.data() as Transaction
    const { type: _ignoredType, ...changes } = data
    const after = { ...before, ...changes }

    await updateDoc(transactionRef, changes)
    await adjustSummaryForChange(before, after)

    response.data = true

  } catch (error) {
    console.error('Error updating transaction:', error)
    response.error = error instanceof Error ? error.message : 'Error al actualizar la transacción'
  }

  return response
}
```

- [ ] **Step 4: Escribir `deleteTransaction`**

```ts
/**
 * Elimina definitivamente una transacción y descuenta su monto del resumen mensual.
 */
export const deleteTransaction = async (id: string): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, id)
    const snapshot = await getDoc(transactionRef)

    if (!snapshot.exists()) {
      throw new Error('El movimiento que intentas eliminar ya no existe')
    }

    const before = snapshot.data() as Transaction

    await deleteDoc(transactionRef)
    await adjustSummaryForChange(before, null)

    response.data = true

  } catch (error) {
    console.error('Error deleting transaction:', error)
    response.error = error instanceof Error ? error.message : 'Error al eliminar la transacción'
  }

  return response
}
```

- [ ] **Step 5: Exportar desde el índice de servicios**

En `services/index.ts`, dentro del bloque "Servicios de transacciones", agrega `updateTransaction` y `deleteTransaction` a la lista de exports.

- [ ] **Step 6: Verificar tipos**

Run: `npx vue-tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add services/transactions.service.ts services/index.ts
git commit -m "feat: agregar servicios de actualizacion y eliminacion de movimientos"
```

---

### Task 3: Métodos `editTransaction` y `removeTransaction` en el composable

**Files:**
- Modify: `composables/useTransactions.ts`

**Interfaces:**
- Consumes: `updateTransaction(id, data)` y `deleteTransaction(id)` de Task 2.
- Produces, en el objeto que retorna `useTransactions()`:
  - `editTransaction(id: string, data: TransactionUpdate): Promise<boolean>`
  - `removeTransaction(id: string): Promise<boolean>`

- [ ] **Step 1: Ampliar imports**

En `composables/useTransactions.ts`, agrega al import desde `~/services`:

```ts
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService,
```

y `TransactionUpdate` al import de tipos desde `~/types`.

- [ ] **Step 2: Escribir `editTransaction`**

Agrégalo después de `addTransaction`, siguiendo su mismo patrón de `loading`/`error`:

```ts
  /**
   * Edita una transacción existente
   * IMPORTANTE: También reajusta el monthly_summary automáticamente
   */
  const editTransaction = async (id: string, data: TransactionUpdate): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const changes: TransactionUpdate = { ...data }
      if (data.date) {
        changes.month = extractMonthFromDate(data.date)
      }

      const result = await updateTransactionService(id, changes)
      if (result.error) {
        error.value = result.error
        return false
      }

      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        const categories = await getCategoriesMap()
        const updated = { ...transactions.value[index], ...changes } as Transaction
        // Se re-adjunta la categoría para no perder ícono ni color en la lista
        transactions.value[index] = {
          ...updated,
          category: categories[updated.categoryId]
        }
      }

      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al editar transacción'
      return false
    } finally {
      loading.value = false
    }
  }
```

- [ ] **Step 3: Escribir `removeTransaction`**

```ts
  /**
   * Elimina definitivamente una transacción
   * IMPORTANTE: También descuenta el monto del monthly_summary
   */
  const removeTransaction = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const result = await deleteTransactionService(id)
      if (result.error) {
        error.value = result.error
        return false
      }

      transactions.value = transactions.value.filter(t => t.id !== id)
      return true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar transacción'
      return false
    } finally {
      loading.value = false
    }
  }
```

- [ ] **Step 4: Exportarlos**

En el `return` del composable, en el bloque `// Métodos de datos`, agrega `editTransaction` y `removeTransaction` justo después de `addTransaction`.

- [ ] **Step 5: Verificar tipos**

Run: `npx vue-tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add composables/useTransactions.ts
git commit -m "feat: exponer edicion y eliminacion de movimientos en useTransactions"
```

---

### Task 4: `CreateMovementForm` reutilizable en modo edición

**Files:**
- Modify: `pages/modules/CreateMovementForm.type.ts`
- Modify: `pages/modules/CreateMovementForm.vue`
- Modify: `components/PillToggle.vue`

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces:
  - Tipo `MovementFormValue` en `CreateMovementForm.type.ts`.
  - `CreateMovementForm` acepta dos props opcionales nuevas: `initialValue?: MovementFormValue` y `lockType?: boolean`. Sigue exponiendo `submit(): MovementPayload | null` sin cambios.
  - `PillToggle` acepta `disabled?: boolean`.

- [ ] **Step 1: Declarar `MovementFormValue`**

En `pages/modules/CreateMovementForm.type.ts`, agrega:

```ts
/**
 * Valor inicial del formulario. Difiere de MovementPayload en que `date` es
 * un string YYYY-MM-DD, que es lo que consume el input nativo de fecha.
 */
export interface MovementFormValue {
  categoryId: string;
  detail: string;
  value: number;
  date: string;
  type: 'income' | 'expense';
}
```

Nota que lleva `categoryId` (un string), **no** un objeto `Category`. Esto es deliberado, ver Step 2.

- [ ] **Step 2: Precargar el formulario desde `initialValue`**

Reemplaza el bloque de `defineProps` y `form` en `pages/modules/CreateMovementForm.vue`:

```ts
const props = defineProps<{
  categories: Category[]
  initialValue?: MovementFormValue
  lockType?: boolean
}>()
```

y el import de tipos pasa a ser:

```ts
import type { Category, MovementPayload, MovementFormValue } from './CreateMovementForm.type'
```

Ahora el `form`:

```ts
// `SelectForm` usa el objeto completo como value del <option>, así que el
// <select> nativo compara por identidad de referencia: hay que buscar el
// objeto dentro de `categories`, no construir uno equivalente.
const initialCategory = props.categories.find(
  category => category.id === props.initialValue?.categoryId
)

const form = reactive({
  type: props.initialValue?.type ?? 'expense' as 'income' | 'expense',
  category: (initialCategory ?? {}) as Category,
  detail: props.initialValue?.detail ?? '',
  value: props.initialValue?.value ?? null as number | null,
  date: props.initialValue?.date ?? ''
})
```

No agregues un `watch` sobre `initialValue`: el consumidor remonta el componente con `:key`, que es más simple y garantiza estado limpio.

- [ ] **Step 3: Pasar `lockType` al toggle**

En el template del formulario:

```html
      <PillToggle
        v-model="form.type"
        :options="TOGGLE_OPTIONS"
        :disabled="lockType"
      />
```

- [ ] **Step 4: Soportar `disabled` en `PillToggle`**

En `components/PillToggle.vue`:

```ts
const props = defineProps<{
  options: Array<{ label: string; value: string }>
  modelValue: string
  disabled?: boolean
}>()
```

y en el botón, bloquear el click y atenuar visualmente:

```html
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :disabled="disabled"
      class="flex-1 py-1.5 px-4 rounded-full text-sm font-medium transition-all"
      :class="[
        modelValue === option.value
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @click="!disabled && emit('update:modelValue', option.value)"
    >
```

Como ahora el template usa `props` a través de `defineProps` asignado a una variable, verifica que el `emit` siga declarado igual (`const emit = defineEmits<...>()`).

- [ ] **Step 5: Verificar tipos**

Run: `npx vue-tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificación manual — no romper el alta**

Con `npm run dev`, abre "+ Agregar" en el home. El formulario debe aparecer **vacío** como siempre, el toggle Gasto/Ingreso debe seguir funcionando, y crear un movimiento debe seguir funcionando. Ninguna prop nueva se pasa desde el home, así que el comportamiento no debe cambiar en nada.

- [ ] **Step 7: Commit**

```bash
git add pages/modules/CreateMovementForm.vue pages/modules/CreateMovementForm.type.ts components/PillToggle.vue
git commit -m "feat: permitir precargar CreateMovementForm y bloquear el tipo"
```

---

### Task 5: Edición y eliminación en el historial

**Files:**
- Modify: `pages/transactions.vue`

**Interfaces:**
- Consumes: `editTransaction` / `removeTransaction` (Task 3), `CreateMovementForm` con `initialValue` y `lockType` (Task 4), `useConfirmMessage().showDialog` (ya existente en `components/ConfirmMessage/useConfirmMessage.ts`).
- Produces: nada que consuman tareas posteriores.

- [ ] **Step 1: Imports y estado de edición**

En el `<script setup>` de `pages/transactions.vue`, agrega a los imports:

```ts
import CreateMovementForm from './modules/CreateMovementForm.vue'
import ConfirmMessage from '~/components/ConfirmMessage/ConfirmMessage.vue'
import { useConfirmMessage } from '~/components/ConfirmMessage/useConfirmMessage'
import type { Transaction, TransactionUpdate, TransactionFilters } from '~/types'
```

(el import de `TransactionFilters` ya existe; fúndelo en una sola línea de tipos)

y declara el estado, después de `const successMessage = ...`:

```ts
const { showDialog } = useConfirmMessage()

const editingTransaction = ref<Transaction | null>(null)
const editFormRef = ref<InstanceType<typeof CreateMovementForm> | null>(null)

const editInitialValue = computed(() => {
  const transaction = editingTransaction.value
  if (!transaction) return undefined

  return {
    categoryId: transaction.categoryId,
    detail: transaction.description,
    value: transaction.amount,
    // `date` puede venir como ISO completo; el input nativo pide YYYY-MM-DD
    date: transaction.date.substring(0, 10),
    type: transaction.type ?? 'expense'
  }
})

const openEdit = (transaction: Transaction) => {
  editingTransaction.value = transaction
}

const closeEdit = () => {
  editingTransaction.value = null
}
```

- [ ] **Step 2: Guardar los cambios**

```ts
// Si la fecha nueva saca al movimiento del periodo que se está viendo, debe
// desaparecer de la lista. El composable no conoce el periodo; la página sí.
const dropIfOutsidePeriod = (id: string) => {
  const { startDate, endDate } = getBillingPeriodRangeFromKey(filters.value.periodKey)
  const transaction = transactions.transactions.value.find(t => t.id === id)
  if (!transaction) return

  const day = transaction.date.substring(0, 10)
  if (day < startDate || day > endDate) {
    transactions.transactions.value = transactions.transactions.value.filter(t => t.id !== id)
  }
}

const saveEdit = async () => {
  if (!editFormRef.value || !editingTransaction.value) return

  const payload = editFormRef.value.submit()
  if (!payload) return

  const id = editingTransaction.value.id
  const changes: TransactionUpdate = {
    categoryId: payload.category?.id || '',
    categoryName: payload.category?.name || '',
    amount: payload.value,
    description: payload.detail,
    date: payload.date.toISOString()
  }

  const success = await transactions.editTransaction(id, changes)
  // En caso de error el banner rojo ya lo muestra y el sheet sigue abierto
  // para que el usuario reintente sin perder lo que escribió.
  if (!success) return

  closeEdit()
  successMessage.value = 'Movimiento actualizado'
  dropIfOutsidePeriod(id)
}
```

`payload.category` es `{}` cuando el movimiento es un ingreso (el `SelectForm` está oculto), por eso el `|| ''`.

- [ ] **Step 3: Eliminar con confirmación**

```ts
const deleteEdit = async () => {
  const transaction = editingTransaction.value
  if (!transaction) return

  const confirmed = await showDialog({
    title: 'Eliminar movimiento',
    message: `¿Eliminar <strong>${transaction.description}</strong> por ${formatCurrency(transaction.amount)}? Esta acción no se puede deshacer.`,
    confirmText: 'Sí, eliminar'
  })
  if (!confirmed) return

  const success = await transactions.removeTransaction(transaction.id)
  if (!success) return

  closeEdit()
  successMessage.value = 'Movimiento eliminado'
}
```

- [ ] **Step 4: Hacer clickeables las filas**

En el template, la fila de cada movimiento (el `div` con `v-for="transaction in groupedTransactions[date]"`) recibe el click y el cursor. Agrega `cursor-pointer` a la lista de clases fijas y el handler:

```html
                  <div
                    v-for="transaction in groupedTransactions[date]"
                    :key="transaction.id"
                    class="flex items-center justify-between p-3 rounded-lg border-l-4 transition-colors cursor-pointer"
                    :class="isIncome(transaction)
                      ? 'bg-green-50 border-green-400 hover:bg-green-100'
                      : 'bg-red-50 border-red-300 hover:bg-red-100'"
                    @click="openEdit(transaction)"
                  >
```

- [ ] **Step 5: Montar el sheet de edición y el diálogo**

Al final del template, justo antes del `</template>` de cierre (fuera del `div` raíz de la página):

```html
  <bottom-sheet
    title="Editar Movimiento"
    allowClose
    :visible="!!editingTransaction"
    showActionButtons
    :actionButtons="{
      closeButton: { label: 'Cancelar', icon: 'X', enabled: true, show: true },
      doneButton: { label: 'Guardar', icon: 'X', enabled: true, show: true },
    }"
    @modalClose="closeEdit"
    @modalDone="saveEdit"
    @modalCancel="closeEdit">
    <template #modal-content>
      <create-movement-form
        v-if="editingTransaction"
        :key="editingTransaction.id"
        ref="editFormRef"
        :categories="categories.sortedCategories.value"
        :initial-value="editInitialValue"
        lock-type
      />

      <button
        type="button"
        class="mt-6 w-full py-2 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
        @click="deleteEdit"
      >
        🗑️ Eliminar movimiento
      </button>
    </template>
  </bottom-sheet>

  <confirm-message />
```

El `:key="editingTransaction.id"` es lo que remonta el formulario con cada movimiento distinto — sin él, abrir un segundo movimiento mostraría los datos del primero.

- [ ] **Step 6: Verificar tipos**

Run: `npx vue-tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Verificación manual completa**

Con `npm run dev`, en `/transactions`:

1. **Editar monto:** toca un gasto, cambia el valor, guarda. El "Balance del Periodo" y el total del día deben ajustarse. Recarga la página: el valor nuevo persiste.
2. **Editar categoría:** cambia un gasto a otra categoría, guarda, ve al home en modo Detalle. La barra de la categoría vieja debe bajar por ese monto y la de la nueva subir por el mismo.
3. **Editar fecha fuera del periodo:** mueve un movimiento a un periodo anterior. Debe desaparecer de la lista; al seleccionar ese periodo en el filtro, debe aparecer allí.
4. **Tipo bloqueado:** al abrir un movimiento, el toggle Gasto/Ingreso debe verse atenuado y no responder al click.
5. **Eliminar:** toca un gasto, "🗑️ Eliminar movimiento", confirma en el diálogo. Desaparece de la lista y el balance del periodo baja. Recarga: sigue eliminado. Cancela el diálogo en otro movimiento: no debe pasar nada.
6. **Ingreso:** abre un ingreso. El selector de categoría no debe mostrarse. Edita su monto y confirma que el "Balance del Periodo" cambia pero el gasto total del home **no**.

- [ ] **Step 8: Commit**

```bash
git add pages/transactions.vue
git commit -m "feat: editar y eliminar movimientos desde el historial"
```
