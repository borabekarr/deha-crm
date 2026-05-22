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
