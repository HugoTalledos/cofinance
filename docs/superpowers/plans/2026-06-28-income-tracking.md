# Income Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add income recording and a three-card summary header (Ingresos / Gastos / Restante) to the home screen without breaking existing expense functionality.

**Architecture:** A new `type: 'income' | 'expense'` field on `Transaction` is the single discriminator. The `useSummary` composable filters by type when building summaries, keeping `totalSpent` and `categoriesData` expense-only. Two new reusable components (`PillToggle`, `SummaryCard`) are created in `/components`. No Firestore schema migration is needed — documents without `type` default to `'expense'` at read time.

**Tech Stack:** Nuxt 3, Vue 3 Composition API `<script setup lang="ts">`, Tailwind CSS, Firebase/Firestore, TypeScript strict mode. No test framework — verification is TypeScript (`npx vue-tsc --noEmit`) + manual browser check (`npm run dev`).

## Global Constraints

- All components use `<script setup lang="ts">` — never Options API.
- Tailwind classes must be written as full strings (no dynamic string interpolation) so the JIT scanner picks them up.
- `formatCurrency` and `shortFormatCurrency` are auto-imported globally from `utils/helpers.ts` — do not import them.
- `ref`, `computed`, `reactive`, `onMounted` are auto-imported by Nuxt — do not import them in `.vue` files.
- Services return `{ data: T | null, error: string | null, loading: boolean }`.
- Existing Firestore documents have no `type` field — always read as `tx.type ?? 'expense'`.

---

### Task 1: Add `type` field to data types and guard the service

**Files:**
- Modify: `types/transaction.ts`
- Modify: `pages/modules/CreateMovementForm.type.ts`
- Modify: `services/transactions.service.ts`

**Interfaces:**
- Produces: `Transaction.type: 'income' | 'expense'`, `MovementPayload.type`, safe `createTransaction` that skips monthly summary for incomes.

- [ ] **Step 1: Add `type` to `Transaction` interface**

In `types/transaction.ts`, add the field after `month`:

```typescript
export interface Transaction {
  id: string
  userId: string
  username: string
  categoryId: string
  categoryName: string
  amount: number
  description: string
  /** Fecha en formato YYYY-MM-DD */
  date: string
  /** Mes en formato YYYY-MM para indexación */
  month: string
  /** Tipo de movimiento */
  type: 'income' | 'expense'
  createdAt: number
  category?: Record<string, any>
}
```

`TransactionInput` and `TransactionUpdate` inherit the field automatically via their `Omit` definitions — no changes needed there.

- [ ] **Step 2: Add `type` to `MovementPayload`**

Replace the full content of `pages/modules/CreateMovementForm.type.ts`:

```typescript
export interface Category {
  id: string;
  name: string;
}

export interface MovementPayload {
  category: Category;
  detail: string;
  value: number;
  date: Date;
  type: 'income' | 'expense';
}
```

- [ ] **Step 3: Guard `updateMonthlySummaryIncremental` for income transactions**

