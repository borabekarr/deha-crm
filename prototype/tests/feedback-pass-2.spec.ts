import { test, expect } from '@playwright/test';

test.describe('feedback-pass-2 — behavioral bugs', () => {
  test('tooltip hover-only (no click-pin)', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tooltip').scrollIntoViewIfNeeded();

    const tooltip = page.locator('#tooltip .tooltip');
    const btn = page.locator('#tooltip button:has-text("Hover me")');

    expect(await tooltip.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');

    await btn.hover();
    await page.waitForTimeout(500);
    expect(await tooltip.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

    await btn.click();
    await page.waitForTimeout(50);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);
    expect(await tooltip.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  });

  test('context menu stays at document coords on scroll', async ({ page }) => {
    await page.goto('/');
    await page.locator('#context').scrollIntoViewIfNeeded();

    const target = page.locator('#ctx-target');
    const box = await target.boundingBox();
    if (!box) throw new Error('ctx-target not visible');

    await target.click({ button: 'right', position: { x: 40, y: 40 } });
    await page.waitForTimeout(50);

    const menu = page.locator('#ctx-menu');
    const beforeTopDoc = await menu.evaluate((el) => parseFloat((el as HTMLElement).style.top));

    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(100);

    const afterTopDoc = await menu.evaluate((el) => parseFloat((el as HTMLElement).style.top));
    expect(afterTopDoc).toBeCloseTo(beforeTopDoc, 0);

    const position = await menu.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('absolute');
  });

  test('popover solid white + z-index 100', async ({ page }) => {
    await page.goto('/');
    await page.locator('#popover').scrollIntoViewIfNeeded();
    await page.locator('#popover button:has-text("Open popover")').click();
    await page.waitForTimeout(200);

    const panel = page.locator('#popover-panel');
    const bg = await panel.evaluate((el) => getComputedStyle(el).backgroundColor);
    const z = await panel.evaluate((el) => getComputedStyle(el).zIndex);

    expect(bg).toBe('rgb(255, 255, 255)');
    expect(z).toBe('100');
  });

  test('OTP focus retains inner shadow + adds emerald ring', async ({ page }) => {
    await page.goto('/');
    await page.locator('#otp').scrollIntoViewIfNeeded();
    const first = page.locator('#otp-row input').first();
    await first.focus();
    await page.waitForTimeout(50);

    const shadow = await first.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain('inset');
    expect(shadow.toLowerCase()).toMatch(/16,?\s*185,?\s*129|rgb\(16/);
  });

  test('sheet header polish — icon 16px + button centered', async ({ page }) => {
    await page.goto('/');
    await page.locator('#sheet').scrollIntoViewIfNeeded();
    await page.locator('#sheet button:has-text("Open sheet")').click();
    await page.waitForTimeout(400);

    const sheetIcon = page.locator('#sht-1 .label .material-symbols-outlined').first();
    const iconSize = await sheetIcon.evaluate((el) => getComputedStyle(el).fontSize);
    expect(iconSize).toBe('16px');

    const sheet = page.locator('#sht-1');
    const saveBtn = page.locator('#sht-1 .sheet-actions .btn-primary');
    const sBox = await sheet.boundingBox();
    const bBox = await saveBtn.boundingBox();
    if (!sBox || !bBox) throw new Error('sheet or button not measurable');

    const sheetCenter = sBox.x + sBox.width / 2;
    const btnCenter = bBox.x + bBox.width / 2;
    expect(Math.abs(sheetCenter - btnCenter)).toBeLessThan(3);
  });
});
