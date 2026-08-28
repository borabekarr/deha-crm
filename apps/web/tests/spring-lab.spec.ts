// Spring Lab (Step 4) interaction spec: sliders drive the physics readouts,
// presets snap the sliders to their named values, and the JS/CSS export
// blocks round-trip through the clipboard.
import { test, expect } from '@playwright/test'

test.describe('spring-showcase / Spring Lab', () => {
  test('sliders update readouts, presets snap params, export copies to clipboard, replay animates', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/components/spring-showcase')
    await page.locator('.ss-lab').waitFor({ state: 'visible' })
    await page.waitForTimeout(300)

    const settle = page.getByTestId('ss-settle')
    const overshoot = page.getByTestId('ss-overshoot')

    const settleBefore = await settle.textContent()
    const overshootBefore = Number.parseFloat((await overshoot.textContent()) ?? '0')

    // Drag damping up to 120 — settle time and overshoot are both physically
    // sensitive to damping, so both readouts must move.
    const dampingSlider = page.locator('#ss-range-damping')
    await dampingSlider.fill('120')
    await dampingSlider.dispatchEvent('input')
    await dampingSlider.dispatchEvent('change')

    await expect(settle).not.toHaveText(settleBefore ?? '')
    const overshootAfter = Number.parseFloat((await overshoot.textContent()) ?? '0')
    expect(overshootAfter).toBeLessThan(overshootBefore)

    // Copy the CSS export and verify the clipboard payload shape.
    await page.locator('.ss-export-block', { hasText: 'CSS linear()' }).getByRole('button', { name: /copy/i }).click()
    const cssClip = await page.evaluate(() => navigator.clipboard.readText())
    expect(cssClip.startsWith('transition: transform ')).toBe(true)
    expect(cssClip).toContain('linear(')

    // Elegant preset snaps stiffness/damping back to its named values.
    await page.getByRole('button', { name: 'Elegant' }).click()
    await expect(page.getByTestId('ss-val-stiffness')).toHaveText('150')
    await expect(page.getByTestId('ss-val-damping')).toHaveText('19')

    // Replay must visibly move the slide demo after being clicked (skipped
    // when motion is disabled -- either --anim-mult <= 0 or the OS/browser
    // prefers-reduced-motion media feature, which the `reduced-motion`
    // Playwright project drives via contextOptions.reducedMotion and which
    // global.css collapses to near-zero transition durations; the callback
    // ref jumps straight to the end state in both cases, matching the app's
    // own motionDisabled() check in spring-showcase-hook.ts / motion-spring.ts).
    // The poll budget is generous to stay stable on slow CI runners.
    const motionDisabled = await page.evaluate(() => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult').trim()
      const mult = raw === '' ? 1 : Number.parseFloat(raw)
      if (Number.isFinite(mult) && mult <= 0) return true
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })
    const slide = page.locator('.ss-demo-slide')
    const transformBefore = await slide.evaluate((el) => getComputedStyle(el).transform)
    await page.getByRole('button', { name: 'Replay' }).click()
    if (!motionDisabled) {
      await expect
        .poll(async () => slide.evaluate((el) => getComputedStyle(el).transform), { timeout: 3000 })
        .not.toBe(transformBefore)
    }

    expect(consoleErrors, `console errors: ${consoleErrors.join('; ')}`).toEqual([])
  })
})