In `services/transactions.service.ts`, the `runTransaction` callback currently always calls `updateMonthlySummaryIncremental`. Income transactions must skip it (they have `categoryId: ''` and don't belong in the expense summary).

Replace this block inside the `runTransaction` callback:

```typescript
// BEFORE
transaction.set(newTransactionRef, transactionData);
updateMonthlySummaryIncremental(data.month, data.categoryId, data.amount);
return newTransactionRef.id;
```

With:

```typescript
// AFTER
transaction.set(newTransactionRef, transactionData);
if (data.type !== 'income') {
  updateMonthlySummaryIncremental(data.month, data.categoryId, data.amount);
}
return newTransactionRef.id;
```

- [ ] **Step 4: Type-check**

```bash
npx vue-tsc --noEmit
```

Expected: no errors. If TypeScript reports errors in files that use `TransactionInput` without `type`, those will be fixed in subsequent tasks as each file is updated.

- [ ] **Step 5: Commit**

```bash
git add types/transaction.ts pages/modules/CreateMovementForm.type.ts services/transactions.service.ts
git commit -m "feat: add type field to Transaction and guard income in createTransaction"
```

---

### Task 2: `PillToggle` component

**Files:**
- Create: `components/PillToggle.vue`

**Interfaces:**
- Produces: `<PillToggle v-model="..." :options="[{label, value}]" />` — a two-option pill selector, fully controlled.

- [ ] **Step 1: Create `components/PillToggle.vue`**

```vue
<script setup lang="ts">
defineProps<{
  options: Array<{ label: string; value: string }>
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="flex rounded-full bg-gray-100 p-1 gap-1">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="flex-1 py-1.5 px-4 rounded-full text-sm font-medium transition-all"
      :class="modelValue === option.value
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
```

- [ ] **Step 2: Type-check**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/PillToggle.vue
git commit -m "feat: add PillToggle reusable component"
```

---

### Task 3: `SummaryCard` component

**Files:**
- Create: `components/SummaryCard.vue`

**Interfaces:**
- Produces: `<SummaryCard label="..." value="..." color="green|red|yellow" :sublabel="..." />`

- [ ] **Step 1: Create `components/SummaryCard.vue`**

Note: all Tailwind classes are written as full strings in `:class` object bindings so JIT scanner detects them.

```vue
<script setup lang="ts">
defineProps<{
  label: string
  value: string
  color: 'green' | 'red' | 'yellow'
  sublabel?: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center px-5 py-4 rounded-2xl border min-w-[150px]"
    :class="{
      'bg-green-50 border-green-200': color === 'green',
      'bg-red-50 border-red-200': color === 'red',
      'bg-yellow-50 border-yellow-200': color === 'yellow',
    }"
  >
    <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ label }}</span>
    <span v-if="sublabel" class="text-xs text-gray-400 mt-0.5 max-w-[120px] truncate">{{ sublabel }}</span>
    <span
      class="text-xl font-bold mt-1"
      :class="{
        'text-green-600': color === 'green',
        'text-red-500': color === 'red',
        'text-yellow-600': color === 'yellow',
      }"
    >{{ value }}</span>
  </div>
</template>
```

- [ ] **Step 2: Type-check**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/SummaryCard.vue
git commit -m "feat: add SummaryCard reusable component"
```

---

### Task 4: Update `useSummary` to filter by type and expose income totals

**Files:**
- Modify: `composables/useSummary.ts`

**Interfaces:**
- Consumes: `Transaction.type` from Task 1.
- Produces: new exports `totalIncome`, `totalIncomeFormatted`, `totalRemaining`, `totalRemainingFormatted`. Existing `totalSpent`, `categoriesData` now exclude income transactions.

- [ ] **Step 1: Add `currentTotalIncome` module-level ref**

At the top of `composables/useSummary.ts`, after the existing `currentSummary` line:

```typescript
const currentSummary: Ref<MonthlySummary | null> = ref(null)
const currentTotalIncome: Ref<number> = ref(0)   // ← add this line
```

- [ ] **Step 2: Update `buildSummaryFromTransactions` to filter by type**

Replace the entire `buildSummaryFromTransactions` function:

```typescript
const buildSummaryFromTransactions = (
  periodKey: string,
  transactions: Transaction[],
  categories: Category[]
): MonthlySummary => {
  const categoriesMap: Record<string, CategorySummary> = {}

  for (const cat of categories) {
    categoriesMap[cat.id] = {
      budget: cat.budget,
      spent: 0,
      icon: cat.icon,
      color: cat.color,
    }
  }

  const expenseTxs = transactions.filter(tx => (tx.type ?? 'expense') === 'expense')
  const incomeTxs = transactions.filter(tx => tx.type === 'income')

  currentTotalIncome.value = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0)

  let totalSpent = 0
  for (const tx of expenseTxs) {
    totalSpent += tx.amount
    if (tx.categoryId) {
      if (!categoriesMap[tx.categoryId]) {
        categoriesMap[tx.categoryId] = { budget: 0, spent: 0 }
      }
      categoriesMap[tx.categoryId].spent += tx.amount
    }
  }

  return {
    id: `billing_${periodKey}`,
    month: periodKey,
    categories: categoriesMap,
    totalSpent,
    updatedAt: getCurrentTimestamp(),
  }
}
```

