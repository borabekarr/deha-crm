import { useCallback, useRef } from 'react'

/**
 * Attaches a keydown listener to `window` for the lifetime of the root
 * element.  Implemented as a callback-ref so no direct side-effects are
 * called at the component level (no direct side-effects).
 *
 * The escape handler is stored in a ref so the listener never needs to be
 * re-registered when state changes; the ref is updated inside the
 * callback-ref (not during render).
 */
export function useAiComposerKeydown(
  initialEscapeHandler: () => void,
): {
  rootRef: (el: HTMLElement | null) => void
  /** Call this in an event handler (not during render) to update the escape handler. */
  setEscapeHandler: (fn: () => void) => void
} {
  const handlerRef = useRef<() => void>(initialEscapeHandler)
  const cleanupRef = useRef<(() => void) | null>(null)

  const setEscapeHandler = useCallback((fn: () => void) => {
    handlerRef.current = fn
  }, [])

  const rootRef = useCallback((el: HTMLElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    if (!el) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handlerRef.current()
      }
    }

    window.addEventListener('keydown', onKey)
    cleanupRef.current = () => window.removeEventListener('keydown', onKey)
  }, [])

  return { rootRef, setEscapeHandler }
}
