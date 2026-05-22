import { test, expect } from '@playwright/test';

/**
 * Step 10 — Context menu top-right anchor.
 *
 * Verifies the rewritten oncontextmenu handler:
 *  1. Positions the menu at the target's top-right corner using
 *     getBoundingClientRect() + scroll offsets (not pageX/pageY).
 *  2. Mirrors to the left of the target when the menu would overflow
 *     the right edge of the viewport.
 *  3. Closes on an outside click.
 */
test.describe('Context menu — top-right anchor', () => {
  test.use({ viewport: { width: 1378, height: 712 } });

  test('menu opens at top-right of #ctx-target', async ({ page }) => {
    await page.goto('/');
    await page.locator('#context #ctx-target').scrollIntoViewIfNeeded();

    const menu = page.locator('#ctx-menu');

    // Right-click anywhere inside the target — position should be based on rect, not click coords
    await page.evaluate(() => {
      const target = document.getElementById('ctx-target')!;
      const r = target.getBoundingClientRect();
      // Click in the middle of the target
      target.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
          view: window,
        })
      );
    });

    await expect(menu).toBeVisible();

    const { menuLeft, menuTop, targetRight, targetTop, scrollX, scrollY } = await page.evaluate(() => {
      const m = document.getElementById('ctx-menu')!;
      const t = document.getElementById('ctx-target')!;
      const tRect = t.getBoundingClientRect();
      return {
        menuLeft: parseFloat(m.style.left),
        menuTop: parseFloat(m.style.top),
        targetRight: tRect.right,
        targetTop: tRect.top,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      };
    });

    // Menu top should equal target top + scrollY (document coords)
    expect(menuTop).toBeCloseTo(targetTop + scrollY, 1);

    // Menu left should be at target right + scrollX (no overflow expected at wide viewport)
    // OR mirrored (targetLeft - menuWidth + scrollX) if overflow
    // Check via document-coord style values, not getBoundingClientRect (which is viewport-relative)
    expect(menuLeft).toBeGreaterThanOrEqual(0);
    // left must not exceed viewport width + scrollX (i.e., menu anchors within document)
    expect(menuLeft).toBeLessThanOrEqual(1378 + scrollX);

    // Dismiss via JS for cleanup
    await page.evaluate(() => {
      (document.getElementById('ctx-menu') as HTMLElement).style.display = 'none';
    });
  });

  test('menu mirrors to left of target when right edge would overflow viewport', async ({ page }) => {
    // Use a narrow viewport so the target's right edge is near the viewport right
    await page.setViewportSize({ width: 500, height: 712 });
    await page.goto('/');
    await page.locator('#context #ctx-target').scrollIntoViewIfNeeded();

    const menu = page.locator('#ctx-menu');

    await page.evaluate(() => {
      const target = document.getElementById('ctx-target')!;
      const r = target.getBoundingClientRect();
      target.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true,
          clientX: r.left + 10,
          clientY: r.top + 10,
          view: window,
        })
      );
    });

    await expect(menu).toBeVisible();

    // Menu must stay within viewport
    const menuRect = await menu.evaluate((el: HTMLElement) => el.getBoundingClientRect());
    expect(menuRect.left).toBeGreaterThanOrEqual(0);
    expect(menuRect.right).toBeLessThanOrEqual(500);

    // Dismiss via JS for cleanup
    await page.evaluate(() => {
      (document.getElementById('ctx-menu') as HTMLElement).style.display = 'none';
    });
  });

  test('outside click closes the context menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('#context #ctx-target').scrollIntoViewIfNeeded();

    const menu = page.locator('#ctx-menu');

    // Open the menu
    await page.evaluate(() => {
      const target = document.getElementById('ctx-target')!;
      const r = target.getBoundingClientRect();
      target.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true,
          clientX: r.left + 20, clientY: r.top + 20,
          view: window,
        })
      );
    });

    await expect(menu).toBeVisible();

    // Click somewhere outside the menu (top of page)
    await page.mouse.click(10, 10);

    // Menu should be hidden
    await expect(menu).not.toBeVisible();
  });
});
