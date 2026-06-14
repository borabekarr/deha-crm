/**
 * MotionTabs hook — encapsulates keyboard listener for the motion tab dock.
 *
 * NO raw useEffect anywhere in MotionTabs.tsx.
 * The Escape key listener is wired via a callback ref on the root element.
 */

type CloseFn = () => void

/**
 * Callback ref for the .mt-root element.
 * Wires an Escape keydown listener on the document that closes the popup.
 * Cleanup is stored on the element so cleanupMtRoot can unwire it.
 */
export function mtRootRef(el: HTMLElement | null, close: CloseFn): void {
  if (!el) return

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') close()
  }

  document.addEventListener('keydown', onKeyDown)

  ;(el as HTMLElement & { __mtCleanup?: () => void }).__mtCleanup = () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

export function cleanupMtRoot(el: HTMLElement | null): void {
  if (!el) return
  const e = el as HTMLElement & { __mtCleanup?: () => void }
  e.__mtCleanup?.()
  delete e.__mtCleanup
}
