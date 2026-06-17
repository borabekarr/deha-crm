/**
 * DynamicCalendar hook — encapsulates all DOM-side behavior.
 *
 * NO raw side-effects anywhere in this folder.
 * All side-effects expressed via callback refs (ref prop on JSX elements).
 *
 * Responsibilities:
 *   1. 30-second "now" ticker — drives countdown text updates
 *   2. Outside-click listener — collapses island when user clicks outside
 *   3. Escape-key listener — collapses island and returns focus
 *
 * Pattern: store cleanup functions on the element itself so the null branch
 * of the callback-ref can tear them down deterministically.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type IslandState = 'compact' | 'preview' | 'expanded'

interface DcRootEl extends HTMLDivElement {
  __dcCleanup?: () => void
}

// ── Callback-ref factory ─────────────────────────────────────────────────────

/**
 * Returns:
 *   rootCallbackRef   — attach to the island-wrap div (outside-click detection)
 *   islandCallbackRef — attach to the dc-island div (focus target on Esc)
 *   setStateFromHook  — call this from React event handlers to keep the hook
 *                       and React state in sync atomically
 *
 * `setReactState` is the React dispatch function (stable identity).
 * `onNowChange` is `setNow` (stable).
 *
 * The hook owns a private `currentState` variable that it updates whenever
 * `setStateFromHook` is called — this avoids any ref.current or mutable-box
 * reads during render.
 */
export function makeDcRefs(
  setReactState: (s: IslandState) => void,
  onNowChange: (d: Date) => void,
) {
  let currentState: IslandState = 'compact'
  let rootEl: DcRootEl | null = null
  let islandEl: HTMLDivElement | null = null

  /** Called from React event handlers whenever state transitions. */
  function setStateFromHook(next: IslandState) {
    currentState = next
    setReactState(next)
  }

  function attach() {
    if (!rootEl || !islandEl) return

    // ── 1. Now ticker (30s) ─────────────────────────────────────────
    const ticker = setInterval(() => onNowChange(new Date()), 30_000)

    // ── 2. Outside-click → compact ──────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      if (currentState === 'compact') return
      if (rootEl && !rootEl.contains(e.target as Node)) {
        setStateFromHook('compact')
      }
    }
    window.addEventListener('mousedown', onMouseDown)

    // ── 3. Escape → compact + refocus island ────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (currentState === 'compact') return
      if (e.key === 'Escape') {
        e.preventDefault()
        setStateFromHook('compact')
        islandEl?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    const cleanup = () => {
      clearInterval(ticker)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }

    if (rootEl) rootEl.__dcCleanup = cleanup
  }

  function detach() {
    rootEl?.__dcCleanup?.()
    if (rootEl) rootEl.__dcCleanup = undefined
  }

  const rootCallbackRef = (el: HTMLDivElement | null) => {
    if (el) {
      rootEl = el as DcRootEl
      if (islandEl) attach()
    } else {
      detach()
      rootEl = null
    }
  }

  const islandCallbackRef = (el: HTMLDivElement | null) => {
    if (el) {
      islandEl = el
      if (rootEl) attach()
    } else {
      islandEl = null
    }
  }

  return { rootCallbackRef, islandCallbackRef, setStateFromHook }
}
