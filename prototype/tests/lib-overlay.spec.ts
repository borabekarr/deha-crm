import { test, expect } from '@playwright/test';

const FIXTURE = '/tests/fixtures/overlay-fixture.html';

test.describe('lib/overlay', () => {
  test('data-opens click adds [open] attribute on target', async ({ page }) => {
    await page.goto(FIXTURE);
    await expect(page.locator('#dlg')).toBeHidden();
    await page.click('#opener');
    await expect(page.locator('#dlg')).toBeVisible();
    await expect(page.locator('#dlg[open]')).toHaveCount(1);
  });

  test('Esc closes the open overlay', async ({ page }) => {
    await page.goto(FIXTURE);
    await page.click('#opener');
    await expect(page.locator('#dlg[open]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('#dlg[open]')).toHaveCount(0);
  });

  test('focus trap cycles forward and backward through focusables', async ({ page }) => {
    await page.goto(FIXTURE);
    await page.click('#opener');
    // First focusable should be auto-focused.
    await expect(page.locator('#a')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#b')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#c')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#close')).toBeFocused();
    // Wrap forward.
    await page.keyboard.press('Tab');
    await expect(page.locator('#a')).toBeFocused();
    // Wrap backward.
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#close')).toBeFocused();
  });

  test('closing restores focus to opener', async ({ page }) => {
    await page.goto(FIXTURE);
    await page.click('#opener');
    await page.keyboard.press('Escape');
    await expect(page.locator('#opener')).toBeFocused();
  });

  test('lockScroll sets body overflow:hidden, unlock restores', async ({ page }) => {
    await page.goto(FIXTURE);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    await page.click('#opener');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});
