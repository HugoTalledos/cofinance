<template>
  <div >
    <label :for="uuid" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <select
      :id="uuid"
      v-model="model"
      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
    >
      <option disabled value="">{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.id"
        :value="option"
      >
        {{ option.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number, Object],
    default: '',
  },
  options: {
    type: Array,
    required: true,
  },
  placeholder: {
    type: String,
    default: 'Selecciona una opción',
  },
});

const emit = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const uuid = ref(`select-${Math.random().toString(36).substring(2, 9)}`);
</script>
