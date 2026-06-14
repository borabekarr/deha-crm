/**
 * Tests for no-nondeterministic-render ESLint rule.
 *
 * Run with:
 *   node --test apps/web/eslint-rules/no-nondeterministic-render.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RuleTester } from 'eslint';
import rule from './no-nondeterministic-render.js';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

describe('no-nondeterministic-render', () => {
  it('passes valid cases and catches invalid cases', () => {
    tester.run('no-nondeterministic-render', rule, {
      valid: [
        // 1. Date.now() inside an onClick JSX event handler — excluded
        {
          code: `
            function MyComponent() {
              return <button onClick={() => { const t = Date.now(); }}>Go</button>;
            }
          `,
        },

        // 2. Date.now() inside a useEffect callback — excluded
        {
          code: `
            function MyComponent() {
              useEffect(() => {
                const t = Date.now();
              }, []);
              return null;
            }
          `,
        },

        // 3. Date.now() at module scope — not inside any component
        {
          code: `const BOOT_TIME = Date.now();`,
        },

        // 4. Hoisted const outside a component — not a render path
        {
          code: `
            const NOW = Date.now();
            function MyComponent({ offset }) {
              return <span>{NOW + offset}</span>;
            }
          `,
        },

        // 5. Math.random() inside a .then() callback — excluded
        {
          code: `
            function MyComponent() {
              fetch('/api').then(() => {
                const r = Math.random();
              });
              return null;
            }
          `,
        },

        // 6. new Date() inside a useMemo callback — excluded
        {
          code: `
            function useMyHook() {
              const d = useMemo(() => new Date(), []);
              return d;
            }
          `,
        },

        // 7. new Date() inside a useCallback — excluded
        {
          code: `
            function MyComponent() {
              const handler = useCallback(() => {
                const d = new Date();
              }, []);
              return null;
            }
          `,
        },

        // 8. Math.random() inside setTimeout callback — excluded
        {
          code: `
            function MyComponent() {
              setTimeout(() => {
                const r = Math.random();
              }, 1000);
              return null;
            }
          `,
        },

        // 9. Non-component function (lowercase name) — not in render path
        {
          code: `
            function formatDate(d) {
              return Date.now() - d;
            }
          `,
        },
      ],

      invalid: [
        // 1. Math.random() directly in a component body
        {
          code: `
            function MyComponent() {
              const jitter = Math.random();
              return <div>{jitter}</div>;
            }
          `,
          errors: [
            {
              messageId: 'noNondeterministicRender',
              data: { call: 'Math.random()' },
            },
          ],
        },

        // 2. new Date() directly in a hook body
        {
          code: `
            function useTimer() {
              const start = new Date();
              return start;
            }
          `,
          errors: [
            {
              messageId: 'noNondeterministicRender',
              data: { call: 'new Date()' },
            },
          ],
        },

        // 3. Date.now() in a JSX expression inside a component
        {
          code: `
            function MyComponent() {
              return <span>{Date.now()}</span>;
            }
          `,
          errors: [
            {
              messageId: 'noNondeterministicRender',
              data: { call: 'Date.now()' },
            },
          ],
        },

        // 4. Math.random() in an arrow-function component
        {
          code: `
            const MyComponent = () => {
              const id = Math.random();
              return <div id={id} />;
            };
          `,
          errors: [
            {
              messageId: 'noNondeterministicRender',
              data: { call: 'Math.random()' },
            },
          ],
        },

        // 5. Date.now() in a hook body (arrow style)
        {
          code: `
            const useTimestamp = () => {
              const t = Date.now();
              return t;
            };
          `,
          errors: [
            {
              messageId: 'noNondeterministicRender',
              data: { call: 'Date.now()' },
            },
          ],
        },
      ],
    });

    assert.ok(true, 'all RuleTester cases passed');
  });
});
