import { describe, it } from 'node:test';
import { RuleTester } from 'eslint';
import rule from './tailwind-size-shorthand.js';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

describe('tailwind-size-shorthand', () => {
  it('passes valid cases and flags+fixes invalid cases', () => {
    tester.run('tailwind-size-shorthand', rule, {
      valid: [
        // Already using size shorthand
        { code: '<div className="size-4" />' },
        // Mismatched values — should NOT collapse
        { code: '<div className="w-4 h-6" />' },
        // Only one axis present
        { code: '<div className="w-4" />' },
        // Different variant prefixes — should NOT collapse
        { code: '<div className="md:w-4 lg:h-4" />' },
        // cn() call with mismatched values
        { code: 'cn("w-4 h-6")' },
      ],

      invalid: [
        // Basic pair: w-4 h-4 → size-4
        {
          code: '<div className="w-4 h-4" />',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: '<div className="size-4" />',
        },
        // Variant-prefixed pair: md:w-4 md:h-4 → md:size-4
        {
          code: '<div className="md:w-4 md:h-4" />',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: '<div className="md:size-4" />',
        },
        // Arbitrary value: w-[3px] h-[3px] → size-[3px]
        {
          code: '<div className="w-[3px] h-[3px]" />',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: '<div className="size-[3px]" />',
        },
        // Multi-token: whitespace normalization proof
        {
          code: '<div className="flex w-4 h-4 rounded" />',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: '<div className="flex size-4 rounded" />',
        },
        // clsx() call
        {
          code: 'clsx("w-8 h-8")',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: 'clsx("size-8")',
        },
        // cn() call
        {
          code: 'cn("p-2 w-6 h-6 text-sm")',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: 'cn("p-2 size-6 text-sm")',
        },
        // cva() call
        {
          code: 'cva("w-12 h-12")',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: 'cva("size-12")',
        },
        // twMerge() call
        {
          code: 'twMerge("w-[1.5rem] h-[1.5rem]")',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: 'twMerge("size-[1.5rem]")',
        },
        // JSX className with expression container
        {
          code: '<div className={"w-4 h-4"} />',
          errors: [{ messageId: 'useSizeShorthand' }],
          output: '<div className={"size-4"} />',
        },
      ],
    });
  });
});
