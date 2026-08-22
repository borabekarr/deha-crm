import { test, expect, type Page } from '@playwright/test'

async function assertNoHorizontalOverflow(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(200)

  const result = await page.evaluate(() => {
    const innerWidth = window.innerWidth
    const docOverflow = document.documentElement.scrollWidth <= innerWidth + 1
    const overflowing: string[] = []
    const main = document.querySelector('main')
    if (main) {
      const walk = (node: Element) => {
        if (node.hasAttribute('aria-hidden')) return
        const rect = node.getBoundingClientRect()
        if (rect.right > innerWidth + 1) {
          overflowing.push(node.tagName + (node.className ? '.' + String(node.className).split(' ')[0] : ''))
        }
        for (const child of Array.from(node.children)) walk(child)
      }
      walk(main)
    }
    return { docOverflow, overflowing }
  })

  expect(result.overflowing, `elements overflowing viewport: ${result.overflowing.join(', ')}`).toEqual([])
  expect(result.docOverflow).toBe(true)
}

test.describe('library mobile', () => {
  test('index has no horizontal overflow and sidebar hidden', async ({ page }) => {
    await page.goto('/')
    await assertNoHorizontalOverflow(page)
    await expect(page.locator('aside')).toBeHidden()
  })

  for (const slug of ['buttons', 'motion-tabs', 'workflow-add-elements', 'pipeline-card', 'calendar']) {
    test(`no horizontal overflow: /components/${slug}`, async ({ page }) => {
      await page.goto(`/components/${slug}`)
      await assertNoHorizontalOverflow(page)
    })
  }

  test('bottom sheet navigates', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /browse/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const link = dialog.locator('a[href^="/components/"]').first()
    await link.click()

    await expect(page).toHaveURL(/\/components\//)
    await expect(dialog).toBeHidden()
  })
})
