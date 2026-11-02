# Control por tarjeta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consultar deuda y administrar abonos por tarjeta en web y móvil sin duplicar gastos.

**Architecture:** Las transacciones son la fuente del saldo; no se almacena un saldo acumulado mutable. Tipos, validaciones, cálculo y servicios viven en packages/core; cada app aporta sus composables y vistas siguiendo sus patrones actuales. El seguimiento se consulta independientemente del período visible.

**Tech Stack:** TypeScript, Vue 3, Nuxt 3, Firebase/Firestore, Vitest, Capacitor.

**Spec:** `docs/superpowers/specs/2026-11-02-control-tarjetas-design.md` (aprobado por el usuario).

## Global Constraints

- Web y móvil, saldo y abonos; corte y pago solo informativos.
- No se calcula dinero disponible en banco.
- Los registros antiguos sin type siguen siendo gastos.
- No crear un segundo egreso para representar el abono ni almacenar un saldo mutable independiente.
- No migrar automáticamente compras sin tarjeta asignada ni reinterpretar antiguos gastos como abonos.
- Sin cuotas, intereses automáticos, extractos, conciliación, devoluciones dedicadas, cupos, recordatorios ni cuentas bancarias.
- Mantener el ámbito compartido que hoy tienen las tarjetas y movimientos; userId identifica al autor del abono, no introduce aislamiento nuevo.
- Saldo inicial al comenzar la fecha de seguimiento; rango inclusivo hasta hoy. COP enteros, abonos positivos, saldo a favor permitido. Corte/pago opcionales 1–31.
- No crear/eliminar tarjetas en esta etapa. No cambiar períodos existentes. No llamar Firestore desde componentes o composables.

## Review Focus

- Respuesta tardía de una tarjeta anterior: nunca reemplaza la tarjeta seleccionada (tareas 4 y 5).
- Escritura exitosa seguida de fallo al recargar: informar que se guardó, permitir reintentar lectura y no inducir un segundo abono (tareas 4 y 5).
- Medianoche local y fechas inexistentes: usar fechas civiles locales válidas; no desplazar el límite por UTC (tarea 1).
- Abono editado mediante el servicio genérico: no puede perder tarjeta, cambiarla ni adquirir categoría o medio (tarea 2).
- Configuración parcialmente presente en datos heredados: no mostrar saldo cero ni permitir abonar hasta completar ambos campos (tareas 1 y 4).

## Mapa de archivos y dependencias

1. Dominio: `packages/core/src/types/{credit-card,transaction}.ts`, nuevos `cards/{balance,payment-form}.ts` y pruebas; exportaciones en `src/index.ts` y barrels existentes.
2. Persistencia: servicios de tarjetas/transacciones/resúmenes, nuevo `services/card-payments.service.ts`, pruebas de servicios, documentación de índices.
3. Clasificación: analytics, edición y adaptadores existentes de ambas apps.
4. Web: nueva ruta `pages/tarjetas.vue`, `composables/useCardControl.ts`, componentes `components/cards/` y navegación.
5. Móvil: nueva ruta `pages/tarjetas.vue`, composable propio y formularios en `pages/modules/`; integración de listas y edición.
6. Verificación conjunta y documentación operativa.

Dependencias: 1 → 2 → 3 → 4 → 5 → 6. Mantener commits acotados por tarea, sin incluir archivos ajenos que ya estén modificados o sin seguimiento. Al ejecutar, aplicar using-git-worktrees y registrar una línea base de tests/tipos antes de modificar producto. No desplegar ni modificar datos reales durante las pruebas.

### Tarea 1: Contratos, validación y saldo

**Archivos:** modificar `packages/core/src/types/credit-card.ts`, `types/transaction.ts`, `src/index.ts`; crear `packages/core/src/cards/balance.ts`, `payment-form.ts`, `balance.test.ts`, `payment-form.test.ts`.

