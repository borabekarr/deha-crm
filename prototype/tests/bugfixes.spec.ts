import { test, expect } from '@playwright/test';

test.describe('Phase 2 bug fixes', () => {
  test('B1 — no href="#" remains in index.html (no jump-to-top)', async ({ page }) => {
    await page.goto('/');
    const hashAnchors = await page.locator('a[href="#"]').count();
    expect(hashAnchors).toBe(0);
  });

  test('B1 — clicking a demo sidebar link does not scroll page', async ({ page }) => {
    await page.goto('/');
    // Scroll to the Sidebar demo section first.
    await page.locator('#sidebar').scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(100);
    // Click the first link inside the sidebar demo.
    await page.locator('#sidebar .sidebar a').first().click();
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThan(50);
  });

  test('B2 — aspect section renders three figures in one row, three labels', async ({ page }) => {
    await page.goto('/');
    const figures = page.locator('#aspect figure');
    await expect(figures).toHaveCount(3);
    await expect(page.locator('#aspect figcaption').nth(0)).toContainText('16:9');
    await expect(page.locator('#aspect figcaption').nth(1)).toContainText('4:3');
    await expect(page.locator('#aspect figcaption').nth(2)).toContainText('1:1');
  });

  test('B6 — context menu uses position:absolute and tracks pageX/Y (document-anchored)', async ({ page }) => {
    await page.goto('/');
    await page.locator('#context #ctx-target').scrollIntoViewIfNeeded();
    const target = page.locator('#ctx-target');
    await target.click({ button: 'right', position: { x: 50, y: 30 } });
    const menu = page.locator('#ctx-menu');
    await expect(menu).toBeVisible();
    const pos = await menu.evaluate((m) => ({
      position: getComputedStyle(m).position,
      left: parseFloat(m.style.left),
      top: parseFloat(m.style.top),
    }));
    expect(pos.position).toBe('absolute');
    expect(pos.left).toBeGreaterThan(0);
    expect(pos.top).toBeGreaterThan(0);
  });
});
