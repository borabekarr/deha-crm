/**
 * Pure spring physics math for the Spring Lab preview (Step 4). No React, no
 * DOM — safe to import from a Node test runner or a build-time script.
 *
 * STOP-IF NOTE: framer-motion/dom DOES re-export a `spring()` solver (via
 * motion-dom). Verified numerically its `spring().next(t)` matches the
 * closed-form equations below exactly for identical {stiffness,damping,mass}.
 * Given that equivalence, wrapping bought no fidelity gain, while pulling a
 * DOM/React runtime dependency into a module meant to stay pure, plus its
 * `velocity()` uses a different implicit time unit than `next()` -- a real
 * foot-gun. Implementing the closed form directly keeps this dependency-free.
 */

import { PILL_SPRING, SPRING_ELEGANT, SPRING_BOUYANT } from './motion-spring'

export interface SpringParams {
  stiffness: number
  damping: number
  mass?: number
}

export interface SpringDerived {
  omega0: number
  zeta: number
  isCritical: boolean
  isOver: boolean
  isUnder: boolean
}

export interface SampleOptions {
  restDelta?: number
  restSpeed?: number
  maxSec?: number
  hz?: number
}

export interface SampleResult {
  t: number[]
  x: number[]
  settleSec: number
  overshootPct: number
  firstPeakSec: number | null
}

/**
 * Settle time, two regimes:
 *  - critical/overdamped: x(t) -> 1 monotonically, so scanning the sampled
 *    grid from the end for the first index clearing both thresholds (and
 *    staying clear) is an exact, unambiguous crossing point.
 *  - underdamped: the raw signal oscillates around 1 with decaying
 *    amplitude, so that same per-sample scan re-triggers on stale
 *    oscillation crossings well after the curve looks settled (measured:
 *    it inflates `bouyant` to ~1.7-2.1s vs. motion-spring.ts's own "~1150ms"
 *    estimate). The closed-form amplitude ENVELOPE -- the standard
 *    control-theory settling-time definition -- reproduces that doc
 *    estimate almost exactly (~1176ms) because the envelope bounds every
 *    future oscillation.
 */
function settleTime(
  zeta: number,
  omega0: number,
  isUnder: boolean,
  restDelta: number,
  restSpeed: number,
  t: number[],
  x: number[],
  v: number[],
): number {
  if (isUnder) {
    const envelope = 1 / Math.sqrt(1 - zeta * zeta)
    return Math.max(0, Math.log(envelope / restDelta) / (zeta * omega0))
  }
  for (let i = t.length - 1; i >= 0; i--) {
    const withinRest = Math.abs(1 - x[i]) < restDelta && Math.abs(v[i]) < restSpeed
    if (!withinRest) return t[Math.min(i + 1, t.length - 1)]
  }
  return 0
}

const CRITICAL_EPS = 1e-6

/** Guards against non-physical inputs (mass<=0, stiffness<=0) by clamping to
 * a tiny positive value rather than producing NaN/Infinity. */
function safeParams(s: SpringParams): Required<SpringParams> {
  const mass = s.mass ?? 1
  return {
    stiffness: s.stiffness <= 0 ? 1e-6 : s.stiffness,
    damping: s.damping < 0 ? 0 : s.damping,
    mass: mass <= 0 ? 1e-6 : mass,
  }
}

export function springParams(s: SpringParams): SpringDerived {
  const { stiffness, damping, mass } = safeParams(s)
  const omega0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  const isCritical = Math.abs(zeta - 1) < CRITICAL_EPS
  return {
    omega0,
    zeta,
    isCritical,
    isOver: !isCritical && zeta > 1,
    isUnder: !isCritical && zeta < 1,
  }
}

/** Displacement 0→1 at time `tSec`, starting at rest with zero velocity. */
export function springPosition(s: SpringParams, tSec: number): number {
  const { omega0, zeta, isCritical } = springParams(s)
  if (tSec <= 0) return 0
  if (isCritical) {
    return 1 - Math.exp(-omega0 * tSec) * (1 + omega0 * tSec)
  }
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta)
    return (
      1 -
      Math.exp(-zeta * omega0 * tSec) *
        (Math.cos(omegaD * tSec) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(omegaD * tSec))
    )
  }
  const disc = Math.sqrt(zeta * zeta - 1)
  const r1 = omega0 * (-zeta + disc)
  const r2 = omega0 * (-zeta - disc)
  return 1 - (r2 * Math.exp(r1 * tSec) - r1 * Math.exp(r2 * tSec)) / (r2 - r1)
}

