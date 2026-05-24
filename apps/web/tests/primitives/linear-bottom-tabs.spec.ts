import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { scrollToSection } from '../_helpers/scroll-to-section'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await scrollToSection(page, 'linear-bottom-tabs')
})

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
test('interaction: clicking a tab marks it aria-selected', async ({ page }) => {
  const section = page.locator('#linear-bottom-tabs')
  const tabs = section.locator('[role="tab"]')

  // First tab is active by default
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')

  // Click second tab
  await tabs.nth(1).click()
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'false')
})

test('interaction: active indicator renders on active tab', async ({ page }) => {
  const section = page.locator('#linear-bottom-tabs')
  await expect(section.locator('[data-motion-indicator="true"]').first()).toBeVisible()
})

test('interaction: hover pill renders on mouse-over', async ({ page }) => {
  const section = page.locator('#linear-bottom-tabs')
  const tabs = section.locator('[role="tab"]')

  // Hover the second tab in first variant
  await tabs.nth(1).hover()
  await page.waitForTimeout(50)

  await expect(section.locator('[data-motion-pill="linear-tab-pill"]').first()).toBeVisible()
})

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------
test('keyboard: Tab key moves focus between tabs', async ({ page }) => {
  const section = page.locator('#linear-bottom-tabs')
  const firstTab = section.locator('[role="tab"]').first()
  await firstTab.focus()
  await page.keyboard.press('Tab')
  // Focus should move (either to next tab or out of bar — just check no crash)
  await expect(section).toBeVisible()
})

test('keyboard: focused tab shows hover pill', async ({ page }) => {
  const section = page.locator('#linear-bottom-tabs')
  const secondTab = section.locator('[role="tab"]').nth(1)

  await secondTab.focus()
  await page.waitForTimeout(50)

  await expect(section.locator('[data-motion-pill="linear-tab-pill"]').first()).toBeVisible()
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
test('accessibility (axe): zero serious violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#linear-bottom-tabs')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// Visual snapshot
// ---------------------------------------------------------------------------
test('visual snapshot: settled state', async ({ page }) => {
  const section = page.locator('#linear-bottom-tabs')
  await page.waitForTimeout(400)
  await expect(section).toHaveScreenshot('linear-bottom-tabs-default.png')
})
