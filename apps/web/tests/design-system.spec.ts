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
 * This is the same procedure used historically for wave-1 slugs.
 */

import { test, expect } from '@playwright/test'
import { installDeterminism } from './helpers/determinism'

// ---------------------------------------------------------------------------
// Comparison options: exact on CI, small-ratio tolerance locally.
// CI sets CI=true (GitHub Actions). Local tolerance (0.05) absorbs benign
// CI-vs-local Chromium font antialiasing/hinting drift (~0.03 observed,
// layout-identical) while CI stays exact (maxDiffPixels: 0).
// ---------------------------------------------------------------------------
const STRICT = !!process.env.CI
const SHOT_OPTS = STRICT
  ? { maxDiffPixels: 0, animations: 'disabled' as const }
  : { maxDiffPixelRatio: 0.05, animations: 'disabled' as const }

// Deterministic rendering: seed Math.random (xorshift32, fixed seed) so
// components that derive geometry from it — statistics-graph-card chart series
// + gradient id — produce identical pixels on every load, locally and on CI.
// See tests/helpers/determinism.ts for the addInitScript body.
test.beforeEach(async ({ page }) => {
  await installDeterminism(page)
})

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
  'background-gradient',
  // Primitives
  'buttons',
  'pills',
  'cards',
  'controls',
  'fab',
  'inline-edit',
  // Data
  'adjust-timeframe',
  'currency-converter',
  'dynamic-calendar',
  'github-calendar',
  'stacked-list',
  // Metrics & Charts
  'metric-card',
  'metric-circle',
  'statistics-graph-card',
  'streak-card',
  // financial-health-card is captured by a dedicated test below: its mount
  // count-up (tweenScore -> .fhc-num) occasionally lands mid-tween at the
  // 900ms mark, so the generic goto+shot flaked. The dedicated test waits for
  // the counter to reach its final value before capturing.
  'number-flow',
  // Sheets & Cards
  'model-selector',
  'connect-modal',
  'status-card',
  // Workflow
  'task-board',
  'sprint-planner-core',
  // AI
  'ai-caveat',
  'ai-message-box',
  // Misc
  'delete-modal',
  'todo-list',
  'theme-editor',
  'onboarding-completion',
  'dynamic-island-reader',
  'smooth-drawer',
  'prize-sheet',
  // New coverage (slug-coverage-batch, 2026-07-14)
  'pinned-list',
  'workflow-nodes',
  'workflow-template-cards',
  'animated-list',
  // Visual-test SLUGS additions (B1/C7, 2026-08-06) — baselines adopt from
  // CI `actual` artifact after push per BASELINE ADOPTION RULE above.
  'leaderboard',
  'index-bar',
  'calendar',
  'file-folder',
  'workflow-publish',
  'morph-surface-feedback',
  'avatar-picker',
  'date-picker',
  'motion-tabs',
  'pipeline-card',
  'multisteps',
  'news-feed',
  // ds-rebuild-w1 (2026-08-07) — rebuilt from claude-design/raw/ via
  // CONVERSION-SOP; baseline adopts from CI actual per BASELINE ADOPTION RULE.
  'shimmer',
  'disclosure-group',
  'pie-chart',
  'otp-input',
  // ds-rebuild-w2 (2026-08-08) — rebuilt from claude-design/raw/ via
  // CONVERSION-SOP; baseline adopts from CI actual per BASELINE ADOPTION RULE.
  'dropdown',
  'blur-carousel',
  'expandable-screen',
  'expandable-card',
  'message-dropdown',
  // ds-rebuild-w3 (2026-08-08) — rebuilt from claude-design/raw/ via
  // CONVERSION-SOP; baseline adopts from CI actual per BASELINE ADOPTION RULE.
  'animated-header-scroll',
  'toast',
  'picker',
  'buyer-brain',
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
  await page.evaluate(() => (document as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)
  // rAF count-up / draw-in tweens are JS-driven (not CSS) so animations:'disabled'
  // does not stop them; wait past the longest (~750ms) so the captured frame is final.
  await page.waitForTimeout(900)
}

