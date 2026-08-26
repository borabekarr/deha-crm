// Unit spec for the pure spring-math module (Step 3). No `page` fixture --
// plain Node import, relative path (Playwright's Node runner does not
// resolve the `@/*` tsconfig alias -- that mapping is bundler/Vite-only).
import { test, expect } from '@playwright/test'
import { springParams, sampleSpring, toLinearEasing, toCssTransition, SPRING_PRESETS } from '../src/lib/spring-math'

const LINEAR_EASING_RE = /^linear\(0(, [0-9.]+ [0-9.]+%)+, 1\)$/

test('elegant preset: zeta, settle, overshoot land in the design-value band', () => {
  const { zeta } = springParams(SPRING_PRESETS.elegant)
  expect(zeta).toBeGreaterThan(0.698)
  expect(zeta).toBeLessThan(0.718)
  const { settleSec, overshootPct } = sampleSpring(SPRING_PRESETS.elegant)
  expect(settleSec * 1000).toBeGreaterThan(500)
  expect(settleSec * 1000).toBeLessThan(700)
  expect(overshootPct).toBeGreaterThan(2)
  expect(overshootPct).toBeLessThan(12)
})

test('bouyant preset: zeta and settle land in the design-value band', () => {
  const { zeta } = springParams(SPRING_PRESETS.bouyant)
  expect(zeta).toBeGreaterThan(0.4)
  expect(zeta).toBeLessThan(0.44)
  const { settleSec } = sampleSpring(SPRING_PRESETS.bouyant)
  expect(settleSec * 1000).toBeGreaterThan(1000)
  expect(settleSec * 1000).toBeLessThan(1300)
})

test('pill preset: near-critical, overshoot under 1%', () => {
  const { zeta } = springParams(SPRING_PRESETS.pill)
  expect(zeta).toBeGreaterThan(0.81)
  expect(zeta).toBeLessThan(0.85)
  const { overshootPct } = sampleSpring(SPRING_PRESETS.pill)
  expect(overshootPct).toBeLessThan(1)
})

test('pop preset: single modest overshoot, settle 300-400ms', () => {
  const { settleSec, overshootPct } = sampleSpring(SPRING_PRESETS.pop)
  expect(settleSec * 1000).toBeGreaterThan(300)
  expect(settleSec * 1000).toBeLessThan(400)
  expect(overshootPct).toBeGreaterThan(0)
  expect(overshootPct).toBeLessThan(10)
})

test('critically damped input has zero overshoot and isCritical', () => {
  const s = { stiffness: 100, damping: 20, mass: 1 }
  const { isCritical } = springParams(s)
  expect(isCritical).toBe(true)
  const { overshootPct } = sampleSpring(s)
  expect(overshootPct).toBe(0)
})

test('overdamped (zeta>1) displacement is monotonic, never decreases', () => {
  const s = { stiffness: 80, damping: 40, mass: 1 }
  expect(springParams(s).zeta).toBeGreaterThan(1)
  const { x } = sampleSpring(s)
  for (let i = 1; i < x.length; i++) {
    expect(x[i]).toBeGreaterThanOrEqual(x[i - 1] - 1e-9)
  }
})

test('toLinearEasing format: bounded stops, correct duration', () => {
  const samples = sampleSpring(SPRING_PRESETS.elegant)
  const { easing, durationMs } = toLinearEasing(samples)
  expect(easing).toMatch(LINEAR_EASING_RE)
  const stopCount = easing.split(',').length
  expect(stopCount).toBeLessThanOrEqual(40)
  expect(durationMs).toBe(Math.round(samples.settleSec * 1000))
})

test('toCssTransition: transform property + linear() easing', () => {
  const css = toCssTransition(SPRING_PRESETS.bouyant)
  expect(css.startsWith('transform ')).toBe(true)
  expect(css).toContain('linear(')
})