export function sampleSpring(s: SpringParams, opts: SampleOptions = {}): SampleResult {
  // Defaults are 0.01/0.01 -- framer-motion's real published restDelta/
  // restSpeed defaults (motion-dom's VelocityOptions docs), not 0.001; at
  // 0.001 `bouyant`'s envelope settle time overshoots its own 1000-1300ms band.
  const { restDelta = 0.01, restSpeed = 0.01, maxSec = 10, hz = 120 } = opts
  const { omega0, zeta, isUnder } = springParams(s)
  const dt = 1 / hz
  const n = Math.max(2, Math.round(maxSec / dt) + 1)
  const t: number[] = new Array(n)
  const x: number[] = new Array(n)
  for (let i = 0; i < n; i++) {
    t[i] = i * dt
    x[i] = springPosition(s, t[i])
  }

  // Central-difference velocity on the sample grid.
  const v: number[] = new Array(n)
  for (let i = 0; i < n; i++) {
    if (i === 0) v[i] = (x[1] - x[0]) / dt
    else if (i === n - 1) v[i] = (x[i] - x[i - 1]) / dt
    else v[i] = (x[i + 1] - x[i - 1]) / (2 * dt)
  }

  const settleSec = settleTime(zeta, omega0, isUnder, restDelta, restSpeed, t, x, v)

  let maxX = -Infinity
  let firstPeakSec: number | null = null
  for (let i = 1; i < n - 1; i++) {
    if (x[i] > maxX) maxX = x[i]
    if (firstPeakSec === null && x[i] > x[i - 1] && x[i] >= x[i + 1] && x[i] > 1) {
      firstPeakSec = t[i]
    }
  }
  if (maxX === -Infinity) maxX = x[n - 1]
  const overshootPct = Math.max(0, (maxX - 1) * 100)

  return { t, x, settleSec, overshootPct, firstPeakSec }
}

export interface LinearEasingOptions {
  stops?: number
}

export interface LinearEasingResult {
  easing: string
  durationMs: number
}

export function toLinearEasing(samples: SampleResult, opts: LinearEasingOptions = {}): LinearEasingResult {
  const stops = Math.min(40, Math.max(2, opts.stops ?? 32))
  const { settleSec } = samples
  const durationMs = Math.round(settleSec * 1000)

  // Build the raw (value, pct) pairs first, then collapse consecutive equal
  // values -- but the very last raw stop (the mandated literal `1`) is never
  // dropped, even if the stop before it also rounds to 1, so the string
  // always terminates in `, 1)`.
  const raw: Array<{ value: string; pct: string | null }> = []
  for (let i = 0; i < stops; i++) {
    const isFirst = i === 0
    const isLast = i === stops - 1
    const tSec = (settleSec * i) / (stops - 1)
    const value = isFirst ? '0' : isLast ? '1' : String(Number(interpolateAt(samples, tSec).toFixed(3)))
    const pct = isFirst || isLast ? null : String(Number(((100 * i) / (stops - 1)).toFixed(1)))
    raw.push({ value, pct })
  }
  const collapsed: typeof raw = []
  for (let i = 0; i < raw.length; i++) {
    const isLast = i === raw.length - 1
    const prev = collapsed[collapsed.length - 1]
    if (!isLast && prev && prev.value === raw[i].value) continue
    collapsed.push(raw[i])
  }
  const entries = collapsed.map((e) => (e.pct === null ? e.value : `${e.value} ${e.pct}%`))

  return { easing: `linear(${entries.join(', ')})`, durationMs }
}

function interpolateAt(samples: SampleResult, tSec: number): number {
  const { t, x } = samples
  if (tSec <= t[0]) return x[0]
  if (tSec >= t[t.length - 1]) return x[x.length - 1]
  const dt = t[1] - t[0]
  const idx = Math.min(t.length - 2, Math.max(0, Math.floor(tSec / dt)))
  const frac = (tSec - t[idx]) / dt
  return x[idx] + (x[idx + 1] - x[idx]) * frac
}

export function toJsSpring(s: SpringParams): string {
  const mass = s.mass ?? 1
  return `{ type: 'spring', stiffness: ${s.stiffness}, damping: ${s.damping}, mass: ${mass} }`
}

export function toCssTransition(s: SpringParams, prop = 'transform'): string {
  const samples = sampleSpring(s)
  const { easing, durationMs } = toLinearEasing(samples)
  return `${prop} ${durationMs}ms ${easing}`
}

/**
 * `pop`: no existing named token supplies stiffness/damping/mass -- approximates
 * `--ease-spring-pop` (cubic-bezier(.34,1.2,.5,1), a snappy single-overshoot
 * curve). {stiffness:400, damping:26, mass:1} -> zeta ~0.65 (underdamped,
 * one visible bounce), omega0=20 rad/s -> settle ~375ms (in the 300-400ms
 * band), overshoot ~6.8% (single bounce, just past the plan's "~3-5%" feel).
 */
export const SPRING_PRESETS = {
  pill: { stiffness: PILL_SPRING.stiffness, damping: PILL_SPRING.damping, mass: 1 },
  elegant: { stiffness: SPRING_ELEGANT.stiffness, damping: SPRING_ELEGANT.damping, mass: SPRING_ELEGANT.mass },
  bouyant: { stiffness: SPRING_BOUYANT.stiffness, damping: SPRING_BOUYANT.damping, mass: SPRING_BOUYANT.mass },
  pop: { stiffness: 400, damping: 26, mass: 1 },
} as const satisfies Record<string, SpringParams>
