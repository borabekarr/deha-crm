/**
 * Motion-hover-overshoot-p2 Step 3 probe. Steps 1-2 aliased 13 legacy
 * over-ceiling curves in motion-tokens.css to var(--ease-toast-pop),
 * var(--ease-spring-pop) or var(--ease-spring-soft). Consumers were never
 * touched, so the only proof is computed style: one live element per token,
 * in light and dark, must report an approved curve whose y-controls are
 * <= 1.32 and numerically match the approved token's own computed value.
 */
import { test, expect, type Page } from '@playwright/test'

type Subject = {
  token: string
  approved: 'spring-soft' | 'spring-pop' | 'toast-pop'
  route: string
  selector: string
  cssProp: string | null // null = animationTimingFunction (single value); else transition property to index
  forceClasses?: { target: string; classes: string[] }
  clickFirst?: string // selector to click before waiting for `selector` (opens a detail view)
}

const SUBJECTS: Subject[] = [
  { token: 'spring-strong', approved: 'toast-pop', route: '/components/file-folder', selector: '.folder', cssProp: 'transform' },
  { token: 'spring', approved: 'toast-pop', route: '/components/file-folder', selector: '.ff-paper', cssProp: 'transform' },
  { token: 'bounce', approved: 'spring-pop', route: '/components/task-board', selector: '.sync-btn', cssProp: null },
  {
    token: 'spring-tight',
    approved: 'spring-soft',
    route: '/components/task-card',
    selector: '.tp-w',
    cssProp: 'transform',
    clickFirst: '.task',
  },
  {
    token: 'spring-medium',
    approved: 'spring-pop',
    route: '/components/pipeline-card',
    selector: '.pc-check',
    cssProp: 'transform',
    forceClasses: { target: '.pc-apply', classes: ['is-done'] },
  },
  { token: 'spring-open', approved: 'spring-soft', route: '/components/message-dropdown', selector: '.md-panel-bg', cssProp: 'width' },
  { token: 'card-pop', approved: 'spring-soft', route: '/components/stacked-list', selector: '.sl-bar-icon', cssProp: 'transform' },
  { token: 'avatar-swap', approved: 'spring-soft', route: '/components/avatar-picker', selector: '.ap-big-art', cssProp: null },
  { token: 'spring-snap-soft', approved: 'spring-pop', route: '/components/motion-tabs', selector: '.mt-iconbox', cssProp: 'transform' },
  { token: 'check-pop', approved: 'spring-pop', route: '/components/morph-surface-feedback', selector: '.ms2-check', cssProp: 'transform' },
  {
    token: 'todo-badge-pop',
    approved: 'spring-pop',
    route: '/components/todo-list',
    selector: '.t-badge',
    cssProp: null,
    forceClasses: { target: '.t-badge', classes: ['pop'] },
  },
  { token: 'dc-cell-pop', approved: 'spring-soft', route: '/components/dynamic-calendar', selector: '.dc-cell', cssProp: null },
  {
    token: 'dc-spring',
    approved: 'spring-pop',
    route: '/components/dynamic-calendar',
    selector: '.dc-island',
    cssProp: 'width',
    forceClasses: { target: '.dc-island', classes: ['preview'] },
  },
]

// Splits a CSS value list on top-level commas only (cubic-bezier(...) args
// contain commas that must not split the outer list).
function splitTop(str: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of str) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

function parseBezier(value: string): [number, number, number, number] | null {
  const m = value.match(/cubic-bezier\(([^)]+)\)/)
  if (!m) return null
  const nums = m[1].split(',').map((n) => parseFloat(n.trim()))
  if (nums.length !== 4 || nums.some((n) => Number.isNaN(n))) return null
  return nums as [number, number, number, number]
}

async function getTiming(
  page: Page,
  selector: string,
  cssProp: string | null,
  forceClasses?: { target: string; classes: string[] },
): Promise<string | null> {
  return page.evaluate(
    ({ selector, cssProp, forceClasses }) => {
      if (forceClasses) {
        const t = document.querySelector(forceClasses.target)
        if (t) t.classList.add(...forceClasses.classes)
      }
      const el = document.querySelector(selector)
      if (!el) return null
      const cs = getComputedStyle(el)
      function splitTop(str: string): string[] {
        const out: string[] = []
        let depth = 0
        let cur = ''
        for (const ch of str) {
          if (ch === '(') depth++
          if (ch === ')') depth--
          if (ch === ',' && depth === 0) {
            out.push(cur.trim())
            cur = ''
          } else {
            cur += ch
          }
        }
        if (cur.trim()) out.push(cur.trim())
        return out
      }
      if (cssProp === null) return cs.animationTimingFunction
      const props = splitTop(cs.transitionProperty)
      const timings = splitTop(cs.transitionTimingFunction)
      const idx = props.indexOf(cssProp)
      if (idx === -1) return null
      return timings[idx] ?? timings[timings.length - 1] ?? null
    },
    { selector, cssProp, forceClasses },
  )
}

async function getApprovedBezier(page: Page, approved: string): Promise<[number, number, number, number] | null> {
  const raw = await page.evaluate(
    (name) => getComputedStyle(document.documentElement).getPropertyValue(`--ease-${name}`).trim(),
    approved,
  )
  return parseBezier(raw)
}

const numsClose = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.005)

for (const dark of [false, true]) {
  test.describe(`overshoot-p2 probe (${dark ? 'dark' : 'light'})`, () => {
    for (const subject of SUBJECTS) {
      test(`${subject.token} -> ${subject.approved} @ ${subject.route} ${subject.selector}`, async ({ page }) => {
        await page.goto(subject.route)
        if (dark) await page.evaluate(() => document.documentElement.classList.add('dark'))
        if (subject.clickFirst) {
          await page.waitForSelector(subject.clickFirst, { state: 'attached' })
          await page.click(subject.clickFirst)
        }
        await page.waitForSelector(subject.selector, { state: 'attached' })

        const timing = await getTiming(page, subject.selector, subject.cssProp, subject.forceClasses)
        expect(timing, `no computed timing for ${subject.selector} (${subject.cssProp ?? 'animation'})`).toBeTruthy()

        const bezier = parseBezier(timing as string)
        expect(bezier, `could not parse cubic-bezier from "${timing}"`).toBeTruthy()
        const [, y1, , y2] = bezier as [number, number, number, number]
        expect(y1).toBeLessThanOrEqual(1.32)
        expect(y2).toBeLessThanOrEqual(1.32)

        const approvedBezier = await getApprovedBezier(page, subject.approved)
        expect(approvedBezier, `--ease-${subject.approved} did not resolve to a cubic-bezier`).toBeTruthy()
        expect(numsClose(bezier as number[], approvedBezier as number[])).toBe(true)
      })
    }
  })
}