**Interfaces:**
- CreditCard agrega `openingBalance?: number`, `trackingStartDate?: string`, `statementDay?: number`, `paymentDay?: number`.
- Transaction admite `type: 'card_payment'` con tarjeta obligatoria y sin categoría/medio; preservar variante legado con type ausente. Conservar nombres públicos TransactionInput/TransactionUpdate con tipos distributivos cuando corresponda, evitando perder campos al usar Omit sobre la unión.
- `CardSettingsInput = { openingBalance: number; trackingStartDate: string; statementDay: number | null; paymentDay: number | null }`.
- `CardPaymentForm = { amount: number; date: string; description: string }`.
- `isCardConfigured(card: CreditCard): boolean`.
- `computeCardBalance(card: CreditCard, transactions: Transaction[], today: string): number | null` (null sin configuración).
- `validateCardSettings(input: CardSettingsInput, today: string): string | null`.
- `validateCardPayment(form: CardPaymentForm, card: CreditCard, today: string): string | null`.
- `buildCardPaymentInput(form: CardPaymentForm, card: CreditCard, author: { userId: string; username: string }): TransactionInput`; descripción vacía se guarda como «Pago de tarjeta».

- [ ] Escribir pruebas con fixtures: inicial 0 + compra 100000 − abono 60000 = 40000; abono 120000 produce −20000; compras anteriores al inicio/futuras/otra tarjeta/débito/sin tarjeta no suman. El día inicial sí suma; varios meses sí suman. Tipo ausente con crédito sí suma. Configuración incompleta devuelve null.
- [ ] Añadir validaciones: rechazar NaN, infinitos, fracciones y enteros no seguros; abono cero/negativo, fecha anterior al seguimiento/futura/inexistente; permitir inicial negativo y cero; aceptar días 1 y 31, rechazar 0/32, permitir null. Comprobar fecha local alrededor de medianoche sin convertir YYYY-MM-DD a UTC para comparar.
- [ ] Ejecutar `npm test -w packages/core -- src/cards`; confirmar fallos por contratos aún inexistentes.
- [ ] Implementar contratos y funciones puras, exportarlos. Adaptar accesos a campos opcionales en consumidores para mantener compilación; no modificar reglas de negocio fuera de esta tarea.
- [ ] Ejecutar el mismo comando y `npm run typecheck -w packages/core`; ambos deben pasar.
- [ ] Commit: `feat: add card tracking domain and balance rules`.

### Tarea 2: Persistencia de configuración y abonos

**Archivos:** modificar `packages/core/src/services/credit-cards.service.ts`, `transactions.service.ts`, `summary.service.ts`, `services/index.ts`, `types/firestore-indexes.md`; crear `services/card-payments.service.ts`, `services/card-payments.service.test.ts`, `services/credit-cards.service.test.ts`, `services/transactions.service.test.ts`.

**Interfaces:**
- `updateCreditCardSettings(id: string, input: CardSettingsInput): Promise<ApiResponse<boolean>>`; valida y guarda inicial/fecha juntos, null elimina metadato opcional.
- `getCardTrackingTransactions(card: CreditCard, today: string): Promise<ApiResponse<Transaction[]>>`; consulta rango completo inclusivo con getTransactions y filtra creditCardId; no usa límite ni mes. Rechaza tarjeta sin configurar.
- `createCardPayment(cardId: string, form: CardPaymentForm, author: { userId: string; username: string }): Promise<ApiResponse<string>>`.
- `updateCardPayment(id: string, form: CardPaymentForm): Promise<ApiResponse<boolean>>`; eliminación usa deleteTransaction existente.

- [ ] Escribir mocks Firestore que prueben configuración en una escritura, borrado de días opcionales, inexistencia de tarjeta y propagación de permission-denied.
- [ ] Probar creación/edición leyendo tarjeta vigente y validando fecha/monto; un abono nunca llama al agregado de gastos. Servicio genérico updateTransaction debe impedir cambios de tarjeta/tipo/categoría/medio en abonos, incluso con removeFields. Eliminar abono no toca agregados.
- [ ] Probar consulta sin límite/mes, error de lectura sin datos parciales y recálculo de resumen con gasto 100000 + abono 60000 + ingreso 200000: gasto persistido 100000. Los helpers getMonthlyTotal/getCategorySpentInMonth deben sumar solo gastos, conservando legado.
- [ ] Ejecutar `npm test -w packages/core -- src/services`; confirmar fallos esperados.
- [ ] Implementar servicios con validación en la frontera de escritura; crear ID fuera del callback reintentable de Firestore. No tratar un fallo de agregado posterior como fallo de la escritura principal. Auditar recálculo de summary.service y sumas directas de transactions.service.
- [ ] Documentar consulta de rango (sin índice compuesto nuevo si se filtra tarjeta en memoria), necesidad de permisos de actualización en credit_cards para los usuarios ya autorizados y comprobación de reglas desplegadas antes de lanzamiento. Si reglas no están versionadas/accesibles, registrar explícitamente la verificación pendiente, sin inventarlas ni abrir acceso público.
- [ ] Ejecutar `npm test -w packages/core -- src/services` y `npm run typecheck -w packages/core`; PASS.
- [ ] Commit: `feat: persist card settings and payment movements`.

