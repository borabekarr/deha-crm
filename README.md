# React + TypeScript + Vite

> See [MIGRATION.md](./MIGRATION.md) for the monorepo restructure rationale and layout.

## Workspaces

| Package | Stack | Port |
|---|---|---|
| `apps/web` | Vite + React 19 + Tailwind v4 + TanStack Router | 5173 |
| `apps/mobile` | Expo SDK 56 + React Native | 8081 |
| `packages/core` | Pure TS types and schemas | — |
| `packages/api` | Supabase client factory | — |
| `packages/motion-tokens` | Duration + easing tokens (shared with both apps) | — |
| `packages/ui-contracts` | Cross-platform component prop interfaces | — |

### Dev commands

- `pnpm dev` — boots web + mobile in parallel via Turborepo
- `pnpm dev:web` — Vite only (port 5173)
- `pnpm dev:mobile` — Metro only (port 8081)

> **Vite-under-Turborepo gotcha** ([vercel/turborepo#11784](https://github.com/vercel/turborepo/issues/11784)): If `pnpm dev` causes Vite to exit early, use `pnpm dev:web` directly.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