- [ ] **Step 3: Add new computed values inside `useSummary`**

After the existing `totalSpentFormatted` computed, add:

```typescript
const totalIncome = computed(() => currentTotalIncome.value)

const totalIncomeFormatted = computed(() => formatCurrency(totalIncome.value))

const totalRemaining = computed(() => totalIncome.value - totalSpent.value)

const totalRemainingFormatted = computed(() => formatCurrency(totalRemaining.value))
```

- [ ] **Step 4: Export the new computeds from the return statement**

In the `return` object of `useSummary`, add the four new values alongside the existing ones:

```typescript
return {
  // Estado (existing)
  currentSummary,
  summaries,
  loading,
  error,
  currentMonth,

  // Computed - Estadísticas (existing)
  stats,
  hasSummary,
  totalSpent,
  totalSpentFormatted,
  totalBudget,
  totalBudgetFormatted,
  remainingBudget,
  remainingBudgetFormatted,
  budgetPercentage,
  isOverBudget,
  categoriesCount,
  categoriesOverBudget,
  categoriesData,
  categoriesBySpent,

  // Ingresos (new)
  totalIncome,
  totalIncomeFormatted,
  totalRemaining,
  totalRemainingFormatted,

  // Métodos de datos (existing)
  fetchSummary,
  fetchCurrentMonthSummary,
  fetchBillingPeriodSummary,
  fetchSummaries,
  recalculateSummary,

  // Métodos de consulta (existing)
  getCategoryData,
  isCategoryOverBudget,
  getCategoryPercentage,
  compareWithPreviousMonth,
  getTopCategories,
  getSpendingTrend,

  // Utilidades (existing)
  clearError,
  clearSummary,
  clearSummaries,
  refreshSummary
}
```

- [ ] **Step 5: Type-check**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add composables/useSummary.ts
git commit -m "feat: filter income from expense summary and expose totalIncome in useSummary"
```

---

### Task 5: Expose `type` on formatted transactions and update `ItemProps`

**Files:**
- Modify: `composables/useTransactions.ts`
- Modify: `components/ListItem.vue`

**Interfaces:**
- Consumes: `Transaction.type` from Task 1.
- Produces: each item in `transactionsList` now has `type: 'income' | 'expense'`, allowing `index.vue` to filter income from the today list.

- [ ] **Step 1: Add `type` to `formatedTransactions` in `useTransactions.ts`**

In `composables/useTransactions.ts`, find the `formatedTransactions` computed. Replace the mapped object to include `type`:

```typescript
const formatedTransactions = computed(() => {
  return transactions.value.map(transaction => {
    return {
      id: transaction.id,
      categoryId: transaction.categoryId,
      type: transaction.type ?? 'expense',
      title: transaction.description,
      description: transaction.categoryName,
      icon: { icon: transaction.category?.icon , color: transaction.category?.color },
      amount: { value: formatCurrency(transaction.amount), short: shortFormatCurrency(transaction.amount) },
      author: transaction.username,
      date: formatDateToString(new Date(transaction.date)),
      clickable: true
    }
  })
})
```

- [ ] **Step 2: Add `type` to `ItemProps` in `ListItem.vue`**

In `components/ListItem.vue`, add `type` as an optional field to `ItemProps`:

```typescript
export interface ItemProps {
  id: string
  categoryId?: string
  type?: 'income' | 'expense'
  title: string
  description: string
  icon: IconProps
  amount?: AmountProps
  author?: string
  date?: string
  clickable?: boolean
}
```

- [ ] **Step 3: Type-check**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add composables/useTransactions.ts components/ListItem.vue
git commit -m "feat: expose type field on formatted transactions"
```

