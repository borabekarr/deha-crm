/**
 * metric-card-hook.ts — encapsulates keyboard listener for the MetricCard expand overlay.
 *
 * NO raw useEffect anywhere in the metric-card folder.
 * The Escape key listener is wired via a callback ref on the overlay element.
 */

type ToggleFn = (open: boolean) => void

/**
 * Callback ref for the .exp-overlay element.
 * Wires an Escape keydown listener on the document that closes the overlay.
 * Cleanup is stored on the element so the returned cleanup ref can unwire it.
 */
export function expOverlayRef(el: HTMLDivElement | null, toggle: ToggleFn): void {
  if (!el) return

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') toggle(false)
  }

  document.addEventListener('keydown', onKeyDown)

  ;(el as HTMLDivElement & { __expCleanup?: () => void }).__expCleanup = () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

export function cleanupExpOverlay(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as HTMLDivElement & { __expCleanup?: () => void }
  e.__expCleanup?.()
  delete e.__expCleanup
}
