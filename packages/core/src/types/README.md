# Tipos de Datos - Cofinance

Documentación completa de las interfaces TypeScript y modelos de datos de Firestore.

## Estructura de Archivos

```
types/
├── index.ts                 # Exporta todos los tipos
├── category.ts             # Interfaces para categorías
├── transaction.ts          # Interfaces para transacciones
├── monthly-summary.ts      # Interfaces para resúmenes mensuales
├── helpers.ts              # Funciones helper
├── firestore-indexes.md    # Índices recomendados de Firestore
└── README.md               # Este archivo
```

## Modelos de Datos

### 1. Category (Categoría)

Representa una categoría de gastos con su presupuesto asignado.

```typescript
interface Category {
  id: string              // ID autogenerado por Firestore
  userId: string          // ID del usuario propietario
  name: string            // Nombre de la categoría (ej: "Comida", "Transporte")
  budget: number          // Presupuesto asignado en la moneda base
  createdAt: number       // Timestamp de creación
}
```

#### Ejemplo de Uso

```typescript
import { Category, CategoryInput } from '~/types'

// Crear una nueva categoría
const newCategory: CategoryInput = {
  userId: 'user123',
  name: 'Comida',
  budget: 5000
}

// Actualizar una categoría existente
const updateData: CategoryUpdate = {
  budget: 6000
}
```

### 2. Transaction (Transacción)

Representa una transacción individual de gasto.

```typescript
interface Transaction {
  id: string              // ID autogenerado por Firestore
  userId: string          // ID del usuario propietario
  categoryId: string      // ID de la categoría
  categoryName: string    // Nombre de la categoría (desnormalizado para queries)
  amount: number          // Monto del gasto
  description: string     // Descripción del gasto
  date: string            // Fecha en formato YYYY-MM-DD
  month: string           // Mes en formato YYYY-MM (índice para queries)
  createdAt: number       // Timestamp de creación
}
```

#### Ejemplo de Uso

```typescript
import { 
  Transaction, 
  TransactionInput,
  formatDateToString,
  extractMonthFromDate,
  getCurrentTimestamp
} from '~/types'

// Crear una nueva transacción
const today = new Date()
const newTransaction: TransactionInput = {
  userId: 'user123',
  categoryId: 'cat456',
  categoryName: 'Comida',
  amount: 250,
  description: 'Compra en supermercado',
  date: formatDateToString(today),
  month: extractMonthFromDate(today)
}

// Query optimizada por mes
const filters: TransactionFilters = {
  userId: 'user123',
  month: '2026-04'  // Consultar solo transacciones de abril 2026
}
```

### 3. MonthlySummary (Resumen Mensual)

Resumen agregado de gastos por mes y categoría.

```typescript
interface MonthlySummary {
  id: string              // ID compuesto: userId_month (ej: "user123_2026-04")
  userId: string          // ID del usuario propietario
  month: string           // Mes en formato YYYY-MM
  categories: Record<string, CategorySummary>  // Resumen por categoría
  totalSpent: number      // Total gastado en el mes
  updatedAt: number       // Timestamp de última actualización
}

interface CategorySummary {
  budget: number          // Presupuesto de la categoría
  spent: number           // Total gastado en la categoría
}
```

#### Ejemplo de Uso

```typescript
import { 
  MonthlySummary,
  MonthlySummaryInput,
  generateMonthlySummaryId,
  getCurrentMonth,
  getCurrentTimestamp
} from '~/types'

// Crear resumen mensual
const userId = 'user123'
const month = getCurrentMonth()
const summaryId = generateMonthlySummaryId(userId, month)

const newSummary: MonthlySummaryInput = {
  id: summaryId,
  userId: userId,
  month: month,
  categories: {
    'cat456': {
      budget: 5000,
      spent: 3250
    },
    'cat789': {
      budget: 3000,
      spent: 1800
    }
  },
  totalSpent: 5050
}

// Calcular estadísticas
const stats: MonthlySummaryStats = {
  totalBudget: 8000,
  totalSpent: 5050,
  remainingBudget: 2950,
  percentageUsed: 63,
  categoriesCount: 2,
  categoriesOverBudget: []
}
```

## Funciones Helper

### Manejo de Fechas