---

### Task 6: Update `CreateMovementForm` with income/expense toggle

**Files:**
- Modify: `pages/modules/CreateMovementForm.vue`

**Interfaces:**
- Consumes: `PillToggle` from Task 2, `MovementPayload.type` from Task 1.
- Produces: form with Gasto/Ingreso toggle; category selector hidden for incomes; `submit()` returns `type` in payload.

- [ ] **Step 1: Update the script of `CreateMovementForm.vue`**

Replace the entire `<script setup lang="ts">` block:

```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { PropType } from 'vue'
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import InputForm from '~/components/InputForm/InputForm.vue'
import PillToggle from '~/components/PillToggle.vue'
import type { Category, MovementPayload } from './CreateMovementForm.type'
import { useToast } from '~/components/Toast/useToast'
import SelectForm from '~/components/SelectForm.vue'

const { showToast } = useToast()

defineProps({
  categories: {
    type: Array as PropType<Category[]>,
    required: true
  }
})

const TOGGLE_OPTIONS = [
  { label: 'Gasto', value: 'expense' },
  { label: 'Ingreso', value: 'income' },
]

const form = reactive({
  type: 'expense' as 'income' | 'expense',
  category: {} as Category,
  detail: '',
  value: null as number | null,
  date: ''
})

const isValid = computed(() => {
  if (form.type === 'income') {
    return Boolean(form.detail && form.value && form.value > 0)
  }
  return Boolean(form.category.id && form.detail && form.value && form.value > 0)
})

const submit = (): MovementPayload | null => {
  if (!isValid.value) {
    showToast('Porfavor, completa los campos requeridos', 'error')
    return null
  }

  const submissionDate = form.date ? new Date(form.date) : new Date()

  return {
    category: form.category,
    detail: form.detail,
    value: form.value || 0,
    date: submissionDate,
    type: form.type,
  }
}

defineExpose({ submit })
</script>
```

- [ ] **Step 2: Update the template of `CreateMovementForm.vue`**

Replace the entire `<template>` block:

```vue
<template>
  <form @submit.prevent>
    <div class="space-y-4">
      <PillToggle
        v-model="form.type"
        :options="TOGGLE_OPTIONS"
      />

      <SelectForm
        v-if="form.type === 'expense'"
        label="Categoría"
        v-model="form.category"
        :options="categories"
      />

      <InputForm
        id="detail"
        v-model="form.detail"
        label="Detalle"
        placeholder="Ej: Almuerzo de trabajo"
      />

      <InputCurrency
        id="value"
        v-model="form.value"
        :label="form.type === 'income' ? 'Valor del Ingreso' : 'Valor del Movimiento'"
      />

      <InputForm
        id="date"
        v-model="form.date"
        label="Fecha (opcional)"
        type="date"
      />
    </div>
  </form>
</template>
```

