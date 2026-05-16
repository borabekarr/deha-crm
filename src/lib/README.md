# src/lib/

Pure utilities, helpers, formatters, constants, and third-party client initialisation (e.g., `supabase.ts`, `utils.ts`).
All exports must be side-effect-free functions or constants — no React components, no hooks.
Do NOT put feature logic, components, or hooks here.

## Environment variables

All env access goes through `env.ts`. Never read `import.meta.env` directly in features.

> **Note:** Supabase vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are currently set to `.default("")` so the app builds without a `.env.local` file. TODO: restore `.min(1).url()` once secrets are provisioned.

## Analytics

All tracking goes through `analytics.track()`. Define event names as constants in `src/lib/events.ts` (when added).

## react-scan

react-scan is auto-enabled in dev mode via the dynamic import block at the top of `src/main.tsx`:

```ts
if (import.meta.env.DEV) {
  await import("react-scan");
}
```

To disable it temporarily, comment out or remove that block. It is tree-shaken out of production builds automatically because the guard is `import.meta.env.DEV` (Vite replaces this with `false` at build time).

## Lighthouse CI

Run a full Lighthouse audit against the production build:

```bash
pnpm build
pnpm lint:perf   # runs: lhci autorun
```

Thresholds are defined in `.lighthouserc.json` (performance ≥ 0.85, accessibility ≥ 0.95, best-practices ≥ 0.9, seo ≥ 0.9). Results are uploaded to temporary public storage.

## Vercel Analytics

Vercel Analytics integration is deferred to the deploy phase. When a Vercel project is provisioned:
1. `pnpm add @vercel/analytics`
2. Import and render `<Analytics />` from `@vercel/analytics/react` inside `AnalyticsProvider` (or at the root in `main.tsx`).
3. No extra env vars needed — Vercel injects the project ID automatically on the platform.
