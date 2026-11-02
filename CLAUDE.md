# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo

npm workspaces:

```
apps/mobile/     # Nuxt + Capacitor app (web + Android)
apps/web/        # Nuxt dashboard web de solo lectura (sin Capacitor); `npm run dev:web` / `generate:web`
packages/core/   # @cofinance/core: types, helpers and Firestore services (no Vue/Nuxt deps)
```

Run `npm install` from the root only (a single `node_modules` and `package-lock.json` live there). Anything that does not depend on Vue/Nuxt (models, Firestore access, billing-period helpers) belongs in `packages/core`; a future `apps/desktop` consumes it the same way.

## Commands

Run from the repo root (they delegate to `apps/mobile`):

```bash
npm run dev            # Start dev server (SSR disabled, runs client-only)
npm run generate       # Generate static site (used before Android build)
npm run android:build  # Full Android build: generate + cap sync + open Android Studio
npm run typecheck -w packages/core   # Type-check the shared package
```

Other mobile scripts: `npm run <script> -w apps/mobile` (`build`, `preview`).

There are no test commands configured in this project.

TypeScript type checking runs as part of Nuxt (configured in `apps/mobile/nuxt.config.ts` with `typeCheck: true`). To check types standalone:
```bash
cd apps/mobile && npx vue-tsc --noEmit
```

## Architecture

The app is a personal finance tracker (expense management) built with **Nuxt 3 (SSR disabled)**, **Vue 3 Composition API**, **Firebase/Firestore**, **Pinia**, and **Tailwind CSS**. It also targets Android via **Capacitor**.

### Layer structure

Paths below are relative to `apps/mobile/` unless they start with `packages/core/`.

```
pages/*.vue  →  composables/*.ts  →  @cofinance/core (packages/core/src/services)  →  Firebase/Firestore
                     ↓
               stores/*.ts (Pinia, global state)
```

- **`pages/`** — Route pages. Complex page-level logic lives in `pages/modules/` (e.g., `CreateMovementForm.vue`).
- **`components/`** — Reusable UI components. Complex ones are split into a folder with a companion `use*.ts` (e.g., `BottomSheet/`, `Toast/`).
- **`composables/`** — Business logic composables that wrap services and manage reactive state (loading, error, data). All exported from `composables/index.ts`. Key composables: `useTransactions`, `useCategories`, `useSummary`, `useAuth` (from `useLogin.ts`), `useRecurringExpenses`.
- **`packages/core/src/services/`** — Direct Firestore operations, imported as `@cofinance/core`. Each service returns `{ data, error }`. Never call Firestore directly from components or composables — always go through a service.
- **`packages/core/src/types/`** — TypeScript interfaces and helper functions. `types/helpers.ts` has date/budget/billing-period utilities. Everything (types + services) is re-exported from `packages/core/src/index.ts`; import with `from '@cofinance/core'`.
- **`stores/`** — Pinia stores for global state.
- **`plugins/firebase.client.ts`** — Calls `configureFirebase()` from `@cofinance/core` with the runtime config. Core never reads Nuxt config itself; any service call before this plugin runs throws `Firebase no configurado`.

### Key data models

| Model | ID format | Notes |
|-------|-----------|-------|
| `Category` | Firestore auto-id | Has `icon`, `color`, `budget` |
| `Transaction` | Firestore auto-id | `categoryName` denormalized; `month` field (`YYYY-MM`) separate from `date` (`YYYY-MM-DD`) for Firestore indexing |
| `MonthlySummary` | `userId_month` | Compound ID for direct reads; updated atomically alongside transactions |
| `RecurringExpense` | Firestore auto-id | Separate collection for recurring payments |
| `CreditCard` | Firestore auto-id | `credit_cards` collection, created in Firebase console; app configures opening balance, tracking date and informational cutoff/payment days; expenses store `creditCardId` + denormalized `creditCardBank` |

### Billing periods

The app uses a **billing period** concept (not calendar month). Key helpers in `packages/core/src/types/helpers.ts`:
- `getCurrentBillingPeriodKey()` — returns the current period key
- `getBillingPeriodRangeFromKey()` — returns date range for a period
- `formatBillingPeriodLabel()` — human-readable label

### Authentication

`useAuth()` (from `composables/useLogin.ts`) handles Google Sign-In. It detects native (Capacitor) vs. web and uses the appropriate flow. The `user` ref is module-level (shared across all composable instances).

### Environment variables

All Firebase config goes in `apps/mobile/.env` using `NUXT_PUBLIC_FIREBASE_*` keys (see `.env.example`). Read via `useRuntimeConfig().public` in `plugins/firebase.client.ts` and passed to `configureFirebase()`.

### Android / Capacitor

The Android project lives in `apps/mobile/android`. The build uses `nuxt generate` to produce a static site in `apps/mobile/.output/public` (`webDir` in `capacitor.config.ts`), then `cap sync` copies it into the Android project and regenerates `capacitor.settings.gradle` pointing at the root `node_modules` — never edit that file by hand. `@cofinance/core` is bundled into the static site at build time (`build.transpile` in `nuxt.config.ts`), so the APK has no runtime dependency on the monorepo. App version: `apps/mobile/package.json` + `versionName`/`versionCode` in `apps/mobile/android/app/build.gradle`.

## Conventions

- Always use `<script setup lang="ts">` — never Options API.
- Composables return `{ data, loading, error }` shape; services return `{ data: T | null, error: string | null }`.
- Auto-imports are active for Nuxt/Vue utilities and composables — no need to import `ref`, `computed`, `navigateTo`, etc. in `.vue` files.
- Global helpers (`formatCurrency`, `shortFormatCurrency`) are auto-imported from `apps/mobile/utils/`. Auto-imports do **not** reach `packages/core`: imports there are explicit and relative.
- Page-specific sub-components live in `pages/modules/` rather than `components/`.
