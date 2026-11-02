# App web — Administración de pagos recurrentes (diseño)

Fecha: 2026-11-01
Referencia visual (solo estilo): Stitch, proyecto "Personal Finance Analytics Dashboard" (ID `9234370127856276893`), pantalla **"3. Tarjetas & Pagos Recurrentes (Minimalist)"** (screen `1809805192004f3d9ab6469ac2e761b5`): se toma el estilo de su tabla "Atajos de Pagos Habituales". Todo lo demás se omite (ver No-objetivos).

## Intención

Hugo necesita sobre todo **crear** y **eliminar** pagos recurrentes (arriendo, suscripciones, servicios). **Editar** lo necesita porque los recurrentes actuales quedaron sin **medio de pago**: cuando los marca como pagados en el móvil, el movimiento que se crea no lleva medio de pago ni tarjeta. Es gestión, así que vive en la app web.

## Objetivos

- Pantalla **Pagos recurrentes** en `apps/web` con la lista de recurrentes.
- **Crear**, **editar** (todos los campos) y **eliminar** (borrado definitivo) recurrentes.
- Nuevos datos en cada recurrente: **medio de pago** (débito/crédito y, si es crédito, la tarjeta) y **día de recordatorio** (1–31, opcional).
- **Móvil:** al marcar un recurrente como pagado, el movimiento creado copia su medio de pago y su tarjeta.

## No-objetivos (decididos por Hugo)

- **Recordatorios:** el día de recordatorio **solo se guarda**. No hay avisos, notificaciones, cálculo de vencimientos ni nada que lo use.
- **Administración de tarjetas:** sigue fuera.
- **Archivar recurrentes:** no; eliminar es definitivo.
- Del diseño Stitch se omiten: las tarjetas de crédito con cupo, "Total gastado este mes / Cupo disponible", "Presupuesto mensual / N pagos frecuentes", botón "Registrar Pago" / "Atajo rápido", "Billetera personal / Mis tarjetas", "+ Nueva Tarjeta / Suscripción", "Filtro Global", "Descargar Reporte", campana. Moneda: COP.
- Marcar un recurrente como pagado desde la web: no (eso sigue en el móvil).

## Anti-objetivos

- Que eliminar o editar un recurrente cambie movimientos ya registrados o totales pasados.
- Que un recurrente pasado a Débito conserve una tarjeta colgada (`creditCardId`/`creditCardBank`), o que quitar el día de recordatorio deje un valor viejo.
- Que editar un recurrente borre su estado de pago del periodo (`lastPaidAt`, `lastPaidAmount`).
- Que el móvil cambie en algo distinto a copiar el medio de pago al pagar.

## Restricciones

- Monorepo existente; la pantalla vive en `apps/web` y usa `@cofinance/core` (ver `CLAUDE.md`). Firestore solo vía servicios de core (ya existen `createRecurringExpense`, `updateRecurringExpense`, `deleteRecurringExpense`, `getRecurringExpenses`).
- Campos nuevos **opcionales** en `RecurringExpense`: los documentos actuales no los tienen y deben seguir funcionando igual en el móvil y en "Pagos habituales" del dashboard.
- Borrar campos opcionales (tarjeta al pasar a débito, día de recordatorio al vaciarlo) requiere `deleteField()`; Firestore no acepta `undefined`. Mismo enfoque que `updateTransaction(id, data, removeFields)`.
- Categorías: solo se ofrecen las **activas** (no archivadas). Si un recurrente ya usa una categoría archivada, al editarlo se muestra como "{nombre} (eliminada)" sin perder el valor (mismo patrón que "Editar Transacción").
- Mismas reglas de medio de pago que el registro de gastos: con Crédito la tarjeta es obligatoria si hay tarjetas en `credit_cards`; cambiar la tarjeta escribe `creditCardId` y `creditCardBank`.

## La pantalla Pagos recurrentes

### Navegación
- Nuevo ítem del menú lateral **"Pagos recurrentes"** (icono `event_repeat`), ruta `/recurrentes` *(decisión de Claude)*.

