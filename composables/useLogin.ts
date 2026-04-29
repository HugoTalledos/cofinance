import { ref, onUnmounted } from 'vue';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type AuthProvider
} from "firebase/auth";
import { useFirebaseAuth } from '../services/firebase';

const auth = useFirebaseAuth();
const provider: AuthProvider | null = auth ? new GoogleAuthProvider() : null;

const user = ref<User | null>(null);

export function useAuth() {
  if (!auth) {
    return {
      user,
      signInWithGoogle: () => console.error("Auth no disponible."),
      signOut: () => console.error("Auth no disponible.")
    };
  }

  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser;
    console.log('Estado de autenticación actualizado:', user.value?.displayName || 'No autenticado');
  });

  onUnmounted(() => {
    unsubscribe();
    console.log('Observador de autenticación detenido.');
  });
  // ---------------------------------------------

  const signInWithGoogle = async () => {
    try {
      if (!provider) return;
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error durante el inicio de sesión con Google:", error);
      user.value = null;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error al cerrar la sesión:", error);
    }
  };

  return {
    user,
    signInWithGoogle,
    signOut
  };
}
