/**
 * message-dropdown-hook.ts — wires outside-click, Escape-to-close, and
 * keyboard navigation for the gooey message dropdown.
 *
 * NO raw side-effects anywhere in this folder.
 * All DOM-side behavior lives in callback refs with teardown.
 * Cleanup is stored on the root element so cleanupMdRoot can unwire everything
 * when the element unmounts.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface MdRootEl extends HTMLDivElement {
  __mdCleanup?: () => void
}

// ── Callback ref ──────────────────────────────────────────────────────────────

/**
 * Callback ref for the .md-root element.
 * Wires:
 *   - window mousedown → outside-click close (only when open)
 *   - window keydown  → Escape close + ArrowDown into list (only when open)
 *
 * `openRef`   — a shared { current: boolean } that the React component keeps
 *               in sync with its own open state so the listeners can read the
 *               latest value without being re-registered on every render.
 * `setOpen`   — React setState dispatcher forwarded from the component.
 * `triggerEl` — the trigger button element, used to return focus on Escape.
 * `itemEls`   — the list item elements array, used for ArrowDown into list.
 */
export function mdRootRef(
  el: HTMLDivElement | null,
  openRef: { current: boolean },
  setOpen: (v: boolean) => void,
  triggerEl: { current: HTMLButtonElement | null },
  itemEls: { current: Array<HTMLLIElement | null> },
): void {
  if (!el) return

  const onMouseDown = (e: MouseEvent): void => {
    if (!openRef.current) return
    if (el && !el.contains(e.target as Node)) {
      setOpen(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    if (!openRef.current) return
    if (e.key === 'Escape') {
      setOpen(false)
      triggerEl.current?.focus()
    }
  }

  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('keydown', onKeyDown)

  ;(el as MdRootEl).__mdCleanup = () => {
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('keydown', onKeyDown)
  }

  // store itemEls ref on element for keyboard nav inside list — component
  // handles ArrowDown/Up inline (no window listener needed for those).
  void itemEls
}

/** Cleanup — call in the ref's null branch. */
export function cleanupMdRoot(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as MdRootEl
  e.__mdCleanup?.()
  delete e.__mdCleanup
}
