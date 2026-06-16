import { ref, onUnmounted } from 'vue';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type AuthProvider
} from "firebase/auth";
import { useFirebaseAuth } from '../services/firebase';

async function getCapacitorModules() {
  if (!process.client) return { FirebaseAuthentication: null, Capacitor: null };
  try {
    const [authModule, coreModule] = await Promise.all([
      import('@capacitor-firebase/authentication'),
      import('@capacitor/core'),
    ]);
    return {
      FirebaseAuthentication: authModule.FirebaseAuthentication,
      Capacitor: coreModule.Capacitor,
    };
  } catch {
    return { FirebaseAuthentication: null, Capacitor: null };
  }
}

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

  const signInWithGoogle = async () => {
    try {
      if (!auth) {
        console.error("Firebase Auth no disponible");
        return;
      }

      const { FirebaseAuthentication, Capacitor } = await getCapacitorModules();
      const isNative = Capacitor?.isNativePlatform?.() || false;
      console.log('Plataforma nativa detectada:', isNative);

      if (isNative && FirebaseAuthentication) {
        console.log('Iniciando flujo de autenticación nativo...');
        const result = await FirebaseAuthentication.signInWithGoogle();
        console.log('Resultado de Google Sign-In nativo:', result);

        const credential = GoogleAuthProvider.credential(
          result.credential?.idToken
        );

        await signInWithCredential(auth, credential);
        console.log('Autenticación con Firebase completada');
      } else {
        console.log('Iniciando flujo de autenticación web...');
        if (!provider) {
          console.error("Google Auth Provider no disponible");
          return;
        }
        await signInWithPopup(auth, provider);
        console.log('Autenticación web completada');
      }
    } catch (error: any) {
      console.error("Error durante el inicio de sesión con Google:", error);
      console.error("Código de error:", error?.code);
      console.error("Mensaje de error:", error?.message);
      user.value = null;
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { FirebaseAuthentication, Capacitor } = await getCapacitorModules();
      const isNative = Capacitor?.isNativePlatform?.() || false;

      if (isNative && FirebaseAuthentication) {
        console.log('Cerrando sesión en plugin nativo...');
        await FirebaseAuthentication.signOut();
      }

      console.log('Cerrando sesión en Firebase...');
      await firebaseSignOut(auth);
      console.log('Sesión cerrada exitosamente');
    } catch (error) {
      console.error("Error al cerrar la sesión:", error);
      throw error;
    }
  };

  return {
    user,
    signInWithGoogle,
    signOut
  };
}
