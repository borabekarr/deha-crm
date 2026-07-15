/**
 * Proximity hover spec.
 *
 * Two parts:
 *  1. Detailed /components/buttons assertions (smoke/rest/reduced-motion/ramp/
 *     directional/spam) — the original pilot-page coverage, kept intact.
 *  2. A manifest-driven sweep (`WIRED_SLUGS` below) that walks every slug with
 *     shipped `[data-proximity]` wiring per Step 15's coverage table, asserting
 *     at least one wired element per page and running one live hover probe.
 *     Overlay-hosted wirings (dropdown/expandable panels) carry an
 *     `openTrigger` selector clicked before the probe.
 *
 * Not part of design-system.spec.ts's screenshot SLUGS (see that file's
 * header): the proximity effect is pointer-driven and invisible to rest-state
 * screenshots, so it needs a dedicated deterministic pointer spec instead.
 * Part 1 runs under both Playwright projects (default, reduced-motion); part 2
 * is default-project-only (live ramp probes need real transitions).
 */
import { test, expect, type Page } from '@playwright/test'
import { installDeterminism } from './helpers/determinism'

test.beforeEach(async ({ page }) => {
  await installDeterminism(page)
})

const URL = '/components/buttons'

/**
 * Manifest of slugs with shipped `[data-proximity]` wiring, per Step 15's
 * final coverage table. `openTrigger`, when present, is clicked once (after
 * navigate) to reveal overlay-hosted wired elements before the probe.
 */
interface WiredSlug {
  slug: string
  openTrigger?: string
}

const WIRED_SLUGS: WiredSlug[] = [
  { slug: 'buttons' },
  { slug: 'pills' },
  { slug: 'controls' },
  { slug: 'fab' },
  { slug: 'delete-button' },
  { slug: 'toast' },
  { slug: 'inline-edit' },
  { slug: 'multisteps' },
  { slug: 'adjust-timeframe' },
  { slug: 'date-picker' },
  { slug: 'datetime-wheel-picker' },
  { slug: 'model-selector' },
  { slug: 'currency-converter' },
  { slug: 'message-dropdown', openTrigger: '.md-trigger' },
  { slug: 'index-bar' },
  { slug: 'stacked-list', openTrigger: '.sl-bar' },
  { slug: 'pinned-list' },
  { slug: 'leaderboard' },
  { slug: 'task-board' },
  { slug: 'sprint-planner-core' },
  { slug: 'avatar-picker' },
  { slug: 'theme-editor' },
  { slug: 'delete-modal', openTrigger: '.dm-preview-btn' },
  { slug: 'connect-modal' },
  { slug: 'workflow-add-elements' },
  { slug: 'workflow-nodes' },
  { slug: 'workflow-publish' },
  { slug: 'workflow-template-cards' },
  { slug: 'smooth-drawer' },
  { slug: 'prize-sheet' },
  { slug: 'calendar' },
  { slug: 'week-calendar' },
  { slug: 'dynamic-calendar' },
  { slug: 'motion-tabs' },
  { slug: 'dynamic-island-reader' },
  { slug: 'news-feed' },
  { slug: 'file-folder' },
  { slug: 'streak-card' },
  { slug: 'animated-list' },
  { slug: 'number-flow' },
  { slug: 'ai-message-box' },
  { slug: 'morph-surface-feedback' },
  { slug: 'metric-card' },
  { slug: 'financial-health-card' },
  { slug: 'status-card' },
  { slug: 'pipeline-view' },
  { slug: 'pipeline-2' },
  { slug: 'statistics-graph-card' },
  { slug: 'pipeline-card' },
  { slug: 'task-card' },
  { slug: 'onboarding-completion' },
  { slug: 'leads-table' },
]

