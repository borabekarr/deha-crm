/**
 * Design-system visual regression suite.
 *
 * Freezes the current (restored, correct) look of all Claude Design components
 * at maxDiffPixels:0.  Runs under both Playwright projects: `default` and
 * `reduced-motion` (see playwright.config.ts).
 *
 * Slugs are hardcoded here to keep the test file self-contained.
 * KEEP IN SYNC with apps/web/src/lib/component-registry.ts.
 */

import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Slug list — mirrors registry order in component-registry.ts
// ---------------------------------------------------------------------------
const SLUGS = [
  // Foundations
  'colors-neutrals',
  'colors-primary',
  'colors-semantic',
  'type-scale',
  'type-display',
  'spacing-scale',
  'spacing-radii',
  'spacing-shadows',
  'iconography',
  'brand-logo',
  'background-gradient',
  // Primitives
  'buttons',
  'pills',
  'cards',
  // Data
  'leads-table',
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wait for the PreviewFrame content area to settle.
 *
 * The route renders a <Suspense> whose lazy component loads asynchronously.
 * We wait for:
 *   1. networkidle  — fonts / icons done loading
 *   2. The preview content wrapper (the inner <div> with min-width set by
 *      the viewport entry) to appear — confirms Suspense resolved
 *   3. A short RAF-aligned pause to let any CSS transitions finish
 */
async function waitForPreview(page: import('@playwright/test').Page) {
  // Wait for Suspense to resolve: the "Loading component…" div goes away
  // and the actual component root appears inside the preview area.
  await page.waitForLoadState('networkidle')
  // Confirm the preview scrollable area is visible
  await page.locator('.overflow-auto').first().waitFor({ state: 'visible' })
  // Give any CSS paint one additional frame
  await page.waitForTimeout(200)
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

for (const slug of SLUGS) {
  test(`design-system / ${slug}`, async ({ page }) => {
    await page.goto(`/components/${slug}`)
    await waitForPreview(page)

    await expect(page).toHaveScreenshot(`${slug}.png`, {
      maxDiffPixels: 0,
      animations: 'disabled',
    })
  })
}
