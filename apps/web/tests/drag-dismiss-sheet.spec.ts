/**
 * DragDismissSheet exhaustive usage/abuse suite.
 *
 * Component under test: src/components/design-system/drag-dismiss-sheet/
 * DragDismissSheet.tsx (registry status: 'Proceeding' -- not yet in the
 * visual-regression SLUGS list or the animation-spam manifest, both of which
 * gate on 'Finished'; this spec is the component's own dedicated coverage
 * until it graduates).
 *
 * One of the cases below (`drag-UP rubber-band stays fully visible`) is a
 * REGRESSION TEST for a live bug at the time this spec was authored:
 *   CLIPPING on drag-up -- a transformed ancestor (confirmed live: the
 *   gallery's PreviewFrame reveal wrapper) turns `.dds-overlay`'s `position:
 *   fixed` into a containing block relative to that ancestor instead of the
 *   viewport, so `.dds-demo`'s own `overflow: hidden` clips the sheet. The
 *   reveal-triggered window is only ~300-400ms after mount, too timing-
 *   fragile for CI, so this test reproduces the same hazard deterministically
 *   by forcing a synthetic ancestor transform itself (any transformed
 *   ancestor triggers the identical containing-block hijack; the fix --
 *   portalling the overlay to document.body -- is correct for the whole
 *   hazard class, not just the reveal timing). Verified: FAILS pre-fix
 *   (overlay box collapses to the transformed ancestor's box, ~1093x2476
 *   instead of the viewport), PASSES post-fix.
 *
 * The `up-down-up sequence` case below covers a second bug found during this
 * investigation (STUCK AT UP: re-grabbing the handle while `y` is still
 * beyond the rubber-band bound hands @use-gesture's `from` an out-of-bounds
 * value, which its rubberband math re-compresses a second time). That exact
 * discontinuity was CONFIRMED two ways during diagnosis: (a) at the pure-math
 * level against the installed @use-gesture rubberband function directly
 * (deterministic, no browser involved), and (b) via precise in-browser
 * instrumentation with `requestAnimationFrame` frozen to get a stable,
 * race-free re-grab target -- both showed the pre-fix code landing on an
 * arbitrary, distance-dependent value (e.g. -65.1 when the true position was
 * -71.8) while the fix consistently converges to the exact bound (-64), a
 * stable fixed point immune to compounding on repeated re-grabs. That
 * instrumentation depended on route-patching the dev server's compiled
 * output and isn't appropriate to keep as a durable CI asset (it would break
 * silently on any Vite/esbuild output-format change), so it is NOT part of
 * this spec -- see the step's completion report for that evidence. The
 * black-box version below instead asserts what IS reliably observable from
 * outside the component: repeated rapid reversals and re-grabs during
 * spring-back must never throw, and must always converge to a clean rest
 * state -- it does not by itself discriminate the sub-pixel discontinuity
 * (a real limitation, noted rather than hidden).
 */
import { test, expect, type Page } from '@playwright/test'
import { installDeterminism } from './helpers/determinism'

const URL = '/components/drag-dismiss-sheet'

test.beforeEach(async ({ page }) => {
  await installDeterminism(page)
})

async function trackErrors(page: Page): Promise<{ consoleErrors: string[]; pageErrors: string[] }> {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const text = m.text()
    // Vite HMR-client infra noise, not app errors -- same filter as
    // animation-spam.spec.ts (debt/animation-spam-suite-preexisting-failures.md).
    if (/wss:\/\/localhost.*(failed|ERR_CONNECTION_REFUSED)/.test(text)) return
    if (text.includes('[vite] failed to connect to websocket')) return
    consoleErrors.push(text)
  })
  page.on('pageerror', (e) => {
    if (e.message.includes('WebSocket closed without opened')) return
    pageErrors.push(e.message)
  })
  return { consoleErrors, pageErrors }
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(700) // let PreviewFrame's mount reveal fully clear
}

function translateY(transform: string): number {
  if (transform === 'none') return 0
  const m = transform.match(/matrix\(([^)]+)\)/)
  if (!m) return NaN
  return Number(m[1].split(',')[5])
}

async function sheetY(page: Page): Promise<number> {
  return translateY(
    await page.evaluate(() => getComputedStyle(document.querySelector('.dds-sheet')!).transform),
  )
}

