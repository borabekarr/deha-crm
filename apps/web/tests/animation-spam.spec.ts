/**
 * Spam-proof animation suite: rapid clicks + mid-flight reversal against
 * useAutoHeight-driven expand/collapse targets. No screenshots — proves
 * interruption survives, the opposite of the visual suite's settle-and-freeze.
 * KEEP IN SYNC with animation-spam-manifest.ts and component-registry.ts.
 */
import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'
import { SPAM_TARGETS, EXPANDABLE_FINISHED_SLUGS, type SpamTarget } from './animation-spam-manifest'

const REGISTRY_PATH = path.resolve(new URL('.', import.meta.url).pathname, '../src/lib/component-registry.ts')

// fs+regex only — importing component-registry.ts pulls in every
// React.lazy() module and crashes under plain Node/ts-node.
function readRegistryFinishedSlugs(): string[] {
  const src = fs.readFileSync(REGISTRY_PATH, 'utf8')
  const slugs = [...src.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1])
  const statuses = [...src.matchAll(/status:\s*'([^']+)'/g)].map((m) => m[1])
  return slugs.filter((_, i) => statuses[i] === 'Finished')
}

async function trackErrors(page: Page): Promise<{ consoleErrors: string[]; pageErrors: string[] }> {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(e.message))
  return { consoleErrors, pageErrors }
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(300)
}

async function measure(page: Page, selector: string): Promise<number> {
  const box = await page.locator(selector).first().boundingBox()
  return box ? box.height : NaN
}

// Some slugs (status-card, ai-memory-card) showcase multiple example rows
// sharing the same class — pin to the first instance throughout.
async function click(page: Page, selector: string) {
  await page.locator(selector).first().click({ force: true })
}

// Alternates trigger/closeTrigger by tracked open state; symmetric targets
// (no closeTrigger) always click `trigger`, which itself flips state.
function selectorFor(target: SpamTarget, isOpen: boolean): string {
  return isOpen ? (target.closeTrigger ?? target.trigger) : target.trigger
}

async function runTarget(page: Page, target: SpamTarget) {
  const { consoleErrors, pageErrors } = await trackErrors(page)
  await page.goto(`/components/${target.slug}`)
  await settle(page)
  if (target.primerSelector) {
    await click(page, target.primerSelector)
    await page.waitForTimeout(target.durationMs + 300)
  }

  const closedRef = await measure(page, target.expandable)
  await click(page, target.trigger)
  await page.waitForTimeout(target.durationMs + 300)
  const openRef = await measure(page, target.expandable)
  await click(page, target.closeTrigger ?? target.trigger)
  await page.waitForTimeout(target.durationMs + 300)
  await page.reload()
  await settle(page)
  if (target.primerSelector) {
    await click(page, target.primerSelector)
    await page.waitForTimeout(target.durationMs + 300)
  }

  const rapidClicks = target.toggles ?? 8
  let isOpen = false
  for (let i = 0; i < rapidClicks; i++) {
    await click(page, selectorFor(target, isOpen))
    isOpen = !isOpen
    await page.waitForTimeout(40 + Math.random() * 20)
  }
  // Mid-flight reversal: click, wait half the transition, click again.
  await click(page, selectorFor(target, isOpen))
  isOpen = !isOpen
  await page.waitForTimeout(target.durationMs * 0.5)
  await click(page, selectorFor(target, isOpen))
  await page.waitForTimeout(target.durationMs + 400)

  const totalClicks = rapidClicks + 2
  const expectOpen = totalClicks % 2 === 1
  const finalHeight = await measure(page, target.expandable)
  const expectedRef = expectOpen ? openRef : closedRef

  expect(Number.isFinite(finalHeight)).toBe(true)
  expect(finalHeight).toBeGreaterThanOrEqual(0)
  expect(Math.abs(finalHeight - expectedRef)).toBeLessThanOrEqual(1)
  expect(consoleErrors, `console errors on ${target.slug}: ${consoleErrors.join('; ')}`).toEqual([])
  expect(pageErrors, `page errors on ${target.slug}: ${pageErrors.join('; ')}`).toEqual([])
}

test.describe('animation spam', () => {
  // Playwright requires an object destructuring pattern as the first (fixtures)
  // argument even when unused.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name === 'reduced-motion', 'animations suppressed under reduced motion')
  })

  for (const target of SPAM_TARGETS) {
    test(`spam / ${target.slug}`, async ({ page }) => {
      await runTarget(page, target)
    })
  }

  // task-board's SyncFeed drives a multi-phase async timeline (idle ->
  // connecting -> ... -> done) with a trigger disabled mid-cycle, not a
  // two-state toggle — covered separately instead of the generic loop above.
  test('spam / task-board (async sync cycle)', async ({ page }) => {
    const { consoleErrors, pageErrors } = await trackErrors(page)
    await page.goto('/components/task-board')
    await settle(page)

    await click(page, '.sync-btn')
    await expect(page.getByText(/Synced \d+ task/)).toBeVisible({ timeout: 12000 })
    await page.waitForTimeout(340 + 300)
    const firstOpenHeight = await measure(page, '.tb-sync-feed--visible')
    expect(Number.isFinite(firstOpenHeight)).toBe(true)
    expect(firstOpenHeight).toBeGreaterThanOrEqual(0)
    // Re-trigger while done: restarts the cycle, proving restart safety too.
    await click(page, '.sync-btn')
    await expect(page.getByText(/Synced \d+ task/)).toBeVisible({ timeout: 12000 })
    await page.waitForTimeout(340 + 300)
    const secondOpenHeight = await measure(page, '.tb-sync-feed--visible')
    expect(Math.abs(secondOpenHeight - firstOpenHeight)).toBeLessThanOrEqual(1)
    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
  })

  // Gate: every Finished expandable slug must carry a spam-manifest entry.
  test('spam / registry gate — Finished expandables are covered', () => {
    const finished = readRegistryFinishedSlugs()
    const covered = new Set(SPAM_TARGETS.map((t) => t.slug))
    for (const slug of EXPANDABLE_FINISHED_SLUGS) {
      expect(finished, `${slug} listed as Finished-expandable but missing from Finished registry`).toContain(slug)
      expect(covered, `${slug} is a Finished expandable with no SPAM_TARGETS entry`).toContain(slug)
    }
  })
})
