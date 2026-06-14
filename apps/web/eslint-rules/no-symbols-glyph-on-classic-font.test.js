/**
 * Tests for no-symbols-glyph-on-classic-font ESLint rule.
 *
 * Run with:
 *   node --test apps/web/eslint-rules/no-symbols-glyph-on-classic-font.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RuleTester } from 'eslint';
import rule from './no-symbols-glyph-on-classic-font.js';

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

describe('no-symbols-glyph-on-classic-font', () => {
  it('passes valid cases and catches invalid cases', () => {
    tester.run('no-symbols-glyph-on-classic-font', rule, {
      valid: [
        // 1. Correct font: material-symbols-outlined with neurology — VALID
        {
          code: `export const A = () => <span className="material-symbols-outlined">neurology</span>;`,
        },

        // 2. Classic font with a glyph that exists there — VALID
        {
          code: `export const B = () => <span className="material-icons">home</span>;`,
        },

        // 3. Classic font variant (outlined) with a classic glyph — VALID
        {
          code: `export const C = () => <span className="material-icons-outlined">star</span>;`,
        },

        // 4. material-symbols-outlined with neurology alongside other classes — VALID
        {
          code: `export const D = () => <span className="material-symbols-outlined icon-lg">neurology</span>;`,
        },
      ],

      invalid: [
        // 1. Classic font + neurology (Symbols-only glyph) — INVALID
        {
          code: `export const X = () => <span className="material-icons">neurology</span>;`,
          errors: [
            {
              messageId: 'useSymbolsFont',
              data: { glyph: 'neurology' },
            },
          ],
        },

        // 2. Classic outlined variant + neurology — INVALID
        {
          code: `export const Y = () => <span className="material-icons-outlined">neurology</span>;`,
          errors: [
            {
              messageId: 'useSymbolsFont',
              data: { glyph: 'neurology' },
            },
          ],
        },
      ],
    });
  });
});
