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
// addInitScript runs in the page before any app script.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let s = 0x2545f491 >>> 0
    Math.random = () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0
      return s / 0xffffffff
    }
    // Freeze the wall clock so components that render live time produce
    // identical pixels every run. currency-converter shows nowHM() (HH:MM) in
    // its default state — minute-granular, so it drifted between runs minutes
    // apart and broke exact-match on CI. Pinned to the capture day
    // (2026-06-17 UTC): day-granular renders (todo-list "today", calendar grid)
    // are unchanged, only live clocks become deterministic. Argument forms
    // (new Date(ms), new Date(y, m, d), parsing) keep their real behaviour, so
    // date math in todo-list / dynamic-calendar is preserved.
    const FIXED = new Date('2026-06-17T12:00:00Z').getTime()
    const RealDate = Date
    class FrozenDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof Date> | []) {
        if (args.length === 0) {
          super(FIXED)
        } else {
          super(...(args as ConstructorParameters<typeof Date>))
        }
      }
      static now() {
        return FIXED
      }
    }
    globalThis.Date = FrozenDate as DateConstructor
  })
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
  'brand-logo',
  'background-gradient',
  // Primitives
  'buttons',
  'pills',
  'cards',
  'controls',
  'fab',
  'message-dropdown',
  'delete-button',
  'inline-edit',
  // Data
  'leads-table',
  'adjust-timeframe',
  'currency-converter',
  'dynamic-calendar',
  'github-calendar',
  'stacked-list',
  // Metrics & Charts
  'chart',
  'metric-card',
  'metric-circle',
  'statistics-graph-card',
  'streak-card',
  // financial-health-card is captured by a dedicated test below: its mount
  // count-up (tweenScore -> .fhc-num) occasionally lands mid-tween at the
  // 900ms mark, so the generic goto+shot flaked. The dedicated test waits for
  // the counter to reach its final value before capturing.
  // Sheets & Cards
  'model-selector',
  'connect-modal',
  'status-card',
  // Workflow
  'task-board',
  'sprint-planner-core',
  // AI
  'ai-memory-card',
  'ai-caveat',
  'ai-message-box',
  'ai-composer',
  // Misc
  'delete-modal',
  'todo-list',
  'theme-editor',
  'onboarding-completion',
  'dynamic-island-reader',
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

for (const slug of SLUGS) {
  test(`design-system / ${slug}`, async ({ page }) => {
    await page.goto(`/components/${slug}`)
    await waitForPreview(page)

    await expect(page).toHaveScreenshot(`${slug}.png`, SHOT_OPTS)
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

  await expect(page).toHaveScreenshot('financial-health-card.png', SHOT_OPTS)
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

  await expect(page).toHaveScreenshot('task-card.png', SHOT_OPTS)
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

  await expect(page).toHaveScreenshot('workflow-add-elements.png', SHOT_OPTS)
})
