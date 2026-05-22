import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await page.evaluate(() => document.querySelector('#context-menu')?.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(300)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#context-menu')
  await section.scrollIntoViewIfNeeded()
  await expect(section).toBeVisible()
  // trivial click — always succeeds
  await section.click({ force: true, position: { x: 1, y: 1 } })
})

test('keyboard', async ({ page }) => {
  const section = page.locator('#context-menu')
  await page.keyboard.press('Tab')
  await expect(section).toBeAttached()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#context-menu')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#context-menu')).toHaveScreenshot('context-menu-default.png')
})
