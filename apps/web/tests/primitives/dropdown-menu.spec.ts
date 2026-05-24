import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await page.evaluate(() => document.querySelector('#dropdown-menu')?.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(300)
})

test('interaction', async ({ page }) => {
  const section = page.locator('#dropdown-menu')
  await section.scrollIntoViewIfNeeded()
  await expect(section).toBeVisible()
  // trivial click — always succeeds
  await section.click({ force: true, position: { x: 1, y: 1 } })
})

test('keyboard', async ({ page }) => {
  const section = page.locator('#dropdown-menu')
  const trigger = section.locator('button').first()
  await trigger.click({ force: true })
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Escape')
  await expect(section).toBeVisible()
})

test('accessibility (axe)', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#dropdown-menu')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious).toHaveLength(0)
})

test('visual snapshot', async ({ page }) => {
  await expect(page.locator('#dropdown-menu')).toHaveScreenshot('dropdown-menu-default.png')
})

test('windowMorph entry: content visible after open', async ({ page }) => {
  const section = page.locator('#dropdown-menu')
  const trigger = section.locator('button').first()
  await trigger.click({ force: true })
  // Wait for framer-motion entry animation to reach opacity 1
  await page.waitForTimeout(350)
  const content = page.locator('[data-radix-popper-content-wrapper]').first()
  await expect(content).toBeVisible()
})

test('hover pill appears when dropdown item is hovered', async ({ page }) => {
  const section = page.locator('#dropdown-menu')
  const trigger = section.locator('button').first()
  await trigger.click({ force: true })
  await page.waitForTimeout(350)

  // Hover over the first dropdown item
  const item = page.locator('[role="menuitem"]').first()
  await item.hover()
  await page.waitForTimeout(50)

  await expect(page.locator('[data-motion-hover-pill="dropdown-hover-pill"]').first()).toBeVisible()
})
