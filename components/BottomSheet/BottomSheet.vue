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
          <div v-if="allowClose" class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click.self="close" />
        </transition>
        <transition name="modal-slide-up" appear>
          <main
            class="flex flex-col bg-white rounded-t-3xl z-10 mt-auto px-6 pt-3 pb-8 gap-2 max-h-[90vh] w-full overflow-y-auto relative"
          >
            <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-outline-variant" />
            <button
              v-if="allowClose"
              type="button"
              aria-label="Cerrar"
              class="absolute top-4 right-4 size-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center z-10 active:scale-95 transition-transform"
              @click="close"
            >
              ✕
            </button>
            <div
              v-if="title || $slots['title-prefix']"
              class="flex flex-col items-center w-full mb-2 gap-3"
            >
              <slot name="title-prefix" />
              <div class="flex items-center w-full justify-center">
                <h1 class="font-display font-bold tracking-tight text-headline-sm text-center px-10">
                  {{ title }}
                </h1>
              </div>
            </div>

            <div class="overflow-y-auto mb-5">
              <slot name="modal-content" />
            </div>

            <div v-if="showActionButtons" class="mt-auto flex gap-3 justify-center">
              <button
                v-if="actionButtons.closeButton.show"
                class="w-full h-12 font-semibold bg-surface-container text-on-surface rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
                :disabled="!actionButtons.closeButton.enabled"
                @click="close">
                {{ actionButtons.closeButton.label }}
              </button>
               
              <button
                v-if="actionButtons.doneButton.show"
                class="w-full h-12 font-semibold bg-black text-white rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
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
