# App web — Dashboard (diseño)

Fecha: 2026-11-01
Referencia visual: Stitch, proyecto "Personal Finance Analytics Dashboard" (ID `9234370127856276893`), pantalla **"1. Dashboard General & Analíticas (Minimalist)"** (screen `1ab5c8cb32954b67bf6481017e441a0c`). Se descarga con el MCP de Stitch (`get_screen` + `download_file`).

## Intención

Hugo registra sus gastos desde el móvil. Quiere una app web, para usar en el computador, donde **ver y analizar** esos datos con más espacio. El objetivo concreto que originó el trabajo de tarjetas de crédito es poder **filtrar y ver cuánto gasta por tarjeta**.

Esta primera entrega es **solo la pantalla Dashboard**. Las otras tres pantallas del diseño (Historial, Tarjetas & Pagos Recurrentes, Categorías & Presupuestos) vendrán en proyectos posteriores.

## Objetivos

- Pantalla Dashboard fiel al diseño Stitch "Minimalist" (tema claro), con datos reales de Firestore.
- Ver un periodo de facturación cualquiera (de los últimos 12) y compararlo con el periodo anterior.
- Filtrar los gastos por tarjeta de crédito.

## No-objetivos (decididos por Hugo)

- **Sin escritura de datos.** La web no crea, edita ni elimina nada: no hay "Nueva Transacción" ni "Pagar con un toque" ni "Registrar Pago Rápido".
- **Todo lo del diseño que no tiene datos en Firestore se omite**, no se simula ni se rellena con datos de ejemplo:
  - "Filtro Global / Todas las carteras activas" y el botón "Filtro Global" de la cabecera de la página.
  - Notificaciones (campana).
  - "Descargar Reporte".
  - KPI "Capacidad de ahorro": la parte "Meta cumplida / Obj." y su barra (no existen metas).
  - Comparación "vs promedio 90d".
  - "Ritmo de consumo" / "Alerta: Umbral crítico" en el ranking.
  - Columna "Estado" (Liquidado / En tránsito) en Últimos movimientos.
  - "Vence en X días" y fechas de vencimiento en Pagos habituales.
  - Moneda "USD": todo se muestra en COP.
- Las otras 3 pantallas: no se construyen y sus enlaces no aparecen en el menú.

## Anti-objetivos

- Que un número del web no coincida con el del móvil para el mismo periodo (restante, gastado, apartado, ingresos). Ambas apps deben calcularlo con la misma lógica.
- Elementos de UI que se ven clicables pero no hacen nada.

## Restricciones

- Monorepo existente (npm workspaces): la web es un workspace nuevo en `apps/web` y consume `@cofinance/core` igual que `apps/mobile` (ver `CLAUDE.md`).
- Firestore ya existe y no cambia: mismas colecciones y campos. Reglas actuales: lectura/escritura para cualquier usuario autenticado.
- Periodos de **facturación**, no meses calendario: empiezan el día `BILLING_START_DAY` (24). Usar los helpers de `@cofinance/core` (`getRecentBillingPeriodKeys`, `getBillingPeriodRangeFromKey`, `formatBillingPeriodLabel`, `getCurrentBillingPeriodKey`).
- Los datos no se filtran por usuario (igual que en móvil hoy): cualquier usuario autenticado ve todas las transacciones.

## Cómo se construye (decisiones de Claude, aceptadas por Hugo en conjunto)

- **Stack:** Nuxt 3 con SSR desactivado + Tailwind, igual que mobile, en `apps/web`. Sin Capacitor.
- **Login:** Google con Firebase Auth en su variante web (popup). Sin sesión, la app muestra solo una pantalla de inicio de sesión.
- **Firebase:** `configureFirebase()` desde un plugin cliente, con las mismas variables `NUXT_PUBLIC_FIREBASE_*` en `apps/web/.env`.
- **Estilo:** tokens de color, tipografías (Geist + JetBrains Mono) y escalas tipográficas tomados del `tailwind.config` embebido en el HTML de Stitch. Iconos: Material Symbols Outlined, como en el diseño.

## La pantalla, sección por sección

### Layout general
- Sidebar izquierdo: marca, un único ítem de navegación "Dashboard General" (activo) y, abajo, la tarjeta de usuario con foto y nombre de la cuenta de Google más un botón de cerrar sesión.
- Cabecera superior: selector de periodo, selector de tarjeta y avatar del usuario.
- Título "Dashboard General" y subtítulo con la etiqueta del periodo (`formatBillingPeriodLabel`).

### Selector de periodo
- Lista los últimos 12 periodos de facturación; por defecto el actual.
- Reemplaza los botones "Este Mes / Q3 / Año en Curso" del diseño (no se construyen).
- "Periodo anterior" = el periodo inmediatamente previo al seleccionado.

