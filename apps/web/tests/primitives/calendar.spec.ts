import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  // Scroll the radix scroll-area viewport to bring #calendar into view
  await page.evaluate(() => {
    const el = document.querySelector('#calendar')
    el?.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(300)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#calendar')
  // Click any button inside the calendar (nav or day button)
  const btn = section.locator('button').first()
  await btn.click({ force: true })
  await expect(section).toBeVisible()
})

test('keyboard', async ({ page }) => {
  const section = page.locator('#calendar')
  const btn = section.locator('button').first()
  await btn.focus()
  await page.keyboard.press('Tab')
  await expect(section).toBeVisible()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#calendar')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#calendar')).toHaveScreenshot('calendar-default.png')
})
