/**
 * PrimaryThemeSwitcher spec — verifies the deha-primary attribute + persisted
 * palette selection on a /components/:slug page (design tokens only load
 * there, not on the app root route). Runs under both Playwright projects
 * (default, reduced-motion).
 */
import { test, expect } from '@playwright/test'
import { installDeterminism } from './helpers/determinism'

test.beforeEach(async ({ page }) => {
  await installDeterminism(page)
})

const URL = '/components/buttons-proximity'
const SWITCHER = '[aria-label^="Primary theme:"]'

async function getBrandPrimary(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim(),
  )
}

test('default load: no data-primary attribute, --brand-primary is emerald (V7)', async ({ page }) => {
  await page.goto(URL)
  await expect(page.locator(SWITCHER)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-primary'))).toBeNull()
  const value = await getBrandPrimary(page)
  expect(['rgb(16, 185, 129)', '#10B981'].includes(value) || value.toLowerCase() === '#10b981').toBe(true)
})

test('activating sunflower sets data-primary and changes --brand-primary', async ({ page }) => {
  await page.goto(URL)
  const before = await getBrandPrimary(page)

  await page.locator(SWITCHER).click()

  await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-primary'))).toBe(
    'sunflower',
  )
  const after = await getBrandPrimary(page)
  expect(after).not.toBe(before)
})

test('reload preserves the selection', async ({ page }) => {
  await page.goto(URL)
  await page.locator(SWITCHER).click()
  await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-primary'))).toBe(
    'sunflower',
  )

  await page.reload()

  await expect
    .poll(() => page.evaluate(() => document.documentElement.getAttribute('data-primary')))
    .toBe('sunflower')
})

test('cycling back to emerald removes the attribute', async ({ page }) => {
  await page.goto(URL)
  const switcher = page.locator(SWITCHER)

  // Cycle: emerald -> sunflower -> bloodymary -> petalglow -> sexyblue -> richgold -> emerald.
  for (let i = 0; i < 6; i++) {
    await switcher.click()
  }

  await expect
    .poll(() => page.evaluate(() => document.documentElement.getAttribute('data-primary')))
    .toBeNull()
})

test('richgold: .btn-primary text is black-on-gold; default stays white', async ({ page }) => {
  await page.goto('/components/buttons')
  const btn = page.locator('.btn-primary').first()
  await expect(btn).toBeVisible()

  const defaultColor = await btn.evaluate((el) => getComputedStyle(el).color)
  expect(defaultColor).toBe('rgb(255, 255, 255)')

  await page.evaluate(() => document.documentElement.setAttribute('data-primary', 'richgold'))
  const richgoldColor = await btn.evaluate((el) => getComputedStyle(el).color)
  expect(richgoldColor).toBe('rgb(17, 17, 17)')
})

test('motion: switcher resolves hover and press states via token-driven transitions', async ({ page }) => {
  const switcher = page.locator(SWITCHER)
  await page.goto(URL)
  await expect(switcher).toBeVisible()

  const duration = await switcher.evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(duration).not.toBe('0s')

  await switcher.hover()
  const hoverBg = await switcher.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(hoverBg).toBeTruthy()

  await switcher.focus()
  const ringWidth = await switcher.evaluate((el) => getComputedStyle(el).outlineWidth)
  expect(ringWidth).toBeDefined()
})
