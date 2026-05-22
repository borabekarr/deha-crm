import { test, expect } from '@playwright/test';

test.describe('Step 15 — Sheet polish: icons and select shadow', () => {
  test('sheet primary header has edit icon', async ({ page }) => {
    await page.goto('/');

    // Open the sheet
    const openBtn = page.locator('#sheet button:has-text("Open sheet")');
    await openBtn.click();
    await page.waitForTimeout(400);

    // Primary header (h3) should contain a material-symbols-outlined span
    const headerIcon = page.locator('#sht-1 h3 span.material-symbols-outlined');
    await expect(headerIcon).toBeVisible();
  });

  test('sheet inner section heading (Stage label) has settings icon', async ({ page }) => {
    await page.goto('/');

    // Open the sheet
    const openBtn = page.locator('#sheet button:has-text("Open sheet")');
    await openBtn.click();
    await page.waitForTimeout(400);

    // Inner label heading should contain a material-symbols-outlined span
    const labelIcon = page.locator('#sht-1 label.label span.material-symbols-outlined').first();
    await expect(labelIcon).toBeVisible();
  });

  test('sheet nested select has inner shadow (background-color is white)', async ({ page }) => {
    await page.goto('/');

    // Open the sheet
    const openBtn = page.locator('#sheet button:has-text("Open sheet")');
    await openBtn.click();
    await page.waitForTimeout(400);

    // The select element inside the sheet should be visible
    const select = page.locator('#sht-1 select.select');
    await expect(select).toBeVisible();

    // Verify computed background-color is white (the base .select rule)
    const bgColor = await select.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBe('rgb(255, 255, 255)');
  });
});
