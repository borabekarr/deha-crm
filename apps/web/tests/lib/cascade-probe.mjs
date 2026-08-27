/**
 * Motion-cascade probe core. Walks document.styleSheets in the live page to
 * find every selector whose declared body is state-driven transition/press
 * motion, then resolves that selector against the live DOM. This is a
 * runtime harness deliberately, not a static CSS scanner: a text scanner
 * cannot see ID selectors, CSS-in-JS, or which of several competing
 * declarations wins, which is what missed #dp-open-btn (DatePicker.css) and
 * .proto-picker-item (picker-css.ts, CSS written in TypeScript).
 *
 * Callable two ways:
 *   - as a library: probeRoute(page, route) from a Playwright spec
 *   - as a standalone CLI: `node cascade-probe.mjs --route <slug> [--json]`
 *
 * Two details below are load-bearing, established by measurement:
 *   - the zero-duration override MUST be injected before any read, or
 *     in-flight transitions produce bogus rows (measured: 74 of them)
 *   - the cursor MUST be parked at (2,2) before every rest-state read, or
 *     ambient hover from wherever the pointer last landed contaminates rest
 */
import { getFinishedSlugs, routePathForSlug } from './cascade-targets.mjs'

// A "state token" is a pseudo-class OR an attribute selector: components in
// this codebase drive their state either way (#dp-open-btn:hover is
// pseudo-driven, .ie-field[data-editing="true"] is attribute-driven), and a
// probe that only recognised pseudo-classes would miss the entire
// attribute-driven family. Longer pseudo-class alternatives are listed first
// so a naive left-to-right alternation doesn't match `:focus` inside
// `:focus-visible` and leave a dangling `-visible`.
const STATE_TOKEN_RE = /:(focus-visible|focus-within|focus|hover|active|disabled)\b(\([^)]*\))?|\[[^\]]+\]/g

const ZERO_DURATION_CSS =
  '* { transition-duration: 0s !important; animation-duration: 0s !important; transition-delay: 0s !important }'

// Extraction runs inside the page. Kept as a single self-contained function
// (no closures over outer scope) so it can be shipped as-is via page.evaluate.
function extractCandidates(stateTokenSource) {
  const STATE_TOKEN_RE = new RegExp(stateTokenSource, 'g')
  const TRANSITION_PROPS = ['transition', 'transition-property', 'transition-duration', 'transition-timing-function']
  const seen = new Set()
  const results = []

  for (const sheet of Array.from(document.styleSheets)) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      continue // cross-origin sheet, unreadable — not a source of app-authored motion
    }
    if (!rules) continue
    walkRules(rules, sheet.href)
  }

  function walkRules(rules, href) {
    for (const rule of Array.from(rules)) {
      // CSSMediaRule / CSSSupportsRule etc. nest further style rules. Guard
      // on .length too: CSSStyleRule also exposes an (always-empty)
      // .cssRules, so a bare truthiness check would recurse into it and
      // skip the instanceof check below on every plain style rule.
      if (rule.cssRules && rule.cssRules.length > 0) {
        walkRules(rule.cssRules, href)
        continue
      }
      if (!(rule instanceof CSSStyleRule)) continue

      const style = rule.style
      const declaresTransition = TRANSITION_PROPS.some((p) => style.getPropertyValue(p))
      const declaresPressTransform = rule.selectorText.includes(':active') && style.getPropertyValue('transform')
      if (!declaresTransition && !declaresPressTransform) continue

      for (const rawSelector of rule.selectorText.split(',')) {
        const selector = rawSelector.trim()
        STATE_TOKEN_RE.lastIndex = 0
        const tokens = [...selector.matchAll(STATE_TOKEN_RE)].map((m) => m[0])
        if (tokens.length === 0) continue // not under a state token — out of scope for this probe

        const state = tokens.join(' ').replace(/[:[\]"]/g, '').trim()
        STATE_TOKEN_RE.lastIndex = 0
        const base = selector.replace(STATE_TOKEN_RE, '').trim().replace(/\s+/g, ' ')
        if (!base) continue

        const key = `${base}::${state}::${href ?? ''}`
        if (seen.has(key)) continue

        let elements
        try {
          elements = document.querySelectorAll(base)
        } catch {
          continue // base selector isn't valid standalone (e.g. a bare pseudo-element chain)
        }
        if (elements.length === 0) continue

        seen.add(key)
        results.push({
          selector: base,
          state,
          stylesheetHref: href ?? null,
          elementCount: elements.length,
          restState: {
            transitionProperty: getComputedStyle(elements[0]).transitionProperty,
          },
        })
      }
    }
  }

  return results
}

/**
 * Probe one route: navigate, freeze motion, park the cursor, then walk
 * stylesheets for state-driven targets and read each one's rest state.
 * @param {import('@playwright/test').Page} page
 * @param {string} route registry slug (not the full path)
 * @param {{ theme?: 'light' | 'dark' }} [opts] theme defaults to 'light';
 *  'dark' toggles `dark` onto documentElement.classList right after
 *  navigation, before motion is frozen — some rules (`html.dark ...`) only
 *  match with it present, so target extraction must run after the toggle.
 * @returns {Promise<Array<object>>}
 */
export async function probeRoute(page, route, opts = {}) {
  const { theme = 'light' } = opts
  await page.goto(routePathForSlug(route))
  await page.waitForLoadState('networkidle')
  await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), theme === 'dark')
  await page.addStyleTag({ content: ZERO_DURATION_CSS })
  await page.mouse.move(2, 2) // park cursor away from any element before the rest-state read

  const targets = await page.evaluate(extractCandidates, STATE_TOKEN_RE.source)
  return targets.map((t) => ({ route, ...t }))
}

/**
 * Probe every route in the registry. Throws if any route yields zero
 * targets — a route that silently probes nothing is the failure mode that
 * made the rejected static scanner useless.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ route: string, targets: Array<object> }[]>}
 */
export async function probeAllRoutes(page) {
  const routes = getFinishedSlugs()
  const results = []
  for (const route of routes) {
    const targets = await probeRoute(page, route)
    results.push({ route, targets })
  }
  return results
}

async function runCli() {
  const args = process.argv.slice(2)
  const routeIdx = args.indexOf('--route')
  const singleRoute = routeIdx !== -1 ? args[routeIdx + 1] : null
  const json = args.includes('--json')

  const { chromium } = await import('@playwright/test')
  const baseURL = process.env.CASCADE_BASE_URL || 'http://localhost:5173'
  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL })

  try {
    const routes = singleRoute ? [singleRoute] : getFinishedSlugs()
    let anyEmpty = false
    const report = []

    for (const route of routes) {
      const targets = await probeRoute(page, route)
      report.push({ route, count: targets.length, targets })
      if (targets.length === 0) {
        anyEmpty = true
        console.error(`probe count 0 for route "${route}"`)
      } else if (!json) {
        console.log(`${route}: ${targets.length} target(s)`)
      }
    }

    if (json) {
      console.log(JSON.stringify(singleRoute ? report[0].targets : report, null, 2))
    }

    if (anyEmpty) {
      console.error('probe count 0: at least one registry route yielded zero targets')
      process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  runCli().catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
}
