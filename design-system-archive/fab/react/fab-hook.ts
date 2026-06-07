/**
 * FAB hook — encapsulates keyboard listener for the expanding FAB.
 *
 * NO raw useEffect anywhere in this folder.
 * The Escape key listener is wired via a callback ref on the screen element.
 */

type ToggleFn = (open: boolean) => void

/**
 * Callback ref for the .fab-screen element.
 * Wires an Escape keydown listener on the document that closes the FAB.
 * Cleanup is stored on the element so the returned cleanup ref can unwire it.
 */
export function fabScreenRef(el: HTMLDivElement | null, toggle: ToggleFn): void {
  if (!el) return

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') toggle(false)
  }

  document.addEventListener('keydown', onKeyDown)

  ;(el as HTMLDivElement & { __fabCleanup?: () => void }).__fabCleanup = () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

export function cleanupFabScreen(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as HTMLDivElement & { __fabCleanup?: () => void }
  e.__fabCleanup?.()
  delete e.__fabCleanup
}
