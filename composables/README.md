# Composables - Cofinance

Composables de Vue 3 que encapsulan la lógica de negocio de la aplicación usando la Composition API.

## Arquitectura

Los composables actúan como una capa intermedia entre los componentes Vue y la capa de servicios:

```
Componentes Vue
      ↓
  Composables (lógica de negocio + estado reactivo)
      ↓
  Services (llamadas a Firebase)
      ↓
   Firestore
```

## Composables Disponibles

### 1. useCategories

Gestiona el estado y operaciones relacionadas con categorías.

#### Estado Reactivo

- `categories` - Array de categorías
- `currentCategory` - Categoría actual seleccionada
- `loading` - Estado de carga
- `error` - Mensaje de error

#### Computed

- `hasCategories` - Verifica si hay categorías
- `categoriesCount` - Número de categorías
- `totalBudget` - Suma de todos los presupuestos
- `sortedCategories` - Categorías ordenadas alfabéticamente

#### Métodos

- `fetchCategories(userId)` - Obtiene categorías del usuario
- `addCategory(data)` - Crea nueva categoría
- `updateCategory(id, data)` - Actualiza categoría
- `removeCategory(id)` - Elimina categoría
- `findCategoryById(id)` - Busca en estado local
- `clearError()` - Limpia errores

#### Ejemplo de Uso

```vue
<script setup lang="ts">
import { useCategories } from '~/composables'
import { onMounted } from 'vue'

const userId = 'user123'

const {
  categories,
  loading,
  error,
  totalBudget,
  fetchCategories,
  addCategory,
  updateCategory,
  removeCategory
} = useCategories()

onMounted(async () => {
  await fetchCategories(userId)
})

const handleAddCategory = async () => {
  const categoryId = await addCategory({
    userId,
    name: 'Nueva Categoría',
    budget: 5000
  })
  
  if (categoryId) {
    console.log('Categoría creada:', categoryId)
  }
}

const handleUpdateBudget = async (categoryId: string) => {
  const success = await updateCategory(categoryId, { budget: 6000 })
  
  if (success) {
    console.log('Presupuesto actualizado')
  }
}
</script>

<template>
  <div>
    <div v-if="loading">Cargando...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>
      <p>Total presupuesto: {{ totalBudget }}</p>
      <ul>
        <li v-for="category in categories" :key="category.id">
          {{ category.name }} - {{ category.budget }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

---

### 2. useTransactions

Gestiona el estado y operaciones relacionadas con transacciones.

#### Estado Reactivo

- `transactions` - Array de transacciones
- `loading` - Estado de carga
- `error` - Mensaje de error
- `currentMonth` - Mes actual

#### Computed

- `hasTransactions` - Verifica si hay transacciones
- `transactionsCount` - Número de transacciones
- `totalAmount` - Suma de montos
- `totalAmountFormatted` - Total formateado como moneda
- `transactionsByCategory` - Agrupadas por categoría
- `transactionsByDate` - Agrupadas por fecha
- `recentTransactions` - Últimas 5 transacciones

#### Métodos

- `fetchTransactions(filters)` - Obtiene transacciones con filtros
- `addTransaction(data)` - Crea nueva transacción (actualiza summary)
- `fetchRecentTransactions(userId, limit)` - Obtiene N más recientes
- `getCategorySpent(userId, categoryId, month)` - Total por categoría
- `getMonthTotal(userId, month)` - Total del mes
- `filterByCategory(categoryId)` - Filtra localmente
- `searchByDescription(query)` - Busca por texto
- `getStatistics()` - Calcula estadísticas

#### Ejemplo de Uso

```vue
<script setup lang="ts">
import { useTransactions } from '~/composables'
import { getCurrentDate, extractMonthFromDate } from '~/types'

const userId = 'user123'

const {
  transactions,
  loading,
  totalAmountFormatted,
  transactionsByDate,
  fetchTransactions,
  addTransaction,
  getStatistics
} = useTransactions()

// Cargar transacciones del mes actual
const loadTransactions = async () => {
  const month = extractMonthFromDate(getCurrentDate())
  await fetchTransactions({
    userId,
    month
  })
}

// Registrar nuevo gasto
const handleAddExpense = async () => {
  const today = getCurrentDate()
  
  const transactionId = await addTransaction({
    userId,
    categoryId: 'cat123',
    categoryName: 'Comida',
    amount: 250,
    description: 'Supermercado',
    date: today,
    month: extractMonthFromDate(today)
  })
  
  if (transactionId) {
    console.log('Gasto registrado:', transactionId)
    // El monthly_summary se actualiza automáticamente
  }
}

