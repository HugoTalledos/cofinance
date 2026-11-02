# Verificación manual — edición y eliminación de movimientos

Rama `feat/editar-eliminar-movimientos` (commits `212c1aa..746dbb0`).

**Nada de esto pudo ejecutarse automáticamente:** ningún agente tuvo credenciales de
Firebase ni login de Google. Todo el juicio sobre la rama es lectura de código y
`npx vue-tsc --noEmit` (exit 0). Esta lista está ordenada por probabilidad de estar rota.

- [ ] **1. El sheet de edición abre con los datos correctos.** Tap en una fila del
      historial. Categoría preseleccionada — este es el punto más frágil: depende de
      la identidad de referencia entre el array de categorías y el `find` del
      formulario. Detalle, monto y fecha correctos. El toggle Gasto/Ingreso
      deshabilitado y en gris.

- [ ] **2. Editar solo el monto.** El "Balance del Periodo" y el total del día se
      mueven exactamente en la diferencia.

- [ ] **3. Editar la fecha sacando el movimiento del periodo visible.** Debe
      desaparecer de la lista al guardar. El periodo de facturación arranca el día 24,
      así que mueve la fecha a antes del 24 del mes de inicio o después del 23 del
      siguiente. Cambia el filtro de periodo y confirma que aparece del otro lado.

- [ ] **4. Eliminar con el sheet abierto.** Es lo que arregló el commit `8a3d7d2`: el
      diálogo de confirmación debe verse **por encima** del bottom sheet y ser
      clickeable. **Verifícalo en móvil o en el emulador de Android**, no solo en
      escritorio: el bottom sheet es `md:hidden` y el bug de apilamiento solo aparece
      en viewport móvil.

- [ ] **5. El alta desde el home sigue intacta.** Crear un gasto y un ingreso. Es el
      chequeo de regresión del formulario compartido: no debería haber cambiado nada,
      pero el formulario se reescribió.

- [ ] **6. La eliminación se refleja en el home.** Elimina un duplicado, navega a `/`,
      confirma que el total bajó.

- [ ] **7. Editar un movimiento de tipo Ingreso.** El selector de categoría oculto, y
      el resumen no debe tocarse en absoluto.

- [ ] **8. Mover un movimiento entre categorías y verificarlo en la consola de
      Firestore, no en el home.** Abre el documento `summary_YYYY-MM` en
      `monthly_summary` y confirma que `spent` bajó en la categoría vieja, subió en la
      nueva, y `totalSpent` no cambió. Las barras del home se recalculan desde las
      transacciones y se verán bien aunque el delta esté mal — **este es el único
      chequeo que prueba de verdad la lógica de deltas.**

- [ ] **9. El diálogo de confirmación en `pages/categories/index.vue`.** Es el
      componente compartido que cambió. Eliminar una categoría debe seguir pidiendo
      confirmación y verse bien.

- [ ] **10. Con las DevTools abiertas durante todo lo anterior**, vigila
      `console.error` / `console.warn` con el texto "resumen mensual". Por diseño, un
      fallo del resumen no avisa por la UI: la consola es el único lugar donde aparece.
