# Consumo por tarjeta en resumen móvil

Cambio solicitado: retirar la administración móvil y mostrar consumo por tarjeta mediante desplazamiento horizontal desde Resumen. La administración web permanece disponible.

Implementado: carrusel nativo con scroll-snap, resumen en la primera vista y gráfico circular en la segunda. Deslizar a la izquierda avanza; botones Resumen/Tarjetas permiten navegación alternativa. El gráfico usa el mismo período del resumen, incluye únicamente compras con crédito (también registros legados sin type), agrupa por tarjeta y excluye abonos/ingresos/débito. Montos y porcentajes aparecen en la leyenda; tocar un segmento o tarjeta resalta su consumo. Compras sin tarjeta conservan un grupo «Sin tarjeta asignada». Incluye carga, error/reintento y estado sin consumo.

Retirados de móvil: ruta /tarjetas, formulario de administración, composable de escritura y pestaña inferior. Se conserva la selección de tarjeta al registrar compras. Los servicios compartidos y la administración web siguen disponibles.

Verificación: 87 pruebas core y 18 web pasan, tipos core pasan y generación móvil pasa. No se realizó prueba del gesto en dispositivo físico ni prueba con sesión real de Firebase.
