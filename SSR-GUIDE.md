# Guía de SSR (Server-Side Rendering) - Cofinance

## ✅ SSR Habilitado

El proyecto está configurado para usar **SSR (Server-Side Rendering)** con Nuxt 3.

## 🔧 Configuración Aplicada

### 1. nuxt.config.ts

```typescript
export default defineNuxtConfig({
  // SSR habilitado explícitamente
  ssr: true,
  
  // Optimizaciones para SSR
  nitro: {
    compressPublicAssets: true,
  },
  
  // Renderizado de rutas
  routeRules: {
    '/': { prerender: true },           // Página principal prerenderizada
    '/categories': { ssr: true },        // SSR en categorías
    '/transactions': { ssr: true }       // SSR en transacciones
  }
})
```

### 2. Firebase Compatible con SSR

Firebase solo funciona en el cliente (browser), por lo que se configuró para:

**`services/firebase.ts`**
- Verifica `process.server` antes de inicializar
- Retorna `null` en el servidor
- Solo se inicializa en el cliente

**`plugins/firebase.client.ts`**
- Plugin con sufijo `.client.ts` se ejecuta solo en el cliente
- Firebase se carga después de la hidratación

## 📋 Cómo Funciona

### Flujo de Renderizado

1. **Servidor (SSR)**:
   - Renderiza el HTML inicial
   - NO ejecuta código de Firebase
   - Retorna HTML estático al navegador

2. **Cliente (Hidratación)**:
   - Descarga JavaScript
   - Inicializa Firebase
   - Carga datos de Firestore
   - Actualiza la UI reactivamente

### Ejemplo en Componente

```vue
<script setup lang="ts">
import { useCategories } from '~/composables'

const { categories, loading, fetchCategories } = useCategories()

// onMounted solo se ejecuta en el cliente
onMounted(async () => {
  await fetchCategories('user123')
})
</script>

<template>
  <div>
    <!-- HTML se renderiza en el servidor -->
    <h1>Categorías</h1>
    
    <!-- Datos se cargan en el cliente -->
    <div v-if="loading">Cargando...</div>
    <div v-else>
      <div v-for="cat in categories" :key="cat.id">
        {{ cat.name }}
      </div>
    </div>
  </div>
</template>
```

## 🚀 Ventajas del SSR

### 1. SEO Mejorado
- Los motores de búsqueda ven HTML completo
- Mejor indexación en Google
- Metadatos visibles en el HTML inicial

### 2. Performance Inicial
- First Contentful Paint (FCP) más rápido
- El usuario ve contenido inmediatamente
- Mejor experiencia en conexiones lentas

### 3. Accesibilidad
- Contenido disponible sin JavaScript
- Funciona mejor con lectores de pantalla
- Compatible con más navegadores

## ⚠️ Consideraciones Importantes

### 1. Firebase Solo en Cliente

❌ **NO funciona en SSR:**
```typescript
// Esto fallará en el servidor
const db = useFirestoreDb() // null en servidor
const data = await getDocs(collection(db, 'categories'))
```

✅ **Correcto - Cargar en onMounted:**
```typescript
onMounted(async () => {
  // Se ejecuta solo en el cliente
  await fetchCategories('user123')
})
```

### 2. Variables de Entorno

Las variables con prefijo `NUXT_PUBLIC_` están disponibles tanto en servidor como en cliente:

```bash
NUXT_PUBLIC_FIREBASE_API_KEY=xxx
NUXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
```

### 3. Datos Iniciales

Para mostrar datos en SSR, considera usar:

**Opción A: useFetch (SSR Compatible)**
```vue
<script setup>
// Se ejecuta en servidor Y cliente
const { data } = await useFetch('/api/categories')
</script>
```

**Opción B: useAsyncData**
```vue
<script setup>
const { data } = await useAsyncData('categories', () => {
  // Se ejecuta en el servidor
  return $fetch('/api/categories')
})
</script>
```

## 🔍 Verificar que SSR Funciona

### 1. Ver el HTML Inicial

```bash
# Inicia el servidor
npm run build
npm run preview

# Visita http://localhost:3000
# Click derecho > Ver código fuente
# Deberías ver HTML completo, no solo <div id="app"></div>
```

### 2. Deshabilitar JavaScript

1. Abre DevTools (F12)
2. Settings > Debugger > Disable JavaScript
3. Recarga la página
4. Deberías ver el HTML inicial

### 3. Lighthouse

1. Abre DevTools (F12)
2. Tab "Lighthouse"
3. Run audit
4. Verifica "Server-Side Rendering" en verde

## 📦 Comandos de Build

```bash
# Desarrollo (SSR activo)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Generar sitio estático (opcional)
npm run generate
```

## 🎯 Optimizaciones Adicionales

### 1. Prerender Rutas Estáticas

```typescript
// nuxt.config.ts
routeRules: {
  '/': { prerender: true },
  '/about': { prerender: true }
}
```

### 2. Cache de API

```typescript
// nuxt.config.ts
routeRules: {
  '/api/**': { cache: { maxAge: 60 } } // Cache por 60 segundos
}
```

### 3. Lazy Loading

```vue
<script setup>
// Lazy load componentes pesados
const HeavyComponent = defineAsyncComponent(() => 
  import('~/components/HeavyComponent.vue')
)
</script>
```

## 🐛 Troubleshooting

### Error: "window is not defined"

```typescript
// ❌ Incorrecto
if (window.location) { ... }

// ✅ Correcto
if (process.client && window.location) { ... }
```

### Error: "Firebase is not initialized"

```typescript
// ❌ Incorrecto - se ejecuta en servidor
const db = useFirestoreDb()

// ✅ Correcto - se ejecuta en cliente
onMounted(() => {
  const db = useFirestoreDb()
  if (db) {
    // usar db
  }
})
```

### Componente no se hidrata

```vue
<script setup>
// Asegúrate de que el HTML del servidor coincida con el cliente
// Evita lógica que genere diferente HTML en servidor vs cliente
</script>
```

## 📚 Referencias

- [Nuxt 3 SSR](https://nuxt.com/docs/guide/concepts/rendering)
- [Firebase + SSR](https://firebase.google.com/docs/hosting/frameworks/nuxt)
- [Server Routes](https://nuxt.com/docs/guide/directory-structure/server)

## ✅ Checklist de Configuración

- [x] `ssr: true` en nuxt.config.ts
- [x] Firebase inicializa solo en cliente
- [x] Plugin firebase.client.ts creado
- [x] Servicios manejan `db: null` en servidor
- [x] Composables usan `onMounted()` para cargar datos
- [x] Variables de entorno con prefijo `NUXT_PUBLIC_`
- [x] RouteRules configuradas

¡Tu proyecto ya está completamente configurado para SSR! 🎉
