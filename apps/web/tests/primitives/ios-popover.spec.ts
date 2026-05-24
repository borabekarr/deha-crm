import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { scrollToSection } from '../_helpers/scroll-to-section'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await scrollToSection(page, 'ios-popover')
})

// ---------------------------------------------------------------------------
// Section renders
// ---------------------------------------------------------------------------
test('renders: section heading is visible', async ({ page }) => {
  const section = page.locator('#ios-popover')
  await expect(section.getByRole('heading', { name: /ios popover/i })).toBeVisible()
})

// ---------------------------------------------------------------------------
// Open trigger — action menu popover opens
// ---------------------------------------------------------------------------
test('open: trigger opens action menu popover', async ({ page }) => {
  const section = page.locator('#ios-popover')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /more options/i })
  await trigger.click()

  // Popover content renders in a portal — locate by menu role
  const menu = page.getByRole('menu', { name: /action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })
})

// ---------------------------------------------------------------------------
// Action items are clickable after open
// ---------------------------------------------------------------------------
test('interaction: action items render inside open popover', async ({ page }) => {
  const section = page.locator('#ios-popover')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /more options/i })
  await trigger.click()

  const copyItem = page.getByRole('menuitem', { name: /copy link/i })
  await expect(copyItem).toBeVisible({ timeout: 2000 })

  const deleteItem = page.getByRole('menuitem', { name: /delete/i })
  await expect(deleteItem).toBeVisible()
})

// ---------------------------------------------------------------------------
// Quick-contact popover opens (variant 2)
// ---------------------------------------------------------------------------
test('open: contact popover opens with quick actions', async ({ page }) => {
  const section = page.locator('#ios-popover')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /open contact actions for yuki tanaka/i })
  await trigger.click()

  const menu = page.getByRole('menu', { name: /contact actions/i })
  await expect(menu).toBeVisible({ timeout: 2000 })

  const callItem = page.getByRole('menuitem', { name: /call/i })
  await expect(callItem).toBeVisible()
})

// ---------------------------------------------------------------------------
// Keyboard: Escape closes open popover
// ---------------------------------------------------------------------------
test('keyboard: Escape closes the open popover', async ({ page }) => {
  const section = page.locator('#ios-popover')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /more options/i })
  await trigger.click()

  const menu = page.getByRole('menu', { name: /action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })

  await page.keyboard.press('Escape')
  await expect(menu).not.toBeVisible({ timeout: 1500 })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#ios-popover')
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
  const section = page.locator('#ios-popover')
  await section.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await expect(section).toHaveScreenshot('ios-popover-default.png')
})
