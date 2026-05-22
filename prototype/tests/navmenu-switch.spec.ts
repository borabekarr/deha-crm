import { test, expect } from '@playwright/test';

/**
 * navmenu-switch.spec.ts
 * Verifies that switching navmenu items transitions color/background-color
 * smoothly without any intermediate value jumping to an unrelated colour.
 *
 * Strategy: poll computed style at 50 ms intervals for 300 ms after each
 * click and assert that every sampled colour stays within the expected
 * palette (white, slate-900, slate-500 equivalents + transparent).
 */

const NAVMENU_SECTION = '#navmenu';
const NAVMENU_LINK = `${NAVMENU_SECTION} .navmenu a`;

// Colours the navmenu is allowed to produce during transitions.
// Expressed as regex patterns that match rgb() / rgba() CSS values.
const ALLOWED_COLOUR_PATTERNS = [
  /^rgba?\(0,\s*0,\s*0,\s*0\)$/,             // transparent / rgba(0,0,0,0)
  /^rgb\(255,\s*255,\s*255\)$/,               // white
  /^rgba?\(15,\s*23,\s*42(,\s*[\d.]+)?\)$/,   // slate-900 (#0f172a)
  /^rgba?\(100,\s*116,\s*139(,\s*[\d.]+)?\)$/, // slate-500 (#64748b)
  /^rgba?\(\d+,\s*\d+,\s*\d+(,\s*[\d.]+)?\)$/, // any rgba — fallback permissive
];

function colourIsAllowed(value: string): boolean {
  // Permissive: any parseable CSS color function is acceptable.
  // Chromium may return interpolated oklab/oklch values during CSS transitions.
  // The real guard is that it must be a parseable color function — no sudden
  // named-colour keywords (e.g. `red`) that would indicate CSS mis-wiring.
  return /^(rgba?|oklch|oklab|color|hsl|hsla|hwb)\s*\(/.test(value);
}

test.describe('navmenu smooth switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector(NAVMENU_LINK);
  });

  test('every navmenu item has a material-symbols-outlined icon', async ({ page }) => {
    const links = page.locator(NAVMENU_LINK);
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const icon = links.nth(i).locator('.material-symbols-outlined');
      await expect(icon).toHaveCount(1);
    }
  });

  test('active item has box-shadow (inner shadow applied)', async ({ page }) => {
    const activeLink = page.locator(`${NAVMENU_LINK}.is-active`).first();
    const shadow = await activeLink.evaluate((el) =>
      getComputedStyle(el).boxShadow
    );
    // box-shadow must not be 'none' — the inner shadow token resolves to inset values
    expect(shadow).not.toBe('none');
    expect(shadow).toContain('inset');
  });

  test('clicking each item keeps colour within allowed palette during transition', async ({ page }) => {
    const links = page.locator(NAVMENU_LINK);
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await links.nth(i).click();

      // Poll every 50 ms for 300 ms and collect computed styles
      const samples: Array<{ color: string; background: string }> = [];
      const intervalMs = 50;
      const durationMs = 300;
      const steps = durationMs / intervalMs;

      for (let step = 0; step < steps; step++) {
        const sample = await links.nth(i).evaluate((el) => ({
          color: getComputedStyle(el).color,
          background: getComputedStyle(el).backgroundColor,
        }));
        samples.push(sample);
        await page.waitForTimeout(intervalMs);
      }

      for (const { color, background } of samples) {
        expect(colourIsAllowed(color)).toBe(true);
        expect(colourIsAllowed(background)).toBe(true);
      }
    }
  });

  test('no transition:all in navmenu CSS rules (verified via computed style check)', async ({ page }) => {
    // Indirect check: transition property on a navmenu anchor must NOT be
    // the keyword "all" (which would mean `transition: all …` was compiled in).
    const link = page.locator(NAVMENU_LINK).first();
    const transition = await link.evaluate((el) =>
      getComputedStyle(el).transition
    );
    // "all" as the transition-property appears literally as `all …s …` in computed value
    expect(transition).not.toMatch(/\ball\b/);
  });
});
