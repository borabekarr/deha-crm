import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { scrollToSection } from '../_helpers/scroll-to-section'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await scrollToSection(page, 'fab')
})

// ---------------------------------------------------------------------------
// Section renders
// ---------------------------------------------------------------------------
test('renders: section heading is visible', async ({ page }) => {
  const section = page.locator('#fab')
  await expect(section.getByRole('heading', { name: /^fab$/i })).toBeVisible()
})

// ---------------------------------------------------------------------------
// Open — contained FAB opens overlay
// ---------------------------------------------------------------------------
test('open: clicking FAB trigger opens menu overlay', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  // The contained (absolute) FAB trigger
  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await trigger.click()

  const menu = page.getByRole('menu', { name: /floating action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })
})

// ---------------------------------------------------------------------------
// Menu items render after open
// ---------------------------------------------------------------------------
test('menu items: all 4 items visible after open', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await trigger.click()

  const menu = page.getByRole('menu', { name: /floating action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })

  for (const label of ['New Contact', 'New Deal', 'New Task', 'New Note']) {
    await expect(menu.getByRole('menuitem', { name: label })).toBeVisible({ timeout: 1000 })
  }
})

// ---------------------------------------------------------------------------
// Stagger ordering — items appear in top-to-bottom order
// ---------------------------------------------------------------------------
test('stagger: menu items appear in declared order', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await trigger.click()

  const menu = page.getByRole('menu', { name: /floating action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })

  const items = menu.getByRole('menuitem')
  const count = await items.count()
  expect(count).toBe(4)

  const labels = await items.allTextContents()
  expect(labels[0]).toMatch(/new contact/i)
  expect(labels[1]).toMatch(/new deal/i)
  expect(labels[2]).toMatch(/new task/i)
  expect(labels[3]).toMatch(/new note/i)
})

// ---------------------------------------------------------------------------
// Close — clicking trigger again closes menu
// ---------------------------------------------------------------------------
test('close: clicking trigger again closes menu', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await trigger.click()

  const menu = page.getByRole('menu', { name: /floating action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })

  await trigger.click()
  await expect(menu).not.toBeVisible({ timeout: 1500 })
})

// ---------------------------------------------------------------------------
// Escape closes menu
// ---------------------------------------------------------------------------
test('keyboard: Escape closes the open FAB menu', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await trigger.click()

  const menu = page.getByRole('menu', { name: /floating action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })

  await page.keyboard.press('Escape')
  await expect(menu).not.toBeVisible({ timeout: 1500 })
})

// ---------------------------------------------------------------------------
// Backdrop click closes menu
// ---------------------------------------------------------------------------
test('close: clicking backdrop closes menu', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await trigger.click()

  const menu = page.getByRole('menu', { name: /floating action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })

  // Click the backdrop (aria-hidden div behind menu)
  // Use page.mouse to click outside menu items
  const menuBox = await menu.boundingBox()
  if (menuBox) {
    // Click above the menu items (in the backdrop area)
    await page.mouse.click(menuBox.x - 80, menuBox.y - 80)
  }
  await expect(menu).not.toBeVisible({ timeout: 1500 })
})

// ---------------------------------------------------------------------------
// ARIA states
// ---------------------------------------------------------------------------
test('aria: trigger has aria-expanded=true when open', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
})

// ---------------------------------------------------------------------------
// Reduced motion — stagger collapses to 0 (CSS class approach)
// ---------------------------------------------------------------------------
test('reduced-motion: menu opens without stagger when prefers-reduced-motion', async ({ page }) => {
  // Emulate reduced motion
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await scrollToSection(page, 'fab')

  const section = page.locator('#fab')
  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await trigger.click()

  // Menu should still appear (just without stagger delay)
  const menu = page.getByRole('menu', { name: /floating action menu/i })
  await expect(menu).toBeVisible({ timeout: 1000 })

  for (const label of ['New Contact', 'New Deal', 'New Task', 'New Note']) {
    await expect(menu.getByRole('menuitem', { name: label })).toBeVisible({ timeout: 500 })
  }
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
test('accessibility (axe)', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  const results = await new AxeBuilder({ page })
    .include('#fab')
    .disableRules(['color-contrast'])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// Visual snapshot (closed state)
// ---------------------------------------------------------------------------
test('visual snapshot: closed', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await expect(section).toHaveScreenshot('fab-closed.png')
})

// ---------------------------------------------------------------------------
// Visual snapshot (open state)
// ---------------------------------------------------------------------------
test('visual snapshot: open', async ({ page }) => {
  const section = page.locator('#fab')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /open crm actions/i }).first()
  await trigger.click()

  const menu = page.getByRole('menu', { name: /floating action menu/i })
  await expect(menu).toBeVisible({ timeout: 2000 })
  await page.waitForTimeout(300) // let stagger settle

  await expect(section).toHaveScreenshot('fab-open.png')
})
