/**
 * Motion-cascade assertions. Pure set logic, no Playwright dependency, so it
 * can be unit-reasoned about (and reused by later steps) independent of how
 * a state's `transitionProperty` was actually read.
 *
 * The core defect this catches: a state rule (`:hover`, `[data-editing]`, ...)
 * redeclares the `transition` shorthand and, in doing so, silently narrows
 * the set of properties that transition — legs present at rest disappear
 * the instant the state fires. Comparing the property lists as strings is
 * wrong because declaration order varies; comparing as sets is wrong too
 * unless shorthand coverage is expanded first, or a state that legitimately
 * writes `background` (which covers `background-color`) reads as a false
 * positive.
 */

/**
 * Each key covers itself plus every longhand/related property listed.
 * `all` covers everything, represented with the sentinel `'*'`.
 */
export const SHORTHAND_COVERAGE = {
  background: ['background-color'],
  outline: ['outline-color', 'outline-offset'],
  all: '*',
}

/** @param {string} value raw `transitionProperty` computed-style string
 *  @returns {string[]} trimmed property names, `[]` for an empty/unset value */
export function parseTransitionProperty(value) {
  if (!value) return []
  return value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
}

/** @param {string[]} stateProps @returns {boolean} true when the state's
 *  transition list is exactly `none` — deliberately-suppressed transitions,
 *  exempt from the superset check entirely. */
export function isNoneExempt(stateProps) {
  return stateProps.length === 1 && stateProps[0] === 'none'
}

/**
 * @param {string[]} restProps @returns {boolean} true when the REST read is
 *  exactly `all` — the initial/spec-default value `getComputedStyle` reports
 *  for `transition-property` on an element that declares no `transition` at
 *  rest at all, not an authored union. `all` and `none` are the only two
 *  keyword values `transition-property` can take standing alone, so a
 *  single-item `["all"]` list is unambiguous: an author who genuinely wants
 *  "transition everything" writes `transition: all <duration> ...`, which
 *  computes to the identical string, but only a state selector exists then
 *  to retime a *narrower* interaction list -- there is no such state rule in
 *  the site this exemption was written for (`Calendar.css:113-116`,
 *  `.cal-cell`), which declares
 *  `transition` only on its `[data-anim="true"]`/`[data-proximity]`
 *  variants, never at rest. Superset-flagging a spec default has no possible
 *  CSS fix -- there is no base list to restate -- so it would fail forever
 *  rather than catching a real clobber. (plan: transition-clobber-fix, Step 8)
 */
export function isSpecDefaultRest(restProps) {
  return restProps.length === 1 && restProps[0] === 'all'
}

/**
 * Expands a state's declared property list into everything it covers: each
 * property covers itself, plus whatever `SHORTHAND_COVERAGE` says it covers.
 * @param {string[]} stateProps
 * @returns {{ all: boolean, covered: Set<string> }}
 */
function expandCoverage(stateProps) {
  const covered = new Set()
  let all = false
  for (const prop of stateProps) {
    covered.add(prop)
    const coverage = SHORTHAND_COVERAGE[prop]
    if (coverage === '*') all = true
    else if (Array.isArray(coverage)) for (const c of coverage) covered.add(c)
  }
  return { all, covered }
}

/**
 * Compares a target's rest-state and forced-state transition-property lists
 * as sets (via shorthand coverage), never as strings.
 * @param {string[]} restProps
 * @param {string[]} stateProps
 * @returns {string[]} rest legs the state drops, `[]` when the state is a
 *  true superset of rest (or exempt via `transition-property: none`)
 */
export function computeDroppedLegs(restProps, stateProps) {
  if (isNoneExempt(stateProps)) return []
  if (isSpecDefaultRest(restProps)) return []
  const { all, covered } = expandCoverage(stateProps)
  if (all) return []
  return restProps.filter((p) => !covered.has(p))
}

/**
 * Builds a finding object for the report, or `null` when the state is a
 * clean superset of rest.
 * @param {{ route: string, selector: string, state: string, restProps: string[], stateProps: string[] }} args
 */
export function buildSupersetFinding({ route, selector, state, restProps, stateProps }) {
  const dropped = computeDroppedLegs(restProps, stateProps)
  if (dropped.length === 0) return null
  return { kind: 'superset-drop', route, selector, state, restProps, stateProps, dropped }
}

/**
 * The twelve focus-ring subjects sharing the house ring rule in
 * `design-system/preview/_shared-feedback.css` (`plan: focus-ring-tokens`).
 * Fixed list, not probe-derived: a superset check cannot tell "the ring
 * genuinely animates" apart from "a higher-specificity rule elsewhere wins
 * and silently drops the ring legs" — `.btn-yellow`/`.btn-red` are exactly
 * that case (masked by `.btn-page-root .btn-yellow[data-proximity]`'s own
 * transition list, which never mentions `outline-color`/`outline-offset`),
 * and that gap was measured, not guessed. `route` is a registry slug.
 */
export const FOCUS_RING_SUBJECTS = [
  { route: 'buttons', selector: '.btn-green', state: 'focus-visible' },
  { route: 'buttons', selector: '.btn-yellow', state: 'focus-visible' },
  { route: 'buttons', selector: '.btn-red', state: 'focus-visible' },
  { route: 'buttons', selector: '.btn-primary', state: 'focus-visible' },
  { route: 'buttons', selector: '.btn-inverse', state: 'focus-visible' },
  { route: 'buttons', selector: '.btn-glass', state: 'focus-visible' },
  { route: 'buttons', selector: '.btn-text', state: 'focus-visible' },
  { route: 'avatar-picker', selector: '.ap-edge-btn', state: 'focus-visible' },
  { route: 'avatar-picker', selector: '.ap-thumb', state: 'focus-visible' },
  { route: 'avatar-picker', selector: '.ap-submit', state: 'focus-visible' },
  { route: 'inline-edit', selector: '.ie-act', state: 'focus-visible' },
  { route: 'inline-edit', selector: '.ie-field', state: 'focus-within' },
]

/**
 * Ring-presence: outright membership, not shorthand-covered superset. The
 * live `transitionProperty` read under the forced state must literally
 * carry `outline-color` and `outline-offset` — a state that is a "superset"
 * by covering unrelated legs (or drops these two while adding others) still
 * fails, which a Step 2-style superset check would miss.
 * @param {{ route: string, selector: string, state: string, stateProps: string[] }} args
 */
export function buildRingPresenceFinding({ route, selector, state, stateProps }) {
  const hasBoth = stateProps.includes('outline-color') && stateProps.includes('outline-offset')
  if (hasBoth) return null
  return { kind: 'ring-absent', route, selector, state, stateProps }
}

/**
 * Press-delta: an element carrying an `:active` transform rule must render
 * a genuinely different `transform` under hover+active than under hover
 * alone, or the press animation never plays. `disabled` is its own finding
 * kind, never folded into a clean result and never silently skipped — a
 * disabled read and a clean read must stay distinguishable, or the
 * `.ap-submit` first-paint mask (AvatarPicker.css:620) reproduces itself
 * inside the harness that is supposed to catch it.
 * @param {{ route: string, selector: string, disabled: boolean, hoverTransform?: string, hoverActiveTransform?: string }} args
 */
export function buildPressDeltaFinding({ route, selector, disabled, hoverTransform, hoverActiveTransform }) {
  if (disabled) return { kind: 'press-disabled', route, selector }
  if (hoverTransform === hoverActiveTransform) {
    return { kind: 'press-dead', route, selector, hoverTransform, hoverActiveTransform }
  }
  return null
}
