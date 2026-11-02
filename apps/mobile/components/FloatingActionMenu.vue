<script setup lang="ts">
import { ref } from 'vue'

interface FabOption {
  label: string
  icon: string
  color: string
}

defineProps<{
  options: FabOption[]
}>()

const emit = defineEmits<{
  (e: 'option-click', index: number): void
}>()

const isOpen = ref(false)

function handleOption(index: number) {
  isOpen.value = false
  emit('option-click', index)
}
</script>

<template>
  <div class="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">

    <!-- Backdrop -->
    <transition name="fam-backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[-1]"
        @click="isOpen = false"
      />
    </transition>

    <!-- Sub-opciones -->
    <transition name="fam-options">
      <div v-if="isOpen" class="flex flex-col items-end gap-3">
        <div
          v-for="(option, i) in options"
          :key="i"
          class="flex items-center gap-3"
        >
          <span class="bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap select-none">
            {{ option.label }}
          </span>
          <button
            class="text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
            :class="option.color"
            @click="handleOption(i)"
          >
            {{ option.icon }}
          </button>
        </div>
      </div>
    </transition>

    <!-- Botón principal -->
    <button
      class="bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl transition-transform duration-300"
      :class="{ 'rotate-45': isOpen }"
      @click="isOpen = !isOpen"
    >
      +
    </button>

  </div>
</template>

<style scoped>
.fam-options-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}
.fam-options-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}
.fam-options-enter-from,
.fam-options-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.fam-backdrop-enter-active,
.fam-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.fam-backdrop-enter-from,
.fam-backdrop-leave-to {
  opacity: 0;
}
</style>
