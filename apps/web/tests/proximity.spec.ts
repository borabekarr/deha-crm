/**
 * Proximity hover pilot spec — /components/buttons-proximity.
 *
 * Not part of design-system.spec.ts's screenshot SLUGS (see that file's
 * header): the proximity effect is pointer-driven and invisible to rest-state
 * screenshots, so it needs a dedicated deterministic pointer spec instead.
 * Runs under both Playwright projects (default, reduced-motion).
 */
import { test, expect, type Page } from '@playwright/test'
import { installDeterminism } from './helpers/determinism'

test.beforeEach(async ({ page }) => {
  await installDeterminism(page)
})

const URL = '/components/buttons-proximity'

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

test('ramp: scale grows with proximity and resets on departure (default project only)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'default', 'live-transition assertions require the default project')

  await page.goto(URL)
  await waitForPreview(page)

  const target = page.locator('[data-proximity]').first()
  const box = await target.boundingBox()
  if (!box) throw new Error('target has no boundingBox')
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // Mid-ramp: ~60px from center.
  await page.mouse.move(cx + 60, cy, { steps: 5 })
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeGreaterThan(1.001)
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeLessThan(1.039)

  // Center: near max ramp.
  await page.mouse.move(cx, cy, { steps: 5 })
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeGreaterThanOrEqual(1.035)
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeLessThanOrEqual(1.045)

  // Departure: > 150px away — back to rest, --prox removed.
  await page.mouse.move(cx + 400, cy + 400, { steps: 5 })
  await expect.poll(() => getScale(page, target), { timeout: 3000 }).toBeCloseTo(1, 3)
  await expect.poll(() => getProxVar(page, target), { timeout: 3000 }).toBe('')
})

test('spam: rapid pointer sweeps never error and settle consistently', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

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
  expect(scale).toBeLessThanOrEqual(1.041)
})
