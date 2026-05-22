import { test, expect } from '@playwright/test';

test.describe('gallery smoke', () => {
  test('loads with 200 + correct title', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Deha CRM/);
  });

  test('renders all 42 numbered sections', async ({ page }) => {
    await page.goto('/');
    const sections = page.locator('section.section');
    await expect(sections).toHaveCount(42);
  });

  test('left rail anchors resolve to existing sections', async ({ page }) => {
    await page.goto('/');
    const anchors = await page.locator('aside.nav-rail a[href^="#"]').evaluateAll(
      (els) => els.map((el) => (el as HTMLAnchorElement).getAttribute('href')),
    );
    await Promise.all(
      anchors
        .filter((href): href is string => Boolean(href))
        .map((href) => expect(page.locator(`#${href.slice(1)}`)).toHaveCount(1)),
    );
  });

  test('agentation comment exists (React-only, not rendered in prototype)', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).toContain('Agentation: React-only');
  });
});
