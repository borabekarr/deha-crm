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
  const typed = el as SavedTimerEl & { __ieConfirmCleanup?: () => void; __ieOutsideCleanup?: () => void }
  typed.__ieCleanup?.()
  delete typed.__ieCleanup
  typed.__ieConfirmCleanup?.()
  delete typed.__ieConfirmCleanup
  typed.__ieOutsideCleanup?.()
  delete typed.__ieOutsideCleanup
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

type ConfirmTimerEl = HTMLElement & { __ieConfirmCleanup?: () => void }

/**
 * Register a short confirm-animation timer against the root element so the
 * save commit fires AFTER the button press animation completes (~200ms).
 *
 * Call from inside the save-button mousedown handler (event-driven, not an
 * effect). Cleared on unmount by cleanupIeRoot() via the shared __ieCleanup
 * path, and separately cancellable by calling the returned cleanup fn.
 *
 * @returns a cleanup function to cancel the pending commit.
 */
export function registerConfirmTimer(
  el: HTMLElement | null,
  onCommit: () => void,
  ms: number,
): () => void {
  // Cancel any in-flight confirm timer for this element.
  const typed = el as ConfirmTimerEl | null
  typed?.__ieConfirmCleanup?.()

  const id = setTimeout(onCommit, ms)
  const cleanup = () => clearTimeout(id)

  if (typed) {
    typed.__ieConfirmCleanup = cleanup
  }

  return cleanup
}

type OutsideListenerEl = HTMLElement & { __ieOutsideCleanup?: () => void }

/**
 * Attach a document pointerdown listener that calls onOutside() when the event
 * target is outside el. Cleanup is stored on the element so cleanupIeRoot()
 * (called on unmount via the root callback ref) removes it automatically.
 *
 * Call from inside the startEdit handler (event-driven, not an effect).
 */
export function registerOutsideListener(
  el: HTMLElement | null,
  onOutside: () => void,
): void {
  if (!el) return
  const typed = el as OutsideListenerEl
  // Remove any previously attached listener before registering a new one.
  typed.__ieOutsideCleanup?.()

  const handler = (e: PointerEvent) => {
    if (!el.contains(e.target as Node)) {
      onOutside()
    }
  }
  document.addEventListener('pointerdown', handler)
  typed.__ieOutsideCleanup = () => {
    document.removeEventListener('pointerdown', handler)
    delete (el as OutsideListenerEl).__ieOutsideCleanup
  }
}

/**
 * Remove the document outside-listener for el (call from commit / cancel handlers).
 */
export function cleanupOutsideListener(el: HTMLElement | null): void {
  if (!el) return
  const typed = el as OutsideListenerEl
  typed.__ieOutsideCleanup?.()
}

type FocusedEl = HTMLInputElement & { __ieFocused?: boolean }

/**
 * Callback ref for the <input> element.
 * When `editing` is true: focuses the input and selects all text — ONCE,
 * on the first render after edit mode begins. Subsequent renders while
 * editing is still true are no-ops so typed characters are not clobbered.
 * When `editing` is false: clears the once-guard so the next edit entry
 * triggers focus+select again.
 *
 * Guard stored as `__ieFocused` directly on the element node (no useEffect).
 *
 * Usage in TSX:
 *   <input ref={(el) => ieInputRef(el, editing)} ... />
 */
export function ieInputRef(el: HTMLInputElement | null, editing: boolean): void {
  const typed = el as FocusedEl | null
  if (!typed) return
  if (!editing) {
    // Leaving edit mode — clear guard so next entry fires focus+select.
    delete typed.__ieFocused
    return
  }
  if (typed.__ieFocused) return  // already focused this edit session
  typed.__ieFocused = true
  // Defer by one microtask so the browser has painted the editable state
  // before focus (avoids the rare "focus without visible caret" glitch).
  Promise.resolve().then(() => {
    typed.focus()
    const len = typed.value.length
    typed.setSelectionRange(len, len)
  })
}
