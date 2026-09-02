/**
 * Overshoot-curve probe: reads back the resolved transition/animation timing
 * function for each hover-adjacent element this plan repoints, parses the
 * cubic-bezier() control points out of it, and asserts neither the 2nd nor
 * 4th number exceeds 1.32 (the overshoot ceiling this plan enforces), while
 * also asserting the transition is not absent (motion disappearing entirely
 * is the failure mode this probe exists to catch, not just "wrong" motion).
 * Modeled on apps/web/tests/motion-exit-asymmetry.spec.ts's navigation and
 * resolved-style helpers, but checks a different property (control-point
 * overshoot, not enter/exit duration asymmetry) so failures stay unambiguous.
 * See plans/overshoot-curve-retire-p1.md Step 1.
 */
import { test, expect, type Page, type Locator } from '@playwright/test'

const OVERSHOOT_CEILING = 1.32

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)
}

// Pulls every `cubic-bezier(a, b, c, d)` out of a resolved timing-function
// string -- transition-timing-function resolves as a comma-separated list
// with one entry per transitioned property, so a harsh curve buried behind
// other properties (e.g. transform on a background-color hover) must still
// be caught.
function parseBezierControlPoints(raw: string): Array<[number, number, number, number]> {
  const matches = [...raw.matchAll(/cubic-bezier\(([^)]+)\)/g)]
  return matches.map((m) => {
    const nums = m[1].split(',').map((n) => Number.parseFloat(n.trim()))
    return [nums[0], nums[1], nums[2], nums[3]] as [number, number, number, number]
  })
}

// Asserts the resolved timing-function string both (a) contains at least one
// real cubic-bezier() curve whose 2nd/4th control points stay within the
// overshoot ceiling, and (b) is not an absent/disabled transition -- an
// empty or "none" timing-function on an element that should be animating is
// the regression this probe is built to catch, not a passing curve.
function assertOvershootWithinThreshold(rawTimingFunction: string, rawDuration: string, label: string) {
  expect(rawTimingFunction, `${label}: timing-function must not be empty`).not.toBe('')
  expect(rawDuration, `${label}: duration must not be "0s" (transition disabled)`).not.toBe('0s')
  expect(rawDuration, `${label}: duration must not be empty`).not.toBe('')

  const points = parseBezierControlPoints(rawTimingFunction)
  expect(points.length, `${label}: expected at least one cubic-bezier() in "${rawTimingFunction}"`).toBeGreaterThan(0)

  for (const [, y1, , y2] of points) {
    expect(y1, `${label}: control point 2 (${y1}) in "${rawTimingFunction}" exceeds ${OVERSHOOT_CEILING}`).toBeLessThanOrEqual(
      OVERSHOOT_CEILING,
    )
    expect(y2, `${label}: control point 4 (${y2}) in "${rawTimingFunction}" exceeds ${OVERSHOOT_CEILING}`).toBeLessThanOrEqual(
      OVERSHOOT_CEILING,
    )
  }
}

// Reads back an element's own resolved transition timing-function/duration.
async function readTransition(locator: Locator) {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el)
    return { timingFunction: style.transitionTimingFunction, duration: style.transitionDuration }
  })
}

// Reads back a pseudo-element's (::before/::after) resolved transition
// timing-function/duration -- getComputedStyle's second argument targets the
// pseudo directly, since Playwright locators can't address ::before/::after.
async function readPseudoTransition(locator: Locator, pseudo: string) {
  return locator.evaluate((el, p) => {
    const style = getComputedStyle(el, p)
    return { timingFunction: style.transitionTimingFunction, duration: style.transitionDuration }
  }, pseudo)
}

test.describe('motion overshoot threshold: control points stay within Apple-standard range', () => {
  test('tb-daybtn hover easing is within threshold', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/task-board')
    await settle(page)

    const dayBtn = page.locator('.tb-daybtn').first()
    await dayBtn.waitFor({ state: 'attached' })
    await dayBtn.hover()
    await expect
      .poll(() => dayBtn.evaluate((el) => el.matches(':hover')), { timeout: 3000 })
      .toBe(true)

    const { timingFunction, duration } = await readTransition(dayBtn)
    assertOvershootWithinThreshold(timingFunction, duration, '.tb-daybtn (hovered) transition')
  })

  test('tb-btn sync pill easing is within threshold', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/task-board')
    await settle(page)

    // The sync button morphs through tb-btn-gray/orange/amber/solid-green as
    // the AI sync sequence advances -- all four classes share one transition
    // rule (TaskBoard.css .tb-btn-gray, .tb-btn-orange, .tb-btn-amber,
    // .tb-btn-solid-green), so catching any one of them after starting the
    // sync is enough to read the shared curve.
    await page.locator('.sync-btn').click()
    const morphedBtn = page.locator('.sync-btn.tb-btn-gray, .sync-btn.tb-btn-orange, .sync-btn.tb-btn-amber, .sync-btn.tb-btn-solid-green')
    await morphedBtn.first().waitFor({ state: 'attached', timeout: 5000 })

    const { timingFunction, duration } = await readTransition(morphedBtn.first())
    assertOvershootWithinThreshold(timingFunction, duration, '.tb-btn-* sync pill transition')
  })

  test('tb-week-nav hover easing is within threshold', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/task-board')
    await settle(page)

    const weekNav = page.locator('.tb-week-nav').first()
    await weekNav.waitFor({ state: 'attached' })
    await weekNav.hover()
    await expect
      .poll(() => weekNav.evaluate((el) => el.matches(':hover')), { timeout: 3000 })
      .toBe(true)

    const { timingFunction, duration } = await readTransition(weekNav)
    assertOvershootWithinThreshold(timingFunction, duration, '.tb-week-nav (hovered) transition')
  })

  test('tb-filt hover easing is within threshold', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'reduced motion zeroes durations')

    await page.goto('/components/task-board')
    await settle(page)

    const filt = page.locator('.tb-filt').first()
    await filt.waitFor({ state: 'attached' })
    await filt.hover()
    await expect
      .poll(() => filt.evaluate((el) => el.matches(':hover')), { timeout: 3000 })
      .toBe(true)

    const { timingFunction, duration } = await readTransition(filt)
    assertOvershootWithinThreshold(timingFunction, duration, '.tb-filt (hovered) transition')
  })
})
