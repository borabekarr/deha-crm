import { test, expect } from '@playwright/test';

test.describe('Step 19 — Sheet hidden by default', () => {
  test('sheet is off-screen on load, visible after open, hidden after overlay click', async ({ page }) => {
    await page.goto('/');

    // Sheet starts translated off-screen (transform: translateX(calc(100% + 1rem)))
    // It is in the DOM but not visually visible — check via bounding box right edge
    const sheet = page.locator('#sht-1');
    const overlay = page.locator('#sht-ov');

    // On load: sheet is translated past the right edge of the viewport
    const viewportWidth = page.viewportSize()?.width ?? 1280;
    const boxBefore = await sheet.boundingBox();
    // The sheet should be positioned beyond the viewport right edge
    if (boxBefore) {
      expect(boxBefore.x).toBeGreaterThan(viewportWidth - 10);
    }

    // Overlay should be hidden (display:none)
    await expect(overlay).not.toBeVisible();

    // Click the "Open sheet" button inside #sheet section
    const openBtn = page.locator('#sheet button:has-text("Open sheet")');
    await openBtn.click();

    // Wait for the sheet to animate in
    await page.waitForTimeout(400);

    // Sheet should now be in viewport (translateX(0))
    const boxAfter = await sheet.boundingBox();
    expect(boxAfter).not.toBeNull();
    expect(boxAfter!.x).toBeLessThan(viewportWidth);
    expect(boxAfter!.x).toBeGreaterThanOrEqual(0);

    // Overlay should be visible
    await expect(overlay).toBeVisible();

    // Click the overlay to close
    await overlay.click();

    // Wait for close animation
    await page.waitForTimeout(400);

    // Overlay should be hidden again
    await expect(overlay).not.toBeVisible();

    // Sheet should be back off-screen
    const boxClosed = await sheet.boundingBox();
    if (boxClosed) {
      expect(boxClosed.x).toBeGreaterThan(viewportWidth - 10);
    }
  });
});
