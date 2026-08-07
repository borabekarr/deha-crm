# Monorepo Migration (2026-05-22, superseded)

## History

In 2026-05 the repo briefly planned a multi-platform monorepo: web (Vite +
React 19) plus a native iOS app (Expo + React Native), sharing types, Zod
schemas, a Supabase client, and motion tokens across four `packages/*`
workspaces. That plan was not carried through — the mobile app and all shared
packages were removed, and the repo consolidated to a single app.

## Current layout

- `apps/web/` — Vite + React 19 + Tailwind v4 + TanStack Router. Port 5173.
  This is the only workspace.
- `prototype/` — legacy vanilla showcase kept at repo root for reference; its
  content has already been ported into `apps/web`.

`packages/` is empty; its glob has been removed from the pnpm workspace
config.

## Gotchas

### nodeLinker: hoisted

`pnpm-workspace.yaml` sets `nodeLinker: hoisted`. This is a current workspace
setting, independent of any multi-app history.

### Vite under Turborepo (vercel/turborepo#11784)

Vite v6 can exit early when run under `turbo run dev`, killing the dev server
before HMR connects. Workarounds:

- Use `pnpm dev:web` (filter to the Vite workspace, bypasses the parallel
  scheduler issue).
- Or run Vite directly: `cd apps/web && pnpm dev`.
- Avoid experimental tty flags. Do not apply until you have actually seen
  the symptom.
