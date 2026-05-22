import { test, expect } from '@playwright/test';

test.describe('feedback-pass-3 — behavioral changes', () => {
  test('ctx menu anchors top to tRect.top + scrollY (right or mirrored left)', async ({ page }) => {
    await page.goto('/');
    await page.locator('#context').scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    const target = page.locator('#ctx-target');

    // Capture tRect and scroll position from inside the page to match the handler
    const { tRect, scrollX, scrollY, viewportWidth } = await target.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        tRect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
      };
    });

    await target.click({
      button: 'right',
      position: { x: tRect.width / 2, y: tRect.height / 2 },
    });
    await page.waitForTimeout(50);

    const menu = page.locator('#ctx-menu');
    const [menuLeft, menuTop, menuWidth] = await Promise.all([
      menu.evaluate((el) => parseFloat((el as HTMLElement).style.left)),
      menu.evaluate((el) => parseFloat((el as HTMLElement).style.top)),
      menu.evaluate((el) => el.getBoundingClientRect().width),
    ]);

    // Top must always be tRect.top + scrollY (within 2px)
    expect(Math.abs(menuTop - (tRect.top + scrollY))).toBeLessThanOrEqual(2);

    // Left is tRect.right + scrollX unless that would overflow the viewport,
    // in which case the handler mirrors to tRect.left - menuWidth + scrollX
    const anchoredLeft = tRect.right + scrollX;
    const mirroredLeft = tRect.left - menuWidth + scrollX;
    const wouldOverflow = anchoredLeft + menuWidth > viewportWidth + scrollX;
    const expectedLeft = wouldOverflow ? mirroredLeft : anchoredLeft;

    expect(Math.abs(menuLeft - expectedLeft)).toBeLessThanOrEqual(2);
  });

  test('ctx menu mirrors to left edge when viewport right is too narrow', async ({ page }) => {
    // Use a narrow viewport so the right-anchor overflows and the mirror branch fires
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto('/');
    await page.locator('#context').scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    const target = page.locator('#ctx-target');

    const { tRect, scrollX, scrollY, viewportWidth } = await target.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        tRect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
      };
    });

    await target.click({ button: 'right', position: { x: tRect.width / 2, y: tRect.height / 2 } });
    await page.waitForTimeout(100);

    const menu = page.locator('#ctx-menu');
    const [menuLeft, menuTop, menuWidth] = await Promise.all([
      menu.evaluate((el) => parseFloat((el as HTMLElement).style.left)),
      menu.evaluate((el) => parseFloat((el as HTMLElement).style.top)),
      menu.evaluate((el) => el.getBoundingClientRect().width),
    ]);

    // Top anchor is always tRect.top + scrollY regardless of mirroring
    expect(Math.abs(menuTop - (tRect.top + scrollY))).toBeLessThanOrEqual(2);

    // Narrow viewport forces the mirror branch
    const anchoredLeft = tRect.right + scrollX;
    const mirroredLeft = tRect.left - menuWidth + scrollX;
    const wouldOverflow = anchoredLeft + menuWidth > viewportWidth + scrollX;
    expect(wouldOverflow).toBe(true); // confirm mirror branch actually fires in this viewport
    expect(Math.abs(menuLeft - mirroredLeft)).toBeLessThanOrEqual(2);

    // The rendered menu must not overflow the right edge of the viewport
    const menuRect = await menu.evaluate((el) => el.getBoundingClientRect());
    expect(menuRect.right).toBeLessThanOrEqual(viewportWidth + 2);
  });

  test('tabs-panel slide animation — active panel uses slide-in-right', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tabs').scrollIntoViewIfNeeded();

    // The first panel is already active on page load
    const activePanel = page.locator('#tabs .tabs-panel[data-active="true"]');
    const animName = await activePanel.evaluate((el) =>
      window.getComputedStyle(el).animationName,
    );
    expect(animName).toContain('slide-in-right');
  });

  test('pager-panel has slide-in-right animation', async ({ page }) => {
    await page.goto('/');
    await page.locator('#pagination').scrollIntoViewIfNeeded();

    const pagerPanel = page.locator('.pager-panel');
    const animName = await pagerPanel.evaluate((el) =>
      window.getComputedStyle(el).animationName,
    );
    expect(animName).toContain('slide-in-right');
  });

  test('sidebar-panel has slide-in-right animation', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sidebar').scrollIntoViewIfNeeded();

    const sidebarPanel = page.locator('.sidebar-panel');
    const animName = await sidebarPanel.evaluate((el) =>
      window.getComputedStyle(el).animationName,
    );
    expect(animName).toContain('slide-in-right');
  });

  test('custom select — clicking trigger flips aria-expanded to true', async ({ page }) => {
    await page.goto('/');
    await page.locator('#select').scrollIntoViewIfNeeded();

    const trigger = page.locator('#sel-trigger');

    expect(await trigger.getAttribute('aria-expanded')).toBe('false');

    await trigger.click();
    await page.waitForTimeout(50);

    expect(await trigger.getAttribute('aria-expanded')).toBe('true');
  });

  test('custom select — clicking an option updates trigger label', async ({ page }) => {
    await page.goto('/');
    await page.locator('#select').scrollIntoViewIfNeeded();

    const trigger = page.locator('#sel-trigger');
    await trigger.click();
    await page.waitForTimeout(50);

    // Click the "Contacted" option
    const contactedOpt = page.locator('#sel-panel .select-opt').nth(1);
    await contactedOpt.click();
    await page.waitForTimeout(50);

    const labelText = await page.locator('#sel-trigger .select-trigger-label').textContent();
    expect(labelText?.trim()).toBe('Contacted');
  });

  test('badge convergence — task-card, metric-card, leaderboard, chart each have a badge', async ({ page }) => {
    await page.goto('/');

    // task-card
    await page.locator('#task-card').scrollIntoViewIfNeeded();
    await expect(page.locator('#task-card [class*="badge"]').first()).toBeVisible();

    // metric-card
    await page.locator('#metric-card').scrollIntoViewIfNeeded();
    await expect(page.locator('#metric-card [class*="badge"]').first()).toBeVisible();

    // leaderboard
    await page.locator('#leaderboard').scrollIntoViewIfNeeded();
    await expect(page.locator('#leaderboard [class*="badge"]').first()).toBeVisible();

    // chart
    await page.locator('#chart').scrollIntoViewIfNeeded();
    await expect(page.locator('#chart [class*="badge"]').first()).toBeVisible();
  });
});
