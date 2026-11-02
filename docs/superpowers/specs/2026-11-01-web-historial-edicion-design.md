# App web — Historial y edición de movimientos (diseño)

Fecha: 2026-11-01
Referencia visual: Stitch, proyecto "Personal Finance Analytics Dashboard" (ID `9234370127856276893`), pantalla **"2. Historial de Transacciones (Minimalist)"** (screen `3ae01214132e4f8587ee8b2a95774130`). Se descarga con el MCP de Stitch (`get_screen` + `download_file`); el HTML trae la tabla, los filtros y el panel lateral "Editar Transacción".

## Intención

Hugo registra movimientos desde el móvil y a veces se equivoca. Corregirlos es **gestión**, y para él la gestión debe ser una tarea consciente, a propósito algo incómoda: por eso vive en la app web (computador) y **no** en el móvil, que queda para registrar y consultar rápido.

La última vez que corrigió un movimiento cambió descripción, valor y categoría. Ahora también quiere poder corregir el medio de pago y, si es crédito, la tarjeta.

## Objetivos

- Pantalla **Historial de Transacciones** en `apps/web`, fiel al diseño Stitch "Minimalist", con datos reales.
- Desde cada fila de la tabla, una acción **Editar** que abre el panel lateral del diseño y permite corregir el movimiento.

## No-objetivos (decididos por Hugo)

- **Eliminar movimientos:** no en esta entrega (ni icono de basura en la fila ni botón "Eliminar Movimiento" en el panel).
- **Editar la fecha:** la fecha es inmutable; se muestra, no se cambia.
- **Edición en el móvil:** no se agrega. (El composable móvil `useTransactions` tiene `editTransaction`/`removeTransaction` sin UI que los use; se dejan como están.)
- Todo lo del diseño que no tiene datos o no se acordó se omite (misma regla que el dashboard):
  - "Nueva Transacción", "Registrar Movimiento", "Descargar CSV", "Descargar Reporte", "Filtro Global", campana, icono de tarjetas de la cabecera.
  - Columna "Estado" (Completado, etc.), hora y código bajo el concepto.
  - "Al día y revisado" y "Tasa de ahorro" en el resumen.
  - En el panel: "Notas personales" (ese campo no existe) y el selector "Tipo".
  - Filtro de fechas "Últimos 30 días / Mes actual / T3 / Rango personalizado" (se reemplaza por el selector de periodo de facturación).
  - Moneda USD: todo en COP.

## Anti-objetivos

- Que editar deje los totales desalineados: tras guardar, el historial y el dashboard deben reflejar el cambio, y el resumen mensual (`monthly_summary`) debe quedar ajustado como hoy lo hace `updateTransaction`.
- Que un movimiento pasado a débito conserve una tarjeta de crédito colgada (`creditCardId`/`creditCardBank`).
- Guardar sin querer: los cambios solo se escriben al pulsar "Guardar cambios".

## Restricciones

- Monorepo existente; la pantalla vive en `apps/web` junto al dashboard y usa `@cofinance/core` (ver `CLAUDE.md`). Nada de Firestore directo desde componentes/composables: siempre por servicios.
- Escritura con el servicio existente `updateTransaction(id, data)` de `@cofinance/core`, que ya reajusta el resumen mensual e ignora `type`. Si hace falta poder **borrar** campos (tarjeta al pasar a débito), se extiende el servicio en core; Firestore no acepta `undefined` en `updateDoc`.
- Periodos de facturación (día 24) con los helpers de core, igual que el dashboard.
- Datos no filtrados por usuario (igual que hoy en móvil y dashboard).
- El dashboard sigue siendo solo lectura; la edición vive únicamente en el Historial.

## La pantalla

### Navegación
- El menú lateral (`AppShell`) gana el ítem **"Historial de Transacciones"** (icono `receipt_long`), con ruta propia. El ítem activo se marca según la ruta.

