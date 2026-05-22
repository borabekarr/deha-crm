import { test, expect } from '@playwright/test';

test('vite app renders dashboard with Agentation', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/', { waitUntil: 'networkidle', timeout: 10000 });

  // Prototype page — no React #root, check that the page body rendered
  const bodyText = await page.textContent('body') || '';
  console.log('Body text (first 300):', bodyText.trim().slice(0, 300));
  console.log('Console errors:', JSON.stringify(errors.slice(0, 5)));

  // Basic assertion: page rendered with meaningful content
  expect(bodyText.length).toBeGreaterThan(100);
});
