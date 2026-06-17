/**
 * DynamicIslandReader hook — encapsulates all DOM side-effects.
 *
 * NO raw effect hooks anywhere in DynamicIslandReader.tsx.
 *
 * Three callback-refs are exported:
 *  - dirScrollerRef  : wired to the scrollable article div; attaches the
 *                      passive scroll listener + resize listener on window.
 *  - dirFillGlowRef  : wired to the progress fill element; replays the
 *                      di-fill-glow animation whenever pulseKey changes.
 *  - cleanupDirRoot  : called in the null branch of the scroller ref to
 *                      remove all listeners.
 *
 * State setters are passed in so the hook can drive React state from DOM
 * events without any effect hook in the component.
 */

export type DiMode = 'compact' | 'expanded' | 'complete'
export type DiAccent = 'emerald' | 'blue' | 'violet' | 'amber'
export type DiShowMode = 'percent' | 'time' | 'off'
export type DiPillStyle = 'island' | 'glass'

export interface DirState {
  disp: number
  mode: DiMode
  pulseKey: number
  scale: number
}

export interface DirSetters {
  setDisp: (v: number) => void
  setMode: (m: DiMode) => void
  setPulseKey: (fn: (k: number) => number) => void
  setScale: (v: number) => void
}

// Reduced-motion query — evaluated once at module load (safe: no DOM mutation)
export const RM: boolean =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

// Internal mutable refs stored on the scroller element to avoid React ref objects
// in the hook signature (keeps the hook a plain function, not a React hook).
interface DirMeta {
  targetRef: number
  dispRef: number
  rafRef: number
  msRef: number
  idleTimer: ReturnType<typeof setTimeout> | null
  setters: DirSetters
  collapseIdle: boolean
  onScroll: () => void
  onResize: () => void
  tick: () => void
}

type DirEl = HTMLElement & { __dir?: DirMeta }

/** Wire scroll + resize listeners on the scroller element. */
export function dirScrollerRef(
  el: HTMLElement | null,
  setters: DirSetters,
  collapseIdle: boolean
): void {
  if (!el) return

  const meta: DirMeta = {
    targetRef: 0,
    dispRef: 0,
    rafRef: 0,
    msRef: 0,
    idleTimer: null,
    setters,
    collapseIdle,
    onScroll: () => {},
    onResize: () => {},
    tick: () => {},
  }

  // smoothing loop: lerp displayed value toward target
  // Snaps immediately when: gap is large (> 0.15), or target is exactly 0 (top)
  const tick = (): void => {
    const tgt = meta.targetRef
    const d = meta.dispRef
    const gap = Math.abs(tgt - d)
    // Snap to target if gap is large (fast scroll) or we are at the very top
    if (gap > 0.15 || tgt === 0) {
      meta.dispRef = tgt
      meta.setters.setDisp(tgt)
      meta.rafRef = 0
      checkMilestone(tgt, meta)
      return
    }
    const nd = d + (tgt - d) * 0.16
    if (gap < 0.0006) {
      meta.dispRef = tgt
      meta.setters.setDisp(tgt)
      meta.rafRef = 0
      checkMilestone(tgt, meta)
      return
    }
    meta.dispRef = nd
    meta.setters.setDisp(nd)
    checkMilestone(nd, meta)
    meta.rafRef = requestAnimationFrame(tick)
  }
  meta.tick = tick

  const onScroll = (): void => {
    const max = el.scrollHeight - el.clientHeight
    const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
    meta.targetRef = p
    // Snap immediately when at the very top (no lerp tail after scroll-to-top)
    if (RM || el.scrollTop === 0) {
      meta.dispRef = p
      meta.setters.setDisp(p)
      checkMilestone(p, meta)
      if (meta.rafRef) { cancelAnimationFrame(meta.rafRef); meta.rafRef = 0 }
    } else if (!meta.rafRef) {
      meta.rafRef = requestAnimationFrame(tick)
    }

    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
    if (atBottom) {
      meta.setters.setMode('complete')
    } else if (p <= 0.002) {
      meta.setters.setMode('compact')
    } else {
      meta.setters.setMode('expanded')
    }

    if (meta.collapseIdle && !atBottom && p > 0.002) {
      if (meta.idleTimer !== null) clearTimeout(meta.idleTimer)
      meta.setters.setMode('expanded')
      meta.idleTimer = setTimeout(() => meta.setters.setMode('compact'), 1500)
    }
  }
  meta.onScroll = onScroll

  const onResize = (): void => {
    const s = Math.min(
      1,
      (window.innerHeight - 28) / 898,
      (window.innerWidth - 40) / 426
    )
    meta.setters.setScale(s)
  }
  meta.onResize = onResize

  el.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)

  // run immediately to get initial state
  onScroll()
  onResize()

  ;(el as DirEl).__dir = meta
}

/** Remove all listeners. Call in the null branch of the scroller callback-ref. */
export function cleanupDirScroller(el: HTMLElement | null): void {
  if (!el) return
  const e = el as DirEl
  const meta = e.__dir
  if (!meta) return
  el.removeEventListener('scroll', meta.onScroll)
  window.removeEventListener('resize', meta.onResize)
  if (meta.rafRef) cancelAnimationFrame(meta.rafRef)
  if (meta.idleTimer !== null) clearTimeout(meta.idleTimer)
  delete e.__dir
}

/** Update collapseIdle option without re-attaching listeners. */
export function updateDirCollapseIdle(el: HTMLElement | null, collapseIdle: boolean): void {
  if (!el) return
  const meta = (el as DirEl).__dir
  if (meta) meta.collapseIdle = collapseIdle
}

/** Replay the di-fill-glow animation on the fill element when pulseKey increments. */
export function dirFillGlowReplay(el: HTMLElement | null): void {
  if (RM || !el) return
  el.classList.remove('di-fill-glow')
  // force reflow to restart animation
  void el.offsetWidth
  el.classList.add('di-fill-glow')
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function checkMilestone(v: number, meta: DirMeta): void {
  const pc = v * 100
  const ms = pc >= 75 ? 75 : pc >= 50 ? 50 : pc >= 25 ? 25 : 0
  if (ms > meta.msRef) {
    meta.msRef = ms
    if (!RM) meta.setters.setPulseKey((k) => k + 1)
  } else if (ms < meta.msRef) {
    meta.msRef = ms
  }
}
