import { configureFirebase } from '@cofinance/core'

/**
 * Registra la configuración de Firebase antes de que cualquier composable use los servicios.
 * Solo se ejecuta en el cliente (.client.ts)
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  configureFirebase({
    apiKey: config.firebaseApiKey as string,
    authDomain: config.firebaseAuthDomain as string,
    projectId: config.firebaseProjectId as string,
    storageBucket: config.firebaseStorageBucket as string,
    messagingSenderId: config.firebaseMessagingSenderId as string,
    appId: config.firebaseAppId as string
  })
})
