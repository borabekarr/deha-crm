/**
 * Spam-proof animation suite: rapid clicks + mid-flight reversal against
 * useAutoHeight-driven expand/collapse targets. No screenshots — proves
 * interruption survives, the opposite of the visual suite's settle-and-freeze.
 * KEEP IN SYNC with animation-spam-manifest.ts and component-registry.ts.
 */
import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'
import {
  SPAM_TARGETS,
  WAIVED,
  STATIC,
  type SpamTarget,
  type AutoHeightSpamTarget,
  type ToggleSpamTarget,
} from './animation-spam-manifest'

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
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const text = m.text()
    // Vite's dev-only HMR client fails to reach the port-less wss://localhost
    // dial in this environment; it's dev-server infra noise, not an app error.
    // See debt/animation-spam-suite-preexisting-failures.md (item 1).
    if (/wss:\/\/localhost.*(failed|ERR_CONNECTION_REFUSED)/.test(text)) return
    if (text.includes('[vite] failed to connect to websocket')) return
    consoleErrors.push(text)
  })
  page.on('pageerror', (e) => {
    // Same Vite HMR-client infra noise as the console filter above, surfacing
    // as a pageerror instead: See debt/animation-spam-suite-preexisting-failures.md
    // (item 1); mirrors the proven pattern at proximity.spec.ts:207-212.
    if (e.message.includes('WebSocket closed without opened')) return
    pageErrors.push(e.message)
  })
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

// Some slugs (status-card) showcase multiple example rows sharing the same
// class — pin to the first instance throughout.
async function click(page: Page, selector: string) {
  await page.locator(selector).first().click({ force: true })
}

// Alternates trigger/closeTrigger by tracked open state; symmetric targets
// (no closeTrigger) always click `trigger`, which itself flips state.
// `isOpen` is a click-pattern alternator ONLY — never an assertion source.
// Correctness comes from the observed-state assertions after the settle:
// coalesced clicks can legitimately drop a toggle, so parity is not a
// prediction the runner is allowed to make.
function selectorFor(target: SpamTarget, isOpen: boolean): string {
  return isOpen ? (target.closeTrigger ?? target.trigger) : target.trigger
}

