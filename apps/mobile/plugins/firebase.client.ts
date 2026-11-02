/**
 * Plugin de Firebase para Nuxt 3
 * Solo se ejecuta en el cliente (.client.ts)
 * Compatible con SSR
 */
export default defineNuxtPlugin(() => {
  // Firebase se inicializará automáticamente cuando se use
  // No es necesario inicializar aquí, solo asegurar que el plugin existe
  
  if (process.client) {
    console.log('✅ Firebase plugin cargado (client-side)')
  }
})
