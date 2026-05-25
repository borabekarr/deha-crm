---
name: vite-esm-dirname-alias
description: Vite config in an ESM package must derive __dirname from import.meta.url; bare __dirname is undefined and silently corrupts path aliases.
metadata:
  type: lesson
  category: bug-type
  incident-date: 2026-05-25
verification-command: grep -q "fileURLToPath" apps/web/vite.config.ts
---

# Lesson: Vite path alias broke silently because `__dirname` is undefined in ESM

## What happened

User opened the dev server, saw a red Vite overlay on every route. Console:

```
[plugin:vite:import-analysis] Failed to resolve import "@/assets/brand" from "src/main.tsx".
```

Earlier work that fixed `LazyMotion features={domAnimation}` → `domMax` (so 8 shared-layout primitives could morph) had already shipped, but appeared to have no effect. Users reported "no animations on the primitives page" for an entire turn because the page never rendered at all. The `@` alias resolved to a path that did not exist, so every `@/components/*`, `@/features/*`, `@/assets/*` import 404'd. The first such failure in `main.tsx` blew up the whole bundle.

## Root cause

`apps/web/vite.config.ts` defined the alias as `path.resolve(__dirname, './src')`. `apps/web/package.json` declares `"type": "module"`. In ESM contexts, `__dirname` is not a global; it is `undefined`. `path.resolve(undefined, './src')` returned `<process.cwd()>/src` or similar garbage depending on where Vite was launched from, never the intended `apps/web/src/`. CommonJS files get `__dirname` injected at module load; ESM files do not.

## How to apply this lesson

- For any Node config file under a package with `"type": "module"`, derive `__dirname` explicitly: `import { fileURLToPath } from 'node:url'; const __filename = fileURLToPath(import.meta.url); const __dirname = path.dirname(__filename)`.
- Or skip the variable entirely: `fileURLToPath(new URL('./src', import.meta.url))` resolves relative to the current source file in one line.
- When a Vite alias appears to work for the test suite but break in the dev server (or vice versa), the cwd-vs-source-relative-path question is the first thing to check.
- Symptom rule of thumb: if every `@/*` import 404s at runtime but TypeScript path resolution succeeds, the Vite alias is pointing somewhere TS doesn't validate. Run `pnpm build` once — it surfaces the mismatch immediately.
