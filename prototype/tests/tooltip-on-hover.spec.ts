import { test, expect } from '@playwright/test';

test.describe('Step 17 — Tooltip on hover', () => {
  test('tooltip hidden by default, visible on hover, hidden after mouse leave', async ({ page }) => {
    await page.goto('/');

    // Scroll the tooltip section into view so hover works reliably
    await page.locator('#tooltip').scrollIntoViewIfNeeded();

    const tooltip = page.locator('#tooltip .tooltip');

    // Default state: opacity should be 0
    const opacityBefore = await tooltip.evaluate((el) => getComputedStyle(el).opacity);
    expect(opacityBefore).toBe('0');

    // Hover the "Hover me" button
    const hoverBtn = page.locator('#tooltip button:has-text("Hover me")');
    await hoverBtn.hover();

    // Wait for hover delay (200ms transition-delay) + transition duration
    await page.waitForTimeout(500);

    // Tooltip should now be visible (opacity: 1)
    const opacityAfter = await tooltip.evaluate((el) => getComputedStyle(el).opacity);
    expect(opacityAfter).toBe('1');

    // Move mouse away from the button to a neutral area
    await page.mouse.move(0, 0);

    // Wait for transition back
    await page.waitForTimeout(400);

    // Tooltip should be hidden again (opacity: 0)
    const opacityFinal = await tooltip.evaluate((el) => getComputedStyle(el).opacity);
    expect(opacityFinal).toBe('0');
  });
});
