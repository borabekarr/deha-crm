import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { scrollToSection } from '../_helpers/scroll-to-section'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await scrollToSection(page, 'motion-tabs')
})

test('interaction: clicking second trigger updates aria-selected', async ({ page }) => {
  const section = page.locator('#motion-tabs')
  const triggers = section.locator('[role="tab"]')
  const firstTrigger = triggers.first()
  const secondTrigger = triggers.nth(1)

  // Initially first tab is selected
  await expect(firstTrigger).toHaveAttribute('aria-selected', 'true')
  await expect(secondTrigger).toHaveAttribute('aria-selected', 'false')

  // Click second trigger
  await secondTrigger.click()

  // Second tab should now be selected
  await expect(secondTrigger).toHaveAttribute('aria-selected', 'true')
  await expect(firstTrigger).toHaveAttribute('aria-selected', 'false')
})

test('keyboard: ArrowRight on first trigger moves focus to second', async ({ page }) => {
  const section = page.locator('#motion-tabs')
  const triggers = section.locator('[role="tab"]')
  const firstTrigger = triggers.first()
  const secondTrigger = triggers.nth(1)

  await firstTrigger.focus()
  await page.keyboard.press('ArrowRight')

  // Radix Tabs moves focus on ArrowRight
  await expect(secondTrigger).toBeFocused()
})

test('accessibility (axe): zero serious violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#motion-tabs')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious).toHaveLength(0)
})

test('visual snapshot: settled state', async ({ page }) => {
  const section = page.locator('#motion-tabs')
  // Wait for layout animation to settle before snapping
  await page.waitForTimeout(400)
  await expect(section).toHaveScreenshot('motion-tabs-default.png')
})

test('reduced-motion: aria-selected flips synchronously after click', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto('/primitives/')
  await scrollToSection(page, 'motion-tabs')

  const section = page.locator('#motion-tabs')
  const triggers = section.locator('[role="tab"]')
  const firstTrigger = triggers.first()
  const secondTrigger = triggers.nth(1)

  await expect(firstTrigger).toHaveAttribute('aria-selected', 'true')

  await secondTrigger.click()

  // With reduced motion, duration is 0 — aria-selected should flip immediately
  await expect(secondTrigger).toHaveAttribute('aria-selected', 'true')
  await expect(firstTrigger).toHaveAttribute('aria-selected', 'false')

  await context.close()
})
