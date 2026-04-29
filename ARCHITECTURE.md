# Arquitectura del Proyecto Cofinance

## Stack Tecnológico

- **Frontend**: Nuxt 3 + Vue 3 (Composition API)
- **Estilos**: Tailwind CSS
- **Backend**: Firebase (Firestore)
- **State Management**: Pinia
- **Lenguaje**: TypeScript (strict mode)

## Estructura de Capas

```
┌─────────────────────────────────────────────────────────┐
│                   UI Layer (Components)                  │
│                     pages/*.vue                          │
│                  components/*.vue                        │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Composables Layer                           │
│              composables/*.ts                            │
│          (Lógica reutilizable de UI)                     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                Pinia Stores                              │
│                 stores/*.ts                              │
│           (Estado global de la app)                      │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Services Layer                              │
│              services/*.service.ts                       │
│        (Lógica de negocio y Firebase)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                 Firebase/Firestore                       │
│                   (Base de datos)                        │
└─────────────────────────────────────────────────────────┘
```

## Servicios Implementados

### 1. firebase.ts
- Inicialización de Firebase App
- Singleton de Firestore
- Constantes de colecciones

### 2. categories.service.ts
- `createCategory()` - Crear categoría
- `updateCategory()` - Actualizar categoría
- `deleteCategory()` - Eliminar categoría
- `getCategories()` - Listar categorías
- `getCategoryById()` - Obtener por ID
- `categoryHasTransactions()` - Verificar transacciones

### 3. transactions.service.ts
- `createTransaction()` - Crear transacción (atómica con resumen)
- `getTransactions()` - Obtener con filtros
- `getRecentTransactions()` - Últimas N transacciones
- `getCategorySpentInMonth()` - Total por categoría
- `getMonthlyTotal()` - Total del mes
- `countTransactions()` - Contar transacciones

### 4. summary.service.ts
- `updateMonthlySummaryIncremental()` - Actualización incremental
- `getMonthlySummary()` - Obtener resumen de un mes
- `getMonthlySummaries()` - Obtener múltiples resúmenes
- `calculateSummaryStats()` - Calcular estadísticas
- `syncCategoryBudget()` - Sincronizar presupuesto
- `recalculateMonthlySummary()` - Recalcular desde transacciones
- `deleteMonthlySummary()` - Eliminar resumen

## Modelos de Datos (types/)

### Category
```typescript
{
  id: string
  userId: string
  name: string
  budget: number
  createdAt: number
}
```

### Transaction
```typescript
{
  id: string
  userId: string
  categoryId: string
  categoryName: string    // Desnormalizado
  amount: number
  description: string
  date: string           // YYYY-MM-DD
  month: string          // YYYY-MM (índice)
  createdAt: number
}
```

### MonthlySummary
```typescript
{
  id: string            // userId_month
  userId: string
  month: string         // YYYY-MM
  categories: Record<string, {
    budget: number
    spent: number
  }>
  totalSpent: number
  updatedAt: number
}
```

## Flujo de Datos: Crear Transacción

```
1. Usuario ingresa gasto en UI
         ↓
2. Componente llama createTransaction()
         ↓
3. Service inicia transacción de Firestore
         ↓
4. Se crea documento en 'transactions'
         ↓
5. Se actualiza 'monthly_summary' (atómico)
         ↓
6. Si ambas operaciones OK, commit
         ↓
7. Retorna ID de transacción
         ↓
8. UI se actualiza
```

## Optimizaciones Implementadas

### 1. Índices Compuestos
- `userId + month + date` (más común)
- `userId + month + categoryId + date`
- `userId + categoryId + date`
- `userId + createdAt`

### 2. Desnormalización
- `categoryName` en transactions (evita joins)
- `month` separado de `date` (índice eficiente)

### 3. Operaciones Atómicas
- `createTransaction()` usa transacciones de Firestore
- Garantiza consistencia de datos

### 4. ID Compuesto
- `monthly_summary` usa `userId_month`
- Lectura directa sin query

## Helpers Implementados (types/helpers.ts)

### Fechas
- `formatDateToString()` - Date → "YYYY-MM-DD"
- `extractMonthFromDate()` - → "YYYY-MM"
- `getCurrentDate()`, `getCurrentMonth()`
- `isValidDateString()`, `isValidMonthString()`
- `getPreviousMonth()`, `getNextMonth()`
- `getMonthRange()`

### Presupuesto
- `calculateBudgetPercentage()`
- `isOverBudget()`
- `formatCurrency()`

### IDs
- `generateMonthlySummaryId()`
- `parseMonthlySummaryId()`

## Archivos de Documentación

- `services/README.md` - Documentación de servicios
- `services/examples.ts` - Ejemplos de uso
- `types/README.md` - Documentación de tipos
- `types/firestore-indexes.md` - Índices de Firestore
- `ARCHITECTURE.md` - Este archivo

## Próximos Pasos Recomendados

1. **Implementar Stores de Pinia**
   - `useCategoriesStore()`
   - `useTransactionsStore()`
   - `useSummaryStore()`

2. **Crear Composables de UI**
   - `useCategories()`
   - `useTransactions()`
   - `useMonthlySummary()`

3. **Implementar Componentes**
   - CategoryList.vue
   - TransactionForm.vue
   - MonthlySummaryCard.vue
   - BudgetChart.vue

4. **Configurar Firebase**
   - Crear proyecto en Firebase Console
   - Configurar Firestore
   - Crear índices compuestos
   - Configurar reglas de seguridad

5. **Agregar Autenticación**
   - Firebase Auth
   - Login/Registro
   - Protección de rutas

6. **Optimizaciones Adicionales**
   - Cache con Pinia
   - Paginación de transacciones
   - Cloud Functions para cálculos

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Compilar
npm run build

# Vista previa
npm run preview

# Desplegar índices de Firestore
firebase deploy --only firestore:indexes
```

## Consideraciones de Seguridad

1. **Variables de entorno**: Credenciales en `.env` (nunca en código)
2. **Reglas de Firestore**: Solo usuarios autenticados pueden leer/escribir sus datos
3. **Validación**: Validar datos antes de enviar a Firebase
4. **Índices**: Configurar índices antes de producción

## Performance

- ✅ Queries optimizadas con índices
- ✅ Operaciones atómicas con transacciones
- ✅ Desnormalización estratégica
- ✅ ID compuesto para lecturas directas
- ✅ Helpers para cálculos eficientes