### Cabecera y filtros
- Título "Historial de Transacciones".
- Filtros (todos combinables, se aplican en el cliente sobre los movimientos del periodo):
  - **Periodo de facturación**: últimos 12, por defecto el actual (mismo selector que el dashboard).
  - **Buscar**: texto libre sobre la descripción, sin distinguir mayúsculas.
  - **Categoría**: "Todas las categorías" + categorías existentes.
  - **Medio de pago / tarjeta**: "Todos los medios", "Débito" y una opción por tarjeta de `credit_cards` (por banco).
  - **Tipo**: pastillas Todos / Gasto / Ingreso.

### Resumen (4 tarjetas)
Sobre los movimientos que pasan los filtros *(decisión de Claude)*:
- **Movimientos**: cantidad.
- **Ingresos**: suma de ingresos.
- **Egresos**: suma de egresos (incluye categorías de ahorro: aquí es flujo de caja, no "gasto").
- **Flujo neto**: Ingresos − Egresos.
- Sin comparación contra el periodo anterior.

### Tabla
- Columnas: Fecha (día, sin hora), Concepto (descripción), Medio de pago ("Débito", "Crédito · Banco", "Crédito" o vacío), Categoría ("Ingreso" para ingresos), Monto (+ verde ingresos, − egresos), Acciones (icono lápiz "Editar").
- Orden por fecha descendente. Paginación de 10 en 10 con "Mostrando X–Y de N", igual que el dashboard *(decisión de Claude)*; vuelve a la página 1 al cambiar cualquier filtro.
- Estados vacío ("Sin movimientos para estos filtros"), cargando y error, como en el dashboard.

### Panel lateral "Editar Transacción"
- Se abre desde el lápiz de la fila; se cierra con la X, "Cancelar" o Escape sin guardar nada.
- Campos de un **egreso**:
  - **Descripción** (texto, obligatorio).
  - **Monto** en COP (entero > 0, con separador de miles como en el formulario móvil).
  - **Categoría** (lista de categorías).
  - **Medio de pago**: Débito / Crédito.
  - **Tarjeta**: visible solo con Crédito; lista de `credit_cards`; obligatoria si hay tarjetas, igual que en el registro móvil.
  - **Fecha**: visible, no editable.
- Campos de un **ingreso**: solo Descripción y Monto (más la fecha visible). Un ingreso no tiene categoría ni medio de pago.
- **Guardar cambios**: deshabilitado mientras no haya cambios o el formulario sea inválido; mientras guarda muestra estado de carga.
  - Envía solo lo que cambió. Cambiar la categoría actualiza también `categoryName`. Cambiar la tarjeta actualiza `creditCardId` y `creditCardBank`. Pasar a Débito **elimina** `creditCardId` y `creditCardBank` del documento.
  - Movimientos antiguos sin `paymentMethod`: el selector arranca vacío; si el usuario no lo toca, no se escribe.
  - Éxito: cierra el panel, refleja el cambio en la tabla y el resumen sin recargar la página.
  - Error: el panel sigue abierto con el mensaje del servicio; nada se pierde.

## Decisiones menores tomadas por Claude
- Ruta de la pantalla: `/historial`.
- Con un filtro de **categoría** o de **medio de pago/tarjeta** activo, los ingresos quedan fuera (no tienen categoría ni medio de pago).
- El filtro de una tarjeta concreta **no** incluye movimientos de crédito antiguos sin `creditCardId` (misma regla que el dashboard).

## Lo que queda a criterio del builder
- Estructura de componentes/composables de la pantalla y cómo compartir con el dashboard (selector de periodo, formato de medio de pago, paginación).
- Si los filtros viven en la URL.
- Cómo refrescar los datos tras guardar (recarga del periodo o actualización local), siempre que tabla y resumen queden correctos.
- Detalles visuales menores donde el diseño y los datos no encajen 1:1.