### Selector de tarjeta
- Opciones: "Todas las tarjetas" (por defecto) + cada documento de `credit_cards` (por `bank`).
- Con una tarjeta elegida, **los gastos** de toda la pantalla se limitan a egresos **de categorías que no son de ahorro** con ese `creditCardId`: KPI Gastos, Comparativa, Ranking y Últimos movimientos (estos últimos muestran solo esos egresos).
- **El dinero apartado nunca cuenta como gasto de una tarjeta** (decidido por Hugo): los egresos en categorías `isSaving` no aparecen en la vista filtrada por tarjeta aunque tengan `creditCardId` (el formulario móvil marca Crédito por defecto, así que muchos lo tienen).
- Ingresos, Restante y Apartado **no** se filtran por tarjeta: se siguen mostrando globales.
- Gastos antiguos sin `creditCardId` quedan fuera cuando hay una tarjeta seleccionada.

### KPIs (4 tarjetas)
Definiciones idénticas a `apps/mobile/composables/useSummary.ts`:
- **Ingresos:** suma de transacciones `type === 'income'` del periodo.
- **Gastos:** suma de egresos (`type` ausente o `'expense'`) cuya categoría **no** es de ahorro (`isSaving`).
- **Apartado:** suma de egresos en categorías `isSaving`.
- **Restante:** Ingresos − Gastos − Apartado. Ocupa el lugar de "Balance total disponible".
- Cada KPI muestra la variación % frente al periodo anterior ("vs periodo anterior"). Si el periodo anterior vale 0, no se muestra porcentaje.

### Comparativa de gastos por periodo
- Excluye categorías de ahorro (`isSaving`), igual que el KPI Gastos y el Ranking, para que sus filas sumen lo mismo que el KPI *(decisión de Claude)*.
- Por cada categoría con gasto en el periodo actual o el anterior: monto actual, monto anterior, barra y variación %.
- Incluye la fila resumen superior con las variaciones de las categorías principales, como en el diseño.
- Se omite el pie "Gasto global neto optimizado…" y "Ver desglose de dispersión".

### Ranking: mayores gastos
- Top 4 categorías por gasto del periodo (excluye categorías de ahorro).
- Si la categoría tiene presupuesto (`budget > 0`): "Presupuesto: $X" y "% consumido" con barra. Sin presupuesto: solo el monto, sin barra ni %.
- Variación % vs periodo anterior.
- Se omite el botón "Administrar Todos los Presupuestos".

### Últimos movimientos
- Transacciones del periodo, ordenadas por fecha descendente, paginadas de 10 en 10 ("Anterior / Siguiente" y "Mostrando X de N").
- Columnas: Concepto (`description`), Categoría (`categoryName`; "Ingreso" si es ingreso), Fecha, Medio de pago ("Débito", "Crédito · Banco" o vacío si no se registró), Importe (+ verde para ingresos, − para egresos).
- Se omite "Ver todo el historial".

### Pagos habituales
- Lista los gastos recurrentes (`recurring_expenses`) con nombre, categoría, monto (`fixedAmount`, o el último pagado si es variable, o "Variable") y estado **Pagado / Pendiente**.
- El estado es siempre del **periodo actual**, aunque el selector muestre otro: `lastPaidAt` solo guarda el último pago, así que no hay historial para periodos pasados. El encabezado lo indica ("este periodo").
- Sin botones de pago.

### Estados vacíos y errores
- Periodo sin transacciones: KPIs en $0 y mensajes "Sin movimientos en este periodo" en las secciones de lista.
- Error al leer Firestore: mensaje en la sección afectada; el resto de la pantalla sigue funcionando.

## Código compartido

La lógica pura de agregación (totales de ingresos / gastos / apartado y gasto por categoría a partir de transacciones + categorías) y la regla "pagado este periodo" de recurrentes viven hoy dentro de composables de mobile. Se extraen a funciones puras en `@cofinance/core` y **mobile pasa a usarlas** sin cambiar su comportamiento, para que ambas apps calculen lo mismo. El gasto por categoría que calcula mobile hoy incluye categorías de ahorro; la función compartida conserva ese comportamiento y es la web la que excluye las de ahorro al mostrar Comparativa y Ranking *(decisión de Claude)*.

## Decisiones menores tomadas por Claude

- "Ver todos" de Pagos habituales se omite (no hay pantalla destino).
- Variación % de Restante cuando el periodo anterior es negativo o 0: no se muestra porcentaje.
- Con tarjeta seleccionada, el Ranking muestra el % de presupuesto calculado solo con el gasto de esa tarjeta.

## Lo que queda a criterio del builder

- Estructura interna de componentes y composables de `apps/web`.
- Número exacto de lecturas a Firestore (p. ej. leer ambos periodos en una consulta por rango de fechas).
- Detalles visuales menores donde el diseño y los datos reales no encajan 1:1 (p. ej. nombres de categoría largos, iconos de categoría que hoy son emojis).
- Diseño responsive: pensado para escritorio; basta con que no se rompa en anchos de laptop.
- Despliegue: fuera de alcance; basta con que corra con `npm run dev -w apps/web` y genere con `nuxi generate`.