async function waitForOpen(page: Page) {
  await expect(page.locator('.dds-overlay')).toHaveAttribute('data-state', 'open')
}

async function waitForRest(page: Page, timeoutMs = 3000) {
  await expect
    .poll(async () => Math.abs(await sheetY(page)), { timeout: timeoutMs, intervals: [50] })
    .toBeLessThan(0.5)
}

async function waitForClosed(page: Page, timeoutMs = 3000) {
  await expect(page.locator('.dds-overlay')).toHaveAttribute('data-state', 'closed', { timeout: timeoutMs })
}

/** Fresh-measured drag: re-reads the handle's box right before every move so
 *  a handle that has already travelled (mid spring/drag) is never missed. */
async function dragHandle(
  page: Page,
  steps: number[],
  opts: { pauseAtEndMs?: number; release?: boolean } = {},
) {
  const handle = page.locator('.dds-handle')
  const box = await handle.boundingBox()
  if (!box) throw new Error('handle not found')
  const cx = box.x + box.width / 2
  let cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  for (const dy of steps) {
    cy += dy
    await page.mouse.move(cx, cy, { steps: 3 })
    await page.waitForTimeout(16)
  }
  if (opts.pauseAtEndMs) await page.waitForTimeout(opts.pauseAtEndMs)
  if (opts.release !== false) await page.mouse.up()
}

