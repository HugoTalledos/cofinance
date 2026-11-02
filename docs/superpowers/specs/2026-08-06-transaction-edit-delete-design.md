# Edición y eliminación de movimientos

**Fecha:** 2026-08-06

## Problema

Un usuario que digita mal el valor de un movimiento y lo guarda no tiene forma de
corregirlo. Un usuario que registra el mismo movimiento dos veces solo puede
compensarlo agregando un ingreso por el mismo valor, lo que distorsiona el
histórico y las métricas futuras.

## Alcance

- Editar un movimiento existente: monto, detalle, categoría y fecha.
- Eliminar un movimiento de forma definitiva.
- Punto de entrada único: la lista del historial en `pages/transactions.vue`.

Fuera de alcance:

- Editar o eliminar desde el home (`pages/index.vue`).
- Cambiar el tipo de un movimiento (Gasto ↔ Ingreso). El toggle se muestra
  deshabilitado al editar; para corregir el tipo, el usuario elimina y vuelve a
  crear.
- Deshacer una eliminación.

## Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Pantalla de entrada | Solo historial | Es donde el usuario revisa y detecta duplicados |
| Interacción | Tap en la fila abre un BottomSheet de edición | Un solo patrón; reutiliza `CreateMovementForm` y `BottomSheet` |
| Campos editables | Monto, detalle, categoría, fecha | Cubre todos los errores de digitación |
| Tipo editable | No | Evita casos de borde en el summary |
| Eliminación | Hard delete | El caso de uso es corregir, no auditar; no contamina consultas |
| Consistencia del summary | Deltas incrementales | Reutiliza el patrón existente; sin queries ni índices nuevos |

### Consistencia de `monthly_summary`: por qué deltas

`monthly_summary` es un agregado derivado que guarda **solo egresos**, indexado
por mes y categoría. Editar monto, categoría o fecha puede mover un movimiento
de bucket.

Se evaluaron tres caminos:

- **Deltas incrementales (elegido).** Reutiliza `updateMonthlySummaryIncremental`
  con montos negativos para revertir. Barato en lecturas, es el patrón que ya usa
  la creación.
- **Recalcular el mes afectado.** Autocorrige desviaciones acumuladas, pero cuesta
  una query completa por edición (dos si cambia el mes) y duplica lógica de
  agregación existente.
- **Cloud Functions con triggers.** Consistencia del lado servidor, pero el
  proyecto no tiene functions desplegadas; la infraestructura es desproporcionada
  para esta feature.

## Diseño

### Capa de servicios

**`services/summary.service.ts`**

`updateMonthlySummaryIncremental` se usa tal cual con montos negativos para
revertir. Único ajuste: cuando el documento de summary **no existe** y llega un
delta negativo, la función no debe crear un summary con total negativo — ignora
el ajuste y registra el caso en consola.

**`services/transactions.service.ts`** — dos funciones nuevas:

- **`updateTransaction(id, data: TransactionUpdate)`** — lee el documento actual,
  escribe los campos nuevos (recalculando `month` desde la fecha) y después ajusta
  el summary con dos deltas: `-amount` sobre el par (`month`, `categoryId`)
  anterior y `+amount` sobre el par nuevo. Si mes y categoría no cambian, los dos
  deltas se colapsan en un solo ajuste (`nuevo - viejo`) para evitar una escritura
  redundante. Si el movimiento es `income`, no toca el summary en ningún lado.

- **`deleteTransaction(id)`** — lee el documento, lo borra y aplica `-amount` al
  summary si es egreso.

Ambas devuelven la forma `{ data, error }` del resto de servicios y se exportan
desde `services/index.ts`.

**Corrección a `createTransaction`:** hoy llama a
`updateMonthlySummaryIncremental` sin `await` y dentro de un `runTransaction`
(fire-and-forget, con transacciones anidadas). La actualización del summary sale
de la transacción de Firestore y pasa a esperarse después de que la escritura
confirme.

**Reglas transversales a las tres operaciones:**

1. **Orden:** primero se escribe o borra el movimiento, después se ajusta el
   summary. Al revés, un fallo dejaría el agregado desalineado sin dato que lo
   respalde.
