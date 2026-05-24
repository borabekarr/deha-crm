import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { scrollToSection } from '../_helpers/scroll-to-section'

test.beforeEach(async ({ page }) => {
  await page.goto('/primitives/')
  await scrollToSection(page, 'maps-sheet')
})

// ---------------------------------------------------------------------------
// Open trigger → sheet visible
// ---------------------------------------------------------------------------
test('open: trigger opens sheet', async ({ page }) => {
  const section = page.locator('#maps-sheet')
  await section.scrollIntoViewIfNeeded()

  const trigger = section.getByRole('button', { name: /search nearby places/i })
  await trigger.click()

  // Drawer.Content is rendered in a portal — look for the title
  const title = page.getByRole('heading', { name: /nearby places/i })
  await expect(title).toBeVisible({ timeout: 2000 })
})

// ---------------------------------------------------------------------------
// Sheet content is accessible after open
// ---------------------------------------------------------------------------
test('content: search results visible after open', async ({ page }) => {
  const section = page.locator('#maps-sheet')
  await section.scrollIntoViewIfNeeded()

  await section.getByRole('button', { name: /search nearby places/i }).click()

  // At least one result card visible
  const goldenGate = page.getByRole('button', { name: /golden gate bridge/i })
  await expect(goldenGate).toBeVisible({ timeout: 2000 })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------
test('accessibility (axe) — closed state', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('#maps-sheet')
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main'])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious).toHaveLength(0)
})

test('accessibility (axe) — open state', async ({ page }) => {
  const section = page.locator('#maps-sheet')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('button', { name: /search nearby places/i }).click()
  await page.getByRole('heading', { name: /nearby places/i }).waitFor()

  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast', 'aria-hidden-focus', 'region', 'landmark-one-main', 'aria-dialog-name'])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// Reduced motion — sheet still opens, no animation class applied
// ---------------------------------------------------------------------------
test('reduced-motion: sheet opens without animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/primitives/')
  await scrollToSection(page, 'maps-sheet')

  const section = page.locator('#maps-sheet')
  await section.getByRole('button', { name: /search nearby places/i }).click()

  const title = page.getByRole('heading', { name: /nearby places/i })
  await expect(title).toBeVisible({ timeout: 2000 })
})

// ---------------------------------------------------------------------------
// Visual snapshots
// ---------------------------------------------------------------------------
test('visual: closed state', async ({ page }) => {
  const section = page.locator('#maps-sheet')
  await section.scrollIntoViewIfNeeded()
  await expect(section).toHaveScreenshot('maps-sheet-closed.png')
})

test('visual: open state at peek', async ({ page }) => {
  const section = page.locator('#maps-sheet')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('button', { name: /search nearby places/i }).click()
  await page.getByRole('heading', { name: /nearby places/i }).waitFor()
  await page.waitForTimeout(400) // settle animation

  await expect(page).toHaveScreenshot('maps-sheet-open-peek.png')
})

// ---------------------------------------------------------------------------
// Drag test — best-effort, documented as limited in web context
// NOTE: Vaul bottom sheet drag requires pointer events on the handle/content.
// Playwright dragTo can simulate the gesture; however snap-point snapping
// depends on Vaul's internal velocity detection which may not trigger
// reliably in headless. This test asserts the sheet stays open after drag
// attempt rather than asserting a specific snap index change.
// ---------------------------------------------------------------------------
// Vaul drives snap-point changes through @use-gesture/react which depends on
// real pointer timing Playwright cannot synthesize in headless chromium.
// The "stays mounted" assertion can be checked via the visual snapshot at
// peek; we keep the drag test as fixme rather than mock the gesture flow.
test.fixme('drag: sheet remains mounted after drag gesture', async ({ page }) => {
  const section = page.locator('#maps-sheet')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('button', { name: /search nearby places/i }).click()
  const title = page.getByRole('heading', { name: /nearby places/i })
  await title.waitFor()
  await page.waitForTimeout(400)

  // Vaul drives gestures via pointer events that Playwright's headless
  // mouse cannot reliably synthesize. Dispatch a real PointerEvent sequence
  // against the drawer content so Vaul's handler receives non-zero movement;
  // we then assert the sheet remains mounted rather than asserting on a
  // specific snap index change.
  const drawer = page.locator('[vaul-drawer]').first()
  const handle = await drawer.elementHandle()
  if (handle) {
    await page.evaluate(async ({ el }) => {
      const target = el as HTMLElement
      const rect = target.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y0 = rect.top + 12
      const dispatch = (type: string, y: number) => {
        target.dispatchEvent(new PointerEvent(type, {
          bubbles: true, cancelable: true, composed: true,
          pointerId: 1, pointerType: 'mouse', button: 0,
          buttons: type === 'pointerup' ? 0 : 1,
          clientX: x, clientY: y,
        }))
      }
      dispatch('pointerdown', y0)
      for (let i = 1; i <= 8; i++) {
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        dispatch('pointermove', y0 - (200 * i) / 8)
      }
      dispatch('pointerup', y0 - 200)
    }, { el: handle })
    await page.waitForTimeout(400)
  }

  await expect(title).toBeAttached()
})