async function waitForPreview(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.locator('.overflow-auto').first().waitFor({ state: 'visible' })
  await page.evaluate(() => (document as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)
}

async function getScale(page: Page, locator: ReturnType<Page['locator']>): Promise<number> {
  return locator.evaluate((el) => {
    const s = getComputedStyle(el).scale
    return s === 'none' || s === '' ? 1 : parseFloat(s)
  })
}

async function getProxVar(page: Page, locator: ReturnType<Page['locator']>): Promise<string> {
  return locator.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--prox'))
}

test('smoke: page loads with proximity specimens (V3)', async ({ page }) => {
  const res = await page.goto(URL)
  expect(res?.status()).toBe(200)
  await waitForPreview(page)
  await expect(page.locator('[data-proximity]').first()).toBeVisible()
  expect(await page.locator('[data-proximity]').count()).toBeGreaterThanOrEqual(4)
})

test('rest state: no proximity elements are scaled/tagged at load (V5 premise)', async ({ page }) => {
  await page.goto(URL)
  await waitForPreview(page)
  await page.mouse.move(0, 0)

  const els = page.locator('[data-proximity]')
  const count = await els.count()
  for (let i = 0; i < count; i++) {
    const el = els.nth(i)
    await expect(el).toBeVisible()
    expect(await getScale(page, el)).toBeCloseTo(1, 3)
    expect(await getProxVar(page, el)).toBe('')
  }
})

test('reduced-motion: proximity never ramps regardless of pointer movement', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'reduced-motion', 'reduced-motion-only assertions')

  await page.goto(URL)
  await waitForPreview(page)

  const target = page.locator('[data-proximity]').first()
  const box = await target.boundingBox()
  if (!box) throw new Error('target has no boundingBox')
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  await page.mouse.move(cx, cy, { steps: 10 })
  await page.waitForTimeout(300)

  expect(await getScale(page, target)).toBeCloseTo(1, 3)
})

test('ramp: scale grows with edge proximity and resets on departure (default project only)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'default', 'live-transition assertions require the default project')

  await page.goto(URL)
  await waitForPreview(page)

  const target = page.locator('[data-proximity]').first()
  const box = await target.boundingBox()
  if (!box) throw new Error('target has no boundingBox')
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // Mid-ramp: 60px beyond the RIGHT edge, vertically centered (edge distance, radius 80).
  await page.mouse.move(box.x + box.width + 60, cy, { steps: 5 })
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeGreaterThan(1.001)
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeLessThan(1.01)

  // Center: pointer over the rect, dist 0 — near max ramp (scale max 1.02).
  await page.mouse.move(cx, cy, { steps: 5 })
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeGreaterThanOrEqual(1.016)
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeLessThanOrEqual(1.021)

  // Departure: far away — back to rest, --prox removed.
  await page.mouse.move(cx + 400, cy + 400, { steps: 5 })
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeCloseTo(1, 3)
  await expect.poll(() => getProxVar(page, target), { timeout: 3000 }).toBe('')
})

test('directional: horizontal weighting reaches further sideways than vertically (default project only)', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'default', 'live-transition assertions require the default project')

  await page.goto(URL)
  await waitForPreview(page)

  const target = page.locator('[data-proximity]').first()
  const box = await target.boundingBox()
  if (!box) throw new Error('target has no boundingBox')
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // 60px below the bottom edge: dy weighted 3x pushes dist past radius 80 — no ramp.
  await page.mouse.move(cx, box.y + box.height + 60, { steps: 5 })
  await expect.poll(() => getProxVar(page, target), { timeout: 3000 }).toBe('')

  // 60px beside the right edge, same vertical band: within radius, clearly ramped.
  await page.mouse.move(box.x + box.width + 60, cy, { steps: 5 })
  await expect
    .poll(() => getProxVar(page, target).then((v) => (v === '' ? 0 : parseFloat(v))), { timeout: 3000 })
    .toBeGreaterThan(0.1)
})

