# Servicios de Firebase - Cofinance

Capa de servicios para interactuar con Firestore de forma estructurada y reutilizable.

## Estructura de Archivos

```
services/
├── index.ts                    # Exportación centralizada
├── firebase.ts                 # Inicialización de Firebase
├── categories.service.ts       # CRUD de categorías
├── transactions.service.ts     # Gestión de transacciones
├── summary.service.ts          # Resúmenes mensuales
└── README.md                   # Este archivo
```

## Características

- ✅ **SDK Modular (v9+)**: Usa la API modular de Firebase
- ✅ **Async/Await**: Todas las funciones son asíncronas
- ✅ **Manejo de errores**: Manejo explícito de errores con try-catch
- ✅ **Tipado fuerte**: TypeScript en toda la capa
- ✅ **Sin lógica UI**: Servicios puros sin dependencias de componentes
- ✅ **Operaciones atómicas**: Usa transacciones para operaciones críticas

## Uso

### Importación

```typescript
// Importar servicios específicos
import { createCategory, getCategories } from '~/services'
import { createTransaction, getTransactions } from '~/services'
import { getMonthlySummary } from '~/services'

// O importar todo
import * as FirebaseServices from '~/services'
```

## Servicios de Categorías

### createCategory

Crea una nueva categoría.

```typescript
import { createCategory } from '~/services'
import type { CategoryInput } from '~/types'

const newCategory: CategoryInput = {
  userId: 'user123',
  name: 'Comida',
  budget: 5000
}

const result = await createCategory(newCategory)

if (result.error) {
  console.error(result.error)
} else {
  console.log('Categoría creada con ID:', result.data)
}
```

### updateCategory

Actualiza una categoría existente.

```typescript
import { updateCategory } from '~/services'

const result = await updateCategory('categoryId123', {
  budget: 6000,
  name: 'Comida y Bebidas'
})
```

### deleteCategory

Elimina una categoría.

```typescript
import { deleteCategory, categoryHasTransactions } from '~/services'

// Verificar primero si tiene transacciones
const hasTransactions = await categoryHasTransactions('categoryId123')

if (!hasTransactions) {
  const result = await deleteCategory('categoryId123')
}
```

### getCategories

Obtiene todas las categorías de un usuario.

```typescript
import { getCategories } from '~/services'

const result = await getCategories('user123')

if (result.data) {
  console.log('Categorías:', result.data)
}
```

## Servicios de Transacciones

### createTransaction

Crea una nueva transacción y actualiza automáticamente el resumen mensual.

**Importante**: Esta operación es atómica usando transacciones de Firestore.

```typescript
import { createTransaction } from '~/services'
import type { TransactionInput } from '~/types'
import { getCurrentDate, extractMonthFromDate } from '~/types'

const today = getCurrentDate()

const newTransaction: TransactionInput = {
  userId: 'user123',
  categoryId: 'cat456',
  categoryName: 'Comida',
  amount: 250,
  description: 'Supermercado',
  date: today,
  month: extractMonthFromDate(today)
}

const result = await createTransaction(newTransaction)

// La transacción se crea Y el monthly_summary se actualiza automáticamente
if (result.data) {
  console.log('Transacción creada con ID:', result.data)
}
```

### getTransactions

Obtiene transacciones con filtros opcionales.

```typescript
import { getTransactions } from '~/services'
import type { TransactionFilters } from '~/types'

// Filtrar por mes (más eficiente)
const filters: TransactionFilters = {
  userId: 'user123',
  month: '2026-04'
}

const result = await getTransactions(filters)

// Filtrar por categoría en un mes específico
const categoryFilters: TransactionFilters = {
  userId: 'user123',
  month: '2026-04',
  categoryId: 'cat456'
}

const categoryResult = await getTransactions(categoryFilters)

// Filtrar por rango de fechas
const rangeFilters: TransactionFilters = {
  userId: 'user123',
  dateFrom: '2026-04-01',
  dateTo: '2026-04-30'
}

const rangeResult = await getTransactions(rangeFilters)
```

### getRecentTransactions

Obtiene las N transacciones más recientes.

```typescript
import { getRecentTransactions } from '~/services'

const result = await getRecentTransactions('user123', 10)

if (result.data) {
  console.log('Últimas 10 transacciones:', result.data)
}
```

### Funciones de ayuda

```typescript
import { 
  getCategorySpentInMonth,
  getMonthlyTotal,
  countTransactions 
} from '~/services'

// Total gastado en una categoría en un mes
const categorySpent = await getCategorySpentInMonth('user123', 'cat456', '2026-04')

// Total gastado en un mes
const monthTotal = await getMonthlyTotal('user123', '2026-04')

// Contar transacciones
const count = await countTransactions({ userId: 'user123', month: '2026-04' })
```

## Servicios de Resúmenes Mensuales

### getMonthlySummary

Obtiene el resumen de un mes específico.

```typescript
import { getMonthlySummary, calculateSummaryStats } from '~/services'

const result = await getMonthlySummary('user123', '2026-04')

if (result.data) {
  const summary = result.data
  console.log('Total gastado:', summary.totalSpent)
  console.log('Categorías:', summary.categories)
  
  // Calcular estadísticas
  const stats = calculateSummaryStats(summary)
  console.log('Presupuesto usado:', stats.percentageUsed + '%')
  console.log('Categorías sobre presupuesto:', stats.categoriesOverBudget)
}
```

