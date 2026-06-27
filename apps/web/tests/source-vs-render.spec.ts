/**
 * Source-vs-render visual diff harness for wave-3 components.
 *
 * For each slug, captures:
 *   - {slug}-source.png  — the Claude Design HTML prototype
 *   - {slug}-render.png  — the React conversion rendered in the app
 *
 * This is NOT an assertion suite; it is a diff/proof engine.
 * Use toHaveScreenshot only in design-system.spec.ts (baseline suite).
 * Screenshots land in test-results/fidelity/ for manual / CI comparison.
 *
 * HMR noise (wss://localhost, [vite], WebSocket) is filtered from console
 * captures. Real component errors cause the test to fail with the error text.
 */

import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Output directory — created once before any test runs
// ESM-safe: __dirname is not available in ES module scope.
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FIDELITY_DIR = path.resolve(__dirname, '../test-results/fidelity')
mkdirSync(FIDELITY_DIR, { recursive: true })

// ---------------------------------------------------------------------------
// Wave-3 slugs
// ---------------------------------------------------------------------------
const SLUGS = [
  'statistics-graph-card',
  'streak-card',
  'financial-health-card',
] as const

// ---------------------------------------------------------------------------
// HMR noise filter — returns true when a console message is real (not HMR)
// ---------------------------------------------------------------------------
function isRealError(text: string): boolean {
  if (text.includes('wss://localhost')) return false
  if (text.includes('[vite]')) return false
  if (text.includes('WebSocket')) return false
  return true
}

// ---------------------------------------------------------------------------
// Wait helper reused from design-system.spec.ts waitForPreview, plus extra
// settle time for entrance animations.
// ---------------------------------------------------------------------------
async function waitForPreview(page: import('@playwright/test').Page, extraMs = 2000) {
  await page.waitForLoadState('networkidle')
  await page.locator('.overflow-auto').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(200)
  // Extra settle for entrance animations (bounce, fade-in, draw-on, etc.)
  if (extraMs > 0) await page.waitForTimeout(extraMs)
}

// ---------------------------------------------------------------------------
// Per-slug tests
// ---------------------------------------------------------------------------
for (const slug of SLUGS) {
  test(`fidelity / ${slug}`, async ({ page }) => {
    const errors: string[] = []

    // Collect console errors + page errors (both URLs share the same page)
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isRealError(msg.text())) {
        errors.push(`[console.error] ${msg.text()}`)
      }
    })
    page.on('pageerror', (err) => {
      if (isRealError(err.message)) {
        errors.push(`[pageerror] ${err.message}`)
      }
    })

    // ---- SOURCE: Claude Design HTML prototype ----
    await page.goto(`/design-system/preview/components-${slug}.html`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // entrance animations

    await page.screenshot({
      path: path.join(FIDELITY_DIR, `${slug}-source.png`),
      fullPage: true,
    })

    // ---- RENDER: React conversion ----
    await page.goto(`/components/${slug}`)
    await waitForPreview(page, 2000)

    // Prefer the .overflow-auto preview container for comparable framing.
    // Fall back to full-page if the locator is unreliable.
    const previewContainer = page.locator('.overflow-auto').first()
    const containerVisible = await previewContainer.isVisible().catch(() => false)

    if (containerVisible) {
      await previewContainer.screenshot({
        path: path.join(FIDELITY_DIR, `${slug}-render.png`),
      })
    } else {
      await page.screenshot({
        path: path.join(FIDELITY_DIR, `${slug}-render.png`),
        fullPage: true,
      })
    }

    // ---- Error gate ----
    if (errors.length > 0) {
      // Use expect to surface as a Playwright assertion failure with context
      expect(errors, `${slug} logged real (non-HMR) errors:\n${errors.join('\n')}`).toHaveLength(0)
    }
  })
}
