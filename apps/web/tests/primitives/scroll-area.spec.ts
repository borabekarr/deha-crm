import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await page.evaluate(() => document.querySelector('#scroll-area')?.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(200)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#scroll-area')
  // Click inside the scroll area
  await section.locator('[data-radix-scroll-area-viewport]').first().click({ force: true })
  await expect(section).toBeVisible()
})

test('keyboard', async ({ page }) => {
  const section = page.locator('#scroll-area')
  await section.locator('[data-radix-scroll-area-viewport]').first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(section).toBeVisible()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#scroll-area')
    .disableRules(['color-contrast'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#scroll-area')).toHaveScreenshot('scroll-area-default.png')
})