### Lista
- Tabla ordenada por nombre: Nombre (y descripción debajo si hay), Categoría (icono + nombre; nombre actual de la categoría, o el guardado si no existe), Monto ("$X" o "Variable"), Medio de pago ("Débito", "Crédito · Banco", "Crédito", o "Sin medio de pago" resaltado para que se note qué falta completar), Recordatorio ("Día N" o "—"), Acciones (lápiz Editar, basura Eliminar).
- Botón **"+ Nuevo pago recurrente"**.
- Estados cargando, vacío ("Aún no hay pagos recurrentes") y error.

### Crear y editar (panel lateral, mismo patrón que "Editar Transacción")
- **Nombre** (obligatorio, recortado).
- **Descripción** (opcional; es el campo `description` existente).
- **Categoría** (obligatoria; solo activas).
- **Monto:** "Fijo" con valor en COP (entero > 0) o "Variable" (se guarda `fixedAmount: null`; el monto se pide al pagar en el móvil, como hoy).
- **Medio de pago:** Débito / Crédito; con Crédito, **Tarjeta**. Obligatorio al crear y al guardar una edición *(decisión de Claude: el objetivo es que ningún recurrente quede sin medio de pago)*.
- **Día de recordatorio** (opcional, entero 1–31).
- Editar: todos esos campos son editables. Guardar envía solo lo que cambió; cambiar la categoría actualiza también `categoryName`; pasar a Débito elimina `creditCardId`/`creditCardBank`; vaciar el día elimina `reminderDay`. Nunca toca `lastPaidAt`/`lastPaidAmount`.
- "Crear" / "Guardar cambios" deshabilitado si es inválido (o, al editar, si no hay cambios); mensajes de validación visibles; error del servicio visible con el panel abierto; no se cierra mientras guarda.

### Eliminar
- Confirmación en la propia página (no `window.confirm`): "¿Eliminar el pago recurrente {nombre}?" y que los movimientos ya registrados se conservan. Al confirmar, borrado definitivo con `deleteRecurringExpense`.

## Cambio en el móvil

- En `apps/mobile/components/RecurringExpenseList/useRecurringList.ts`, el movimiento que se crea al marcar un recurrente como pagado incluye `paymentMethod`, `creditCardId` y `creditCardBank` del recurrente **cuando existen** (sin escribir campos `undefined`). Recurrentes sin medio de pago siguen creando el movimiento como hoy.

## Decisiones menores tomadas por Claude

- **Dueño de los datos:** igual que el resto de la app, los recurrentes no se filtran por usuario; la pantalla muestra todos. Al crear se guarda el `userId` del usuario actual; editar conserva el `userId` original. `getRecurringExpenses` no cambia.
- **Sin tarjetas en `credit_cards`:** misma regla que el registro de gastos: Crédito se puede guardar sin tarjeta y se muestra como "Crédito".
- **Recurrentes antiguos sin medio de pago:** al editar cualquier campo, "Guardar cambios" exige elegir un medio de pago (es justamente lo que falta completar). Mensaje: "Elige un medio de pago".
- **Fijo / Variable:** pasar a Variable guarda `fixedAmount: null`; pasar a Fijo exige un monto > 0 ("El monto debe ser mayor a 0").
- **Nombres repetidos:** permitidos.
- **"Sin medio de pago" resaltado:** solo en la nueva pantalla; el dashboard ("Pagos habituales") y el móvil no cambian su presentación y siguen leyendo la misma colección.
- **Input de monto COP:** reutilizar el de `apps/web/components/history/EditTransactionPanel.vue` (extraerlo a un componente compartido si conviene).

## Lo que queda a criterio del builder

- Nombres exactos de los campos nuevos (sugerido: `paymentMethod`, `creditCardId`, `creditCardBank`, `reminderDay`).
- Si la lógica de validación y de "qué cambió" vive en `@cofinance/core` como funciones puras con tests (recomendado, como `transaction-edit.ts` y `category-form.ts`).
- Estructura de componentes; reutilizar el panel lateral, el input de monto COP y el patrón de confirmación de categorías.
