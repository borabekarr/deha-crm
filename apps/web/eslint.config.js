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
  // 2026-08-31 (Bora): these components pass a shared "refs bag" object down
  // as a prop and write individual ref.current fields into it directly, by
  // design, to keep imperative DOM writes out of useEffect (see the
  // shared-refs-bag rationale documented in TodoTaskEditorPopover.tsx's
  // header comment). react-hooks/refs and react-hooks/immutability can't
  // statically distinguish a ref nested in a prop object from arbitrary
  // mutable prop data, so they misfire on every access here. Scoped off
  // rather than refactored, per Bora's decision.
  {
    files: [
      'src/components/design-system/buyer-brain/BuyerBrain.tsx',
      'src/components/design-system/delete-modal/DeleteModal.tsx',
      'src/components/design-system/dropdown/Dropdown.tsx',
      'src/components/design-system/expandable-screen/ExpandableScreen.tsx',
      'src/components/design-system/sprint-planner-core/SprintPlannerCore.tsx',
      'src/components/design-system/status-card/StatusCard.tsx',
      'src/components/design-system/toast/toast-swipe.ts',
      'src/components/design-system/todo-list/TodoTaskEditorPopover.tsx',
    ],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  // 2026-08-31 (Bora): genuinely effect-appropriate setState -- each case
  // below schedules or cancels a real timer (unmount/exit delay, roll-digit
  // animation settle) tied to an external system, which is exactly what
  // react-hooks/set-state-in-effect's own guidance says effects are for; a
  // render-phase derivation can't own a setTimeout. Everything derivable
  // during render was converted (ModelSelector.tsx, OtpInput.tsx,
  // use-fit-scale.ts) rather than scoped off.
  {
    files: [
      'src/components/design-system/dropdown/Dropdown.tsx',
      'src/components/design-system/delete-button/DeleteButton.tsx',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  // 2026-08-31 (Bora): `role="group"` grouping a labeled set of native
  // <button>s (WAI-ARIA APG toolbar/group pattern) with aria-label(ledby).
  // <fieldset> is form-control semantics and adds unwanted default browser
  // border/padding chrome that would change these widgets' layout.
  {
    files: [
      'src/components/design-system/calendar/CalendarNewEventPopover.tsx',
    ],
    rules: {
      'jsx-a11y/prefer-tag-over-role': 'off',
    },
  },
  // 2026-08-31 (Bora): a fully-implemented WAI-ARIA APG "listbox" composite
  // widget (roving tabindex, aria-selected, keyboard nav) with a rich visual
  // row layout a native <select>/<datalist> can't render. role="listbox"/
  // "option" is the correct, standard pattern for this kind of custom widget.
  {
    files: ['src/components/design-system/model-selector/ModelSelector.tsx'],
    rules: {
      'jsx-a11y/prefer-tag-over-role': 'off',
    },
  },
  // 2026-08-31 (Bora): `<svg role="img" aria-label>` is the W3C-recommended
  // accessible pattern for a non-decorative inline SVG chart (an <img> tag
  // can't render live SVG paths); the rule's "use <img>" suggestion doesn't
  // apply to this case.
  {
    files: ['src/components/design-system/pie-chart/PieChart.tsx'],
    rules: {
      'jsx-a11y/prefer-tag-over-role': 'off',
    },
  },
  // 2026-08-31 (Bora): canonical-pass.tsx is a standalone token-fidelity-gate
  // fixture that registers itself on `window` by design and intentionally
  // carries no import/export (see its own header comment) — exempt it from
  // the exports-required check rather than adding a throwaway export.
  {
    files: ['design-system/tools/fixtures/canonical-pass.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
