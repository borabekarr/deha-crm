/**
 * InlineEdit hook utilities — encapsulates all DOM side-effects.
 *
 * NO raw useEffect anywhere in InlineEdit.tsx.
 *
 * Patterns used (mirrors motion-tabs-hook.ts style):
 *  - Focus + select via callback ref on <input> (replaces useEffect #1 in source).
 *  - Keydown (Enter/Escape) listener via callback ref on the field (replaces
 *    the implicit DOM coupling; handlers are pure here).
 *  - Saved-flash timer set inside the save handler, NOT in an effect.
 *    Cleanup stored on root element so unmount via callback ref clears it
 *    (replaces useEffect #2 "clearTimeout on unmount" in source).
 *
 * The three App-level useEffects (value resync, dark-mode toggle, seed on
 * tweak change) are not ported — they belong to the prototype shell only
 * and are superseded by the component's prop interface and its callers.
 */

type SavedTimerEl = HTMLElement & { __ieCleanup?: () => void }

/**
 * Callback ref attached to the root .ie-field div.
 * Stores a cleanup function that clears any in-flight saved-badge timer so
 * no stale setState fires after the component unmounts.
 */
export function ieRootRef(el: HTMLElement | null): void {
  if (!el) return
  // Cleanup stub — real timer handle registered by registerSavedTimer().
  const typed = el as SavedTimerEl
  if (!typed.__ieCleanup) {
    typed.__ieCleanup = () => {}
  }
}

export function cleanupIeRoot(el: HTMLElement | null): void {
  if (!el) return
  const typed = el as SavedTimerEl
  typed.__ieCleanup?.()
  delete typed.__ieCleanup
}

/**
 * Register a new saved-badge timer against the root element so it can be
 * cancelled both by a subsequent save and by unmount cleanup.
 *
 * Call from inside the save handler (event-driven, not an effect).
 *
 * @returns the numeric timer id (so caller can also hold a ref for
 *          double-save cancellation).
 */
export function registerSavedTimer(
  el: HTMLElement | null,
  onExpire: () => void,
  ms: number,
): ReturnType<typeof setTimeout> {
  // Cancel any existing timer stored on this element.
  const typed = el as SavedTimerEl | null
  typed?.__ieCleanup?.()

  const id = setTimeout(onExpire, ms)

  if (typed) {
    typed.__ieCleanup = () => clearTimeout(id)
  }

  return id
}

/**
 * Callback ref for the <input> element.
 * When `editing` is true: focuses the input and selects all text.
 * When false (input leaving DOM or editing turned off): no-op.
 *
 * Usage in TSX:
 *   <input ref={(el) => ieInputRef(el, editing)} ... />
 */
export function ieInputRef(el: HTMLInputElement | null, editing: boolean): void {
  if (!el || !editing) return
  // Defer by one microtask so the browser has painted the editable state
  // before focus (avoids the rare "focus without visible caret" glitch).
  Promise.resolve().then(() => {
    el.focus()
    el.setSelectionRange(0, el.value.length)
  })
}