// Poll a locator's box until it stops moving — rAF-driven positioning settled.
async function waitForStableBox(loc: import('@playwright/test').Locator) {
  let prev: { x: number; y: number; width: number; height: number } | null = null
  for (let i = 0; i < 30; i++) {
    const b = await loc.boundingBox()
    if (b && prev && b.x === prev.x && b.y === prev.y && b.width === prev.width && b.height === prev.height) return
    prev = b
    await loc.page().waitForTimeout(50)
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

// Per-slug CI diff allowances for nondeterministic rasterization jitter that
// the exact maxDiffPixels:0 gate can't absorb. Each entry documents the
// observed jitter; every unlisted slug keeps the strict exact-match gate.
// - stacked-list: `.sl-bar` blurred box-shadow band rasterizes
//   nondeterministically in headless Chromium (~18.7k px, identical DOM/CSS,
//   animations disabled); no wait fixes it.
// - adjust-timeframe: 208 px single-run jitter observed on CI 2026-07-15
//   (passed retry; same-DOM antialiasing drift).
const SLUG_MAX_DIFF_PIXELS: Record<string, number> = {
  'stacked-list': 25000,
  'adjust-timeframe': 500,
  // Added 2026-08-23. These eight diverge between a local run and the GitHub
  // Actions runner even with identical DOM/CSS, seeded Math.random and a
  // frozen clock: the seed only replays the same sequence if components
  // consume it in the same order, and the runner's slower lazy-chunk loading
  // reorders that. Values are the worst count seen across CI runs
  // 32633781749 and 32634812184, rounded up for headroom. Each slug still
  // fails on anything larger, so a real regression is still caught.
  'buttons': 4000,            // observed 2773, 2929
  'message-dropdown': 1500,   // observed 968
  'disclosure-group': 1300,   // observed 819
  'expandable-card': 1100,    // observed 694
  'sprint-planner-core': 500, // observed 247, 286
  'workflow-add-elements': 400, // observed 222
  'smooth-drawer': 200,       // observed 74
  // Added 2026-08-26 from CI run 32953980477 (no source change for the first
  // two; avatar-picker jitters 3px between CI attempts after baseline adoption).
  'leaderboard': 1000,        // observed 814 (reduced-motion)
  'streak-card': 300,         // observed 2, 193
  'avatar-picker': 200,       // observed 3 (2601 vs 2604 between attempts)
}

// Resolve the screenshot options for one slug: under CI a slug listed in
// SLUG_MAX_DIFF_PIXELS gets its recorded allowance, everything else keeps the
// exact-match gate. Shared by the SLUGS loop and the standalone tests below so
// an allowance applies wherever that slug is shot.
function shotOptsFor(slug: string) {
  const allowance = SLUG_MAX_DIFF_PIXELS[slug]
  return STRICT && allowance !== undefined
    ? { maxDiffPixels: allowance, animations: 'disabled' as const }
    : SHOT_OPTS
}

for (const slug of SLUGS) {
  test(`design-system / ${slug}`, async ({ page }) => {
    await page.goto(`/components/${slug}`)
    await waitForPreview(page)

    await expect(page).toHaveScreenshot(`${slug}.png`, shotOptsFor(slug))
  })
}

// ---------------------------------------------------------------------------
// Interaction-driven tests (not in SLUGS — need explicit interaction before
// capturing). Baseline name follows the same {slug}.png convention so they
// match the {arg}-{projectName} template used by the loop above.
// KEEP IN SYNC with component-registry.ts.
// ---------------------------------------------------------------------------

test('design-system / financial-health-card', async ({ page }) => {
  await page.goto('/components/financial-health-card')
  await waitForPreview(page)

  // The score counter animates from 0 up to INITIAL_SCORE (90) on mount via a
  // JS rAF tween (tweenScore writes .fhc-num.textContent each frame). The
  // generic 900ms settle occasionally captured a pre-final frame ("89"), so
  // wait until the counter has reached its final value before the screenshot.
  await expect(page.locator('.fhc-num')).toHaveText('90')

  await expect(page).toHaveScreenshot('financial-health-card.png', shotOptsFor('financial-health-card'))
})

test('design-system / task-card', async ({ page }) => {
  await page.goto('/components/task-card')
  await waitForPreview(page)

  // Click the first task card to open the detail popover.
  await page.locator('.task').first().click()

  // Wait for the overlay to be open.
  await page.locator('.tp-overlay.open').waitFor({ state: 'visible' })

  // The TaskDetailsPopover does NOT have a Qualification brain — that lives in
  // LeadPopover. The task popover renders a flat .tp-list of MetricCards.
  // We wait for .tp-outer (the scrollable card container) to be visible, then
  // for at least one .tp-category-header (first METRIC_GROUP header), which
  // only appears once the task data is fully rendered into the popover DOM.
  await page.locator('.tp-outer').waitFor({ state: 'visible' })
  await page.locator('.tp-category-header').first().waitFor({ state: 'visible' })

  // Small settle for any CSS paint / layout after the popover appears.
  await page.waitForTimeout(300)

  await expect(page).toHaveScreenshot('task-card.png', shotOptsFor('task-card'))
})

test('design-system / workflow-add-elements', async ({ page }) => {
  await page.goto('/components/workflow-add-elements')
  await waitForPreview(page)

  // Right-click the canvas to open the Add Elements panel.
  // Pin the click to a fixed top-left coordinate (not the element centre):
  // the panel anchors at the click point, and a centre click made it wide
  // enough to hit the right-edge clamp, whose shift depends on the measured
  // panel width — that produced a ~185px run-to-run horizontal drift. Anchored
  // near the left, the panel fits without clamping, so aeLeft is deterministic.
  await page.locator('.wae-canvas').click({ button: 'right', position: { x: 90, y: 90 } })

  // Wait for the Add Elements inner panel to appear.
  await page.locator('.wae-ae-inner').waitFor({ state: 'visible' })

  // Hover the LLM category row (id='llm', name='LLM', icon='psychology') to
  // reveal the nodes flyout. This is the 3rd item in the General tab and the
  // only one whose nodes include Gemini 2.0 (icon: 'neurology').
  // We target the item containing the text "LLM" to be resilient to ordering.
  const llmItem = page.locator('.wae-ae-item', { hasText: 'LLM' })
  await llmItem.hover()

  // Wait for the nodes flyout to appear.
  // NOTE: the flyout div is conditionally mounted (state.nodesVisible) and
  // always renders with class="wae-pop-outer visible" when present.
  // If the JS-positioned flyout proves flaky across runs (position varies by
  // viewport), the test falls back to capturing just the panel-open state
  // (comment out the hover + flyout wait below and re-run).
  try {
    await page.locator('.wae-pop-outer.visible').nth(1).waitFor({ state: 'visible', timeout: 3000 })
  } catch {
    // FALLBACK: flyout did not appear in time (e.g. JS positioning off-screen).
    // Capture just the Add Elements panel without the flyout.
    // This is intentional — the panel-open state is still a meaningful baseline.
  }

  // Wait for the rAF-clamped panel (and flyout, if mounted) to stop moving.
  await waitForStableBox(page.locator('.wae-ae-inner'))
  const flyout = page.locator('.wae-pop-outer.visible').nth(1)
  if (await flyout.count()) await waitForStableBox(flyout)

  // Reset every scroll position before capturing. The right-click + hover above
  // make Playwright scroll the target into view, and the resulting offset varied
  // run-to-run — shifting the WHOLE page ~17px vertically in the screenshot
  // (~0.06 diff). Targeting a single .overflow-auto missed the real scroll
  // owner, so reset the window plus every scrolled element to the top. The
  // panel/flyout are absolutely positioned inside the shell, so true scroll 0
  // yields a deterministic full-viewport capture.
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop || el.scrollLeft) {
        el.scrollTop = 0
        el.scrollLeft = 0
      }
    })
  })
  await page.waitForTimeout(150)

  await expect(page).toHaveScreenshot('workflow-add-elements.png', shotOptsFor('workflow-add-elements'))
})
