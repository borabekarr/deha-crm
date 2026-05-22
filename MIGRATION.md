# Monorepo Migration (2026-05-22)

## Why

Deha CRM ships as web (existing Vite + React 19 surface) and iOS (Expo + RN, in
progress). Two stacks cannot share React components, but can share types, Zod
schemas, Supabase wrappers, and crucially motion tokens (durations + easing
curves) that keep animation behavior consistent across both platforms. Single
repo, two app targets, four shared packages.

## Layout

- `apps/web/` — Vite 5 + React 19 + Tailwind v4 + TanStack Router. Port 5173.
- `apps/mobile/` — Expo SDK 56 + React Native. Port 8081 (Metro).
- `packages/core/` — Pure TS types, Zod schemas, platform-agnostic business logic.
- `packages/api/` — Supabase client factory (`createSupabaseClient(url, anonKey)`).
  Re-exported by `apps/web/src/lib/supabase.ts` as a singleton with
  `import.meta.env` injection; mobile will do the same with
  `process.env.EXPO_PUBLIC_*`.
- `packages/motion-tokens/` — Duration + easing tables. Shared by both apps.
- `packages/ui-contracts/` — Cross-platform component prop interfaces (e.g.
  `MotionAwareProps`). Stub for now.
- `prototype/` — STAYS at repo root. Vanilla showcase, separate tooling, ported
  to `apps/web` in a later plan.

## How to add a new shared package

1. `mkdir -p packages/<name>/src && cd packages/<name>`
2. Add `package.json`:
   ```json
   {
     "name": "@deha/<name>",
     "private": true,
     "version": "0.0.0",
     "main": "src/index.ts",
     "types": "src/index.ts",
     "scripts": {
       "build": "tsc",
       "typecheck": "tsc --noEmit"
     }
   }
   ```
3. Add `tsconfig.json` extending `../../tsconfig.base.json`.
4. Add `src/index.ts` with at least one named export.
5. From repo root: `pnpm install`.
6. Add `"@deha/<name>": "workspace:*"` to consumer app dependencies.

## Motion tokens

Single source: `packages/motion-tokens`. Two consumers translate to
platform-native shape:

**Web (Framer Motion):**

```ts
// apps/web/src/lib/motion.ts
import { duration, easing } from '@deha/motion-tokens';

export const motionTransition = (token = 'base') => ({
  duration: duration[token] / 1000,
  ease: easing.standard,
});
```

**Mobile (Reanimated / RN Easing):**

```ts
// apps/mobile/src/lib/motion.ts
import { duration, easing } from '@deha/motion-tokens';
import { Easing } from 'react-native';

export const motionTiming = (token = 'base') => ({
  duration: duration[token],
  easing: Easing.bezier(...easing.standard),
});
```

## Gotchas

### nodeLinker: hoisted

`pnpm-workspace.yaml` has `nodeLinker: hoisted`. Required for Expo monorepo
compatibility on SDK 53 and below. SDK 54+ supports isolated installs but Metro
module resolution still gets touchy with deeply hoisted RN deps. Stay hoisted
until a future plan tests isolated mode end-to-end on iOS device.

### Vite under Turborepo (vercel/turborepo#11784)

Vite v6 can exit early when run under `turbo run dev`, killing the dev server
before HMR connects. Workarounds:

- Use `pnpm dev:web` (filter to the Vite workspace, bypasses the parallel
  scheduler issue).
- Or run Vite directly: `cd apps/web && pnpm dev`.
- Avoid experimental tty flags. Do not apply until you have actually seen
  the symptom.

### Why not Tamagui

Tamagui is the obvious "one component library, two platforms" play, but it
conflicts with the existing Shadcn UI + Tailwind v4 investment in `apps/web`.
Rewriting the web design system to Tamagui would burn weeks for parity with what
Shadcn already gives. Pattern chosen: **parallel-UI** — separate `ui-web` and
`ui-native` packages will conform to shared `ui-contracts` interfaces. Motion
tokens shared, components not.

### Supabase client env injection

`packages/api` exports `createSupabaseClient(url, anonKey)` as a factory. Each
app injects its own env var source: web uses `import.meta.env.VITE_SUPABASE_*`,
mobile uses `process.env.EXPO_PUBLIC_SUPABASE_*`. Never read env from inside the
package — keep it pure.

### Metro monorepo config

`apps/mobile/metro.config.js` MUST include `watchFolders: [workspaceRoot]`,
extended `nodeModulesPaths`, and `disableHierarchicalLookup = true`. Without
these, Metro fails to resolve `@deha/*` workspace imports. Copy from Expo's
official monorepo guide.

## Next phases

- `plans/web-react-port.md` — Port `prototype/` vanilla showcase into `apps/web`
  routes.
- `plans/web-anims-port.md` — Wire Framer Motion + Stripe-style animation
  choreography into `apps/web`.
- `plans/ios-anims-port.md` — Add Reanimated 4 + RN Skia + rit3zh primitives in
  `apps/mobile`.

Execute in that order. Each builds on the motion tokens scaffolding from this
monorepo plan.
