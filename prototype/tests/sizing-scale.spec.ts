import { test, expect } from '@playwright/test';

test.describe('sizing scale tokens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('.input has computed height of 40px', async ({ page }) => {
    const input = page.locator('.input').first();
    await expect(input).toBeVisible();
    const height = await input.evaluate((el) =>
      getComputedStyle(el).height,
    );
    expect(height).toBe('40px');
  });

  test('.input has computed max-width of 320px', async ({ page }) => {
    const input = page.locator('.input').first();
    await expect(input).toBeVisible();
    const maxWidth = await input.evaluate((el) =>
      getComputedStyle(el).maxWidth,
    );
    expect(maxWidth).toBe('320px');
  });

  test('gap between .label and sibling .input is <= 12px', async ({ page }) => {
    // Find a .label that has a sibling .input (or nearest .input after it)
    const label = page.locator('.label').first();
    await expect(label).toBeVisible();

    // Use the first .input that follows the first .label in the DOM
    const gap = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('.label'));
      const inputs = Array.from(document.querySelectorAll('.input'));

      for (const label of labels) {
        for (const input of inputs) {
          const labelRect = label.getBoundingClientRect();
          const inputRect = input.getBoundingClientRect();
          // Check the input is below the label and horizontally close
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
});
