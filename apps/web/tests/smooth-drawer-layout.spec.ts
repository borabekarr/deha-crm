/**
 * smooth-drawer-layout — full-viewport overlay + focus-return regression.
 * SD_SIDES order in SmoothDrawer.tsx is bottom/top/left/right, so the Nth
 * `.sd-trigger` / `.sd-overlay` pair corresponds to that side. Each side
 * reserves a 16px --space-4 gap by design (overlay padding for bottom/top,
 * .sd-sheet-outer margin for left/right), so sheet edges land 16px off the
 * overlay edge, not flush.
 */
import { test, expect } from '@playwright/test'

const SIDES = ['bottom', 'top', 'left', 'right'] as const

for (const dark of [false, true]) {
  test(`smooth-drawer overlay is full-viewport per side (${dark ? 'dark' : 'light'})`, async ({ page }) => {
    await page.goto('/components/smooth-drawer')
    if (dark) await page.evaluate(() => document.documentElement.classList.add('dark'))
    await page.waitForLoadState('networkidle')
    await page.locator('.overflow-auto').first().waitFor({ state: 'visible' })
    await page.waitForTimeout(900)

    const vp = page.viewportSize()!
    for (let i = 0; i < SIDES.length; i++) {
      const side = SIDES[i]
      const trigger = page.locator('.sd-trigger').nth(i)
      const overlay = page.locator('.sd-overlay').nth(i)

      await trigger.click()
      await overlay.locator('.sd-sheet-outer').waitFor({ state: 'visible' })
      await page.waitForTimeout(500)

      const box = (await overlay.boundingBox())!
      expect(Math.abs(box.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(box.y)).toBeLessThanOrEqual(1)
      expect(Math.abs(box.width - vp.width)).toBeLessThanOrEqual(1)
      expect(Math.abs(box.height - vp.height)).toBeLessThanOrEqual(1)

      const sheetBox = (await overlay.locator('.sd-sheet-outer').boundingBox())!
      if (side === 'bottom') expect(Math.abs(sheetBox.y + sheetBox.height - vp.height)).toBeLessThanOrEqual(18)
      if (side === 'top') expect(Math.abs(sheetBox.y)).toBeLessThanOrEqual(18)
      if (side === 'left') expect(Math.abs(sheetBox.x)).toBeLessThanOrEqual(18)
      if (side === 'right') expect(Math.abs(sheetBox.x + sheetBox.width - vp.width)).toBeLessThanOrEqual(18)

      await overlay.locator('.sd-later').click()
      await page.waitForTimeout(500)
      expect(await trigger.evaluate((el) => el === document.activeElement)).toBe(true)
    }
  })
}
