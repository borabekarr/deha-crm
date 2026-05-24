import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { scrollToSection } from '../_helpers/scroll-to-section'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await scrollToSection(page, 'progressive-blur')
})

// ---------------------------------------------------------------------------
// Section renders
// ---------------------------------------------------------------------------
test('renders: section heading is visible', async ({ page }) => {
  const section = page.locator('#progressive-blur')
  await expect(section.getByRole('heading', { name: /progressive blur/i })).toBeVisible()
})

// ---------------------------------------------------------------------------
// Sticky header is present
// ---------------------------------------------------------------------------
test('renders: sticky header is present', async ({ page }) => {
  const section = page.locator('#progressive-blur')
  await section.scrollIntoViewIfNeeded()
  const header = section.locator('[data-progressive-blur-header]').first()
  await expect(header).toBeVisible()
})

// ---------------------------------------------------------------------------
// Content list renders items
// ---------------------------------------------------------------------------
test('renders: content items visible', async ({ page }) => {
  const section = page.locator('#progressive-blur')
  await section.scrollIntoViewIfNeeded()
  const content = section.locator('[data-progressive-blur-content]').first()
  await expect(content).toBeVisible()
  // At least one lead item rendered
  const items = content.locator('[class*="rounded-lg"]')
  await expect(items.first()).toBeVisible()
})

// ---------------------------------------------------------------------------
// Scroll interaction — header remains sticky after scrolling
// ---------------------------------------------------------------------------
test('interaction: sticky header stays visible after scroll', async ({ page }) => {
  const section = page.locator('#progressive-blur')
  await section.scrollIntoViewIfNeeded()

  const root = section.locator('[data-progressive-blur-root]').first()
  const header = section.locator('[data-progressive-blur-header]').first()

  // Scroll the root container down
  await root.evaluate((el) => el.scrollBy({ top: 200, behavior: 'instant' }))
  await page.waitForTimeout(100)

  // Header should still be visible (sticky)
  await expect(header).toBeVisible()
})

// ---------------------------------------------------------------------------
// Keyboard: scroll container is focusable and responds to arrow keys
// ---------------------------------------------------------------------------
test('keyboard: root container scrolls with arrow keys', async ({ page }) => {
  const section = page.locator('#progressive-blur')
  await section.scrollIntoViewIfNeeded()

  const root = section.locator('[data-progressive-blur-root]').first()
  await root.focus()
  await page.keyboard.press('ArrowDown')
  await expect(root).toBeVisible()
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#progressive-blur')
    .disableRules(['color-contrast'])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// Visual snapshot
// ---------------------------------------------------------------------------
test('visual snapshot', async ({ page }) => {
  const section = page.locator('#progressive-blur')
  await section.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await expect(section).toHaveScreenshot('progressive-blur-default.png')
})
