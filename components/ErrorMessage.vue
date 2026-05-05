<template>
  <div v-if="visible" class="error-overlay" @click.self="close">
    <div class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      <h2 class="error-title">Error</h2>
      <p class="error-message">{{ message }}</p>
      <button class="close-button" @click="close">Cerrar</button>
    </div>
  </div>
</template>
  
<script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    message: {
      type: String,
      required: true,
      default: 'Ha ocurrido un error inesperado.'
    },
    visible: {
      type: Boolean,
      required: true,
      default: false
    }
  });
  
  const emit = defineEmits(['update:visible']);
  
  const close = () => {
    emit('update:visible', false);
  };
</script>
  
<style scoped>
  .error-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
  }
  
  .error-container {
    background: white;
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    max-width: 90%;
    width: 450px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    animation: fadeIn 0.3s ease-out;
  }
  
  .error-icon {
    margin-bottom: 20px;
  }
  
  .error-title {
    margin: 0 0 15px;
    color: #333;
    font-size: 24px;
    font-weight: bold;
  }
  
  .error-message {
    margin: 0 0 30px;
    color: #555;
    font-size: 16px;
    line-height: 1.5;
  }
  
  .close-button {
    background-color: #ff4d4f;
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: background-color 0.2s;
  }
  
  .close-button:hover {
    background-color: #e63946;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
  