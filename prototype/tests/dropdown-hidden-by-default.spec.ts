import { test, expect } from '@playwright/test';

test.describe('Step 18 — Dropdown hidden by default', () => {
  test('menu hidden on load, visible after trigger click, hidden after outside click', async ({ page }) => {
    await page.goto('/');

    // Scroll dropdown section into view
    await page.locator('#dropdown').scrollIntoViewIfNeeded();

    const menu = page.locator('#dropdown-menu');

    // Default state: menu has display:none (no is-open class)
    await expect(menu).not.toBeVisible();

    // Click the dropdown trigger button
    const trigger = page.locator('[data-dropdown-trigger]');
    await trigger.click();

    // Menu should be visible
    await expect(menu).toBeVisible();

    // Click outside the menu (on the section header to avoid the menu area)
    await page.locator('#dropdown header').click();

    // Menu should be hidden again
    await expect(menu).not.toBeVisible();
  });
});
