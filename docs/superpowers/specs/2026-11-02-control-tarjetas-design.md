# Control de saldo y abonos por tarjeta

Estado: aprobado por el usuario; implementado con verificaciones locales. Alcance acordado: web y móvil, saldo y abonos; corte y pago solo informativos.

## Intención y alternativas

Registrar la deuda sin duplicar gastos. Se consideraron control por tarjeta y cuentas bancarias con transferencias. El usuario eligió control por tarjeta: aprovecha las compras actuales y evita introducir cuentas bancarias. No se calcula dinero disponible en banco.

## Comportamiento propuesto

- Sección Tarjetas en ambas apps: banco, saldo pendiente, acceso a movimientos y registro de abono. Permite configurar las tarjetas existentes; crear/eliminar tarjetas queda fuera de esta etapa.
- Configuración: saldo inicial, fecha de inicio del seguimiento y días opcionales de corte y pago (enteros 1–31). Son metadatos, no cambian los períodos actuales ni producen vencimientos o recordatorios.
- El saldo inicial representa la deuda al inicio de la fecha elegida. Se incluyen compras y abonos con fecha igual o posterior, hasta hoy. Los movimientos anteriores conservan sus efectos históricos sobre gastos pero no se vuelven a sumar a la deuda.
- Una tarjeta sin configurar muestra «Configurar saldo», nunca una deuda supuesta de cero. La configuración admite saldo inicial cero o negativo (saldo a favor).
- Saldo = inicial + egresos con medio crédito vinculados a esa tarjeta − abonos. Se calcula sobre todo el seguimiento, independientemente del filtro mensual del historial.
- Abono: tarjeta obligatoria configurada, monto entero COP mayor a cero, fecha entre inicio del seguimiento y hoy, descripción opcional. No requiere categoría ni cuenta bancaria. No se permite cambiar su tipo al editar.
- Se permite pagar más que la deuda: el resultado se presenta como saldo a favor. No se fuerza el saldo a cero.
- Los abonos aparecen en historial y movimientos recientes con etiqueta «Pago de tarjeta», filtro propio y filtro por tarjeta. Nunca cuentan como ingresos, gastos, ahorro ni consumo de presupuesto. El contador de movimientos sí los incluye.
- Permitir editar monto, fecha y descripción del abono y eliminarlo con confirmación; la tarjeta del abono permanece fija. Compras editadas, borradas o movidas entre tarjetas recalculan sus saldos.
- Guardar conserva el formulario ante errores y bloquea envíos simultáneos. Tras éxito se actualizan saldos e historial. Si falla la lectura del seguimiento, mostrar error y reintento, no un saldo parcial.

## Datos y arquitectura

Extender CreditCard con openingBalance, trackingStartDate, statementDay y paymentDay opcionales. Saldo y fecha se guardan juntos; editar el punto inicial advierte que recalcula todo el seguimiento. Conservar IDs y compras existentes.

Agregar tipo explícito card_payment a transactions y modelar campos según tipo: categoría y medio de pago corresponden a gastos, tarjeta corresponde a compras con crédito y abonos. Los registros antiguos sin type siguen siendo gastos. No crear un segundo egreso para representar el abono ni almacenar un saldo mutable independiente.

Servicios Firestore y funciones de cálculo compartidos en packages/core; composables y vistas en cada app. Mantener el ámbito compartido que hoy tienen las tarjetas y movimientos; userId identifica al autor del abono, no introduce aislamiento nuevo. Antes de habilitar edición de tarjetas se verifica compatibilidad con permisos desplegados; no ampliar acceso público.

Auditar todos los cálculos y presentaciones que hoy interpretan «no gasto» como ingreso, especialmente summarizeHistory y sus filtros; revisar agregados persistidos y su recálculo, totales, recurrentes y edición. Solo expense (o tipo ausente legado) entra en gastos y solo income en ingresos. Los abonos no modifican los agregados de gastos.

Consultar movimientos del seguimiento sin límite de recientes ni filtro mensual. Reutilizar consultas por rango y filtrar por tarjeta; documentar cualquier índice nuevo necesario. No migrar automáticamente compras sin tarjeta asignada ni reinterpretar antiguos gastos como abonos.

## Límites y decisiones propuestas

Sin cuotas, intereses automáticos, extractos, conciliación, devoluciones dedicadas, cupos, recordatorios ni cuentas bancarias. Los cargos se pueden registrar como gastos con crédito. No modificar el histórico automáticamente: si existen pagos registrados como gastos, se revisan y corrigen explícitamente por separado.

Son propuestas del diseño: inicio de día inclusivo, permitir saldo a favor, configuración de tarjetas existentes desde ambas apps y edición de abonos sin cambiar tarjeta. Los detalles visuales siguen los patrones actuales.

## Validación requerida

Verificar compra de 100.000 y abono de 60.000: gasto 100.000 y deuda 40.000 con inicial cero. Cubrir frontera del día inicial, movimientos anteriores, varios meses/tarjetas, saldo a favor, tarjeta sin configurar, edición/eliminación, errores de lectura/escritura y compatibilidad con registros sin tipo. Comprobar que abonos no entran en ingresos/gastos/presupuestos en ninguna app y que los filtros los clasifican correctamente. Ejecutar pruebas y comprobación de tipos correspondientes a los cambios; verificar los flujos en ambas interfaces.
