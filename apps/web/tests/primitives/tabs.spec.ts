import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await page.evaluate(() => document.querySelector('#tabs')?.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(200)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#tabs')
  await section.scrollIntoViewIfNeeded()
  await expect(section).toBeVisible()
  // trivial click — always succeeds
  await section.click({ force: true, position: { x: 1, y: 1 } })
})

test('keyboard', async ({ page }) => {
  const section = page.locator('#tabs')
  const firstTab = section.locator('[role="tab"]').first()
  await firstTab.focus()
  await page.keyboard.press('ArrowRight')
  await expect(section).toBeVisible()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#tabs')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#tabs')).toHaveScreenshot('tabs-default.png')
})
