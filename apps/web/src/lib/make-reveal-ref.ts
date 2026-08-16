/**
 * makeRevealRef — imperative on-visible staggered entrance for a grid/list
 * CONTAINER (Primer's "on-visible" behavior: fires when the container starts
 * to enter the viewport, not on mount).
 *
 * NO useEffect anywhere; the repo bans it. Modeled on the house callback-ref
 * pattern in apps/web/src/components/design-system/animated-list/animated-list-hook.ts,
 * but drives the animation via framer-motion's `animate` + `stagger` (imported
 * from 'framer-motion/dom' only, never the root entry or 'dom-mini').
 *
 * Initial hidden state is set synchronously in JS on each item (never CSS),
 * so a ref that never fires leaves the page fully visible. The hidden state
 * is applied in the ref callback BEFORE the IntersectionObserver is created,
 * so there is no frame where content flashes visible pre-observe.
 */

import { animate, stagger } from 'framer-motion/dom'

export interface RevealOptions {
  selector?: string
  each?: number
  maxTotal?: number
  duration?: number
  y?: number
  rotate?: number
  from?: 'first' | 'last' | 'center'
}

type AugContainer = HTMLElement & {
  __revealTimerId?: ReturnType<typeof setTimeout>
  __revealObserver?: IntersectionObserver
}

// Mirrors --duration-entrance in motion-tokens.css (600ms, Primer's
// --brand-animation-duration-default). Kept as a JS constant because
// WAAPI/`animate` calls cannot read a CSS custom property directly (same
// precedent as EASE_SLIDE_BOUNCE in motion-spring.ts).
const ENTRANCE_DURATION_S = 0.6

// Mirrors --stagger-entrance in motion-tokens.css (100ms DOM-order stagger
// increment between siblings).
const ENTRANCE_STAGGER_S = 0.1

// Mirrors --ease-brand-entrance in motion-tokens.css -- Primer's exact
// published curve (--brand-animation-easing-default), byte-for-byte.
const ENTRANCE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Primer's "bottom-of-screen" on-visible threshold: fire once the container
// starts entering the viewport from the bottom, well before it is centered.
const ON_VISIBLE_ROOT_MARGIN = '0px 0px -10% 0px'

// Play-once guard: re-renders reuse the same node so nothing replays; each
// route navigation mounts a fresh container node so the reveal replays per
// visit, which is intended. React StrictMode double-invokes the callback ref
// (attach -> detach(null) -> attach) on the SAME node in dev, so this must be
// checked FIRST, before any cleanup, or the re-attach kills the in-flight
// reveal it was meant to guard.
const played = new WeakSet<HTMLElement>()

/**
 * Callback ref: sets the hidden initial state synchronously, then observes
 * the container and plays the entrance once it starts to become visible.
 * Play-once — the observer disconnects after firing. Exported so app routes
 * (and future pages) can import the same on-visible mechanism directly.
 */
export function makeRevealRef(opts: RevealOptions = {}) {
  const {
    selector = ':scope > *',
    each = ENTRANCE_STAGGER_S,
    maxTotal = 0.6,
    duration = ENTRANCE_DURATION_S,
    y = 15,
    rotate = 0,
    from = 'center',
  } = opts

  return (el: HTMLElement | null): void => {
    if (!el) return
    armOnVisibleReveal(el, { selector, each, maxTotal, duration, y, rotate, from })
  }
}

/** Applies the hidden initial state and arms the IntersectionObserver. */
function armOnVisibleReveal(
  container: HTMLElement,
  opts: Required<RevealOptions>,
): void {
  if (played.has(container)) return

  const items = container.querySelectorAll<HTMLElement>(opts.selector)
  if (items.length === 0) return

  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.visibilityState === 'hidden'
  ) {
    played.add(container)
    return
  }

  // Hidden state applied synchronously, before the observer exists, so
  // there is no frame where content is visible pre-observe.
  items.forEach((item) => {
    item.style.opacity = '0'
    item.style.transform = `translateY(${opts.y}px) rotate(${opts.rotate}deg)`
  })

  const aug = container as AugContainer
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.disconnect()
        delete aug.__revealObserver
        playReveal(container, items, opts)
      }
    },
    { threshold: 0, rootMargin: ON_VISIBLE_ROOT_MARGIN },
  )
  aug.__revealObserver = observer
  observer.observe(container)
}

function playReveal(
  container: HTMLElement,
  items: NodeListOf<HTMLElement>,
  opts: Required<RevealOptions>,
): void {
  if (played.has(container)) return
  played.add(container)

  const mult =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--anim-mult'),
    ) || 1
  const duration = opts.duration * mult

  const n = items.length
  const origin =
    opts.from === 'first' ? 0 : opts.from === 'last' ? n - 1 : Math.floor((n - 1) / 2)
  const maxDist = Math.max(origin, n - 1 - origin)
  const step = Math.min(opts.each, opts.maxTotal / Math.max(1, maxDist)) * mult

  const aug = container as AugContainer
  const controls = animate(
    items,
    { opacity: [0, 1], y: [opts.y, 0], rotate: [opts.rotate, 0] },
    { duration, ease: ENTRANCE_EASE, delay: stagger(step, { from: opts.from }) },
  )

  const clearInline = () => {
    items.forEach((item) => {
      item.style.opacity = ''
      item.style.transform = ''
    })
  }

  controls.then(clearInline)

  aug.__revealTimerId = setTimeout(() => {
    delete aug.__revealTimerId
    if (container.isConnected) clearInline()
  }, duration * 1000 + 200)
}
