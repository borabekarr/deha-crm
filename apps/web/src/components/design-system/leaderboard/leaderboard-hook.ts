/**
 * leaderboard-hook.ts — encapsulates all timers, FLIP animation, and number-tween
 * logic for the Leaderboard component.
 *
 * NO raw useEffect anywhere in the leaderboard/ folder.
 * All side-effects are wired via callback refs on DOM elements.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export interface Agent {
  id: string
  name: string
  you: boolean
  revenue: number
  growth: number
}

export const AGENTS: Agent[] = [
  { id: 'deha',  name: 'Deha (You)',  you: true,  revenue: 320, growth: 24 },
  { id: 'selin', name: 'Selin Aydın', you: false, revenue: 210, growth: 38 },
  { id: 'mert',  name: 'Mert Yıldız', you: false, revenue: 150, growth: 6  },
  { id: 'bora',  name: 'Bora Bekar',  you: false, revenue: 95,  growth: 11 },
]

export type Metric = 'revenue' | 'growth'

export function fmt(metric: Metric, v: number): string {
  const rounded = Math.round(v)
  return metric === 'growth' ? `+${rounded}%` : `$${rounded}K`
}

function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// ---------------------------------------------------------------------------
// Number-tween engine
// Callback ref on a stable container element.
// The caller passes setDisplay so the hook can drive React state.
// ---------------------------------------------------------------------------

export interface TweenState {
  timerId: ReturnType<typeof setTimeout> | null
  start: Record<string, number>
  t0: number
}

/** Start a number-tween from `from` values toward `metric` targets.
 *  Drives React state via the provided setter; cleans up in the returned fn. */
export function startTween(
  metric: Metric,
  fromValues: Record<string, number>,
  setDisplay: (vals: Record<string, number>) => void,
  stateRef: { current: TweenState },
): () => void {
  if (stateRef.current.timerId !== null) {
    clearTimeout(stateRef.current.timerId)
    stateRef.current.timerId = null
  }
  const start = { ...fromValues }
  const t0 = Date.now()
  const dur = 700

  function tick(): void {
    const t = Math.min(1, (Date.now() - t0) / dur)
    const e = ease(t)
    const next: Record<string, number> = {}
    AGENTS.forEach((a) => {
      next[a.id] = start[a.id] + (a[metric] - start[a.id]) * e
    })
    setDisplay(next)
    if (t < 1) {
      stateRef.current.timerId = setTimeout(tick, 16)
    } else {
      stateRef.current.timerId = null
    }
  }

  tick()

  return () => {
    if (stateRef.current.timerId !== null) {
      clearTimeout(stateRef.current.timerId)
      stateRef.current.timerId = null
    }
  }
}

// ---------------------------------------------------------------------------
// FLIP re-rank animation
// Called from a useLayoutEffect-equivalent callback ref pattern.
// ---------------------------------------------------------------------------

export interface FlipState {
  prevRects: Record<string, number>
}

/** Run FLIP on all tracked row elements.
 *  Reads natural positions (transform-cleared), then plays from prior rects. */
export function runFlip(
  rowEls: Record<string, HTMLElement | null>,
  flipState: FlipState,
): void {
  const ids = Object.keys(rowEls)
  const natural: Record<string, number> = {}

  // 1. Clear any in-flight transforms and measure natural positions
  ids.forEach((id) => {
    const el = rowEls[id]
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = ''
    natural[id] = el.getBoundingClientRect().top
  })

  // 2. Play from previous rects
  ids.forEach((id) => {
    const el = rowEls[id]
    if (!el) return
    const pr = flipState.prevRects[id]
    const nr = natural[id]
    if (pr != null) {
      const dy = pr - nr
      if (Math.abs(dy) > 0.5) {
        el.style.transform = `translateY(${dy}px)`
        el.getBoundingClientRect() // force layout to commit offset
        el.style.transition = 'transform 560ms cubic-bezier(.22,1,.36,1)'
        el.style.transform = ''
      }
    }
    flipState.prevRects[id] = nr
  })
}

// ---------------------------------------------------------------------------
// Segmented pill positioning
// Callback ref wired directly on the .seg element.
// ---------------------------------------------------------------------------

interface SegElement extends HTMLDivElement {
  __lbSegCleanup?: () => void
}

/** Callback ref for the .seg element in the leaderboard.
 *  Positions the pill immediately (no transition) and handles resize. */
export function lbSegRef(el: HTMLDivElement | null): void {
  if (!el) return
  const pill = el.querySelector<HTMLSpanElement>('.seg-pill')
  if (!pill) return

  function reposition(animate: boolean): void {
    const active = el!.querySelector<HTMLButtonElement>('button.active')
    if (!active) return
    if (!animate) pill!.style.transition = 'none'
    pill!.style.left = `${active.offsetLeft}px`
    pill!.style.width = `${active.offsetWidth}px`
    if (!animate) {
      void pill!.offsetWidth
      pill!.style.transition = ''
    }
  }

  reposition(false)
  const resumeTimer = setTimeout(() => reposition(false), 60)

  function onResize(): void {
    reposition(false)
  }
  window.addEventListener('resize', onResize)

  ;(el as SegElement).__lbSegCleanup = () => {
    clearTimeout(resumeTimer)
    window.removeEventListener('resize', onResize)
  }
}

export function cleanupLbSeg(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as SegElement
  e.__lbSegCleanup?.()
  delete e.__lbSegCleanup
}

/** Reposition the pill over the currently-active button with animation. */
export function repositionLbPill(segEl: HTMLDivElement): void {
  const pill = segEl.querySelector<HTMLSpanElement>('.seg-pill')
  const active = segEl.querySelector<HTMLButtonElement>('button.active')
  if (!pill || !active) return
  pill.style.left = `${active.offsetLeft}px`
  pill.style.width = `${active.offsetWidth}px`
}
