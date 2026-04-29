import { initializeApp, type FirebaseApp, getApps } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

/**
 * Inicializa Firebase con las variables de entorno configuradas
 * Usa singleton para evitar múltiples inicializaciones
 * Compatible con SSR - solo se ejecuta en el cliente
 */
export const initializeFirebase = (): FirebaseApp | null => {
  // Solo inicializar en el cliente (browser)
  if (process.server) {
    console.warn('Firebase no se puede inicializar en el servidor (SSR)')
    return null
  }

  // Usamos la variable singleton 'app' para no llamar a getApps() innecesariamente
  if (app) {
    return app
  }

  const existingApps = getApps()
  if (existingApps.length > 0) {
    app = existingApps[0]
    return app
  }

  const config = useRuntimeConfig()
  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey as string,
    authDomain: config.public.firebaseAuthDomain as string,
    projectId: config.public.firebaseProjectId as string,
    storageBucket: config.public.firebaseStorageBucket as string,
    messagingSenderId: config.public.firebaseMessagingSenderId as string,
    appId: config.public.firebaseAppId as string
  }
  
  app = initializeApp(firebaseConfig)
  return app
}

/**
 * Obtiene la instancia de Firestore
 * Compatible con SSR - retorna null en el servidor
 */
export const getFirestoreInstance = (): Firestore | null => {
  if (process.server) return null
  if (!db) {
    const firebaseApp = initializeFirebase()
    if (firebaseApp) {
      db = getFirestore(firebaseApp)
    }
  }
  return db
}

/**
 * Obtiene la instancia de Auth
 * Compatible con SSR - retorna null en el servidor
 */
export const getAuthInstance = (): Auth | null => { 
  if (process.server) return null
  if (!auth) {
    const firebaseApp = initializeFirebase()
    if (firebaseApp) {
      auth = getAuth(firebaseApp)
    }
  }
  return auth
}


/**
 * Exporta la instancia de Firestore para uso directo
 */
export const useFirestoreDb = (): Firestore | null => {
  return getFirestoreInstance()
}

/**
 * Exporta la instancia de Auth para uso directo
 */
export const useFirebaseAuth = (): Auth | null => {
  return getAuthInstance()
}

/**
 * Nombres de colecciones de Firestore
 */
export const COLLECTIONS = {
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  MONTHLY_SUMMARY: 'monthly_summary'
} as const
