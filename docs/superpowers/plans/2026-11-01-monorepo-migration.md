# Migración a monorepo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir cofinance en un monorepo con npm workspaces (`apps/mobile` + `packages/core`) sin cambiar el comportamiento de la app ni el proceso de generar el APK.

**Architecture:** La app Nuxt + Capacitor actual se mueve tal cual a `apps/mobile`. Los modelos (`types/`) y el acceso a Firestore (`services/`) pasan a `packages/core` (`@cofinance/core`), que no depende de Nuxt: recibe la config de Firebase por parámetro. Mobile consume `core` como código TypeScript fuente (Vite lo empaqueta en `nuxi generate`), así el APK no depende del monorepo en runtime. `apps/desktop` **no** se crea en este plan; el glob `apps/*` la incluirá cuando exista.

**Tech Stack:** npm workspaces, Nuxt 3 (SSR off), Capacitor 8, Firebase 12, TypeScript 5.

**Spec:** Acordado en conversación (2026-11-01), sin documento aparte. Resumen: estructura `apps/mobile` + `packages/core`; `core` = types + services + helpers de periodos + config Firebase inyectada; `build.transpile: ['@cofinance/core']`; `cap sync` regenera rutas gradle; eliminar symlink `dist` roto. Criterio de éxito: `npm run android:build -w apps/mobile` produce un APK que inicia sesión con Google y registra un gasto.

## Global Constraints

- El proyecto **no tiene framework de tests**; no se agrega uno. La verificación es: `tsc`/`vue-tsc`, `nuxi generate`, `cap sync` y prueba manual en dispositivo/emulador.
- Mover archivos con `mv` + `git add -A` (no `git mv` de carpetas): `android/` y la raíz contienen archivos ignorados que deben viajar (`android/app/google-services.json`, `android/local.properties`, `.env`).
- La versión de la app (`2.0.2`, `versionCode 3`) vive en `apps/mobile/package.json` y `apps/mobile/android/app/build.gradle`; no se cambia.
- Nombre del paquete compartido: `@cofinance/core`. Entry point único: `packages/core/src/index.ts` (exporta tipos, helpers y servicios).
- `firebase` debe existir **una sola vez** en `node_modules` (en `core` es `peerDependency`). Dos copias rompen Firestore en runtime.
- Los nombres de colecciones y campos en Firestore no cambian.
- Trabajar en una rama nueva desde `feat/simplificar-app-movil`: `chore/monorepo`.

## Review Focus

1. **`.env` no encontrado tras el movimiento** → Nuxt lee `.env` desde su rootDir (`apps/mobile`). Esperado: la app arranca con la config de Firebase. Verificado en Task 1 Step 6.
2. **Firebase usado antes de configurarse** (algún composable llama `useFirebaseAuth()` antes de que corra el plugin) → esperado: error explícito `"Firebase no configurado: llama configureFirebase() primero"`, nunca un `null` silencioso. Verificado en Task 2 Step 8.
3. **Dos copias de `firebase`** → esperado: `npm ls firebase` muestra una sola versión deduplicada. Verificado en Task 2 Step 7.
4. **Login nativo de Google en el APK** (depende de `google-services.json` movido y del plugin `@capacitor-firebase/authentication` resuelto desde la raíz) → esperado: login funciona en dispositivo. Verificado en Task 3.
5. **Imports `~/types` / `~/services` residuales** que solo fallan en `generate` → esperado: grep vacío. Verificado en Task 2 Step 6.

---

### Task 1: Mover la app a `apps/mobile` con workspaces

Entregable: el monorepo existe con una sola app; todo funciona igual que antes, ejecutado desde `apps/mobile`.

**Files:**
- Move → `apps/mobile/`: `app.vue`, `assets/`, `components/`, `composables/`, `pages/`, `plugins/`, `stores/`, `utils/`, `types/`, `services/`, `android/`, `capacitor.config.ts`, `nuxt.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `package.json`, `.env`, `.env.example`
- Delete: `dist` (symlink roto a `/Users/hugotalledos/Documents/Programacion/...`), `node_modules/`, `.nuxt/`, `.output/`
- Create: `package.json` (raíz)
- Stays in root: `CLAUDE.md`, `README.md`, `ARCHITECTURE.md`, `SSR-GUIDE.md`, `docs/`, `.gitignore`, `package-lock.json` (se regenera)

**Interfaces:**
- Produces: workspace `apps/mobile` con nombre de paquete `cofinance-mobile`; scripts raíz `dev`, `generate`, `android:build` que delegan a ese workspace.

- [ ] **Step 1: Crear rama**

```bash
git checkout -b chore/monorepo
```

- [ ] **Step 2: Limpiar artefactos y el symlink roto**

```bash
rm -rf node_modules .nuxt .output dist
```

- [ ] **Step 3: Mover la app**

```bash
mkdir -p apps/mobile
mv app.vue assets components composables pages plugins stores utils types services android \
   capacitor.config.ts nuxt.config.ts tailwind.config.ts tsconfig.json package.json .env .env.example \
   apps/mobile/