### Tarea 3: Clasificación consistente en ambas apps

**Archivos:** modificar `packages/core/src/analytics/{history,period}.ts`, sus tests, `editing/transaction-edit.ts` y test; `apps/web/utils/format.ts`, `components/history/{HistoryFilters,HistoryTable,EditTransactionPanel}.vue`, `components/dashboard/RecentMovements.vue`, `composables/useDashboardData.ts`; `apps/mobile/composables/useTransactions.ts`, `components/ListItem.vue` y los consumidores encontrados por la auditoría.

**Interfaces:** HistoryFilters.type agrega card_payment; filtro tarjeta incluye compras y abonos, filtro débito/categoría solo gastos. summarizeHistory cuenta todos pero suma ingresos únicamente con income. La edición genérica deriva los abonos al formulario específico de tareas 4/5; no permite transformarlos.

- [ ] Añadir pruebas a history.test.ts: expense 100000, income 200000, abono 60000 → count 3, income 200000, expenses 100000, net 100000; filtro ingresos excluye abono; filtro tarjeta lo incluye; categoría/débito lo excluyen. period.test.ts verifica que presupuesto, ahorro y restantes no cambian por un abono.
- [ ] Ejecutar `npm test -w packages/core -- src/analytics src/editing`; confirmar fallo por clasificación actual.
- [ ] Corregir cálculos y etiquetas con discriminación explícita; mostrar «Pago de tarjeta» sin signo/estilo de ingreso. Auditar con `rg -n 'type|reduce|categoryId|paymentMethod' apps/mobile apps/web packages/core/src` los accesos relevantes, incluidas compras recurrentes, recientes, grupos por categoría y formularios. No hacer refactorizaciones ajenas.
- [ ] Ejecutar tests anteriores y typecheck core; PASS. Guardar edición de abonos para formularios específicos, conservando edición actual de compras/ingresos.
- [ ] Commit: `fix: exclude card payments from income and expenses`.

### Tarea 4: Control por tarjeta en web

**Archivos:** crear `apps/web/pages/tarjetas.vue`, `composables/useCardControl.ts`, `composables/useCardControl.test.ts`, `components/cards/{CardOverview,CardSettingsPanel,CardPaymentPanel,CardMovementList}.vue`, `components/cards/CardPaymentPanel.test.ts`; modificar `components/AppShell.vue`, `pages/historial.vue` y componentes de historial para abrir edición específica.

**Interfaces:** `useCardControl()` devuelve refs `cards`, `selectedCardId`, `movements`, `balance`, `loading`, `saving`, `error`, más `reload(): Promise<void>`, `selectCard(id: string): Promise<void>`, `saveSettings(input: CardSettingsInput)`, `createPayment(form: CardPaymentForm)`, `editPayment(id: string, form: CardPaymentForm)`, `removePayment(id: string)`; mutaciones retornan `Promise<{ saved: boolean; error: string | null }>` para distinguir fallo de escritura de fallo de recarga. Consume servicios tareas 1/2 y autor de useAuth.

- [ ] Escribir pruebas de composable: cambiar A→B con respuesta tardía de A conserva B; configuración incompleta muestra null; error del seguimiento no presenta saldo parcial; guardado exitoso con recarga fallida retorna saved true y error de lectura. Doble envío simultáneo produce una escritura.
- [ ] Escribir prueba de formulario: error conserva datos; éxito cierra; descripción opcional; tarjeta fija al editar; fecha inválida impide enviar. Reutilizar patrón SSR de tests de paneles existentes para render y probar lógica reactiva en composable.
- [ ] Ejecutar `npm test -w apps/web -- composables/useCardControl.test.ts components/cards/CardPaymentPanel.test.ts`; confirmar fallos esperados.
- [ ] Implementar composable y paneles usando servicios compartidos, token de solicitud y bloqueo saving. Listado muestra «Configurar saldo»/deuda/saldo a favor, días informativos y movimientos completos. Confirmar eliminación y cambio del punto inicial. Sin crear/eliminar tarjetas. Ruta usa AppShell y navegación existente; edición desde historial reutiliza panel y recarga historial al guardar.
- [ ] Ejecutar tests de tarea y `npm run generate:web`; PASS. Verificar navegador con datos de prueba: vacío, loading, error/reintento, varios meses y edición/eliminación; nunca crear movimientos reales para probar sin contexto autorizado.
- [ ] Commit: `feat: add web card balance and payment management`.