// Ver estadísticas
const stats = getStatistics()
console.log('Estadísticas:', stats)
</script>

<template>
  <div>
    <h2>Total: {{ totalAmountFormatted }}</h2>
    
    <div v-for="(txs, date) in transactionsByDate" :key="date">
      <h3>{{ date }}</h3>
      <ul>
        <li v-for="tx in txs" :key="tx.id">
          {{ tx.description }} - {{ tx.amount }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

---

### 3. useSummary

Gestiona el estado y operaciones relacionadas con resúmenes mensuales.

#### Estado Reactivo

- `currentSummary` - Resumen mensual actual
- `summaries` - Array de múltiples resúmenes
- `loading` - Estado de carga
- `error` - Mensaje de error
- `currentMonth` - Mes actual

#### Computed

- `stats` - Estadísticas calculadas del resumen
- `totalSpent` - Total gastado
- `totalBudget` - Total presupuestado
- `remainingBudget` - Presupuesto restante
- `budgetPercentage` - Porcentaje usado
- `isOverBudget` - Verifica si está sobre presupuesto
- `categoriesData` - Datos de categorías con cálculos
- `categoriesBySpent` - Ordenadas por gasto

#### Métodos

- `fetchSummary(userId, month)` - Obtiene resumen de un mes
- `fetchCurrentMonthSummary(userId)` - Resumen del mes actual
- `fetchSummaries(filters)` - Obtiene múltiples resúmenes
- `getCategoryData(categoryId)` - Datos de una categoría
- `isCategoryOverBudget(categoryId)` - Verifica si está sobre presupuesto
- `getCategoryPercentage(categoryId)` - Porcentaje usado
- `compareWithPreviousMonth(summary)` - Compara con mes anterior
- `getTopCategories(limit)` - Top N categorías por gasto
- `getSpendingTrend()` - Tendencia de gasto

#### Ejemplo de Uso

```vue
<script setup lang="ts">
import { useSummary } from '~/composables'
import { getCurrentMonth } from '~/types'

const userId = 'user123'

const {
  currentSummary,
  loading,
  stats,
  totalSpentFormatted,
  totalBudgetFormatted,
  budgetPercentage,
  isOverBudget,
  categoriesData,
  fetchCurrentMonthSummary,
  getCategoryPercentage,
  getTopCategories
} = useSummary()

// Cargar resumen del mes actual
const loadSummary = async () => {
  await fetchCurrentMonthSummary(userId)
}

// Ver top 3 categorías
const topCategories = getTopCategories(3)
</script>

<template>
  <div>
    <div v-if="loading">Cargando...</div>
    <div v-else-if="currentSummary">
      <h2>Resumen de {{ currentSummary.month }}</h2>
      
      <div>
        <p>Gastado: {{ totalSpentFormatted }}</p>
        <p>Presupuesto: {{ totalBudgetFormatted }}</p>
        <p>Porcentaje: {{ budgetPercentage }}%</p>
        <p v-if="isOverBudget" class="text-red-500">
          ⚠️ Sobre presupuesto
        </p>
      </div>
      
      <h3>Por categoría</h3>
      <ul>
        <li 
          v-for="cat in categoriesData" 
          :key="cat.categoryId"
          :class="{ 'text-red-500': cat.isOverBudget }"
        >
          {{ cat.spent }} / {{ cat.budget }} ({{ cat.percentage }}%)
        </li>
      </ul>
      
      <h3>Top 3 Categorías</h3>
      <ul>
        <li v-for="cat in topCategories" :key="cat.categoryId">
          {{ cat.spent }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

---

## Características Comunes

Todos los composables siguen estos principios:

### ✅ Estado Reactivo
- Usan `ref()` para estado mutable
- Usan `computed()` para valores derivados
- Estado actualizado automáticamente en la UI

### ✅ Manejo de Estados
- `loading` - Indica operaciones en curso
- `error` - Captura y expone errores
- Estados independientes por composable

### ✅ Sin Llamadas Directas a Firestore
- Toda comunicación pasa por la capa de servicios
- Separación clara de responsabilidades
- Fácil de testear y mantener

### ✅ Lógica Reutilizable
- Puede usarse en múltiples componentes
- Mantiene estado compartido cuando es necesario
- Cada instancia puede tener estado independiente

### ✅ Operaciones Locales
- Filtrado y búsqueda en el estado local
- Cálculos y transformaciones eficientes
- Reduce llamadas a Firestore

## Patrón de Uso Recomendado

### 1. En Componentes de Página

```vue
<script setup lang="ts">
import { useCategories, useTransactions, useSummary } from '~/composables'
import { onMounted } from 'vue'

const userId = 'user123'

// Usar múltiples composables
const categories = useCategories()
const transactions = useTransactions()
const summary = useSummary()

onMounted(async () => {
  // Cargar datos en paralelo
  await Promise.all([
    categories.fetchCategories(userId),
    transactions.fetchTransactions({ userId, month: '2026-04' }),
    summary.fetchCurrentMonthSummary(userId)
  ])
})
</script>
```

### 2. En Componentes Reutilizables

```vue
<script setup lang="ts">
import { useCategories } from '~/composables'

// Los props pueden determinar qué cargar
const props = defineProps<{
  userId: string
}>()

const { categories, loading, fetchCategories } = useCategories()

// Cargar datos basados en props
watchEffect(async () => {
  if (props.userId) {
    await fetchCategories(props.userId)
  }
})
</script>
```

### 3. Composición de Composables

```vue
<script setup lang="ts">
import { useCategories, useTransactions } from '~/composables'
import { computed } from 'vue'

const categories = useCategories()
const transactions = useTransactions()

// Combinar datos de múltiples composables
const enrichedTransactions = computed(() => {
  return transactions.transactions.value.map(tx => {
    const category = categories.findCategoryById(tx.categoryId)
    return {
      ...tx,
      categoryBudget: category?.budget || 0
    }
  })
})
</script>
```

## Manejo de Errores

Todos los composables exponen un estado `error` reactivo:

```vue
<script setup lang="ts">
const { error, clearError, fetchCategories } = useCategories()

const loadData = async () => {
  await fetchCategories('user123')
  
  if (error.value) {
    // Mostrar notificación de error
    console.error(error.value)
    
    // Opcionalmente limpiar después de mostrar
    setTimeout(() => clearError(), 3000)
  }
}
</script>

<template>
  <div v-if="error" class="error-message">
    {{ error }}
    <button @click="clearError">Cerrar</button>
  </div>
</template>
```

## Optimización de Performance

### Cache Local
Los composables mantienen datos en estado local para reducir llamadas a Firestore:

```typescript
// Primera llamada: fetch desde Firestore
await fetchCategories('user123')

// Búsquedas locales: no requieren Firestore
const category = findCategoryById('cat123')
const filtered = categories.value.filter(c => c.budget > 1000)
```

### Refresh Selectivo
Usa métodos `refresh*` solo cuando sea necesario:

```typescript
// Después de crear una transacción
await addTransaction(data)
// El estado local se actualiza automáticamente

// Solo refresh si necesitas sincronizar con el servidor
await refreshTransactions(filters)
```

## Integración con Pinia

Los composables pueden usarse dentro de stores de Pinia:

```typescript
// stores/app.ts
import { defineStore } from 'pinia'
import { useCategories, useTransactions } from '~/composables'

export const useAppStore = defineStore('app', () => {
  const categories = useCategories()
  const transactions = useTransactions()
  
  return {
    ...categories,
    ...transactions
  }
})
```

## Testing

Los composables son fáciles de testear porque:

1. No tienen dependencias directas de Firestore
2. Usan servicios que pueden ser mockeados
3. Retornan objetos simples de JavaScript

```typescript
import { useCategories } from '~/composables'
import * as services from '~/services'

// Mock del servicio
vi.mock('~/services', () => ({
  getCategories: vi.fn().mockResolvedValue({
    data: [{ id: '1', name: 'Test', budget: 100, userId: 'user1', createdAt: Date.now() }],
    error: null
  })
}))

test('fetchCategories carga categorías', async () => {
  const { categories, fetchCategories } = useCategories()
  
  await fetchCategories('user123')
  
  expect(categories.value).toHaveLength(1)
  expect(categories.value[0].name).toBe('Test')
})
```

## Próximos Pasos

1. **Integrar con componentes Vue** - Usar en páginas y componentes
2. **Agregar más composables** - Por ejemplo, `useAuth` para autenticación
3. **Implementar cache** - Usar Pinia para cache global
4. **Agregar tests** - Pruebas unitarias para cada composable

## Referencias

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Composables Guide](https://vuejs.org/guide/reusability/composables.html)
- [Nuxt 3 Composables](https://nuxt.com/docs/guide/directory-structure/composables)
