# Verificación del control por tarjeta

Implementación en el directorio actual, autorizada por el usuario. Se preservaron los archivos ajenos que ya estaban sin seguimiento.

## Resultado local

- Núcleo: 84 pruebas pasan (incluye saldo inicial, saldo a favor, fechas inclusivas, varias tarjetas, legado, validación de importes y consulta del seguimiento).
- Web: 22 pruebas pasan, incluidas 8 pruebas de los composables web/móvil: respuestas obsoletas, configuración ausente, escritura exitosa seguida de error de lectura y doble envío.
- Comprobación de tipos del núcleo: pasa.
- Generación Nuxt web y móvil: pasan. Advertencias existentes de Browserslist antiguo y prerender deshabilitado por ssr:false.
- Revisión independiente: detectó una confirmación de borrado que sobrevivía al cambio de tarjeta; corregida cerrándola al seleccionar otra tarjeta.

## Decisiones de implementación

Se conserva el modelo Transaction actual con categoryId/categoryName vacíos en abonos, para compatibilidad con consumidores existentes; el servicio de escritura exige tipo card_payment, tarjeta configurada y ausencia de categoría/medio. Cada app utiliza una vista CardControl con formularios integrados y un composable, en lugar de fragmentar los formularios en numerosos componentes. La edición desde el historial web conduce a Tarjetas, donde están el detalle y las acciones de cada abono.

Los saldos se derivan de todas las transacciones desde el inicio del seguimiento, no del resumen mensual. Los abonos no cambian presupuestos, ingresos, gastos ni ahorro. No se migran registros históricos ni se modifican datos remotos.

## Pendientes antes del lanzamiento

No se verificaron los permisos desplegados en Firestore ni se ejecutaron pruebas con sesión real. No hay reglas de Firestore versionadas en este repositorio. Verificar que los usuarios autorizados puedan actualizar los cuatro campos de configuración en credit_cards y registrar/editar/eliminar card_payment en transactions, sin ampliar acceso público.

Con una sesión de prueba, verificar en ambas interfaces: configurar saldo inicial, registrar compra de 100000 y abono de 60000 (deuda 40000); editar abono a 50000 (deuda 50000); eliminarlo (deuda 100000); pagar 120000 (saldo a favor 20000); cambiar de tarjeta con borrado abierto; errores sin conexión; navegación móvil y formularios con teclado. Las compilaciones y pruebas automatizadas no sustituyen esta verificación visual/autenticada.
