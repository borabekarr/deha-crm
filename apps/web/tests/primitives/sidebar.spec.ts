import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await page.evaluate(() => document.querySelector('#sidebar')?.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(200)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#sidebar')
  const link = section.locator('a').first()
  await link.click({ force: true })
  await expect(section).toBeVisible()
})

test('keyboard', async ({ page }) => {
  const section = page.locator('#sidebar')
  const first = section.locator('a, button').first()
  await first.focus()
  await page.keyboard.press('Tab')
  await expect(section).toBeVisible()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#sidebar')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#sidebar')).toHaveScreenshot('sidebar-default.png')
})

test('morph indicator renders on active sidebar item', async ({ page }) => {
  const section = page.locator('#sidebar')
  // An active SidebarItem renders the morph indicator — check it's present
  await expect(section.locator('[data-motion-indicator="true"]').first()).toBeVisible()
})

test('hover pill appears when sidebar item is hovered', async ({ page }) => {
  const section = page.locator('#sidebar')
  // Hover over the second sidebar item (non-active) to trigger hover pill
  const items = section.locator('a[aria-current], a:not([aria-current])')
  await items.nth(1).hover()
  await page.waitForTimeout(50)
  // Hover pill should be mounted
  await expect(section.locator('[data-motion-hover-pill="sidebar-hover-pill"]').first()).toBeVisible()
})
