import { test, expect } from '@playwright/test';

const REQUIRED_SECTIONS = ['task-card', 'metric-card', 'leaderboard', 'chart'] as const;

test.describe('bible section presence', () => {
  test('all four bible sections exist and are visible', async ({ page }) => {
    await page.goto('/');

    for (const id of REQUIRED_SECTIONS) {
      const section = page.locator(`section#${id}`);
      await expect(section).toHaveCount(1, { message: `section#${id} must exist in DOM` });
      expect(await section.isVisible(), `section#${id} must be visible`).toBe(true);
    }
  });
});
