import { test, expect } from '@playwright/test';

test('scroll-area content overflows container', async ({ page }) => {
  await page.goto('/');

  const scrollArea = page.locator('.scroll-area').first();
  await expect(scrollArea).toBeVisible();

  const overflows = await scrollArea.evaluate((el) => el.scrollHeight > el.clientHeight);
  expect(overflows).toBe(true);
});
