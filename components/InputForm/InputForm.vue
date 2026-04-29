<script setup lang="ts">
import { computed } from 'vue';

// 1. DEFINICIÓN DE TIPOS Y PROPS
// -----------------------------------------------------------------------------
// Definimos los tipos de input que permitiremos para mayor seguridad y autocompletado.
type InputType = 'text' | 'number' | 'email' | 'password';

const props = withDefaults(defineProps<{
  modelValue: string | number | null; // El valor, compatible con v-model.
  label: string;                     // El texto para el <label>.
  id: string;                        // ID para vincular label e input.
  type?: InputType;                  // El tipo de input ('text', 'number', etc.).
  placeholder?: string;              // El placeholder, que ahora es opcional.
}>(), {
  // 'withDefaults' nos permite definir valores por defecto para las props.
  // 'text' es el tipo más común, así que es un buen valor por defecto.
  type: 'text',
  placeholder: ''
});

// 2. EMITS PARA V-MODEL
// -----------------------------------------------------------------------------
const emit = defineEmits(['update:modelValue']);

// 3. COMPUTED PROPERTY PARA V-MODEL
// -----------------------------------------------------------------------------
// Esta propiedad computada asegura que el v-model funcione correctamente
// sin modificar directamente las props, lo cual es una mala práctica en Vue.
const value = computed({
  // Cuando se lee el valor, simplemente retornamos el prop.
  get() {
    return props.modelValue;
  },
  // Cuando el usuario escribe, emitimos el evento 'update:modelValue'
  // que v-model escucha para actualizar la variable en el componente padre.
  set(newValue) {
    emit('update:modelValue', newValue);
  }
});
</script>

<template>
  <div>
    <!-- El label se vincula dinámicamente al input mediante los props 'id' y 'label' -->
    <label 
      :for="id" 
      class="block text-sm font-medium leading-6 text-gray-900"
    >
      {{ label }}
    </label>

    <!-- 
      El input se configura completamente a través de props:
      - :id se vincula al prop id.
      - v-model usa nuestra propiedad computada 'value'.
      - :type, :placeholder y otros atributos se asignan dinámicamente.
    -->
    <div class="mt-2">
      <input
        :id="id"
        v-model="value"
        :type="type"
        :placeholder="placeholder"
        class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        required
      />
    </div>
  </div>
</template>
