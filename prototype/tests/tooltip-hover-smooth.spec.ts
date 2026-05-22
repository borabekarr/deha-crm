import { test, expect } from '@playwright/test';

test.describe('Step 17 — Tooltip smooth opacity+transform transition', () => {
  test('tooltip uses opacity transition with intermediate values during hover', async ({ page }) => {
    await page.goto('/');

    await page.locator('#tooltip').scrollIntoViewIfNeeded();

    const tooltip = page.locator('#tooltip .tooltip');

    // Verify initial state: opacity 0, no display:none hiding
    const initialOpacity = await tooltip.evaluate((el) => getComputedStyle(el).opacity);
    expect(initialOpacity).toBe('0');

    // Verify transition CSS includes both opacity and transform
    const transitionProp = await tooltip.evaluate((el) => getComputedStyle(el).transition);
    expect(transitionProp).toMatch(/opacity/);
    expect(transitionProp).toMatch(/transform/);

    // Verify no display:none on default state
    const displayVal = await tooltip.evaluate((el) => getComputedStyle(el).display);
    expect(displayVal).not.toBe('none');

    // Verify initial transform includes translateY(4px) (non-zero Y offset)
    const initialTransform = await tooltip.evaluate((el) => getComputedStyle(el).transform);
    // The matrix form: translateX(-50%) translateY(4px) → matrix(..., ..., ..., ..., tx, ty)
    // ty should be non-zero (positive 4px) in default state
    expect(initialTransform).not.toBe('none');

    // Start hovering the trigger button
    const hoverBtn = page.locator('#tooltip button:has-text("Hover me")');
    await hoverBtn.hover();

    // The transition has a 200ms delay then 150ms duration (~350ms total).
    // Sample opacity at 4 intervals during the active transition window.
    // We start sampling shortly after the delay elapses.
    const samples: number[] = [];
    const sampleCount = 4;
    const sampleIntervalMs = 30;

    // Wait for the delay to pass, then sample at fixed offsets in parallel
    await page.waitForTimeout(210); // just past the 200ms transition-delay

    const parallelSamples = await Promise.all(
      Array.from({ length: sampleCount }, async (_, step) => {
        await page.waitForTimeout(step * sampleIntervalMs);
        return tooltip.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
      }),
    );
    samples.push(...parallelSamples);

    // At least 2 samples should be strictly between 0 and 1 (intermediate values)
    const intermediates = samples.filter((v) => v > 0 && v < 1);
    expect(
      intermediates.length,
      `Expected ≥2 intermediate opacity values (0 < v < 1) but got: ${JSON.stringify(samples)}`
    ).toBeGreaterThanOrEqual(2);

    // Wait for transition to fully complete
    await page.waitForTimeout(200);

    // Final state: opacity 1
    const finalOpacity = await tooltip.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(finalOpacity).toBe(1);

    // Final transform: translateY should be ~0 (only translateX(-50%) remains)
    const finalTransform = await tooltip.evaluate((el) => getComputedStyle(el).transform);
    // matrix(1, 0, 0, 1, tx, ty) — ty should be ~0
    const tyMatch = finalTransform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,([^)]+)\)/);
    if (tyMatch) {
      const ty = parseFloat(tyMatch[1]);
      expect(Math.abs(ty)).toBeLessThan(1); // within 1px of 0
    }
  });
});
