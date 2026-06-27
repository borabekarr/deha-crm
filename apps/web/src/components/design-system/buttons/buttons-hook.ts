/**
 * buttons-hook.ts — DOM-side behavior for the Buttons page specimens.
 *
 * NO raw useEffect anywhere in the buttons/ folder.
 * All side-effects are expressed via callback refs or event handlers.
 *
 * Mirrors inline-edit-hook.ts pattern:
 *  - Timer handles stored directly on the DOM node (__btnCleanup).
 *  - Callback ref clears timers on unmount so no stale setState fires.
 *  - runApplyBtn mirrors pipeline-card-hook.ts runApply (loading→done→reset).
 */

type BtnTimerEl = HTMLElement & { __btnCleanup?: () => void }

/**
 * Callback ref attached to the Apply button root element.
 * Registers a no-op cleanup stub on first mount so registerBtnTimer
 * can safely call it without a null-check guard.
 */
export function btnRootRef(el: HTMLElement | null): void {
  if (!el) return
  const typed = el as BtnTimerEl
  if (!typed.__btnCleanup) {
    typed.__btnCleanup = () => {}
  }
}

export function cleanupBtnRoot(el: HTMLElement | null): void {
  if (!el) return
  const typed = el as BtnTimerEl
  typed.__btnCleanup?.()
  delete typed.__btnCleanup
}

/**
 * Register a new timer against the button element so it can be cancelled
 * both by a subsequent click and by unmount cleanup.
 *
 * Call from inside click handlers (event-driven, not an effect).
 */
export function registerBtnTimer(
  el: HTMLElement | null,
  onExpire: () => void,
  ms: number,
): ReturnType<typeof setTimeout> {
  const typed = el as BtnTimerEl | null
  typed?.__btnCleanup?.()

  const id = setTimeout(onExpire, ms)

  if (typed) {
    typed.__btnCleanup = () => clearTimeout(id)
  }

  return id
}

/**
 * State machine for the Apply button specimen.
 * default → is-loading (~700ms) → is-done (~1800ms) → reset to default.
 * Mirrors pipeline-card-hook.ts runApply exactly (loading spinner → check pop).
 * NO card removal — this is the page-variant; it just returns to rest.
 *
 * @param btn  The button DOM element.
 * @param setPhase  React setState dispatcher — updates class-driving state.
 */
export function runApplyBtn(
  btn: HTMLElement | null,
  setPhase: (phase: 'default' | 'loading' | 'done') => void,
): void {
  if (!btn) return
  // Guard: ignore clicks while already animating.
  if (btn.classList.contains('is-loading') || btn.classList.contains('is-done')) return

  setPhase('loading')
  // Hold loading bar ~3 s (driven by --anim-mult in CSS for visual durations;
  // the timer here is a fixed real-time hold — multiply by a sensible baseline).
  registerBtnTimer(btn, () => {
    setPhase('done')
    // Hold done state ~3 s then reset.
    registerBtnTimer(btn, () => {
      setPhase('default')
    }, 3000)
  }, 3000)
}
