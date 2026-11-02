# App web — Administración de categorías (diseño)

Fecha: 2026-11-01
Referencia visual (orientativa): Stitch, proyecto "Personal Finance Analytics Dashboard" (ID `9234370127856276893`), pantalla **"4. Categorías & Presupuestos (Minimalist)"** (screen `7116d380a6114762bfd6a48c8ea4931b`). Se toma el estilo (tarjetas por categoría, botón "+ Crear Categoría", lápiz de editar); casi todo su contenido de presupuestos se omite (ver No-objetivos).

## Intención

Hugo necesita **crear** categorías nuevas y poder **editar** o **eliminar** las existentes. Es gestión, así que vive en la app web, no en el móvil. A futuro quizá maneje presupuestos por categoría; por ahora el presupuesto es solo un dato que se puede fijar.

## Objetivos

- Pantalla **Categorías** en `apps/web` con la lista de categorías activas.
- **Crear** una categoría: nombre, icono, presupuesto opcional y marca "de ahorro".
- **Editar** una categoría: solo **presupuesto** e **icono**.
- **Eliminar** una categoría: en realidad **archivarla** (ver abajo).

## No-objetivos (decididos por Hugo)

- **Administración de tarjetas de crédito:** fuera. Las tarjetas se siguen manejando directamente en Firebase.
- **Cambiar el nombre** de una categoría: no se permite (el nombre se fija al crearla).
- **Cambiar la marca de ahorro** después de crear: no (solo presupuesto e icono son editables).
- **Borrado real** de categorías o de sus movimientos: nunca.
- Del diseño Stitch se omiten: resumen "Presupuesto mensual asignado / Gastado actual / Restante disponible / Estado del plan", barra "Consumo global acumulado", gasto vs presupuesto y estados "Excedido / Límite alcanzado / Dentro del límite" por categoría, vista "Tabla de gestión", tarjetas "Mayor gasto registrado / Mayor ahorro acumulado / Regla 50/30/20", botón "Ajustar Presupuestos", selector de mes, "Filtro Global", "Descargar Reporte", campana. Moneda: COP.

## Anti-objetivos

- Que eliminar una categoría haga desaparecer o altere movimientos ya registrados.
- Que eliminar una categoría de ahorro cambie los totales de periodos pasados (su dinero apartado pasaría a contarse como gasto).
- Que una categoría eliminada siga apareciendo para elegirla en algún lado (registro móvil, filtros o panel de edición de la web).

## Eliminar = archivar (decidido por Hugo)

- Eliminar marca la categoría como archivada en Firestore; el documento y todos sus movimientos se conservan tal cual.
- Una categoría archivada **no se puede volver a seleccionar**: no aparece en el formulario de registro del móvil, ni en los filtros del historial web, ni en la lista de categorías del panel "Editar Transacción", ni en la pantalla Categorías.
- Los movimientos que ya la usan siguen mostrando su categoría (nombre e icono) en dashboard e historial.
- Los cálculos (`computePeriodTotals`, comparativa, ranking) siguen recibiendo **todas** las categorías, incluidas las archivadas, para que `isSaving` y nombres de periodos pasados no cambien.
- Se archiva igual tenga o no movimientos (una sola regla) *(decisión de Claude)*.
- Recuperar una categoría archivada: fuera de alcance por ahora *(decisión de Claude)*.

## Restricciones

- Monorepo existente; la pantalla vive en `apps/web` y usa `@cofinance/core` (ver `CLAUDE.md`). Firestore solo vía servicios de core (ya existen `createCategory`, `updateCategory`, `getCategories`; `deleteCategory` hace borrado real y **no** debe usarse para esto).
- El campo de archivado es nuevo y opcional en el modelo `Category`: los documentos actuales no lo tienen y deben seguir funcionando como activos.
- Esto toca también `apps/mobile`: **todo selector de categoría** del móvil (formulario de registro y, si existe, creación de gastos recurrentes) deja de ofrecer categorías archivadas. El filtro se aplica en quien muestra la lista (p. ej. un `activeCategories`), **no** dentro de `getCategories`, porque los cálculos necesitan todas. Gastos recurrentes ya ligados a una categoría archivada siguen funcionando y mostrando su icono *(decisión de Claude)*. Ningún otro comportamiento del móvil cambia.
- El nombre de una categoría ya no cambia nunca, así que la copia `categoryName` de los movimientos no se desactualiza.

## La pantalla Categorías

### Navegación
- Nuevo ítem del menú lateral **"Categorías"** (icono `pie_chart`), ruta `/categorias` *(decisión de Claude)*.

### Lista
- Una tarjeta por categoría activa, ordenadas por nombre: icono (emoji), nombre, etiqueta "Ahorro" si es de ahorro, presupuesto ("Presupuesto: $X" o "Sin presupuesto").
- En cada tarjeta: lápiz **Editar** y acción **Eliminar**.
- Botón **"+ Crear categoría"** arriba.
- Estados cargando, vacío ("Aún no hay categorías") y error.

### Crear
- Formulario (panel lateral, mismo patrón que "Editar Transacción") con:
  - **Nombre** (obligatorio, recortado; no puede repetir el nombre de **ninguna** categoría, activa o eliminada, sin distinguir mayúsculas — decidido por Hugo; el móvil y `categoryCode` dependen del nombre). Mensaje si se repite: "Ya existe una categoría con ese nombre".
  - **Icono** (un emoji; obligatorio).
  - **Presupuesto** en COP (opcional; vacío = sin presupuesto, se guarda como 0).
  - **Es de ahorro** (sí/no, por defecto no), con una línea que explique que su dinero se aparta y no cuenta como gasto.
- "Crear categoría" deshabilitado mientras sea inválido; al guardar, cierra y la lista se actualiza. Error: el panel sigue abierto con el mensaje.

### Editar
- Mismo panel, con el nombre y la marca de ahorro visibles pero **no editables**; solo **Icono** y **Presupuesto** editables.
- Categorías antiguas sin icono (o con un icono que no es un emoji): se pueden guardar cambiando solo el presupuesto; el icono solo es obligatorio al crear. La validación del icono es "no vacío", no "exactamente un emoji", para no bloquear iconos existentes *(decisión de Claude)*.
- "Guardar cambios" deshabilitado si no hay cambios o es inválido. Mismo manejo de errores.

### Eliminar
- Pide confirmación en la propia página (no `window.confirm`), indicando que los movimientos registrados se conservan y que la categoría ya no podrá elegirse.
- Al confirmar: archiva, la tarjeta desaparece de la lista.

## Efectos en el resto de la web

- **Historial — filtros:** el filtro de categoría solo ofrece categorías activas.
- **Historial — panel "Editar Transacción":** la lista de categorías solo ofrece activas. Si el movimiento que se edita tiene una categoría archivada, esa se muestra como seleccionada (marcada "(eliminada)") para no perder el valor; el usuario puede cambiarla a una activa pero no puede elegir otra archivada *(decisión de Claude)*.
- **Dashboard:** sin cambios visibles; sigue usando todas las categorías para nombres, iconos y cálculos.

## Lo que queda a criterio del builder

- Nombre y forma del campo de archivado (p. ej. `archivedAt?: number`), y si se agrega un servicio `archiveCategory` en core o se reutiliza `updateCategory`.
- Cómo elegir el emoji (campo de texto, lista sugerida o ambos), mientras se guarde un solo emoji.
- Estructura de componentes y composables; reutilizar lo que ya existe del historial (panel lateral, input de monto COP).
- Si el archivado guarda también quién/cuándo, siempre que una categoría sin el campo siga siendo activa.
