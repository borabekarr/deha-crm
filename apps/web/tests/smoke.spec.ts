import { test, expect } from '@playwright/test'

test('home renders the Deha CRM heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Deha CRM' })).toBeVisible()
})
