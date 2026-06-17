import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import noNondeterministicRender from './eslint-rules/no-nondeterministic-render.js'
import tailwindSizeShorthand from './eslint-rules/tailwind-size-shorthand.js'
import noSymbolsGlyphOnClassicFont from './eslint-rules/no-symbols-glyph-on-classic-font.js'

const local = {
  rules: {
    'no-nondeterministic-render': noNondeterministicRender,
    'tailwind-size-shorthand': tailwindSizeShorthand,
    'no-symbols-glyph-on-classic-font': noSymbolsGlyphOnClassicFont,
  },
}

export default defineConfig([
  globalIgnores(['dist', 'plans/', 'evaluate/', 'handouts/', 'debt/', 'memory/', '.archive/', 'node_modules/', 'eslint-rules/']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
      local,
    },
    settings: {
      react: { version: '19.2.3' },
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'Route',
            'loader',
            'action',
            'meta',
            'links',
            'shouldRevalidate',
            'ErrorBoundary',
            'useFormField',
          ],
        },
      ],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'dangerouslySetInnerHTML is banned; sanitize and render text instead.',
        },
        {
          selector: "Literal[value=/auto_awesome/]",
          message: "auto_awesome is blacklisted — use 'neurology' instead.",
        },
        {
          selector: "JSXText[value=/auto_awesome/]",
          message: "auto_awesome is blacklisted — use 'neurology' instead.",
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'react/button-has-type': 'error',
      'react/no-array-index-key': 'error',
      'react/jsx-no-constructed-context-values': 'error',
      'jsx-a11y/control-has-associated-label': 'error',
      'jsx-a11y/prefer-tag-over-role': 'error',
      'local/no-nondeterministic-render': 'warn',
      'local/tailwind-size-shorthand': 'warn',
    },
  },
  // Design-system source: enforce Symbols-only glyph guard at ERROR level.
  {
    files: ['src/components/design-system/**/*.{ts,tsx}'],
    plugins: { local },
    rules: {
      'local/no-symbols-glyph-on-classic-font': 'error',
    },
  },
])
