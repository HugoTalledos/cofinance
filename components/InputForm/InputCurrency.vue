<script setup lang="ts">
import { computed } from 'vue';

// 1. DEFINICIÓN DE PROPS Y EMITS
// -----------------------------------------------------------------------------
// Se añade 'label' para el texto y 'id' para la accesibilidad (conectar label e input).
const props = defineProps<{
  modelValue: number | null; // El valor numérico vinculado con v-model
  label: string;             // El texto que se mostrará en el label
  id: string;                // Un ID único para el input
}>();

const emit = defineEmits(['update:modelValue']);

// 2. LÓGICA DE FORMATO (Sin cambios)
// -----------------------------------------------------------------------------
const formattedValue = computed({
  get() {
    if (props.modelValue === null || props.modelValue === undefined) {
      return '';
    }
    return new Intl.NumberFormat('es-CO').format(props.modelValue);
  },
  set(value) {
    const numericValue = parseInt(value.replace(/\D/g, ''), 10);
    emit('update:modelValue', isNaN(numericValue) ? null : numericValue);
  }
});

function handleFocus(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
}

</script>

<template>
  <!-- Contenedor principal para el label y el input -->
  <div>
    <!-- 
      El 'label' usa el prop 'id' en su atributo 'for' para
      vincularse directamente al input. Esto es clave para la accesibilidad.
    -->
    <label :for="props.id" class="block text-sm font-medium leading-6 text-gray-900">
      {{ props.label }}
    </label>

    <!-- Se añade un pequeño margen superior para separar el input del label -->
    <div class="relative mt-2 rounded-md shadow-sm">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span class="text-gray-500 sm:text-sm">$</span>
      </div>

      <input
        :id="props.id"
        v-model="formattedValue"
        type="text"
        inputmode="numeric"
        placeholder="0"
        @focus="handleFocus"
        class="block w-full rounded-md border-0 py-2 pl-8 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
    </div>
  </div>
</template>