### Tarea 5: Control por tarjeta en móvil

**Archivos:** crear `apps/mobile/pages/tarjetas.vue`, `composables/useCardControl.ts`, `pages/modules/{CardSettingsForm,CardPaymentForm,CardMovementList}.vue`; modificar `components/AppShell/BottomNav.vue`, `composables/useCreditCards.ts`, `composables/index.ts` y puntos de edición en `components/ListItem.vue`/consumidores. Crear `apps/web/composables/mobileCardControl.test.ts` para probar el composable móvil mediante import relativo en el runner existente, sin añadir dependencias ni runner nuevo.

**Interfaces:** mismo contrato público de useCardControl web, implementado con auth/estado móvil y servicios core; useCreditCards mantiene una única lista compartida y se refresca tras configurar. Importar Vue explícitamente para que el composable móvil sea comprobable desde Vitest; los tests simulan globals de auth/formato como hacen los tests existentes.

- [ ] Repetir tests de estado relevantes sobre el composable móvil: respuesta tardía, error después de escritura, envío simultáneo, edición/eliminación y actualización de la caché compartida. Ejecutar `npm test -w apps/web -- composables/mobileCardControl.test.ts`; fallo esperado antes de implementar.
- [ ] Implementar ruta y formularios con componentes móviles existentes (BottomSheet/InputCurrency y navegación), mismo texto y reglas que web. Añadir abono desde Tarjetas; no sobrecargar el formulario de compras. Las listas recientes identifican abonos y abren su editor, nunca el editor de gastos. Recargar al volver a la ruta para reflejar compras modificadas.
- [ ] Ejecutar prueba anterior y `npm run generate`; PASS. Verificar viewport móvil: teclado, monto/fecha, mensajes, cancelar, guardar, eliminar, historial y navegación de regreso. Verificar límites de fechas con hora local.
- [ ] Commit: `feat: add mobile card balance and payment management`.

### Tarea 6: Integración y entrega

**Archivos:** actualizar `CLAUDE.md` (tarjetas ya no son solo lectura), spec (estado aprobado), crear `docs/superpowers/2026-11-02-control-tarjetas-verificacion.md` con resultados reales y pendientes.

- [ ] Ejecutar `npm test -w packages/core`, `npm test -w apps/web`, `npm run typecheck -w packages/core`, `npm run generate:web`, `npm run generate`. Esperado: PASS; comparar fallos con línea base, no declarar éxito si hay fallos nuevos. Las generaciones sustituyen una compilación Android que no es necesaria para esta lógica.
- [ ] Verificar caso integrado con fixtures/entorno de prueba: inicial 0 al 2026-10-01, compra 100000 ese día, abono 60000 el 2026-11-01 → deuda 40000 aunque historial solo muestre noviembre. Editar abono a 50000 → 50000; eliminarlo → 100000. Abono 120000 → saldo a favor 20000. Compra anterior al inicio no cambia deuda. Mover compra a otra tarjeta actualiza ambos saldos.
- [ ] Comprobar consistencia web/móvil, datos antiguos sin type, tarjetas sin configurar, campos de corte/pago sin efecto sobre períodos, aislamiento de errores y exclusión de abonos en todos los totales. Registrar verificación real de permisos o dejarla como pendiente de lanzamiento si no hay acceso; no afirmar prueba de Firebase basándose en mocks.
- [ ] Revisar `git diff --check` y diff final; actualizar documentación con comandos/resultados, limitaciones y cualquier comprobación manual pendiente.
- [ ] Commit: `docs: document card tracking and validation`.

## Revisión del plan

Cobertura revisada contra el diseño: inicio y saldo a favor (1), servicios y permisos (2), clasificación/histórico (3), configuración/abonos web (4), paridad móvil (5), evidencia y límites de lanzamiento (6). Interfaces de formularios/servicios coinciden entre tareas. No se necesita migración automática ni dependencia nueva. La implementación debe preservar los archivos ajenos ya presentes en el árbol de trabajo.
