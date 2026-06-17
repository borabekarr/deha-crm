/**
 * adjust-timeframe-hook.ts
 *
 * Callback-ref hook for the AdjustTimeframe track element.
 * Wires ResizeObserver (→ onTrackWidth) and stores a cleanup.
 *
 * No raw effect calls anywhere in this file or the component.
 * All DOM side-effects are expressed via callback refs with teardown.
 */

interface TrackEl extends HTMLDivElement {
  __tfCleanup?: () => void
}

export interface TrackRefOptions {
  /** Called whenever the track element's width changes. */
  onTrackWidth: (w: number) => void
}

/**
 * Callback ref for the .tf-track element.
 * Wires a ResizeObserver and does a synchronous first measure.
 * Returns a cleanup function stored on the element itself.
 */
export function trackRef(el: HTMLDivElement | null, opts: TrackRefOptions): void {
  if (!el) return

  const measure = (): void => {
    const w = el.getBoundingClientRect().width
    if (w > 0) opts.onTrackWidth(w)
  }

  measure() // synchronous first measure

  const ro = new ResizeObserver(measure)
  ro.observe(el)

  ;(el as TrackEl).__tfCleanup = () => {
    ro.disconnect()
  }
}

/** Cleanup — pass to the ref's unmount branch. */
export function cleanupTrack(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as TrackEl
  e.__tfCleanup?.()
  delete e.__tfCleanup
}

/* ── Drag helpers ────────────────────────────────────────────────────────── */

export interface BeginDragOptions {
  type: 'start' | 'end' | 'move'
  clientX: number
  pointerId: number
  /** The element that received the pointerdown (for setPointerCapture). */
  currentTarget: Element
  /** Live mirror of scrubber state needed by the drag math. */
  getLive: () => {
    startIdx: number
    endIdx: number
    ppd: number
    scroll: number
    todayIdx: number
    totalDays: number
    trackW: number
    maxScroll: number
    minScroll: number
    trackRect: DOMRect | null
  }
  MIN_SPAN: number
  clamp: (v: number, lo: number, hi: number) => number
  /** Called on every pointermove with new indices + ensureVisible side-effect. */
  onMove: (ns: number, ne: number, focusIdx: number) => void
  /** Called when drag ends. */
  onUp: () => void
  /** Pans scroll to keep focusIdx inside the viewport. */
  ensureVisible: (idx: number) => void
}

/**
 * Starts a pointer-drag session, attaches pointermove/pointerup to window,
 * and returns a manual cancel function (e.g. for onBlur).
 * Listeners are always removed — both via pointerup AND on the returned cancel.
 */
export function beginDrag(opts: BeginDragOptions): () => void {
  const { type, MIN_SPAN, clamp, getLive } = opts
  const moveSnap = (() => {
    const L = getLive()
    const rect = L.trackRect
    const localX = rect ? opts.clientX - rect.left + L.scroll : 0
    const anchor = clamp(Math.round(localX / L.ppd), 0, L.totalDays)
    return { s: L.startIdx, e: L.endIdx, anchor }
  })()

  try {
    const el = opts.currentTarget as Element & { setPointerCapture?: (id: number) => void }
    el.setPointerCapture?.(opts.pointerId)
  } catch { /* ignore */ }

  function toIdx(clientX: number): number {
    const L = getLive()
    const rect = L.trackRect
    const localX = rect ? clientX - rect.left + L.scroll : 0
    return clamp(Math.round(localX / L.ppd), 0, L.totalDays)
  }

  function handleMove(ev: PointerEvent): void {
    if (ev.buttons === 0) { handleUp(); return }
    const idx = toIdx(ev.clientX)
    const L = getLive()

    if (type === 'start') {
      const ns = clamp(idx, 0, L.endIdx - MIN_SPAN)
      opts.onMove(ns, L.endIdx, ns)
      opts.ensureVisible(ns)
    } else if (type === 'end') {
      const ne = clamp(idx, L.startIdx + MIN_SPAN, L.todayIdx)
      opts.onMove(L.startIdx, ne, ne)
      opts.ensureVisible(ne)
    } else {
      // move whole range — mirror logic: clamp the span, keep the focus edge in
      // the direction of travel. Direction is derived from the STABLE drag anchor
      // (idx vs the pointerdown anchor), not from live state which jitters once the
      // range starts updating. This makes right-slide behave identically to left.
      const delta = idx - moveSnap.anchor
      const dur = moveSnap.e - moveSnap.s
      const ns = clamp(moveSnap.s + delta, 0, L.todayIdx - dur)
      const ne = ns + dur
      const movingRight = delta > 0
      const focusIdx = movingRight ? ne : ns
      opts.onMove(ns, ne, focusIdx)
      opts.ensureVisible(focusIdx)
    }
  }

  function handleUp(): void {
    window.removeEventListener('pointermove', handleMove)
    window.removeEventListener('pointerup', handleUp)
    opts.onUp()
  }

  window.addEventListener('pointermove', handleMove)
  window.addEventListener('pointerup', handleUp)

  // Return a cancel fn so callers (e.g. blur) can force-stop the drag.
  return handleUp
}
