<script setup lang="ts">
import { type ModalProps, modalEmits } from './shared';

defineProps<ModalProps>();
const emit = defineEmits(modalEmits);

const close = () => emit('modalClose');
const done = () => emit('modalDone');
</script>
<template>
  <teleport to="body">
    <transition name="modal-overlay" appear>
      <div v-if="visible" class="fixed inset-0 flex md:hidden items-center justify-center z-[1001] h-screen w-full">
        <transition name="modal-backdrop" appear>
          <div v-if="allowClose" class="absolute inset-0 bg-gray-900 bg-opacity-50" @click.self="close" />
        </transition>
        <transition name="modal-slide-up" appear>
          <main
            class="flex flex-col bg-white rounded-t-2xl z-10 mt-auto p-[30px] gap-[8px] max-h-[90vh] w-full overflow-y-auto relative"
          >
            <button
              v-if="allowClose"
              class="absolute top-4 right-4 size-3 md:size-4 z-10 hover:opacity-70 transition-opacity"
              @click="close"
            >
              <span class="text-2xl font-bold">X</span>
            </button>
            <div
              v-if="title || $slots['title-prefix']"
              class="flex flex-col items-center w-full mb-2 gap-3"
            >
              <slot name="title-prefix" />
              <div class="flex items-center w-full justify-center">
                <h1 class="font-quicksand font-semibold text-xl">
                  {{ title }}
                </h1>
              </div>
            </div>

            <div class="overflow-y-auto mb-[20px]">
              <slot name="modal-content" />
            </div>

            <div v-if="showActionButtons" class="mt-auto flex gap-4 justify-center">
              <button
                v-if="actionButtons.closeButton.show"
                class="!w-full !h-[40px] text-[14px] !cursor-pointer bg-gray-200 text-gray-800 rounded-md"
                :disabled="!actionButtons.closeButton.enabled"
                @click="close">
                {{ actionButtons.closeButton.label }}
              </button>
               
              <button
                v-if="actionButtons.doneButton.show"
                class="!w-full !h-[40px] text-[14px] !cursor-pointer bg-blue-500 text-white rounded-md"
                :disabled="!actionButtons.doneButton.enabled"
                @click="done">
                {{ actionButtons.doneButton.label }}
              </button>
            </div>
          </main>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
/* Animación del overlay del modal - fade in, deslizamiento hacia abajo al salir */
.modal-overlay-enter-active {
  transition: opacity 0.3s ease;
}

.modal-overlay-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

.modal-overlay-enter-from {
  opacity: 0;
}

.modal-overlay-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* Animación del backdrop - fade in, deslizamiento hacia abajo al salir */
.modal-backdrop-enter-active {
  transition: opacity 0.3s ease;
}

.modal-backdrop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

.modal-backdrop-enter-from {
  opacity: 0;
}

.modal-backdrop-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* Animación de deslizamiento desde abajo hacia abajo */
.modal-slide-up-enter-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

.modal-slide-up-enter-from {
  transform: translateY(100%);
}

.modal-slide-up-leave-to {
  transform: translateY(100%);
}
</style>
