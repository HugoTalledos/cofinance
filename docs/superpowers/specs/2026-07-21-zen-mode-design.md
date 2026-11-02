# Diseño: Modo "Sin ansiedad" en el inicio

**Fecha:** 2026-07-21
**Estado:** Aprobado

## Objetivo

Reducir la fricción y la granularidad del inicio: el usuario debe poder ver de un
vistazo solo dos números — un saldo **"libre para gastar"** que disminuye conforme
agrega transacciones y un **total gastado** — junto con la lista de pagos
recurrentes para operarla sin salir de la pantalla.

## Decisiones tomadas

| Tema | Decisión |
|------|----------|
| Alcance | Toggle en `index.vue` entre modo "sin ansiedad" (simple) y modo "detalle" (vista actual) |
| Cálculo de "libre para gastar" | `totalRemaining` de `useSummary`: ingresos − gastos del periodo de facturación |
| Pagos recurrentes en el home | Lista interactiva completa: tocar marca como pagado (popup de monto si es variable) y crea la transacción, igual que `/recurring` |
| Persistencia | Modo "sin ansiedad" por defecto; la última elección se guarda en `localStorage` |
| Implementación | Componente compartido: extraer la lista de recurrentes de `recurring.vue` a un componente reutilizable |

## Arquitectura

### 1. Toggle de modo (`pages/index.vue`)

- Switch discreto en el header: dos tabs pequeños "🧘 Simple / 📊 Detalle".
- Estado `viewMode: 'zen' | 'detail'`, por defecto `'zen'`.
- Persistido en `localStorage` bajo la clave `home-view-mode`; se lee en
  `onMounted` (mismo patrón que el checklist de recurrentes).

### 2. Vista "sin ansiedad" (`pages/modules/ZenView.vue`)

- **Card "Libre para gastar"**: protagonista, valor grande. Usa
  `totalRemainingFormatted`. Verde si el saldo es positivo, rojo suave si es
  negativo.
- **Card "Gastado"**: `totalSpentFormatted`, secundaria y más discreta.
- Las cards del modo zen usan markup propio dentro de `ZenView.vue` (no
  `SummaryCard`, que impone tamaño uniforme y no soporta la jerarquía
  protagonista/secundaria ni el color condicional por signo).
- **Lista de pagos recurrentes** interactiva (componente compartido, ver §4).
  Al marcar un pago como pagado se refresca `useSummary` para que el saldo
  "libre para gastar" baje al instante.
- Sin gráfico, sin lista de transacciones, sin desglose por categoría.

### 3. Vista "detalle"

Exactamente la vista actual de `index.vue`: 3 cards (Ingresos / Gastos /
Restante), `BarCharSummary` y lista de transacciones de hoy. Sin cambios de
comportamiento.

### 4. Componente compartido `components/RecurringExpenseList/`

Extraído de `recurring.vue`, siguiendo el patrón de carpeta de `BottomSheet/`:

- `RecurringExpenseList.vue` — lista con checkbox, estado pagado/pendiente,
  monto (fijo / variable / pagado), botón de editar opcional.
- `useRecurringList.ts` — lógica de marcar pagado, popup de monto variable y
  creación de la transacción vía `useTransactions`.
- Emite eventos:
  - `paid` — cuando un pago se marca como pagado (el home refresca el resumen).
  - `edit` — cuando se toca el botón de editar (solo lo usa `/recurring`; en el
    home el botón de editar se oculta vía prop).
- `recurring.vue` conserva: header, barra de progreso y el formulario de
  crear/editar. Pasa a consumir el componente compartido.

### 5. Sin cambios

- Botón flotante / menú de acciones para agregar gasto (disponible en ambos modos).
- Lateral sheet y autenticación.
- Composables `useSummary`, `useRecurringExpenses`, `useTransactions` (solo se
  consumen; no se modifican).

## Flujo de datos

```
index.vue
  ├── viewMode (localStorage) ──> ZenView | vista detalle
  └── ZenView
        ├── useSummary → totalRemaining / totalSpent
        └── RecurringExpenseList
              ├── useRecurringExpenses → expenses, checklist, markPaid
              ├── useTransactions → addTransaction al marcar pagado
              └── emit('paid') → index refresca useSummary
```

## Manejo de errores

- Errores al crear la transacción desde un pago recurrente: toast de error
  (mismo comportamiento que hoy en `/recurring`).
- Sin usuario autenticado: se mantiene el `ErrorMessage` actual del home.

## Pruebas

El proyecto no tiene tests configurados. Verificación manual:

1. El home abre en modo "sin ansiedad" por defecto.
2. El toggle cambia de vista y la elección persiste tras recargar.
3. "Libre para gastar" = ingresos − gastos y disminuye al agregar un gasto.
4. Marcar un recurrente (fijo y variable) desde el home crea la transacción y
   actualiza el saldo al instante.
5. `/recurring` sigue funcionando igual (marcar, editar, eliminar, progreso).
6. `npx vue-tsc --noEmit` sin errores.
