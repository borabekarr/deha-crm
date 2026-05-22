import { test, expect } from '@playwright/test';

// Bible's first badge variant: .badge.success has background #10B981
// Computed value browsers return for #10B981 is rgb(16, 185, 129)
const BIBLE_SUCCESS_BG = 'rgb(16, 185, 129)';

test('badge.success background-color matches bible hex #10B981', async ({ page }) => {
  await page.goto('/');

  // Navigate to the badge section
  const badgeSection = page.locator('#badge');
  await expect(badgeSection).toBeVisible();

  // The first .badge.success element inside the badge section
  const successBadge = badgeSection.locator('.badge.success').first();
  await expect(successBadge).toBeVisible();

  const bg = await successBadge.evaluate((el) =>
    window.getComputedStyle(el).backgroundColor
  );

  expect(bg).toBe(BIBLE_SUCCESS_BG);
});

test('badge section contains bible pill classes pill-priority and pill-tab', async ({ page }) => {
  await page.goto('/');

  const badgeSection = page.locator('#badge');

  // Verify pill-priority pills are present (from bible's Priority filter row)
  await expect(badgeSection.locator('.pill-priority').first()).toBeVisible();

  // Verify pill-tab pills are present (from bible's Segmented row)
  await expect(badgeSection.locator('.pill-tab').first()).toBeVisible();

  // Verify active pill-tab is present
  await expect(badgeSection.locator('.pill-tab.active')).toBeVisible();
});

test('badge section contains bible stat badge variants gci, time, tag', async ({ page }) => {
  await page.goto('/');

  const badgeSection = page.locator('#badge');

  await expect(badgeSection.locator('.badge.gci')).toBeVisible();
  await expect(badgeSection.locator('.badge.time')).toBeVisible();
  await expect(badgeSection.locator('.badge.tag').first()).toBeVisible();
});
