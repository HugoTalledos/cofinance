# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (SSR disabled, runs client-only)
npm run build        # Build for production
npm run generate     # Generate static site (used before Android build)
npm run preview      # Preview production build
npm run android:build  # Full Android build: generate + cap sync + open Android Studio
```

There are no test commands configured in this project.

TypeScript type checking runs as part of Nuxt (configured in `nuxt.config.ts` with `typeCheck: true`). To check types standalone:
```bash
npx vue-tsc --noEmit
```

## Architecture

The app is a personal finance tracker (expense management) built with **Nuxt 3 (SSR disabled)**, **Vue 3 Composition API**, **Firebase/Firestore**, **Pinia**, and **Tailwind CSS**. It also targets Android via **Capacitor**.

### Layer structure

```
pages/*.vue  →  composables/*.ts  →  services/*.service.ts  →  Firebase/Firestore
                     ↓
               stores/*.ts (Pinia, global state)
```

- **`pages/`** — Route pages. Complex page-level logic lives in `pages/modules/` (e.g., `BarCharSummary.vue`, `CreateMovementForm.vue`).
- **`components/`** — Reusable UI components. Complex ones are split into a folder with a companion `use*.ts` (e.g., `BottomSheet/`, `Toast/`).
- **`composables/`** — Business logic composables that wrap services and manage reactive state (loading, error, data). All exported from `composables/index.ts`. Key composables: `useTransactions`, `useCategories`, `useSummary`, `useAuth` (from `useLogin.ts`), `useRecurringExpenses`.
- **`services/`** — Direct Firestore operations. Each service returns `{ data, error }`. Never call Firestore directly from components or composables — always go through a service.
- **`types/`** — TypeScript interfaces and helper functions. `types/helpers.ts` has date/currency/budget utilities that are imported throughout the app. All types re-exported from `types/index.ts`.
- **`stores/`** — Pinia stores for global state.
- **`plugins/firebase.client.ts`** — Ensures Firebase loads client-side only (`.client.ts` suffix enforces this in Nuxt).

### Key data models

| Model | ID format | Notes |
|-------|-----------|-------|
| `Category` | Firestore auto-id | Has `icon`, `color`, `budget` |
| `Transaction` | Firestore auto-id | `categoryName` denormalized; `month` field (`YYYY-MM`) separate from `date` (`YYYY-MM-DD`) for Firestore indexing |
| `MonthlySummary` | `userId_month` | Compound ID for direct reads; updated atomically alongside transactions |
| `RecurringExpense` | Firestore auto-id | Separate collection for recurring payments |

### Billing periods

The app uses a **billing period** concept (not calendar month). Key helpers in `types/helpers.ts`:
- `getCurrentBillingPeriodKey()` — returns the current period key
- `getBillingPeriodRangeFromKey()` — returns date range for a period
- `formatBillingPeriodLabel()` — human-readable label

### Authentication

`useAuth()` (from `composables/useLogin.ts`) handles Google Sign-In. It detects native (Capacitor) vs. web and uses the appropriate flow. The `user` ref is module-level (shared across all composable instances).

### Environment variables

All Firebase config goes in `.env` using `NUXT_PUBLIC_FIREBASE_*` keys (see `.env.example`). Accessed via `useRuntimeConfig().public` in server/plugin code.

### Android / Capacitor

The Android build uses `nuxt generate` to produce a static site in `.output/public`, then Capacitor copies it into the Android project. The `dist` symlink in the root points to `.output/public`.

## Conventions

- Always use `<script setup lang="ts">` — never Options API.
- Composables return `{ data, loading, error }` shape; services return `{ data: T | null, error: string | null }`.
- Auto-imports are active for Nuxt/Vue utilities and composables — no need to import `ref`, `computed`, `navigateTo`, etc. in `.vue` files.
- Global helpers (`formatCurrency`, `shortFormatCurrency`) are auto-imported from `utils/`.
- Page-specific sub-components live in `pages/modules/` rather than `components/`.