```typescript
import {
  formatDateToString,
  extractMonthFromDate,
  parseDateString,
  getCurrentDate,
  getCurrentMonth,
  isValidDateString,
  isValidMonthString
} from '~/types'

// Formatear fecha
const today = new Date()
const dateStr = formatDateToString(today)  // "2026-04-29"

// Extraer mes
const month = extractMonthFromDate(dateStr)  // "2026-04"

// Validar formato
isValidDateString("2026-04-29")  // true
isValidMonthString("2026-04")    // true

// Obtener fecha/mes actual
const currentDate = getCurrentDate()    // "2026-04-29"
const currentMonth = getCurrentMonth()  // "2026-04"
```

### Cálculos de Presupuesto

```typescript
import {
  calculateBudgetPercentage,
  isOverBudget,
} from '~/types'

// Calcular porcentaje
const percentage = calculateBudgetPercentage(3250, 5000)  // 65

// Verificar si está sobre presupuesto
const overBudget = isOverBudget(5500, 5000)  // true

// Formatear moneda
const formatted = formatCurrency(3250.50)  // "$3,250.50"
```

### Navegación de Meses

```typescript
import {
  getMonthRange,
  getPreviousMonth,
  getNextMonth
} from '~/types'

// Obtener rango de meses
const months = getMonthRange('2026-01', '2026-03')
// ["2026-01", "2026-02", "2026-03"]

// Navegar meses
const prev = getPreviousMonth('2026-04')  // "2026-03"
const next = getNextMonth('2026-04')      // "2026-05"
```

## Patrones de Consulta Optimizados

### Consultar transacciones por mes

```typescript
import { useFirebaseCollection } from '~/composables/useFirebase'
import type { Transaction, TransactionFilters } from '~/types'
import { where } from 'firebase/firestore'

const transactionsCollection = useFirebaseCollection<Transaction>('transactions')

// Query optimizada con índices
const filters: TransactionFilters = {
  userId: 'user123',
  month: '2026-04'
}

const constraints = [
  where('userId', '==', filters.userId),
  where('month', '==', filters.month)
]

const result = await transactionsCollection.queryDocuments(constraints)
```

### Consultar transacciones por categoría

```typescript
const filters: TransactionFilters = {
  userId: 'user123',
  month: '2026-04',
  categoryId: 'cat456'
}

const constraints = [
  where('userId', '==', filters.userId),
  where('month', '==', filters.month),
  where('categoryId', '==', filters.categoryId)
]
```

### Obtener resumen mensual

```typescript
import { generateMonthlySummaryId } from '~/types'

const summaryId = generateMonthlySummaryId('user123', '2026-04')
const summaryCollection = useFirebaseCollection<MonthlySummary>('monthly_summary')
const result = await summaryCollection.getById(summaryId)
```

## Validación de Datos

### Validar transacción antes de crear

```typescript
import { isValidDateString, isValidMonthString } from '~/types'

function validateTransaction(data: TransactionInput): boolean {
  if (!data.userId || !data.categoryId) return false
  if (!data.amount || data.amount <= 0) return false
  if (!isValidDateString(data.date)) return false
  if (!isValidMonthString(data.month)) return false
  if (data.description.trim().length === 0) return false
  
  return true
}
```

## Consideraciones de Performance

### 1. Alto Volumen de Escritura en Transactions

- El campo `month` está indexado para queries rápidas
- El campo `categoryName` está desnormalizado para evitar joins
- Usa batch writes para múltiples transacciones

### 2. Actualización de Resúmenes Mensuales

- El ID compuesto permite lectura directa sin query
- Usa transacciones de Firestore para actualizaciones atómicas
- Considera Cloud Functions para mantener sincronizado

### 3. Queries Optimizadas

- Siempre incluye `userId` en las queries (seguridad + performance)
- Usa el campo `month` para limitar el rango de búsqueda
- Los índices compuestos están documentados en `firestore-indexes.md`

## Próximos Pasos

1. **Configurar índices**: Lee `firestore-indexes.md` para crear los índices necesarios
2. **Implementar composables**: Crea composables específicos para cada colección
3. **Agregar validación**: Implementa validación de datos antes de escribir a Firestore
4. **Cloud Functions**: Considera implementar functions para mantener `monthly_summary` sincronizado

## Referencias

- [Documentación de Firestore](https://firebase.google.com/docs/firestore)
- [Índices en Firestore](https://firebase.google.com/docs/firestore/query-data/indexing)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
