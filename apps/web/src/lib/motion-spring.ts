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

/** Mirrors `--ease-slide-bounce` in motion-tokens.css. Kept as a JS constant
 *  because WAAPI/`animate` calls cannot read a CSS custom property directly. */
export const EASE_SLIDE_BOUNCE = 'cubic-bezier(.34,1.3,.64,1)'

/** E2 verdict (2026-08-06): mirrors `--ease-spring-open` in motion-tokens.css,
 *  the house open-spring. FinancialHealthCard now uses this for BOTH its
 *  open and close leg so the two legs read as one shared spring family
 *  instead of two distinct feels. */
export const EASE_SPRING_OPEN = 'cubic-bezier(.55,1.35,.35,1)'

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
