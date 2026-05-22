import { test, expect } from '@playwright/test';

/**
 * Inset box-shadow direction spec.
 *
 * Design bible rule: inset shadows must be bottom-emitting (light from above),
 * meaning the y-offset of every `inset` box-shadow must be negative.
 *
 * Opt-out: icon-button triggers (calendar nav, etc.) that intentionally use
 * a positive y-offset for pressed-state feedback are excluded.
 */

const OPT_OUT_SELECTORS = [
  'button:has(.material-symbols-outlined)',
];

interface ShadowViolation {
  selector: string;
  tagName: string;
  shadow: string;
  yOffset: number;
}

test.describe('inset box-shadow direction', () => {
  test('every inset box-shadow has negative y-offset (bottom-emitting)', async ({ page }) => {
    await page.goto('/');

    const violations: ShadowViolation[] = await page.evaluate((optOuts) => {
      const results: ShadowViolation[] = [];

      // Build a combined CSS selector string for opt-outs
      const optOutSelector = optOuts.join(', ');

      // Walk every element in the document
      const all = document.querySelectorAll('*');
      for (const el of all) {
        // Skip opt-out elements
        if (optOutSelector && el.matches(optOutSelector)) continue;

        const shadow = getComputedStyle(el).boxShadow;
        if (!shadow || shadow === 'none') continue;

        // Split multiple shadows by the comma that separates them
        // (be careful: rgb(...) can contain commas, so split on `) ,` pattern)
        const parts = shadow.split(/(?<=\))\s*,\s*/);

        for (const part of parts) {
          if (!part.includes('inset')) continue;

          // Parse the y-offset from an inset shadow.
          // Format: inset <x>px <y>px [blur] [spread] [color]
          // We strip the color portion and parse numeric px values.
          // Regex captures the second px value (y-offset) after "inset"
          const insetMatch = part.match(
            /inset\s+(-?[\d.]+)px\s+(-?[\d.]+)px/i,
          );
          if (!insetMatch) continue;

          const yOffset = parseFloat(insetMatch[2]);

          if (yOffset >= 0) {
            results.push({
              selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className ? `.${[...el.classList].join('.')}` : ''),
              tagName: el.tagName,
              shadow: part.trim(),
              yOffset,
            });
          }
        }
      }

      return results;
    }, OPT_OUT_SELECTORS);

    if (violations.length > 0) {
      const summary = violations
        .map((v) => `  [${v.selector}] y=${v.yOffset} shadow="${v.shadow}"`)
        .join('\n');
      expect(violations, `Found ${violations.length} inset shadows with non-negative y-offset:\n${summary}`).toHaveLength(0);
    }
  });
});
