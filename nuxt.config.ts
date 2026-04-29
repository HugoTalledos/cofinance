// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR habilitado explícitamente
  ssr: true,
  
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  css: ['~/assets/css/main.css'],
  
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID
    }
  },
  
  // Optimizaciones para SSR
  nitro: {
    compressPublicAssets: true,
  },
  
  // Renderizado de rutas para mejor SEO
  routeRules: {
    '/': { prerender: true },
    '/categories': { ssr: true },
    '/transactions': { ssr: true }
  }
})