```

Expected: `ls apps/mobile/android/app/google-services.json apps/mobile/.env` lista ambos archivos.

- [ ] **Step 4: Ajustar `apps/mobile/package.json` y crear `package.json` raíz**

En `apps/mobile/package.json`: `"name": "cofinance-mobile"` (resto igual, versión `2.0.2`).

`package.json` raíz:

```json
{
  "name": "cofinance",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev -w apps/mobile",
    "generate": "npm run generate -w apps/mobile",
    "android:build": "npm run android:build -w apps/mobile"
  }
}
```

- [ ] **Step 5: Instalar y regenerar lock**

```bash
rm package-lock.json && npm install
```

Expected: termina sin errores; `postinstall` (`nuxt prepare`) corre en `apps/mobile` y crea `apps/mobile/.nuxt/`.

- [ ] **Step 6: Verificar tipos y build**

```bash
cd apps/mobile && npx vue-tsc --noEmit && npx nuxi generate
```

Expected: `vue-tsc` sin salida; `generate` termina y existe `apps/mobile/.output/public/index.html`. Luego `npm run dev` y abrir la app en el navegador: debe iniciar sesión y listar movimientos (prueba que `.env` se lee).

- [ ] **Step 7: `cap sync` y revisar rutas gradle**

```bash
cd apps/mobile && npx cap sync android && cat android/capacitor.settings.gradle
```

Expected: las rutas de `projectDir` ahora apuntan a `../../../node_modules/@capacitor/android/capacitor` y `../../../node_modules/@capacitor-firebase/authentication/android` (node_modules de la raíz). `android/app/capacitor.build.gradle` y `android/app/build.gradle` solo tienen rutas relativas internas a `android/` (ya verificado: no requieren cambios).

- [ ] **Step 8: Commit**

```bash
git add -A
git status --short | grep -v "^R" # revisar que solo haya renames + package.json/lock
git commit -m "chore: mover la app a apps/mobile dentro de un monorepo con npm workspaces"
```

---

### Task 2: Extraer `packages/core` (`@cofinance/core`)

Entregable: types, helpers y servicios viven en `core` sin dependencias de Nuxt; mobile los importa desde `@cofinance/core` y compila/genera igual.

**Files:**
- Move: `apps/mobile/types/*` → `packages/core/src/types/`; `apps/mobile/services/*` → `packages/core/src/services/`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/index.ts`
- Modify: `packages/core/src/services/firebase.ts` (config inyectada), todos los `packages/core/src/services/*.service.ts` (imports relativos)
- Modify: `apps/mobile/plugins/firebase.client.ts`, `apps/mobile/nuxt.config.ts`
- Modify (imports): `apps/mobile/composables/{useCategories,useCreditCards,useFirebase,useLogin,useRecurringExpenses,useSummary,useTransactions}.ts`, `apps/mobile/components/RecurringExpenseList/{RecurringExpenseList.vue,useRecurringList.ts}`, `apps/mobile/pages/index.vue`, `apps/mobile/pages/modules/{CreateMovementForm.vue,CreateMovementForm.type.ts}`, `apps/mobile/stores/example.ts`
- Stays in mobile: `apps/mobile/utils/` (`formatCurrency` etc. son de UI y se autoimportan)

**Interfaces:**
- Consumes: workspace de Task 1.
- Produces (`@cofinance/core`):
  - Todo lo que hoy exportan `types/index.ts` y `services/index.ts`, re-exportado desde `src/index.ts`.
  - `configureFirebase(options: FirebaseOptions): void` — guarda la config; debe llamarse antes de cualquier servicio.
  - `initializeFirebase(): FirebaseApp | null` — lanza `Error('Firebase no configurado: llama configureFirebase() primero')` si no hubo `configureFirebase`; devuelve `null` solo si `typeof window === 'undefined'` (reemplaza a `process.server`).
  - `getFirestoreInstance`, `getAuthInstance`, `useFirestoreDb`, `useFirebaseAuth`, `COLLECTIONS` — misma firma que hoy.

- [ ] **Step 1: Mover carpetas**

```bash
mkdir -p packages/core/src
mv apps/mobile/types packages/core/src/types
mv apps/mobile/services packages/core/src/services
```

- [ ] **Step 2: Crear `packages/core/package.json` y `tsconfig.json`**

```json
{
  "name": "@cofinance/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc -p tsconfig.json" },
  "peerDependencies": { "firebase": "^12.12.1" }
}
```

`tsconfig.json`: `target`/`module` `ES2022`, `moduleResolution` `bundler`, `lib` `["ES2022","DOM"]`, `strict` y las mismas flags estrictas que `apps/mobile/tsconfig.json` (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`), `noEmit: true`, `include: ["src"]`.

- [ ] **Step 3: Crear `src/index.ts` y reescribir imports internos**

`src/index.ts`: `export * from './types'` y `export * from './services'`.

En `src/services/*.ts`: `'~/types'` → `'../types'`, `'~/services/categories.service'` → `'./categories.service'`.

- [ ] **Step 4: Quitar la dependencia de Nuxt en `src/services/firebase.ts`**

Implementar `configureFirebase(options: FirebaseOptions): void` (guarda en variable de módulo `firebaseOptions`). `initializeFirebase` usa `firebaseOptions` en vez de `useRuntimeConfig()` y lanza el error exacto de Interfaces si es `null`. Reemplazar los tres `process.server` por `typeof window === 'undefined'`. Exportar `configureFirebase` desde `src/services/index.ts`.

- [ ] **Step 5: Verificar `core` aislado**

```bash
npm run typecheck -w packages/core
```

Expected: sin errores. Si falla por `useRuntimeConfig`/`process`/`~/`, quedó una dependencia de Nuxt.

- [ ] **Step 6: Conectar mobile a `core`**

- `apps/mobile/package.json`: agregar `"@cofinance/core": "*"` en `dependencies`.
- `apps/mobile/nuxt.config.ts`: agregar `build: { transpile: ['@cofinance/core'] }`.
- `apps/mobile/plugins/firebase.client.ts`: llamar `configureFirebase({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId })` con los valores de `useRuntimeConfig().public` (mismos que leía `initializeFirebase` antes). Quitar el `console.log`.
- Reemplazar en mobile todos los `'~/types'`, `'~/services'`, `'~/services/<x>'`, `'../services/firebase'` por `'@cofinance/core'`.

Run:

```bash
npm install
grep -rnE "~/(types|services)|\.\./services" apps/mobile --include=*.ts --include=*.vue --exclude-dir=node_modules --exclude-dir=.nuxt --exclude-dir=.output
```

Expected: `npm install` crea el symlink `node_modules/@cofinance/core`; el grep no imprime nada.

- [ ] **Step 7: Verificar una sola copia de firebase**

```bash
npm ls firebase
```

Expected: una única versión `firebase@12.x`, marcada `deduped` bajo `@cofinance/core`.

- [ ] **Step 8: Verificar tipos, build y orden de inicialización**

```bash
cd apps/mobile && npx vue-tsc --noEmit && npx nuxi generate
```

Expected: ambos sin errores. Luego `npm run dev`, abrir en navegador: login con Google, ver el resumen, registrar un gasto con crédito (elige tarjeta) y confirmar en la consola del navegador que **no** aparece `Firebase no configurado`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: extraer types y services a @cofinance/core sin dependencias de Nuxt"
```

---

### Task 3: Verificar el APK y actualizar la documentación

Entregable: APK generado desde el monorepo que inicia sesión y registra un gasto; `CLAUDE.md` describe la nueva estructura.

**Files:**
- Modify: `CLAUDE.md` (Commands, Layer structure, rutas `types/`→`packages/core/src/types/`, `services/`→`packages/core/src/services/`, sección Android/Capacitor sin el symlink `dist`)
- Modify: `apps/mobile/composables/README.md` si menciona `/services` (actualizar ruta)

- [ ] **Step 1: Build Android desde la raíz**

```bash
npm run android:build
```

Expected: `generate` + `cap sync` sin errores y se abre Android Studio en `apps/mobile/android`.

- [ ] **Step 2: Generar e instalar APK**

En Android Studio: Build → Build APK(s), instalar en dispositivo/emulador.

Expected (manual): login nativo con Google funciona; se ve el resumen del periodo; se registra un gasto con crédito y aparece en la lista.

- [ ] **Step 3: Actualizar `CLAUDE.md`**

Reflejar: comandos desde la raíz (`npm run dev`, `npm run android:build`) o con `-w apps/mobile`; `npm run typecheck -w packages/core`; capa `pages → composables → @cofinance/core (services) → Firestore`; Firebase se configura en `apps/mobile/plugins/firebase.client.ts` vía `configureFirebase`; regla: código que no dependa de Vue/Nuxt va en `core`.

- [ ] **Step 4: Commit y push**

```bash
git add -A
git commit -m "docs: actualizar CLAUDE.md para la estructura de monorepo"
git push -u origin chore/monorepo
```
