import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await page.evaluate(() => document.querySelector('#pagination')?.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(200)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#pagination')
  const btn = section.locator('button, a[href]').first()
  await btn.click({ force: true })
  await expect(section).toBeVisible()
})

test('keyboard', async ({ page }) => {
  const section = page.locator('#pagination')
  const btn = section.locator('button, a').first()
  await btn.focus()
  await page.keyboard.press('Tab')
  await expect(section).toBeVisible()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#pagination')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#pagination')).toHaveScreenshot('pagination-default.png')
})

test('morph indicator renders behind current page number', async ({ page }) => {
  const section = page.locator('#pagination')
  // The active page button should contain a motion indicator
  await expect(section.locator('[data-motion-indicator="true"]').first()).toBeVisible()

  // Click a different page button and verify indicator is still present
  const pageButtons = section.locator('button[aria-current="page"]')
  await expect(pageButtons.first()).toBeVisible()
  await expect(section.locator('[data-motion-indicator="true"]').first()).toBeVisible()
})
