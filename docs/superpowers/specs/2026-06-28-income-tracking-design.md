# Income Tracking — Design Spec
Date: 2026-06-28

## Summary

Add income recording to Cofinance. Users can register incomes from the existing "Agregar gasto" form via a new Gasto/Ingreso toggle. The home screen header is replaced by a horizontal slider showing three summary cards (Ingresos, Gastos, Restante). The bar chart and all existing expense functionality remain untouched.

---

## 1. Data Model

### `types/transaction.ts`

Add one field to `Transaction`:

```typescript
type: 'income' | 'expense'
```

- Existing Firestore documents have no `type` field. Reads default to `'expense'` via `tx.type ?? 'expense'` everywhere the field is consumed.
- For income transactions `categoryId` is sent as `''` and `categoryName` as `''`.
- `TransactionInput` inherits the new field via `Omit<Transaction, 'id' | 'createdAt'>`.
- No Firestore migration required.

### `types/monthly-summary.ts`

No changes. `totalSpent` continues to represent only expense totals.

### `pages/modules/CreateMovementForm.type.ts`

Add `type` to `MovementPayload`:

```typescript
export interface MovementPayload {
  category: Category;
  detail: string;
  value: number;
  date: Date;
  type: 'income' | 'expense';  // new
}
```

---

## 2. Services

### `services/transactions.service.ts`

No changes to existing functions. The `type` field is stored as part of the transaction document automatically because `createTransaction` spreads `TransactionInput`.

---

## 3. Composables

### `composables/useSummary.ts` — `buildSummaryFromTransactions`

Filter transactions by type before aggregation:

```typescript
// Only expense transactions count toward category breakdown and totalSpent
const expenseTxs = transactions.filter(tx => (tx.type ?? 'expense') === 'expense')
const incomeTxs  = transactions.filter(tx => tx.type === 'income')

let totalSpent = 0
for (const tx of expenseTxs) { ... }

const totalIncome = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0)
```

New module-level ref (alongside `currentSummary`):

```typescript
const currentTotalIncome: Ref<number> = ref(0)
```

New computed exported from `useSummary`:

```typescript
totalIncome       // raw number
totalIncomeFormatted  // formatCurrency(totalIncome)
remaining         // totalIncome - totalSpent
remainingFormatted
```

`refreshSummary` and `fetchCurrentMonthSummary` automatically pick up the new field because they call `buildSummaryFromTransactions`.

### `composables/useTransactions.ts`

`formatedTransactions` computed already maps all transactions for list display. Income transactions are included in the raw `transactions` array but `index.vue` filters them out via `todayTransactionsList` (which calls `transactionsList.value.filter(t => t.date === today)`). To prevent incomes from appearing in that list, add one filter:

```typescript
// in formatedTransactions or in todayTransactionsList computed in index.vue
.filter(t => (t.type ?? 'expense') === 'expense')
```

This filter goes in `index.vue`'s `todayTransactionsList` computed (not the composable), keeping the composable neutral.

---

## 4. New Components

### `components/PillToggle.vue`

**Props:**
```typescript
options: Array<{ label: string; value: string }>  // exactly 2 items
modelValue: string
```

**Emits:** `update:modelValue`

**Behavior:** Renders two pill buttons side by side. Active pill has filled background, inactive is outlined. Fully controlled via v-model.

**Usage:**
```vue
<PillToggle
  v-model="form.type"
  :options="[{ label: 'Gasto', value: 'expense' }, { label: 'Ingreso', value: 'income' }]"
/>
```

### `components/SummaryCard.vue`

**Props:**
```typescript
label: string
value: string          // formatted currency string
color: 'green' | 'red' | 'yellow'
sublabel?: string      // shown below label in smaller text (e.g. category name)
```

Color mapping:
- `green`  → text-green-600, border-green-200, bg-green-50
- `red`    → text-red-500, border-red-200, bg-red-50
- `yellow` → text-yellow-600, border-yellow-200, bg-yellow-50

---

## 5. `pages/modules/CreateMovementForm.vue`

Changes:
1. Add `PillToggle` at the top of the form bound to `form.type` (default `'expense'`).
2. `SelectForm` for category is `v-if="form.type === 'expense'"`.
3. `isValid` computed: when `type === 'income'`, category check is skipped.
4. `submit()` includes `type` in the returned `MovementPayload`.

---

## 6. `pages/index.vue` — Header

Replace the current `<header>` block (single `<h1>` amount) with a horizontal slider of three `SummaryCard` instances.

```vue
<header class="w-full overflow-x-auto">
  <div class="flex gap-3 pb-2 min-w-max">
    <SummaryCard label="Ingresos" :value="formatCurrency(totalIncome)" color="green" />
    <SummaryCard
      label="Gastos"
      :value="formatCurrency(displayedExpense)"
      color="red"
      :sublabel="selectedCategoryName || undefined"
    />
    <SummaryCard label="Restante" :value="formatCurrency(totalIncome - totalSpent)" color="yellow" />
  </div>
</header>
```

`displayedExpense` computed:
```typescript
const displayedExpense = computed(() =>
  selectedCategorySpent.value !== null ? selectedCategorySpent.value : totalSpent.value
)
```

`totalIncome` and `totalSpent` come from `useSummary`. `periodLabel` moves below the slider.

Remove: `displayedAmount` computed (replaced by the three cards).

---

## 7. `index.vue` — `createMovement` function

Pass `type` from the form payload to `addTransaction`:

```typescript
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

---

## 8. Backward Compatibility Checklist

| Area | Risk | Mitigation |
|---|---|---|
| Existing transactions in Firestore (no `type` field) | Read as `'expense'` — correct | `tx.type ?? 'expense'` |
| `totalSpent` in MonthlySummary | Already only expense (filter in composable) | Filter in `buildSummaryFromTransactions` |
| Bar chart (`BarCharSummary`) | Uses `categoriesData` which comes from expense-only summary | No change needed |
| `transactions.vue` history page | Not touched in this spec | — |
| `recurring.vue` | Not touched | — |
| `todayTransactionsList` | Income filtered out in `index.vue` computed | One-line filter added |

---

## Out of Scope

- Displaying income in the transactions history page (`transactions.vue`)
- Income categories
- Editing or deleting transactions
