<script setup lang="ts">
// 1. DEFINICIÓN DE PROPS
// -----------------------------------------------------------------------------
// Definimos la prop 'title' que el componente padre deberá proporcionar.
defineProps<{
  title: string;
}>();
</script>

<template>
  <!-- 
    Contenedor principal de la tarjeta.
    - Sombra (shadow-md)
    - Esquinas redondeadas (rounded-lg)
    - Borde sutil
    - Fondo blanco
  -->
  <div class="bg-white border border-gray-200 rounded-lg shadow-md">
    
    <!-- 
      Cabecera de la tarjeta.
      - Padding interno (px-6 py-4)
      - Borde inferior para separar del contenido
    -->
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800">
        {{ title }}
      </h3>
    </div>

    <!-- 
      Cuerpo de la tarjeta.
      - El elemento <slot /> es un marcador de posición. 
      - Aquí es donde se inyectará cualquier contenido que pongas
        entre las etiquetas <BaseCard> y </BaseCard> en el componente padre.
    -->
    <div class="px-6 py-5">
      <slot name="content" />
    </div>

  </div>
</template>
