/**
 * Pipeline2 hook — encapsulates the outside-click / Escape dismissal for the
 * stage-detail popovers.
 *
 * NO raw effect hooks anywhere in Pipeline2.tsx. All imperative DOM wiring lives
 * here and is attached through a callback ref on the `.pipeline-2` root
 * element (motion-tabs-hook.ts convention). The listener is removed via a
 * cleanup function that is BOTH returned (React 19 ref-cleanup) and stored on
 * the element (`__p2Cleanup`) so the ref-null path can also unwire it.
 */

type CloseFn = () => void

type P2Element = HTMLElement & { __p2Cleanup?: () => void }

/**
 * Callback ref for the `.pipeline-2` root.
 * Wires a document `pointerdown` listener (outside-click dismissal) and an
 * Escape `keydown` listener that both call `close`. A pointerdown that lands
 * on a stage row is ignored so the row's own click handler owns the toggle.
 * Returns the cleanup function (React 19 ref cleanup).
 */
export function p2RootRef(el: HTMLElement | null, close: CloseFn): (() => void) | void {
  if (!el) return

  function onDocPointerDown(e: PointerEvent): void {
    const target = e.target as Element | null
    // A tap inside a row is handled by the row's own onClick (toggle). The
    // popover is pointer-events:none, so taps land on the row underneath it —
    // switching stages works without special-casing .p2-pop here.
    if (target && target.closest('.p2-row')) return
    close()
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') close()
  }

  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onKeyDown)

  const cleanup = (): void => {
    document.removeEventListener('pointerdown', onDocPointerDown)
    document.removeEventListener('keydown', onKeyDown)
  }

  ;(el as P2Element).__p2Cleanup = cleanup
  return cleanup
}

/** Unwire listeners when the ref is called with null and no cleanup was returned. */
export function cleanupP2Root(el: HTMLElement | null): void {
  if (!el) return
  const e = el as P2Element
  e.__p2Cleanup?.()
  delete e.__p2Cleanup
}
