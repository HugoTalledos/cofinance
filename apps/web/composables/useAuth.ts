import { ref } from 'vue'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { useFirebaseAuth } from '@cofinance/core'

// Estado a nivel de módulo: compartido por todas las instancias
const user = ref<User | null>(null)
const authLoading = ref(true)
let listening = false

export function useAuth() {
  const auth = useFirebaseAuth()

  if (!auth) {
    authLoading.value = false
  } else if (!listening) {
    listening = true
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      authLoading.value = false
    })
  }

  const signInWithGoogle = async (): Promise<void> => {
    if (!auth) {
      console.error('Firebase Auth no disponible')
      return
    }
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (error) {
      console.error('Error durante el inicio de sesión con Google:', error)
      throw error
    }
  }

  const signOut = async (): Promise<void> => {
    if (!auth) return
    await firebaseSignOut(auth)
  }

  return { user, authLoading, signInWithGoogle, signOut }
}
