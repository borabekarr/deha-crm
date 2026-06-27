/**
 * DeleteButton hook -- encapsulates all timer and width-measurement logic.
 *
 * NO raw useEffect / useLayoutEffect anywhere in DeleteButton.tsx.
 *
 * Design:
 *  - dbInnerRef: callback ref on the .db-inner span. Reads offsetWidth immediately
 *    on every state/count render cycle and calls setWidth so the outer button can
 *    animate its width. Cleanup is a no-op (no listeners attached).
 *
 *  - dbRootRef: callback ref on the outer <button>. Wires countdown and auto-reset
 *    timers. Timer handles are stored on the element so cleanupDbRoot can clear them
 *    when the element unmounts. The hook re-runs whenever `state` changes by being
 *    called with the new state on each render -- the old timers are cleared in
 *    cleanupDbRoot before re-attaching.
 */

export type DbState = 'idle' | 'confirming' | 'done'

interface DbTimerStore {
  __dbCountdown?: ReturnType<typeof setTimeout>
  __dbReset?: ReturnType<typeof setTimeout>
  __dbCleanup?: () => void
}

/**
 * Callback ref for the .db-inner span.
 * Reads scrollWidth (the natural content width, including any content that
 * overflows the clip box) and calls setWidth so the outer button morphs to fit.
 *
 * NOTE: .db-inner has overflow:hidden and its laid-out width is driven by the
 * button's inline width, so offsetWidth would just echo the current (possibly
 * too-narrow) width and never grow to fit the entering confirming content
 * (the countdown badge). scrollWidth reflects the in-flow .db-slide-in slot's
 * full natural width even when it overflows the clip box, so the button grows
 * to contain the badge instead of clipping it.
 */
export function dbInnerRef(
  el: HTMLElement | null,
  setWidth: (w: number | null) => void,
): void {
  if (!el) {
    setWidth(null)
    return
  }
  setWidth(el.scrollWidth)
}

/**
 * Callback ref for the outer <button>.
 * Wires countdown (confirming) and auto-reset (done) timers.
 * Re-call this whenever state changes; call cleanupDbRoot first to clear old timers.
 *
 * @param el        The button element (null on unmount)
 * @param state     Current DbState
 * @param count     Current countdown value
 * @param setCount  State setter for count
 * @param setState  State setter for DbState
 */
export function dbRootRef(
  el: HTMLElement | null,
  state: DbState,
  count: number,
  setCount: (c: number | ((prev: number) => number)) => void,
  setState: (s: DbState) => void,
): void {
  if (!el) return

  const store = el as HTMLElement & DbTimerStore

  // Clear any existing timers before setting new ones
  cleanupDbRoot(el)

  if (state === 'confirming') {
    if (count <= 0) {
      // Transition to done immediately -- no async needed
      setState('done')
      return
    }
    const id = setTimeout(() => {
      setCount((c) => c - 1)
    }, 1000)
    store.__dbCountdown = id
    store.__dbCleanup = () => {
      clearTimeout(id)
      delete store.__dbCountdown
      delete store.__dbCleanup
    }
  } else if (state === 'done') {
    const id = setTimeout(() => {
      setState('idle')
    }, 2100)
    store.__dbReset = id
    store.__dbCleanup = () => {
      clearTimeout(id)
      delete store.__dbReset
      delete store.__dbCleanup
    }
  }
}

export function cleanupDbRoot(el: HTMLElement | null): void {
  if (!el) return
  const store = el as HTMLElement & DbTimerStore
  store.__dbCleanup?.()
  delete store.__dbCleanup
}
