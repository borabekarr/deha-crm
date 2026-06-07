/**
 * Design-system visual regression suite.
 *
 * Runs under both Playwright projects: `default` and `reduced-motion`
 * (see playwright.config.ts).
 *
 * Slugs are hardcoded here to keep the test file self-contained.
 * KEEP IN SYNC with apps/web/src/lib/component-registry.ts.
 *
 * BASELINE ADOPTION RULE FOR NEW SLUGS
 * -------------------------------------
 * Baselines must be CI-rendered. Locally generated PNGs differ from CI output
 * due to antialiasing and font-rendering differences, which causes CI to fail
 * even when no visual change was made.
 *
 * Procedure for a new slug:
 *   1. Add the slug to SLUGS below.
 *   2. Push a branch. The CI run will fail the new snapshot test and upload
 *      an `actual` artifact under the Playwright report.
 *   3. Download the artifact and copy the PNG into
 *      apps/web/tests/design-system.spec.ts-snapshots/ as the baseline.
 *   4. Commit the baseline PNG and push again — CI passes.
 *
 * Do NOT run --update-snapshots locally for new slugs.
 * Do NOT commit locally generated PNGs as baselines.
 * This is the same procedure used for leads-table (wave-1 reference).
 */

import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Comparison options: exact on CI, small-ratio tolerance locally.
// CI sets CI=true (GitHub Actions). Local runs absorb antialiasing noise
// (observed ratio ~0.01) while still catching real changes.
// ---------------------------------------------------------------------------
const STRICT = !!process.env.CI
const SHOT_OPTS = STRICT
  ? { maxDiffPixels: 0, animations: 'disabled' as const }
  : { maxDiffPixelRatio: 0.02, animations: 'disabled' as const }

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
  'controls',
  'fab',
  // Data
  'leads-table',
  // Metrics & Charts
  'metric-card',
  'metric-circle',
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
  // Wait for Suspense to resolve: the "Loading component..." div goes away
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

    await expect(page).toHaveScreenshot(`${slug}.png`, SHOT_OPTS)
  })
}
