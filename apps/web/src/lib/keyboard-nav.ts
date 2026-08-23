// ---------------------------------------------------------------------------
// keyboard-nav — shared roving-tabindex index math (WAI-ARIA APG patterns:
// tabs / listbox). Pure function, no DOM/React coupling, so MotionTabs,
// Dropdown, and ModelSelector can each own their own focus/select wiring
// while sharing the "what's the next index" arithmetic.
// ---------------------------------------------------------------------------

export type NavOrientation = 'horizontal' | 'vertical'

/**
 * Given a key event's `key`, the current index, the collection length, and
 * an orientation (horizontal = ArrowLeft/ArrowRight, vertical =
 * ArrowUp/ArrowDown), returns the next index (wrapping at both ends), or
 * `null` if the key isn't a nav key this helper handles. Home/End are
 * orientation-agnostic (jump to first/last).
 */
export function rovingTabIndex(
  key: string,
  current: number,
  length: number,
  orientation: NavOrientation = 'horizontal',
): number | null {
  if (length <= 0) return null
  const cur = current < 0 ? 0 : current
  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
  if (key === prevKey) return (cur - 1 + length) % length
  if (key === nextKey) return (cur + 1) % length
  if (key === 'Home') return 0
  if (key === 'End') return length - 1
  return null
}