test.describe('drag-dismiss-sheet', () => {
  test('open / close basic', async ({ page }) => {
    const { consoleErrors, pageErrors } = await trackErrors(page)
    await page.goto(URL)
    await settle(page)

    await expect(page.locator('.dds-overlay')).toHaveAttribute('data-state', 'closed')
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    await page.click('.dds-close')
    await waitForClosed(page)

    expect(consoleErrors, consoleErrors.join('; ')).toEqual([])
    expect(pageErrors, pageErrors.join('; ')).toEqual([])
  })

  test('drag-down dismiss (position route)', async ({ page }) => {
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    // Large, slow (low-velocity) downward drag: dismiss decided by position
    // alone crossing DISMISS_RATIO, not by momentum.
    await dragHandle(page, Array(14).fill(20), { pauseAtEndMs: 150 })
    await waitForClosed(page, 5000)
  })

  test('high-velocity flick dismiss from shallow travel (projection route)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'projection math needs a real release velocity')
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    // Shallow travel (~75px, well under DISMISS_RATIO on position alone) but
    // released with real (fast) velocity -- must still dismiss via the
    // PROJECTED endpoint (position + velocity), proving dismissal never runs
    // off position alone. `steps: 1` + no inter-frame wait keeps this a
    // genuine flick, not a slow drag that happens to cover the same distance.
    const handle = page.locator('.dds-handle')
    const box = await handle.boundingBox()
    if (!box) throw new Error('handle not found')
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx, cy + 25, { steps: 1 })
    await page.mouse.move(cx, cy + 50, { steps: 1 })
    await page.mouse.move(cx, cy + 75, { steps: 1 })
    await page.mouse.up()
    await waitForClosed(page, 5000)
  })

  test('spring-back on low velocity', async ({ page }) => {
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    // Small drag, paused release (zero velocity/direction): must spring back
    // to rest, never dismiss.
    await dragHandle(page, Array(3).fill(15), { pauseAtEndMs: 150 })
    await waitForRest(page, 3000)
    await expect(page.locator('.dds-overlay')).toHaveAttribute('data-state', 'open')
  })

  test('drag-UP rubber-band stays fully visible (regression: bug 1 clipping)', async ({ page }) => {
    await page.goto(URL)
    await settle(page)

    // Force the exact hazard class the live gallery's mount-reveal wrapper
    // transiently creates -- a transformed ancestor -- deterministically
    // instead of racing a ~300ms window. Any transform on an ancestor of
    // `.dds-overlay` reproduces the same containing-block hijack.
    await page.evaluate(() => {
      const parent = document.querySelector('.flex-1.overflow-auto') as HTMLElement | null
      if (parent) parent.style.transform = 'translateY(12px) rotate(-2deg)'
    })

    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    await dragHandle(page, Array(20).fill(-15), { pauseAtEndMs: 50, release: false })

    const viewport = page.viewportSize()!
    const overlayBox = await page.locator('.dds-overlay').boundingBox()
    const sheetBox = await page.locator('.dds-sheet').boundingBox()

    // Bug 2 (bottom-bleed gap): while held up, the sheet's bottom edge lifts
    // off the viewport bottom, exposing whatever is behind it. Hit-test the
    // viewport's bottom edge at the sheet's horizontal center -- it must land
    // on `.dds-sheet` (or a descendant, e.g. the `::after` bleed pseudo-
    // element hit-tests to its originating element), never the scrim behind
    // it or anything outside `.dds-overlay`.
    const gapHit = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y)
        return {
          isSheetOrDescendant: !!el && !!document.querySelector('.dds-sheet')?.contains(el),
          isScrim: !!el && el.classList.contains('dds-scrim'),
          insideOverlay: !!el && !!document.querySelector('.dds-overlay')?.contains(el),
        }
      },
      { x: sheetBox!.x + sheetBox!.width / 2, y: viewport.height - 2 },
    )

    await page.mouse.up()

    expect(overlayBox).not.toBeNull()
    expect(sheetBox).not.toBeNull()
    expect(gapHit.isSheetOrDescendant).toBe(true)
    expect(gapHit.isScrim).toBe(false)
    expect(gapHit.insideOverlay).toBe(true)
    // The overlay must still resolve against the viewport (portal target:
    // document.body), never a transformed ancestor's box. Playwright's
    // boundingBox() returns { x, y, width, height } -- NOT the DOMRect-style
    // { top, left, right, bottom } -- hence x/y below, not top/left.
    expect(overlayBox!.width).toBeCloseTo(viewport.width, 0)
    expect(overlayBox!.height).toBeCloseTo(viewport.height, 0)
    // The sheet's full top edge and width must stay within the viewport --
    // not trimmed/pushed outside it.
    expect(sheetBox!.y).toBeGreaterThanOrEqual(-1)
    expect(sheetBox!.x).toBeGreaterThanOrEqual(0)
    expect(sheetBox!.x + sheetBox!.width).toBeLessThanOrEqual(viewport.width + 1)
    expect(sheetBox!.y + sheetBox!.height).toBeLessThanOrEqual(viewport.height + 1)
  })

  test('up-down-up sequence settles at rest', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'needs real spring-back travel to exercise the sequence')
    const { consoleErrors, pageErrors } = await trackErrors(page)
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    // Up, then down, then up again -- with re-grabs landing mid spring-back
    // each time (no settle wait between gestures), the exact abuse pattern
    // that surfaced the STUCK AT UP bug during this investigation (see the
    // file header for how that was actually diagnosed/verified). This
    // black-box version can't isolate the sub-pixel discontinuity on its
    // own, but it must never throw and must always end at a clean rest.
    await dragHandle(page, Array(8).fill(-15), { pauseAtEndMs: 0 })
    await page.waitForTimeout(15) // land mid spring-back, not after it settles
    await dragHandle(page, Array(6).fill(12), { pauseAtEndMs: 0 })
    await page.waitForTimeout(15)
    await dragHandle(page, Array(8).fill(-15), { pauseAtEndMs: 150 })

    await waitForRest(page, 3000)
    await expect(page.locator('.dds-overlay')).toHaveAttribute('data-state', 'open')
    expect(consoleErrors, consoleErrors.join('; ')).toEqual([])
    expect(pageErrors, pageErrors.join('; ')).toEqual([])
  })

  test('rapid re-grabs during spring-back never freeze mid-flight', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'needs real spring-back travel to exercise the sequence')
    const { consoleErrors, pageErrors } = await trackErrors(page)
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    // Statistical coverage for the same race window as above: many rapid
    // re-grabs in immediate succession (no settle wait), alternating
    // direction, maximizing the odds of landing mid rubber-band/spring-back
    // at least once. Must always recover to a valid, non-frozen state.
    for (let i = 0; i < 10; i++) {
      const dy = i % 2 === 0 ? -12 : 12
      await dragHandle(page, Array(3).fill(dy), { pauseAtEndMs: 0 })
      await page.waitForTimeout(10)
    }
    await dragHandle(page, Array(4).fill(-12), { pauseAtEndMs: 200 })

    await expect
      .poll(async () => {
        const state = await page.locator('.dds-overlay').getAttribute('data-state')
        const y = await sheetY(page)
        return state === 'closed' || Math.abs(y) < 0.5
      }, { timeout: 5000 })
      .toBe(true)
    expect(consoleErrors, consoleErrors.join('; ')).toEqual([])
    expect(pageErrors, pageErrors.join('; ')).toEqual([])
  })

  test('rapid open-close-open spam (5x fast)', async ({ page }) => {
    const { consoleErrors, pageErrors } = await trackErrors(page)
    await page.goto(URL)
    await settle(page)

    for (let i = 0; i < 5; i++) {
      await page.click('.dds-trigger')
      await page.waitForTimeout(30)
      // Scrim (not .dds-close): it covers the full viewport regardless of
      // where the sheet currently is in its entrance spring, so this stays
      // clickable even 30ms into the open animation -- unlike the close
      // button, which can still be off-screen (sheet starts at
      // DEFAULT_SHEET_TRAVEL) that early.
      await page.click('.dds-scrim', { force: true })
      await page.waitForTimeout(30)
    }
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page, 5000)

    expect(consoleErrors, consoleErrors.join('; ')).toEqual([])
    expect(pageErrors, pageErrors.join('; ')).toEqual([])
  })

  test('grab during entrance', async ({ page }) => {
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    // Grab almost immediately, mid open-spring, before it settles.
    await page.waitForTimeout(20)
    await dragHandle(page, Array(4).fill(15), { pauseAtEndMs: 100 })
    // Must still be interactable and settle cleanly (open, at rest, or
    // dismissed -- never frozen mid-flight).
    await expect
      .poll(async () => {
        const state = await page.locator('.dds-overlay').getAttribute('data-state')
        const y = await sheetY(page)
        return state === 'closed' || Math.abs(y) < 0.5
      }, { timeout: 3000 })
      .toBe(true)
  })

  test('grab during exit', async ({ page }) => {
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)
    await page.click('.dds-close')
    // Grab mid-close, before the dismiss animation finishes -- the component
    // documents this must stay grabbable through the whole flight.
    await page.waitForTimeout(20)
    await dragHandle(page, Array(4).fill(-15), { pauseAtEndMs: 100 })
    await expect
      .poll(async () => {
        const state = await page.locator('.dds-overlay').getAttribute('data-state')
        const y = await sheetY(page)
        return state === 'closed' || Math.abs(y) < 0.5
      }, { timeout: 3000 })
      .toBe(true)
  })

  test('release exactly at threshold region', async ({ page }) => {
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    const sheetBox = await page.locator('.dds-sheet').boundingBox()
    if (!sheetBox) throw new Error('sheet not found')
    const travel = sheetBox.height + 24
    // Drag to within a hair of DISMISS_RATIO * travel, paused release (no
    // velocity contribution) -- pure position-threshold boundary case. Must
    // resolve to exactly one of open-rest or closed, never an in-between.
    await dragHandle(page, Array(10).fill((travel * 0.5) / 10), { pauseAtEndMs: 150 })

    await expect
      .poll(async () => {
        const state = await page.locator('.dds-overlay').getAttribute('data-state')
        const y = await sheetY(page)
        return state === 'closed' || Math.abs(y) < 0.5
      }, { timeout: 3000 })
      .toBe(true)
  })

  test('scrim click during drag', async ({ page }) => {
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    await waitForOpen(page)
    await waitForRest(page)

    // Start a drag, then (without releasing the handle's own gesture) click
    // the scrim -- must not throw or leave the sheet in a broken state.
    const handle = page.locator('.dds-handle')
    const box = await handle.boundingBox()
    if (!box) throw new Error('handle not found')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + 40, { steps: 3 })
    await page.mouse.up()
    await page.click('.dds-scrim', { force: true })
    await waitForClosed(page, 5000)
  })

  test('reduced-motion fade', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'reduced-motion', 'reduced-motion-project-only assertion')
    await page.goto(URL)
    await settle(page)
    await page.click('.dds-trigger')
    // Reduced motion: instant position jump, no sustained travel animation --
    // rest (y=0) should be reached effectively immediately.
    await waitForRest(page, 500)
    await expect(page.locator('.dds-overlay')).toHaveAttribute('data-state', 'open')
  })
})
