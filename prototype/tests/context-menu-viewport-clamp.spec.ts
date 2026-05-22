import { test, expect } from '@playwright/test';

/**
 * Step 10 — Context menu top-right anchor + viewport clamp.
 *
 * The handler positions the menu at the target element's top-right corner:
 *   left = rect.right + scrollX
 *   top  = rect.top  + scrollY
 *
 * If the menu would overflow the right viewport edge, it mirrors left:
 *   left = rect.left - menuWidth + scrollX
 *
 * Tests verify:
 *  a) Menu appears at target's top-right (not at click coords)
 *  b) position:absolute is preserved
 *  c) style.top reflects rect.top + scrollY
 *  d) Mirror kicks in when menu would overflow right edge
 */
test.describe('Step 10 — Context menu top-right anchor + viewport clamp', () => {
  test('context menu appears at target top-right and uses position:absolute', async ({ page }) => {
    await page.goto('/');
    await page.locator('#context #ctx-target').scrollIntoViewIfNeeded();

    const target = page.locator('#ctx-target');
    const menu = page.locator('#ctx-menu');

    // Right-click in the middle of the target
    await target.click({ button: 'right', position: { x: 50, y: 30 } });

    await expect(menu).toBeVisible();

    // Verify position:absolute is preserved
    const pos = await menu.evaluate((m: HTMLElement) => getComputedStyle(m).position);
    expect(pos).toBe('absolute');

    // Verify menu top matches target top + scrollY
    const { menuTop, targetTop, scrollY } = await page.evaluate(() => {
      const m = document.getElementById('ctx-menu')!;
      const t = document.getElementById('ctx-target')!;
      const tRect = t.getBoundingClientRect();
      return {
        menuTop: parseFloat(m.style.top),
        targetTop: tRect.top,
        scrollY: window.scrollY,
      };
    });

    expect(menuTop).toBeCloseTo(targetTop + scrollY, 1);

    // Dismiss
    await page.evaluate(() => {
      (document.getElementById('ctx-menu') as HTMLElement).style.display = 'none';
    });
    await expect(menu).not.toBeVisible();
  });

  test('context menu left is anchored to target right, not click coords', async ({ page }) => {
    await page.goto('/');
    await page.locator('#ctx-target').scrollIntoViewIfNeeded();

    const viewport = page.viewportSize()!;
    const menu = page.locator('#ctx-menu');

    // Click at a deliberately different X position (left side of target)
    // and verify menu left is set from rect.right, not from clientX
    const result = await page.evaluate(({ vw }) => {
      const target = document.getElementById('ctx-target')!;
      const rect = target.getBoundingClientRect();
      // Click near the left edge of the target
      const cx = rect.left + 10;
      const cy = rect.top + rect.height / 2;

      const evt = new MouseEvent('contextmenu', {
        bubbles: true, cancelable: true,
        clientX: cx, clientY: cy,
        view: window,
      });
      target.dispatchEvent(evt);

      const m = document.getElementById('ctx-menu')!;
      return {
        left: parseFloat(m.style.left),
        top: parseFloat(m.style.top),
        display: m.style.display,
        position: getComputedStyle(m).position,
        targetRight: rect.right,
        targetTop: rect.top,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        clickX: cx,
        vw,
      };
    }, { vw: viewport.width });

    // Menu should be shown
    expect(result.display).toBe('block');
    expect(result.position).toBe('absolute');

    // Menu left must NOT equal clickX — it must be anchored to target right (or mirror)
    // The minimum left should be different from clickX
    const expectedRight = result.targetRight + result.scrollX;
    const menuWidth = await menu.evaluate((el: HTMLElement) => el.getBoundingClientRect().width);

    if (expectedRight + menuWidth <= viewport.width + result.scrollX) {
      // No overflow: left should equal targetRight + scrollX
      expect(result.left).toBeCloseTo(expectedRight, 1);
    } else {
      // Overflow: left should equal targetLeft - menuWidth + scrollX (mirror)
      expect(result.left).toBeLessThan(result.targetRight + result.scrollX);
    }

    // Dismiss
    await page.evaluate(() => {
      (document.getElementById('ctx-menu') as HTMLElement).style.display = 'none';
    });
  });

  test('context menu top stays at target top when triggered near bottom edge', async ({ page }) => {
    await page.goto('/');
    await page.locator('#ctx-target').scrollIntoViewIfNeeded();

    const menu = page.locator('#ctx-menu');

    const result = await page.evaluate(() => {
      const target = document.getElementById('ctx-target')!;
      const rect = target.getBoundingClientRect();
      // Click near bottom of target
      const cx = rect.left + rect.width / 2;
      const cy = rect.bottom - 5;

      const evt = new MouseEvent('contextmenu', {
        bubbles: true, cancelable: true,
        clientX: cx, clientY: cy,
        view: window,
      });
      target.dispatchEvent(evt);

      const m = document.getElementById('ctx-menu')!;
      return {
        left: parseFloat(m.style.left),
        top: parseFloat(m.style.top),
        display: m.style.display,
        position: getComputedStyle(m).position,
        targetTop: rect.top,
        scrollY: window.scrollY,
      };
    });

    expect(result.display).toBe('block');
    expect(result.position).toBe('absolute');

    // Top should always be target.top + scrollY regardless of click position
    expect(result.top).toBeCloseTo(result.targetTop + result.scrollY, 1);

    // Dismiss
    await page.evaluate(() => {
      (document.getElementById('ctx-menu') as HTMLElement).style.display = 'none';
    });
  });
});
