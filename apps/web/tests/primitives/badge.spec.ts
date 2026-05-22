import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await page.evaluate(() => document.querySelector('#badge')?.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(200)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#badge')
  await section.locator('span').first().click({ force: true })
  await expect(section).toBeVisible()
})

test('keyboard', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(page.locator('#badge')).toBeVisible()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#badge')
    .disableRules(['color-contrast'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#badge')).toHaveScreenshot('badge-default.png')
})
