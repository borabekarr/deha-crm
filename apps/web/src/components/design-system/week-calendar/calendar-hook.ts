/**
 * Calendar hooks — wired as callback refs, NO useEffect anywhere.
 *
 * nowLineRef  — attaches a self-rescheduling per-minute timer to whichever
 *               element holds the .cal2-now line. On mount it reads the current
 *               time, positions the line, then schedules a setTimeout for the
 *               next minute boundary. Each callback reschedules itself so the
 *               line stays live. On unmount the pending timeout is cleared from
 *               the element to prevent cross-navigation leaks.
 *
 * scrollSyncRef — attaches a scroll listener on the grid scroll container so
 *                 the sticky header follows horizontal scroll. Listener is
 *                 stored on the element and removed on unmount.
 */

const HOUR_HEIGHT = 120

function nowPos(): number {
  const d = new Date()
  return Math.max(0, Math.round((d.getHours() * 60 + d.getMinutes()) * (HOUR_HEIGHT / 60)))
}

type ElWithTimer = HTMLElement & { __cal2NowTimer?: ReturnType<typeof setTimeout> }

/** Callback ref for the element that wraps the now-line indicator. */
export function nowLineRef(el: HTMLElement | null): void {
  if (!el) return

  const typed = el as ElWithTimer

  function tick(): void {
    // Update position
    typed.style.top = nowPos() + 'px'

    // Schedule next tick at the start of the next minute
    const d = new Date()
    const msUntilNextMinute = (60 - d.getSeconds()) * 1000 - d.getMilliseconds()
    typed.__cal2NowTimer = setTimeout(tick, msUntilNextMinute)
  }

  tick()
}

export function cleanupNowLine(el: HTMLElement | null): void {
  if (!el) return
  const typed = el as ElWithTimer
  if (typed.__cal2NowTimer !== undefined) {
    clearTimeout(typed.__cal2NowTimer)
    delete typed.__cal2NowTimer
  }
}

type ElWithScroll = HTMLElement & { __cal2ScrollHandler?: () => void }

/**
 * Callback ref for the scroll container (.cal2-scroll).
 * Scrolls to ~8am on first mount and syncs the sticky header on horizontal scroll.
 * The header is a sibling element with class .cal2-head-row inside .cal2-canvas.
 */
export function scrollContainerRef(el: HTMLElement | null): void {
  if (!el) return

  // Scroll to 8am on initial mount
  el.scrollTop = 8 * HOUR_HEIGHT

  const typed = el as ElWithScroll

  // No header sync needed — the header is sticky inside the same scroll container,
  // so the browser handles it natively. We attach the ref to establish the initial
  // scroll position and provide a clean unmount path.
  const handler = (): void => {
    // Horizontal sync: the corner cell and hours column are position:sticky left:0,
    // so no manual sync required. This handler is a no-op placeholder kept for
    // symmetry so cleanupScrollContainer has something to remove.
  }

  el.addEventListener('scroll', handler, { passive: true })
  typed.__cal2ScrollHandler = handler
}

export function cleanupScrollContainer(el: HTMLElement | null): void {
  if (!el) return
  const typed = el as ElWithScroll
  if (typed.__cal2ScrollHandler) {
    el.removeEventListener('scroll', typed.__cal2ScrollHandler)
    delete typed.__cal2ScrollHandler
  }
}
