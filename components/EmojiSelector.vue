<template>
  <div>
    <!-- ✅ Label añadido dentro del componente -->
    <label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>

    <div class="w-full overflow-x-auto scrollbar-hide py-2">
      <div class="flex items-center gap-2 min-w-max">
        <!-- Opción sin icono -->
        <button
          type="button"
          @click="selectEmoji(null)"
          class="flex-shrink-0 size-10 rounded-full border border-dashed border-gray-400 flex items-center justify-center transition-transform hover:scale-110"
          aria-label="Sin icono"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><line x1="5" y1="19" x2="19" y2="5"></line></svg>
        </button>

        <!-- Botones de Emojis -->
        <button
          v-for="emoji in popularEmojis"
          :key="emoji"
          type="button"
          :class="[
            'relative flex-shrink-0 size-10 rounded-xl flex items-center justify-center',
            'cursor-pointer transition-all hover:bg-gray-200 focus:outline-none',
            { 'bg-gray-200': modelValue === emoji }
          ]"
          @click="selectEmoji(emoji)"
        >
          <span class="text-2xl">{{ emoji }}</span>
          <span
            v-if="modelValue === emoji"
            class="absolute inset-0 rounded-xl ring-2 ring-offset-2 ring-indigo-500"
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

const popularEmojis: string[] = [
  '🏠', '🍔', '🚗', '🛍️', '🎓', '🏥', '🎉', '💻', '✈️', '🎁',
  '🐶', '📈', '🧾', '💡', '☕', '💪', '🎬', '🎵', '👕', '📞',
  '🛒', '⛽', '🚌', '🅿️', '🛡️', '📺', '📱', '💊', '🦷', '🐾',
  '🔧', '🧹', '🏦', '💳', '🍽️', '🍺', '🍼', '📚', '🎨', '🌱',
  '🧺', '🚕', '💇', '⚽', '🔥', '💧', '🧴', '🕯️', '🚨', '❤️'
];

const selectEmoji = (emoji: string | null) => {
  emit('update:modelValue', emoji);
};
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
