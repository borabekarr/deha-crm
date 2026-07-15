// motion-spring.ts — velocity-preserving spring for sliding pill indicators.
// Rule source: .claude/references/frontend/design-system.md §10
// ("Sliding pill indicators", spring-velocity-pill-tip).
//
// Uses the imperative `animate` from 'framer-motion/dom' only (never the root
// entry or 'dom-mini'), matching make-reveal-ref.ts. Springs retarget from the
// element's current value AND inherit its current velocity, so spam-switching
// a segmented control glides through reversals instead of restarting from zero.
//
// Effect/measurement logic lives here per the no-use-effect convention;
// components consume the returned callback ref only.

import { useCallback, useLayoutEffect, useRef } from 'react'
import { animate } from 'framer-motion/dom'

/** Snappy, near-critically damped — no visible overshoot, so the design-system
 *  "no bounce/elastic easing" rule holds. */
export const PILL_SPRING = { type: 'spring', stiffness: 520, damping: 38 } as const

function motionDisabled(el: HTMLElement): boolean {
  const raw = getComputedStyle(el).getPropertyValue('--anim-mult').trim()
  const mult = raw === '' ? 1 : parseFloat(raw)
  if (Number.isFinite(mult) && mult <= 0) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Drives a sliding pill indicator's `x`/`width` with a velocity-preserving
 * spring. First paint is applied instantly (no mount animation); when
 * `--anim-mult` is 0 (spam tests) or the user prefers reduced motion, updates
 * collapse to duration 0.
 *
 * The consuming element must not carry CSS transitions on transform/width
 * (they would chase the per-frame inline writes) — pass
 * `style={{ transition: 'none' }}` when the class is shared with the static
 * HTML previews.
 */
export function usePillSpring<T extends HTMLElement>(x: number, width: number) {
  const elRef = useRef<T | null>(null)
  const painted = useRef(false)

  const ref = useCallback((el: T | null) => {
    elRef.current = el
    if (!el) painted.current = false
  }, [])

  useLayoutEffect(() => {
    const el = elRef.current
    if (!el) return
    if (!painted.current) {
      painted.current = true
      el.style.transform = `translateX(${x}px)`
      el.style.width = `${width}px`
      return
    }
    animate(el, { x, width }, motionDisabled(el) ? { duration: 0 } : PILL_SPRING)
  }, [x, width])

  return ref
}
