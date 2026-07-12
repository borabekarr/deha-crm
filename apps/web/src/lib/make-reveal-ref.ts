/**
 * makeRevealRef — imperative staggered entrance for a grid/list CONTAINER.
 *
 * NO useEffect anywhere; the repo bans it. Modeled on the house callback-ref
 * pattern in apps/web/src/components/design-system/animated-list/animated-list-hook.ts,
 * but drives the animation via framer-motion's `animate` + `stagger` (imported
 * from 'framer-motion/dom' only, never the root entry or 'dom-mini').
 *
 * Initial hidden state is set synchronously in JS on each item (never CSS),
 * so a ref that never fires leaves the page fully visible.
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
}

// Play-once guard: re-renders reuse the same node so nothing replays; each
// route navigation mounts a fresh container node so the reveal replays per
// visit, which is intended. React StrictMode double-invokes the callback ref
// (attach -> detach(null) -> attach) on the SAME node in dev, so this must be
// checked FIRST, before any cleanup, or the re-attach kills the in-flight
// reveal it was meant to guard.
const played = new WeakSet<HTMLElement>()

export function makeRevealRef(opts: RevealOptions = {}) {
  const {
    selector = ':scope > *',
    each = 0.05,
    maxTotal = 0.6,
    duration = 0.4,
    y = 12,
    rotate = -2,
    from = 'center',
  } = opts

  return (el: HTMLElement | null): void => {
    if (!el) return
    return playReveal(el, { selector, each, maxTotal, duration, y, rotate, from })
  }
}

function playReveal(
  container: HTMLElement,
  opts: Required<RevealOptions>,
): void {
  if (played.has(container)) return

  const items = container.querySelectorAll<HTMLElement>(opts.selector)
  if (items.length === 0) return

  played.add(container)

  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.visibilityState === 'hidden'
  ) {
    return
  }

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

  items.forEach((item) => {
    item.style.opacity = '0'
    item.style.transform = `translateY(${opts.y}px) rotate(${opts.rotate}deg)`
  })

  const aug = container as AugContainer
  const controls = animate(
    items,
    { opacity: [0, 1], y: [opts.y, 0], rotate: [opts.rotate, 0] },
    { duration, ease: [0.22, 1, 0.36, 1], delay: stagger(step, { from: opts.from }) },
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
