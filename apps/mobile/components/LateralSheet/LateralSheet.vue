<script setup lang="ts">
import './index.css'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['sidebar-close']);

const close = () => {
  emit('sidebar-close');
};
</script>

<template>
  <div :class="['sidebar-container', { 'sidebar-open': props.isOpen }]">
    <div class="siderbar-overlay" @click="close"></div>
    <aside class="sidebar-aside">
      <div class="sidebar-aside__header">
        <p>{{ title }}</p>
        <button
          type="button"
          aria-label="Cerrar"
          class="size-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center active:scale-95 transition-transform"
          @click="close"
        >
          ✕
        </button>
      </div>
      <div v-if="subtitle" class="sidebar-aside__subtitle">
        <p>{{ subtitle }}</p>
      </div>
      <div class="sidebar-aside__content">
        <slot name="content" />
      </div>
    </aside>
  </div>
</template>