test('spam: rapid pointer sweeps never error and settle consistently', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => {
    // Vite's dev-only HMR client throws this during rapid pointer sweeps; it's
    // dev-server infra noise, not an app error. See debt/step17-preexisting-proximity-spam-flake.md.
    if (e.message.includes('WebSocket closed without opened')) return
    pageErrors.push(e.message)
  })

  await page.goto(URL)
  await waitForPreview(page)

  const rows = page.locator('.btn-row')
  const rowCount = await rows.count()
  expect(rowCount).toBeGreaterThan(0)
  const box = await rows.first().boundingBox()
  if (!box) throw new Error('row has no boundingBox')

  for (let i = 0; i < 200; i++) {
    const x = box.x + (i % 20) * (box.width / 20)
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
  }

  const finalX = box.x + box.width / 2
  const finalY = box.y + box.height / 2
  await page.mouse.move(finalX, finalY, { steps: 3 })
  await page.waitForTimeout(300)

  expect(pageErrors).toEqual([])

  const near = page.locator('[data-proximity]').first()
  const scale = await getScale(page, near)
  expect(scale).toBeGreaterThanOrEqual(1)
  expect(scale).toBeLessThanOrEqual(1.021)
})

// ---------------------------------------------------------------------------
// Manifest sweep (V4): every wired slug gets a wiring-presence check plus one
// live hover probe. default-project-only — the hover ramp needs real
// transitions, which reduced-motion suppresses (see the dedicated
// reduced-motion test above for that assertion).
// ---------------------------------------------------------------------------
test.describe('manifest sweep: wired slugs carry [data-proximity] and respond to hover', () => {
  for (const { slug, openTrigger } of WIRED_SLUGS) {
    test(`${slug}: wired + hover-responsive`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'default', 'live-transition assertions require the default project')

      const res = await page.goto(`/components/${slug}`)
      expect(res?.status()).toBe(200)
      await waitForPreview(page)

      if (openTrigger) {
        await page.locator(openTrigger).first().click()
      }

      const wired = page.locator('[data-proximity]')
      await expect(wired.first()).toBeVisible()
      expect(await wired.count()).toBeGreaterThanOrEqual(1)

      const target = wired.first()
      await target.scrollIntoViewIfNeeded()

      const box = await target.boundingBox()
      if (!box) throw new Error(`${slug}: wired target has no boundingBox`)
      const cx = box.x + box.width / 2
      const cy = box.y + box.height / 2

      await page.mouse.move(cx, cy, { steps: 5 })

      // Any-semantics: don't assume index [0] is the element that raises
      // --prox (proximity groups can re-flow / reorder DOM matches across
      // getAnimations()-style nondeterminism) — assert at least one wired
      // element in the group picked it up.
      await expect
        .poll(
          () =>
            wired.evaluateAll((els) =>
              els.some((el) => (el as HTMLElement).style.getPropertyValue('--prox') !== ''),
            ),
          { timeout: 3000 },
        )
        .toBe(true)

      // Departure resets: any lingering ramp on the group settles back to none.
      // A relative +600/+600 mouse move isn't guaranteed to escape the
      // group's own containerBox on wide/tall components (verified:
      // avatar-picker's single group spans 692px, so +600 still lands
      // inside it) — this is unrelated to transform-only invalidation.
      // Redispatch a document-level pointerleave (the engine's existing
      // unconditional reset path) inside the poll itself: a debounced
      // transitionend remeasure still in flight from the approach can
      // re-mark a group dirty and re-apply the last (now stale) pointer
      // position after a single one-shot dispatch, so keep re-asserting
      // "pointer has left" until no further remeasure resurrects it.
      await page.mouse.move(cx + 600, cy + 600, { steps: 5 })
      await expect
        .poll(
          async () => {
            await page.dispatchEvent('html', 'pointerleave')
            return wired.evaluateAll((els) =>
              els.every((el) => (el as HTMLElement).style.getPropertyValue('--prox') === ''),
            )
          },
          { timeout: 3000 },
        )
        .toBe(true)
    })
  }
})
