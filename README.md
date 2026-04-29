# Cofinance

Proyecto Nuxt 3 con TypeScript, Tailwind CSS, Firebase y Pinia.

## Características

- ✅ **Nuxt 3** - Framework Vue.js moderno con renderizado híbrido
- ✅ **TypeScript** - Tipado fuerte con modo strict habilitado
- ✅ **Tailwind CSS** - Framework CSS utility-first
- ✅ **Firebase** - Firestore para base de datos
- ✅ **Pinia** - State management oficial de Vue
- ✅ **Composition API** - Usando sintaxis `<script setup>`
- ✅ **Variables de entorno** - Configuración segura sin hardcoding

## Estructura del Proyecto

```
cofinance/
├── assets/
│   └── css/
│       └── main.css          # Estilos globales de Tailwind
├── components/
│   └── HelloWorld.vue        # Componente de ejemplo
├── composables/
│   └── useFirebase.ts        # Composable para Firestore
├── pages/
│   └── index.vue             # Página de inicio
├── services/
│   └── firebase.ts           # Configuración de Firebase
├── stores/
│   └── example.ts            # Store de Pinia de ejemplo
├── types/
│   └── index.ts              # Tipos e interfaces TypeScript
├── app.vue                   # Componente raíz
├── nuxt.config.ts            # Configuración de Nuxt
├── tailwind.config.ts        # Configuración de Tailwind
├── tsconfig.json             # Configuración de TypeScript
└── .env.example              # Template de variables de entorno
```

## Requisitos Previos

- Node.js 18.x o superior
- npm 9.x o superior
- Cuenta de Firebase (para Firestore)

## Instalación

1. **Clonar el repositorio**

```bash
git clone <url-del-repositorio>
cd cofinance
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Luego edita el archivo `.env` con tus credenciales de Firebase:

```env
NUXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### Obtener credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Configuración del proyecto** (ícono de engranaje)
4. En la sección **Tus aplicaciones**, crea una aplicación web
5. Copia las credenciales del objeto `firebaseConfig`
6. Activa **Firestore Database** en la sección **Compilación > Firestore Database**

## Scripts Disponibles

```bash
# Servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview

# Generar sitio estático
npm run generate
```

## Uso

### Pinia Store

Ejemplo de uso del store en componentes:

```vue
<script setup lang="ts">
import { useExampleStore } from '~/stores/example'

const store = useExampleStore()

// Acceder al estado
console.log(store.count)

// Usar getters
console.log(store.doubleCount)

// Llamar acciones
store.increment()
</script>
```

### Firebase Firestore

Ejemplo de operaciones con Firestore:

```typescript
import { useFirebaseCollection } from '~/composables/useFirebase'
import type { Todo } from '~/types'

// En un componente o composable
const todosCollection = useFirebaseCollection<Todo>('todos')

// Obtener todos los documentos
const response = await todosCollection.getAll()
if (response.data) {
  console.log(response.data)
}

// Crear un nuevo documento
await todosCollection.create({
  title: 'Nueva tarea',
  completed: false,
  userId: 'user123'
})

// Actualizar un documento
await todosCollection.update('doc-id', { completed: true })

// Eliminar un documento
await todosCollection.remove('doc-id')
```

### Tipos TypeScript

Define tus propios tipos en `types/index.ts`:

```typescript
export interface MiTipo {
  id: string
  nombre: string
  // ...
}
```

Úsalos en tus componentes:

```vue
<script setup lang="ts">
import type { MiTipo } from '~/types'

const items = ref<MiTipo[]>([])
</script>
```

## Convenciones de Código

- ✅ Usar siempre `<script setup>` con TypeScript
- ✅ Definir interfaces para props, estados y respuestas
- ✅ Usar Composition API (no Options API)
- ✅ Mantener la configuración de Firebase en `services/firebase.ts`
- ✅ Usar variables de entorno para datos sensibles
- ✅ Seguir la estructura de carpetas establecida

## Tecnologías

- [Nuxt 3](https://nuxt.com/) - Framework Vue.js
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Firebase](https://firebase.google.com/) - Backend as a Service
- [Pinia](https://pinia.vuejs.org/) - State management
- [Vue 3](https://vuejs.org/) - Framework JavaScript progresivo

## Recursos

- [Documentación de Nuxt 3](https://nuxt.com/docs)
- [Documentación de TypeScript](https://www.typescriptlang.org/docs/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de Pinia](https://pinia.vuejs.org/)

## Licencia

MIT

## Autor

Hugo Talledos - 2026