// The isOpen alternator is an optimistic predictor, not an assertion source
// (see the comment above selectorFor): a click can be legitimately swallowed
// mid-spam, e.g. expandable-screen's full-screen FLIP surface temporarily
// sits on top of its own trigger (pointer-events: none while active), so a
// force-click at the trigger's coordinates lands on the overlay instead and
// never fires onExpand. When that happens the tracked isOpen drifts from the
// real DOM: the *next* alternator click targets a control that has since
// gone display:none (zero box), which `.click({ force: true })` cannot
// resolve to a screen point ("Element is not visible") even though force
// bypasses the ordinary visibility/actionability checks. Rather than crash
// on that legitimate drift, resync to the control that's actually present
// before clicking, and report back the real resulting isOpen so the caller's
// alternation stays correct going forward.
async function clickToggleAlternator(page: Page, target: ToggleSpamTarget, isOpen: boolean): Promise<boolean> {
  // The box check and the click itself are two separate round-trips, so the
  // real DOM state can drift again in the gap between them (same swallowed-
  // click race the resync above targets). Retry the resync on that race
  // rather than crashing: this is not a blanket timeout/assertion weakening,
  // it re-derives which control is actually live before every attempt.
  const maxAttempts = 5
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let assumedOpen = isOpen
    let selector = selectorFor(target, assumedOpen)
    let box = await page.locator(selector).first().boundingBox()
    if (!box) {
      // The assumed-open control has no box: state actually drifted to the
      // opposite of what the tracker predicted. Target the real one.
      assumedOpen = !assumedOpen
      selector = selectorFor(target, assumedOpen)
      box = await page.locator(selector).first().boundingBox()
    }
    if (!box) continue // both controls momentarily boxless mid-transition; retry
    try {
      await page.locator(selector).first().click({ force: true, timeout: 2000 })
      return !assumedOpen
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

// Settle state for a toggle target: the computed value of one CSS property,
// or the ABSENT sentinel when the (possibly portal-mounted) surface is not in
// the DOM at all — absence is itself a valid, assertable settled state.
const ABSENT = '__absent__'

// Compares settle-property reads either exactly (default) or, when the
// target declares `settleTolerance`, by the numeric distance between the
// first numeric token in each value — see settleTolerance's doc comment in
// animation-spam-manifest.ts for why continuous-geometry-derived reads (e.g.
// scroll-offset-driven transforms) need this instead of exact string match.
function settleValuesMatch(target: ToggleSpamTarget, a: string, b: string): boolean {
  if (a === b) return true
  if (!target.settleTolerance) return false
  const na = Number(a.match(/-?\d+(\.\d+)?/)?.[0])
  const nb = Number(b.match(/-?\d+(\.\d+)?/)?.[0])
  if (Number.isNaN(na) || Number.isNaN(nb)) return false
  return Math.abs(na - nb) <= target.settleTolerance
}

async function readSettleValue(page: Page, target: ToggleSpamTarget): Promise<string> {
  const el = page.locator(target.settleSelector).first()
  if ((await el.count()) === 0) return ABSENT
  return el.evaluate(
    (node, prop) => getComputedStyle(node as Element).getPropertyValue(prop).trim(),
    target.settleProperty,
  )
}

async function runAutoHeightTarget(page: Page, target: AutoHeightSpamTarget) {
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
  // Two references within the 1px tolerance can't be told apart.
  expect(
    Math.abs(openRef - closedRef),
    `${target.slug}: open (${openRef}) and closed (${closedRef}) heights are indistinguishable`,
  ).toBeGreaterThan(1)
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

  const finalHeight = await measure(page, target.expandable)
  expect(Number.isFinite(finalHeight)).toBe(true)
  expect(finalHeight).toBeGreaterThanOrEqual(0)

  // Clean settle: whichever state it landed in, it must be exactly one of the
  // two references — anything between them is mid-flight residue.
  const near = (a: number, b: number) => Math.abs(a - b) <= 1
  expect(
    near(finalHeight, openRef) || near(finalHeight, closedRef),
    `${target.slug} settled to ${finalHeight} after spam; expected open (${openRef}) or closed (${closedRef})`,
  ).toBe(true)

  // No primer replay here: auto-height primers (pinned-list's unpin) are one-shot
  // page setup, not idempotent — replaying re-pins and shifts both references.
  const observedOpen = near(finalHeight, openRef)

  // Responsiveness: one deterministic toggle out of the observed state.
  await click(page, observedOpen ? (target.closeTrigger ?? target.trigger) : target.trigger)
  await page.waitForTimeout(target.durationMs + 400)
  const toggledHeight = await measure(page, target.expandable)
  expect(
    Math.abs(toggledHeight - (observedOpen ? closedRef : openRef)),
    `${target.slug} did not respond to a post-spam toggle`,
  ).toBeLessThanOrEqual(1)

  expect(consoleErrors, `console errors on ${target.slug}: ${consoleErrors.join('; ')}`).toEqual([])
  expect(pageErrors, `page errors on ${target.slug}: ${pageErrors.join('; ')}`).toEqual([])
}

// Same abuse sequence as the height runner (rapid re-trigger, then a
// mid-animation reversal), but the assertion is the settled computed value of
// one CSS property rather than a measured height — for morphs driven by CSS
// transitions on width / flex-basis / opacity / max-height, or by a
// hardcoded open size, where there is no measured content height to compare.
// Settle wait for a toggle target: polls `awaitAttribute` to its target value
// when present (for targets with no fixed CSS transition duration, e.g.
// native smooth-scroll), otherwise falls back to the plain timeout.
async function settleWait(page: Page, target: ToggleSpamTarget, timeoutMs: number) {
  if (!target.awaitAttribute) return page.waitForTimeout(timeoutMs)
  const { selector, attribute, value } = target.awaitAttribute
  const loc = page.locator(selector).first()
  // A click's scroll may not have started yet — the attribute can still read
  // as the rest value from the PREVIOUS settle. A fixed pre-poll delay here
  // is a race, not a guarantee: under load the browser can take longer than
  // any fixed guess to dispatch the first 'scroll' event for the new click,
  // so polling for `value` immediately after the delay can observe the
  // stale prior-settle read and return before the new scroll has even
  // started — the caller then samples the settle property mid-flight one
  // tick later. Explicitly wait for the attribute to flip away from `value`
  // first (proving the new scroll actually started) before polling for it
  // to return; only fall back to a flat delay if it never flips away at all
  // (legitimate: e.g. a boundary click whose trigger is disabled and
  // produces no scroll to await).
  try {
    await expect(loc).not.toHaveAttribute(attribute, value, { timeout: 400 })
  } catch {
    // No scroll started within 400ms — likely a no-op click (disabled
    // trigger at a boundary). Nothing to await; fall through to the
    // unconditional settle-value poll below, which is a no-op if the
    // attribute never changes.
  }
  await expect(loc).toHaveAttribute(attribute, value, { timeout: timeoutMs + 2000 })
  // The attribute reaching `value` proves the app's own completion signal
  // fired, but that signal (native 'scrollend' / an idle-debounce timer) is
  // not the thing under test — `target.settleProperty` is. Trusting the
  // attribute alone still leaves a gap: a legitimate trailing scroll frame
  // (compositor lag past 'scrollend', or a fresh click racing the idle
  // debounce) can land after the attribute flips but before this function
  // returns, so the caller's next read of settleProperty can still catch a
  // value the geometry hasn't fully caught up to yet — this was observed
  // directly (matrix(0.9773,...) instead of matrix(1,...), a partial-step
  // read, not sub-pixel noise). Poll settleProperty itself until two
  // consecutive reads, 60ms apart, agree — the actual value under test is
  // the only oracle that can prove it has genuinely stopped changing.
  // Bounded iteration count, not a blanket timeout increase.
  let previous: string | null = null
  for (let i = 0; i < 10; i++) {
    const current = await readSettleValue(page, target)
    if (current === previous) return
    previous = current
    await page.waitForTimeout(60)
  }
}

async function runToggleTarget(page: Page, target: ToggleSpamTarget) {
  const { consoleErrors, pageErrors } = await trackErrors(page)
  const settleMs = target.transitionMs + 300
  await page.goto(`/components/${target.slug}`)
  await settle(page)
  if (target.primerSelector) {
    await click(page, target.primerSelector)
    await settleWait(page, target, settleMs)
  }

  const closedRef = await readSettleValue(page, target)
  await click(page, target.trigger)
  await settleWait(page, target, settleMs)
  const openRef = await readSettleValue(page, target)
  // A target whose two states read identically can't prove anything.
  expect(openRef, `${target.slug}: ${target.settleProperty} does not change on open`).not.toBe(closedRef)
  await click(page, target.closeTrigger ?? target.trigger)
  await settleWait(page, target, settleMs)
  await page.reload()
  await settle(page)
  if (target.primerSelector) {
    await click(page, target.primerSelector)
    await settleWait(page, target, settleMs)
  }

  const rapidClicks = target.toggles ?? 8
  let isOpen = false
  for (let i = 0; i < rapidClicks; i++) {
    isOpen = await clickToggleAlternator(page, target, isOpen)
    await page.waitForTimeout(40 + Math.random() * 20)
  }
  // Mid-flight reversal: click, wait half the transition, click again.
  isOpen = await clickToggleAlternator(page, target, isOpen)
  await page.waitForTimeout(target.transitionMs * 0.5)
  await clickToggleAlternator(page, target, isOpen)
  await settleWait(page, target, target.transitionMs + 400)

  // Clean settle: exactly one of the two references (ABSENT sentinel included).
  const finalValue = await readSettleValue(page, target)
  expect(
    settleValuesMatch(target, finalValue, openRef) || settleValuesMatch(target, finalValue, closedRef),
    `${target.slug} settled to ${finalValue} after spam; expected open (${openRef}) or closed (${closedRef})`,
  ).toBe(true)

  let observedOpen = settleValuesMatch(target, finalValue, openRef)
  if (target.primerSelector) {
    await click(page, target.primerSelector)
    await settleWait(page, target, settleMs)
    observedOpen = settleValuesMatch(target, await readSettleValue(page, target), openRef)
  }

  // Responsiveness: one deterministic toggle out of the observed state.
  // Most targets jump straight to the opposite reference on a single click.
  // A stepper (e.g. blur-carousel's next/prev, postSpamSteps > 1) only
  // advances one position per click, so a lone click is not guaranteed to
  // reach the boundary reference from wherever the spam sequence left it —
  // repeat, re-clicking the same trigger each time, until the reference is
  // reached or the step budget is exhausted. Each click is a genuine,
  // separately-verifiable interaction; this proves responsiveness without
  // assuming single-click reversibility that only holds for true 2-state
  // toggles.
  const postSpamTrigger = observedOpen ? (target.closeTrigger ?? target.trigger) : target.trigger
  const postSpamTarget = observedOpen ? closedRef : openRef
  let postSpamValue = ''
  for (let i = 0; i < (target.postSpamSteps ?? 1); i++) {
    await click(page, postSpamTrigger)
    await settleWait(page, target, target.transitionMs + 400)
    postSpamValue = await readSettleValue(page, target)
    if (settleValuesMatch(target, postSpamValue, postSpamTarget)) break
  }
  expect(
    settleValuesMatch(target, postSpamValue, postSpamTarget),
    `${target.slug} did not respond to a post-spam toggle: got ${postSpamValue}, expected ${postSpamTarget}`,
  ).toBe(true)

  expect(consoleErrors, `console errors on ${target.slug}: ${consoleErrors.join('; ')}`).toEqual([])
  expect(pageErrors, `page errors on ${target.slug}: ${pageErrors.join('; ')}`).toEqual([])
}

async function runTarget(page: Page, target: SpamTarget) {
  if (target.kind === 'auto-height') return runAutoHeightTarget(page, target)
  return runToggleTarget(page, target)
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
    // Guard against the stale "Synced N task" text from the FIRST cycle still
    // being visible in the instant after the click (phase flips off 'done' on
    // a next-tick timer, not synchronously) — wait for it to clear first.
    await expect(page.getByText(/Synced \d+ task/)).toBeHidden({ timeout: 5000 })
    await expect(page.getByText(/Synced \d+ task/)).toBeVisible({ timeout: 12000 })
    await page.waitForTimeout(340 + 300)
    const secondOpenHeight = await measure(page, '.tb-sync-feed--visible')
    expect(Math.abs(secondOpenHeight - firstOpenHeight)).toBeLessThanOrEqual(1)
    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
  })

  // Gate: the population is DERIVED from component-registry.ts, not from a
  // hand-maintained list, so enrollment cannot stay opt-in. Every Finished
  // slug must be claimed by exactly one of SPAM_TARGETS / WAIVED / STATIC;
  // an unclassified one fails here the moment its status flips to Finished.
  test('spam / registry gate — every Finished slug is classified', () => {
    const finished = readRegistryFinishedSlugs()
    expect(finished.length, 'registry read returned no Finished slugs — regex drifted').toBeGreaterThan(0)

    const enrolled = new Set(SPAM_TARGETS.map((t) => t.slug))
    const waived = new Set(WAIVED.map((w) => w.slug))
    const staticSlugs = new Set(STATIC)

    const unclassified = finished.filter((s) => !enrolled.has(s) && !waived.has(s) && !staticSlugs.has(s))
    expect(
      unclassified,
      `Finished with no classification — add to SPAM_TARGETS, WAIVED, or STATIC in animation-spam-manifest.ts: ${unclassified.join(', ')}`,
    ).toEqual([])

    // Exactly one list, never two — an enrolled slug must not also carry a
    // waiver, and nothing animated may be parked in STATIC as well.
    const doubleClaimed = finished.filter(
      (s) => [enrolled.has(s), waived.has(s), staticSlugs.has(s)].filter(Boolean).length > 1,
    )
    expect(doubleClaimed, `claimed by more than one classification list: ${doubleClaimed.join(', ')}`).toEqual([])

    // A waiver is a decision, not a placeholder: real reason, ISO date.
    for (const w of WAIVED) {
      expect(w.reason.length, `WAIVED entry ${w.slug} needs a substantive reason`).toBeGreaterThan(20)
      expect(w.date, `WAIVED entry ${w.slug} needs an ISO date`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