- [ ] **Step 3: Type-check**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add pages/modules/CreateMovementForm.vue
git commit -m "feat: add income/expense toggle to CreateMovementForm"
```

---

### Task 7: Update `index.vue` — header slider and income-aware logic

**Files:**
- Modify: `pages/index.vue`

**Interfaces:**
- Consumes: `SummaryCard` (Task 3), `totalIncome`, `totalIncomeFormatted`, `totalRemaining`, `totalRemainingFormatted` from `useSummary` (Task 4), `type` on `transactionsList` items (Task 5), `MovementPayload.type` (Task 1).

- [ ] **Step 1: Update the `useSummary` destructure**

Find the existing line:

```typescript
const { totalSpent, categoriesData, refreshSummary, currentMonth } = useSummary()
```

Replace it with:

```typescript
const { totalSpent, totalIncomeFormatted, totalRemainingFormatted, categoriesData, refreshSummary, currentMonth } = useSummary()
```

- [ ] **Step 2: Add `SummaryCard` import**

After the existing named imports at the top of the script, add:

```typescript
import SummaryCard from '~/components/SummaryCard.vue'
```

- [ ] **Step 3: Replace `displayedAmount` with `displayedExpense`**

Find and remove this computed:

```typescript
const displayedAmount = computed(() =>
  selectedCategorySpent.value !== null ? selectedCategorySpent.value : totalSpent.value
)
```

Add in its place:

```typescript
const displayedExpense = computed(() =>
  selectedCategorySpent.value !== null ? selectedCategorySpent.value : totalSpent.value
)
```

- [ ] **Step 4: Filter income from `todayTransactionsList`**

Find the existing `todayTransactionsList` computed:

```typescript
const todayTransactionsList = computed(() => {
  const today = formatDateToString(new Date())
  return transactionsList.value.filter(t => t.date === today)
})
```

Replace with:

```typescript
const todayTransactionsList = computed(() => {
  const today = formatDateToString(new Date())
  return transactionsList.value.filter(t => t.date === today && (t.type ?? 'expense') === 'expense')
})
```

- [ ] **Step 5: Update `createMovement` to pass `type`**

Find the `createMovement` function. Replace the `body` object:

```typescript
// BEFORE
const body = {
  userId: user.value?.uid || '',
  username: user.value?.displayName || '',
  categoryId: payload.category.id,
  categoryName: payload.category.name,
  amount: payload.value,
  description: payload.detail,
  date: payload.date.toISOString(),
  month: ''
}
```

```typescript
// AFTER
const body = {
  userId: user.value?.uid || '',
  username: user.value?.displayName || '',
  categoryId: payload.type === 'income' ? '' : payload.category.id,
  categoryName: payload.type === 'income' ? '' : payload.category.name,
  amount: payload.value,
  description: payload.detail,
  date: payload.date.toISOString(),
  month: '',
  type: payload.type,
}
```

- [ ] **Step 6: Replace the `<header>` block in the template**

Find the current header:

```vue
<header class="flex flex-col justify-center align-center gap-1">
  <h1 class="text-5xl font-bold tracking-tight text-heading text-center">{{ formatCurrency(displayedAmount) }}</h1>
  <h2 class="text-2xl font-bold tracking-tight text-heading text-center text-gray-500">
    Gasto del periodo<template v-if="selectedCategoryName"> · {{ selectedCategoryName }}</template>
  </h2>
  <h3 class="font-normal text-gray-400 text-center">{{ periodLabel }}</h3>
</header>
```

Replace with:

```vue
<header class="w-full">
  <div class="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory">
    <SummaryCard
      label="Ingresos"
      :value="totalIncomeFormatted"
      color="green"
    />
    <SummaryCard
      label="Gastos"
      :value="formatCurrency(displayedExpense)"
      color="red"
      :sublabel="selectedCategoryName || undefined"
    />
    <SummaryCard
      label="Restante"
      :value="totalRemainingFormatted"
      color="yellow"
    />
  </div>
  <p class="text-sm font-normal text-gray-400 text-center mt-1">{{ periodLabel }}</p>
</header>
```

- [ ] **Step 7: Type-check**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Manual verification**

```bash
npm run dev
```

Open the browser and verify:
1. Home screen shows three summary cards (Ingresos verde, Gastos rojo, Restante amarillo).
2. Open the FAB → "Agregar gasto": the toggle Gasto/Ingreso appears at the top.
3. Switching to "Ingreso" hides the category selector and changes the value label.
4. Save an income — it appears in the header totals but NOT in the today's transaction list.
5. Save an expense — appears in the today list, Gastos card updates after `refreshSummary`.
6. Click a category bar — only the Gastos card changes; Ingresos and Restante stay general.

- [ ] **Step 9: Commit**

```bash
git add pages/index.vue
git commit -m "feat: replace header with income/expense/remaining slider in home screen"
```
