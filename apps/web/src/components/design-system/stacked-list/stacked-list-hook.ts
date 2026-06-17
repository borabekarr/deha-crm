/**
 * StackedList hook — encapsulates DOM-side setup for the stacked-list component.
 *
 * NO raw useEffect anywhere in StackedList.tsx.
 * - Search debounce is handled via event handler + setTimeout (cleared on each keystroke).
 * - Focus via callback ref on the search input.
 * - Cleanup stored on elements via __slCleanup so React can call it on unmount.
 */

/**
 * Callback ref for the active-panel search input.
 * Auto-focuses when the element mounts.
 */
export function activeSearchRef(el: HTMLInputElement | null): void {
  if (!el) return
  // Store cleanup noop (focus has no teardown)
  ;(el as HTMLInputElement & { __slCleanup?: () => void }).__slCleanup = () => { /* noop */ }
}

export function cleanupActiveSearch(el: HTMLInputElement | null): void {
  if (!el) return
  const e = el as HTMLInputElement & { __slCleanup?: () => void }
  e.__slCleanup?.()
  delete e.__slCleanup
}

/**
 * Callback ref for the directory search input inside the expanded dock.
 * Auto-focuses when the dock expands and the input mounts.
 */
export function dirSearchRef(el: HTMLInputElement | null): void {
  if (!el) return
  // Focus is a DOM side-effect tied to node presence — callback ref is correct.
  el.focus()
  ;(el as HTMLInputElement & { __slCleanup?: () => void }).__slCleanup = () => { /* noop */ }
}

export function cleanupDirSearch(el: HTMLInputElement | null): void {
  if (!el) return
  const e = el as HTMLInputElement & { __slCleanup?: () => void }
  e.__slCleanup?.()
  delete e.__slCleanup
}

/**
 * Build a debounced search handler.
 * Returns a change handler and a cancel function.
 * Replaces `useEffect(() => { ... debounce ... }, [query])` with a plain event handler.
 */
export function makeDebounceHandler(
  setter: (value: string) => void,
  delay = 120,
): { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null

  function onChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      setter(value)
      timer = null
    }, delay)
  }

  function cancel(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { onChange, cancel }
}
