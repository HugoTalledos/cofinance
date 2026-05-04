<template>
  <div>
    <!-- ✅ Label añadido dentro del componente -->
    <label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>

    <div class="w-full overflow-x-auto scrollbar-hide py-2">
      <div class="flex items-center gap-3 min-w-max">
        <!-- Opción para deseleccionar o sin color -->
        <button
          type="button"
          @click="selectColor(null)"
          class="flex-shrink-0 size-8 rounded-full border border-dashed border-gray-400 flex items-center justify-center transition-transform hover:scale-110"
          aria-label="Sin color"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><line x1="5" y1="19" x2="19" y2="5"></line></svg>
        </button>

        <!-- Círculos de Colores -->
        <button
          v-for="color in tailwindColors"
          :key="color"
          type="button"
          :class="[
            color,
            'relative flex-shrink-0 size-8 rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none'
          ]"
          @click="selectColor(color)"
        >
          <span
            v-if="modelValue === color"
            class="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-blue-500"
            aria-hidden="true"
          ></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ✅ Prop 'label' añadida
defineProps<{
  modelValue: string | null;
  label: string;
}>();

const emit = defineEmits(['update:modelValue']);

const tailwindColors: string[] = [
  'bg-red-100', 'bg-orange-100', 'bg-amber-100', 'bg-yellow-100', 'bg-lime-100',
  'bg-green-100', 'bg-emerald-100', 'bg-teal-100', 'bg-cyan-100', 'bg-sky-100',
  'bg-blue-100', 'bg-indigo-100', 'bg-violet-100', 'bg-purple-100', 'bg-fuchsia-100',
  'bg-pink-100', 'bg-rose-100'
];

const selectColor = (color: string | null) => {
  emit('update:modelValue', color);
};
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