2. **Fallo del summary no revierte la operación.** El documento de la transacción
   es la fuente de verdad; el summary es derivado. Si el ajuste falla, la
   operación reporta éxito y el error queda en consola.

### Composable

**`composables/useTransactions.ts`** — dos métodos que envuelven los servicios,
siguiendo el patrón de `addTransaction` (manejan `loading` y `error`, se exportan
en el bloque "Métodos de datos", devuelven `boolean`):

- **`editTransaction(id, data)`** — deriva `month` con `extractMonthFromDate`,
  llama al servicio y, si va bien, reemplaza el objeto en su posición actual
  dentro del array `transactions`, re-adjuntando `category` desde el mapa de
  categorías para no perder ícono ni color.
- **`removeTransaction(id)`** — llama al servicio y quita el elemento del array
  local.

No hace falta refetch: los agrupados por fecha, los totales y el balance ya son
`computed` sobre `transactions`.

**Coherencia con el periodo visible:** si el usuario cambia la fecha y saca el
movimiento del periodo que está viendo, debe desaparecer de la lista. Esto se
resuelve en la página, comparando la fecha nueva contra el rango del periodo
activo — no en el composable, que no conoce el periodo.

### UI

**`pages/modules/CreateMovementForm.vue`** — se vuelve reutilizable en vez de
duplicarse. Dos props opcionales:

- `initialValue?: MovementFormValue` — precarga tipo, categoría, detalle, valor y
  fecha. Sin ella, el comportamiento actual de creación no cambia. Se declara en
  `CreateMovementForm.type.ts` con `categoryId: string`, `date: string`
  (`YYYY-MM-DD`, que es lo que consume el input nativo), `detail`, `value` y
  `type`.
- `lockType?: boolean` — muestra el toggle Gasto/Ingreso deshabilitado. Requiere
  agregar una prop `disabled` a `PillToggle`, que hoy no la tiene.

La categoría se precarga **buscando el objeto dentro del array `categories`** por
id. `SelectForm` usa el objeto completo como `value` de cada `<option>`, así que el
`<select>` nativo compara por identidad de referencia: construir un `{ id, name }`
equivalente no preseleccionaría nada. La fecha se precarga con los primeros 10
caracteres del campo `date`.

El formulario no observa `initialValue` con un `watch`: la página lo remonta con
`:key` por id de movimiento, lo que garantiza estado limpio con menos código.

**`pages/transactions.vue`**

- Cada fila del historial pasa a ser clickeable y abre un `BottomSheet` titulado
  "Editar Movimiento", con los botones Cancelar/Guardar del mismo modo que el alta
  en el home.
- Dentro del contenido del sheet, un tercer botón **"🗑️ Eliminar"** en rojo,
  separado visualmente del resto.
- Eliminar dispara `showDialog` de `useConfirmMessage` (el diálogo existente que
  devuelve una promesa), nombrando el movimiento y su monto para que el usuario
  confirme que borra el correcto. Al confirmar, se cierra el sheet y la fila
  desaparece.
- Requiere montar `<confirm-message />` en la página, que hoy no está en ningún
  punto del árbol.
- El feedback de éxito y error reutiliza los banners que la página ya tiene
  (`successMessage` y el banner de error del composable), no el `Toast`: son dos
  sistemas de notificación distintos en el proyecto y no conviene mezclarlos en
  una misma pantalla.

### Manejo de errores

- Validación inválida: la cubre el propio formulario con su toast interno.
- Fallo de red o de Firestore: se muestra en el banner rojo y el sheet permanece
  abierto para que el usuario reintente sin perder lo que escribió.

## Verificación

El proyecto no tiene runner de tests configurado. La verificación es:

- `npx vue-tsc --noEmit`
- Pasada manual:
  - Editar el monto y ver ajustarse el balance del periodo.
  - Mover un movimiento a otra categoría y confirmar que las barras del home
    cambian en ambas categorías.
  - Editar la fecha sacando el movimiento del periodo visible y confirmar que
    desaparece de la lista.
  - Eliminar un duplicado y ver bajar el total.

Agregar un runner de tests es una decisión aparte de esta feature.
