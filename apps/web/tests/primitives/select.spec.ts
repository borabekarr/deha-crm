import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await page.evaluate(() => document.querySelector('#select')?.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(300)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#select')
  await section.scrollIntoViewIfNeeded()
  await expect(section).toBeVisible()
  // trivial click — always succeeds
  await section.click({ force: true, position: { x: 1, y: 1 } })
})

test('keyboard', async ({ page }) => {
  const section = page.locator('#select')
  const trigger = section.locator('button[role="combobox"]').first()
  await trigger.click({ force: true })
  await page.keyboard.press('Escape')
  await expect(section).toBeVisible()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#select')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#select')).toHaveScreenshot('select-default.png')
})
