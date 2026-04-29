import { initializeApp, type FirebaseApp, getApps } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

let db: Firestore | null = null

/**
 * Inicializa Firebase con las variables de entorno configuradas
 * Usa singleton para evitar múltiples inicializaciones
 */
export const initializeFirebase = (): FirebaseApp => {
  // Verificar si ya existe una app inicializada
  const existingApps = getApps()
  if (existingApps.length > 0) {
    return existingApps[0]
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

  return initializeApp(firebaseConfig)
}

/**
 * Obtiene la instancia de Firestore
 */
export const getFirestoreInstance = (): Firestore => {
  if (!db) {
    const app = initializeFirebase()
    db = getFirestore(app)
  }
  return db
}

/**
 * Exporta la instancia de Firestore para uso directo
 */
export const useFirestoreDb = (): Firestore => {
  return getFirestoreInstance()
}

/**
 * Nombres de colecciones de Firestore
 */
export const COLLECTIONS = {
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  MONTHLY_SUMMARY: 'monthly_summary'
} as const