### getMonthlySummaries

Obtiene múltiples resúmenes con filtros.

```typescript
import { getMonthlySummaries } from '~/services'

// Últimos 6 meses
const result = await getMonthlySummaries({
  userId: 'user123',
  monthFrom: '2025-11',
  monthTo: '2026-04'
})

if (result.data) {
  result.data.forEach(summary => {
    console.log(`${summary.month}: $${summary.totalSpent}`)
  })
}
```

### updateMonthlySummaryIncremental

Actualiza un resumen mensual de forma incremental.

**Nota**: Esta función es llamada automáticamente por `createTransaction`, normalmente no necesitas llamarla directamente.

```typescript
import { updateMonthlySummaryIncremental } from '~/services'

// Incrementar gasto de una categoría
await updateMonthlySummaryIncremental(
  'user123',        // userId
  '2026-04',        // month
  'cat456',         // categoryId
  250,              // amount
  5000              // categoryBudget (opcional)
)
```

### recalculateMonthlySummary

Recalcula completamente un resumen desde las transacciones.

Útil para corregir inconsistencias o después de eliminar transacciones.

```typescript
import { recalculateMonthlySummary } from '~/services'
import { getCategories } from '~/services'

// Obtener presupuestos actuales
const categoriesResult = await getCategories('user123')
const budgetsMap: Record<string, number> = {}

categoriesResult.data?.forEach(cat => {
  budgetsMap[cat.id] = cat.budget
})

// Recalcular resumen
await recalculateMonthlySummary('user123', '2026-04', budgetsMap)
```

### syncCategoryBudget

Sincroniza el presupuesto de una categoría en múltiples meses.

```typescript
import { syncCategoryBudget } from '~/services'
import { getMonthRange, getCurrentMonth } from '~/types'

// Actualizar presupuesto en los últimos 6 meses
const months = getMonthRange('2025-11', getCurrentMonth())

await syncCategoryBudget(
  'user123',
  'cat456',
  6000,         // nuevo presupuesto
  months
)
```

## Operaciones Atómicas

### createTransaction con actualización de resumen

La función `createTransaction` usa transacciones de Firestore para garantizar que:

1. La transacción se crea correctamente
2. El `monthly_summary` se actualiza correctamente
3. Si alguna operación falla, ambas se revierten

```typescript
// Esta operación es ATÓMICA
const result = await createTransaction(transactionData)

// Si result.data existe, significa que:
// ✅ La transacción fue creada
// ✅ El monthly_summary fue actualizado
// ✅ Ambas operaciones fueron exitosas

// Si result.error existe, significa que:
// ❌ Ninguna operación se completó
// ❌ No hay inconsistencias en la base de datos
```

## Manejo de Errores

Todas las funciones retornan un objeto `ApiResponse`:

```typescript
interface ApiResponse<T> {
  data: T | null      // Datos si la operación fue exitosa
  error: string | null // Mensaje de error si falló
  loading: boolean     // Estado de carga (siempre false en el resultado)
}
```

### Patrón recomendado

```typescript
import { createCategory } from '~/services'

async function handleCreateCategory() {
  const result = await createCategory(categoryData)
  
  if (result.error) {
    // Manejar error
    alert(result.error)
    return
  }
  
  // Usar datos
  console.log('ID:', result.data)
}
```

## Consideraciones de Performance

### 1. Queries Optimizadas

Los servicios están diseñados para usar los índices de Firestore eficientemente:

```typescript
// ✅ BUENO: Filtra por mes primero (índice eficiente)
const transactions = await getTransactions({
  userId: 'user123',
  month: '2026-04',
  categoryId: 'cat456'
})

// ⚠️ MENOS EFICIENTE: Rango de fechas amplio
const transactions = await getTransactions({
  userId: 'user123',
  dateFrom: '2025-01-01',
  dateTo: '2026-04-30'
})
```

### 2. Operaciones Batch

Para múltiples operaciones, considera usar batch writes:

```typescript
import { writeBatch, doc } from 'firebase/firestore'
import { useFirestoreDb, COLLECTIONS } from '~/services'

const db = useFirestoreDb()
const batch = writeBatch(db)

// Agregar múltiples operaciones
batch.set(doc(db, COLLECTIONS.CATEGORIES, 'id1'), data1)
batch.set(doc(db, COLLECTIONS.CATEGORIES, 'id2'), data2)
batch.set(doc(db, COLLECTIONS.CATEGORIES, 'id3'), data3)

// Ejecutar todas a la vez
await batch.commit()
```

### 3. Cache de Datos

Considera usar Pinia stores para cachear datos frecuentemente accedidos:

```typescript
// En un store de Pinia
const categoriesStore = useCategoriesStore()

if (categoriesStore.categories.length === 0) {
  // Solo cargar si el cache está vacío
  const result = await getCategories(userId)
  categoriesStore.setCategories(result.data || [])
}
```

## Próximos Pasos

1. **Implementar stores de Pinia** que usen estos servicios
2. **Crear composables** para lógica de UI que use los servicios
3. **Agregar validación** antes de llamar a los servicios
4. **Implementar Cloud Functions** para operaciones en segundo plano

## Referencias

- [Firebase Modular SDK](https://firebase.google.com/docs/web/modular-upgrade)
- [Firestore Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
