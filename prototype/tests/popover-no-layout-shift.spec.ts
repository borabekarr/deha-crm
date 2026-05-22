import { test, expect } from '@playwright/test';

test('popover opens without layout shift and has strong shadow', async ({ page }) => {
  await page.goto('/');

  // Capture scrollHeight before opening
  const heightBefore = await page.evaluate(() => document.body.scrollHeight);

  // Click the popover trigger
  const trigger = page.locator('[data-popover-trigger]').first();
  await trigger.click();

  // Wait for panel to be visible
  const panel = page.locator('#popover-panel');
  await expect(panel).toHaveClass(/is-open/);

  // Capture scrollHeight after opening — must not change (absolute positioning)
  const heightAfter = await page.evaluate(() => document.body.scrollHeight);
  expect(heightAfter - heightBefore).toBe(0);

  // Assert box-shadow is not none and contains blur >= 24px
  const shadow = await panel.evaluate((el) => {
    return window.getComputedStyle(el).boxShadow;
  });

  expect(shadow).not.toBe('none');

  // Extract the largest blur value from the shadow string.
  // box-shadow format: "Xpx Ypx BLURpx SPREADpx color, ..."
  // We split on comma, parse each layer, and find max blur.
  const blurValues = [...shadow.matchAll(/\d+(?:\.\d+)?px\s+(-?\d+(?:\.\d+)?px\s+)?(\d+(?:\.\d+)?)px/g)]
    .map((m) => parseFloat(m[2]));

  const maxBlur = Math.max(...blurValues);
  expect(maxBlur).toBeGreaterThanOrEqual(24);
});

test('popover-wrap has position relative and popover has position absolute', async ({ page }) => {
  await page.goto('/');

  const wrap = page.locator('.popover-wrap').first();
  const wrapPosition = await wrap.evaluate((el) => window.getComputedStyle(el).position);
  expect(wrapPosition).toBe('relative');

  const panel = page.locator('#popover-panel');
  const panelPosition = await panel.evaluate((el) => window.getComputedStyle(el).position);
  expect(panelPosition).toBe('absolute');
});
