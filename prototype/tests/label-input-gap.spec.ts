import { test, expect } from '@playwright/test';

test.describe('label-input gap and border rules', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('gap between first label bottom and sibling input top is <= 12px', async ({ page }) => {
    const gap = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('.label, label'));
      const inputs = Array.from(document.querySelectorAll('.input, input[type="text"], input[type="email"], input:not([type="checkbox"]):not([type="radio"]):not([type="range"])'));

      for (const label of labels) {
        for (const input of inputs) {
          const labelRect = label.getBoundingClientRect();
          const inputRect = input.getBoundingClientRect();
          // Input must be below the label and horizontally close
          if (
            inputRect.top >= labelRect.bottom &&
            Math.abs(inputRect.left - labelRect.left) < 200
          ) {
            return inputRect.top - labelRect.bottom;
          }
        }
      }
      return null;
    });

    expect(gap).not.toBeNull();
    expect(gap!).toBeLessThanOrEqual(12);
  });

  test('textarea computed border-top-width is 1px', async ({ page }) => {
    const textarea = page.locator('.textarea').first();
    await expect(textarea).toBeVisible();

    const borderWidth = await textarea.evaluate((el) =>
      getComputedStyle(el).borderTopWidth,
    );
    expect(borderWidth).toBe('1px');
  });

  test('.input border-top-width is 1px (not 2px)', async ({ page }) => {
    const input = page.locator('.input').first();
    await expect(input).toBeVisible();

    const borderWidth = await input.evaluate((el) =>
      getComputedStyle(el).borderTopWidth,
    );
    expect(borderWidth).toBe('1px');
  });
});
