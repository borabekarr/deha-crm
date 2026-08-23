/**
 * workflow-add-elements-hook.ts
 *
 * All imperative DOM logic for WorkflowAddElements lives here.
 * NO raw useEffect in this folder — all DOM side-effects use callback refs.
 *
 * Responsibilities:
 *  - Menu viewport clamping: open the Add Elements panel at the right-click
 *    position, clamped so it never bleeds off-screen.
 *  - Nodes flyout positioning: show the secondary panel to the right of the
 *    primary panel, top-aligned with it, with viewport clamping.
 *  - Segmented control pill: the component drives it directly via
 *    usePillSpring (src/lib/motion-spring.ts), not the shared CSS-transition
 *    segRef — see WorkflowAddElements.tsx for the wiring.
 *  - closeAll/context-menu/tab-switch state transitions (react-doctor
 *    no-giant-component split) — WorkflowAddElements.tsx keeps only thin
 *    wrappers around these.
 */

import { tokenMs } from '@/lib/token-ms'
import { closedState, type MenuState, type Tab } from './workflow-add-elements-shared'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MenuPos {
  left: number
  top: number
}

// ---------------------------------------------------------------------------
// Viewport-clamped position for the Add Elements panel
// ---------------------------------------------------------------------------

/**
 * Given a raw right-click coordinate and the shell container element, compute
 * a clamped `{left, top}` for the Add Elements outer panel expressed as
 * shell-relative offsets (for use with `position: absolute` inside the shell).
 *
 * Must be called inside a `requestAnimationFrame` so the element already has
 * its layout dimensions (the outer panel must be in the DOM at that point).
 */
export function clampAEPosition(
  x: number,
  y: number,
  outerEl: HTMLElement,
  shellEl?: HTMLElement | null,
): MenuPos {
  const w = outerEl.offsetWidth
  const h = outerEl.offsetHeight

  // Compute shell-relative origin so the panel stays anchored to the shell
  // (position: absolute) rather than the viewport (position: fixed).
  // When no shellEl is provided, fall back to viewport coords (legacy).
  const shellRect = shellEl ? shellEl.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
  const sw = shellEl ? (shellEl.offsetWidth) : window.innerWidth
  const sh = shellEl ? (shellEl.offsetHeight) : window.innerHeight

  // Convert viewport coords to shell-relative coords
  let nx = x - shellRect.left
  let ny = y - shellRect.top

  // Clamp inside the shell bounds with 10px margin
  if (nx + w > sw - 10) nx = sw - w - 10
  if (ny + h > sh - 10) ny = sh - h - 10
  if (nx < 10) nx = 10
  if (ny < 10) ny = 10

  return { left: nx, top: ny }
}

// ---------------------------------------------------------------------------
// Nodes flyout position (secondary panel)
// ---------------------------------------------------------------------------

/**
 * Item 1 (Step 9): vertically aligns the
 * flyout to the hovered category ROW instead of always top-aligning with the
 * AE panel — hovering a lower option places the popover lower at the same
 * proportional position (centered on the row), clamped to the visible area
 * so an option near the bottom never pushes the popover off-screen.
 */
export function clampNodesPositionForRow(
  rowEl: HTMLElement,
  aeOuterEl: HTMLElement,
  nodesEl: HTMLElement,
  shellEl?: HTMLElement | null,
): MenuPos {
  const rowRect = rowEl.getBoundingClientRect()
  const aeRect = aeOuterEl.getBoundingClientRect()
  const nw = nodesEl.offsetWidth
  const nh = nodesEl.offsetHeight

  const shellRect = shellEl ? shellEl.getBoundingClientRect() : { left: 0, top: 0 }
  const sw = shellEl ? shellEl.offsetWidth : window.innerWidth
  const sh = shellEl ? shellEl.offsetHeight : window.innerHeight

  let nx = (aeRect.right - shellRect.left) + 8
  if (nx + nw > sw - 10) nx = (aeRect.left - shellRect.left) - nw - 8
  if (nx < 10) nx = 10

  // Shell-relative y: center the flyout on the hovered row's vertical center.
  const rowCenter = rowRect.top + rowRect.height / 2 - shellRect.top
  let ny = rowCenter - nh / 2
  if (ny + nh > sh - 10) ny = sh - nh - 10
  if (ny < 10) ny = 10

  return { left: nx, top: ny }
}

// ---------------------------------------------------------------------------
// Nodes flyout mount/update placement (callback ref body)
// ---------------------------------------------------------------------------

/** Keeps the nodes flyout pinned immediately right of and top-aligned with
 *  the AE panel — hover- and search-driven content share the same anchor
 *  (Fix 1). If the right-placed flyout overflows the shell, slides the AE
 *  card left so the flyout still fits (never flips it to the left). */
export function placeNodesFlyout(
  el: HTMLDivElement,
  aeOuter: HTMLDivElement,
  shell: HTMLDivElement | null,
  hoveredRowRef: { current: HTMLDivElement | null },
  searchModeRef: { current: boolean },
  setAeLeft: (left: number) => void,
): void {
  const placeRight = () => {
    // F7: aeOuter and el are both direct, position:absolute children of the
    // position:relative shell, so offsetTop/offsetLeft are the settled
    // shell-relative layout box — unaffected by the entrance transform.
    const shellRect = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 }
    const shInner = shell ? shell.offsetHeight : window.innerHeight
    const nh = el.offsetHeight
    let nx = aeOuter.offsetLeft + aeOuter.offsetWidth + 8
    if (nx < 10) nx = 10
    // F7: search mode is ALWAYS top-aligned, even if a hoveredRowRef survives
    // from before the search started — searchModeRef is the source of truth.
    const row = searchModeRef.current ? null : hoveredRowRef.current
    let ny: number
    if (row) {
      const rowRect = row.getBoundingClientRect()
      ny = rowRect.top + rowRect.height / 2 - shellRect.top - nh / 2
    } else {
      ny = aeOuter.offsetTop
    }
    if (ny + nh > shInner - 10) ny = shInner - nh - 10
    if (ny < 10) ny = 10
    el.style.left = `${nx}px`
    el.style.top = `${ny}px`
  }

  // Place the flyout at its final position on this frame (no jump).
  placeRight()

  const aeRect = aeOuter.getBoundingClientRect()
  const shellRect = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 }
  const sw = shell ? shell.offsetWidth : window.innerWidth
  const nw = el.offsetWidth
  const aeLeftShell = aeRect.left - shellRect.left
  const nx0 = (aeRect.right - shellRect.left) + 8
  const overflow = nx0 + nw - (sw - 10)
  if (overflow > 0.5) {
    const newAeLeft = Math.max(10, aeLeftShell - overflow)
    if (Math.abs(newAeLeft - aeLeftShell) > 0.5) {
      setAeLeft(newAeLeft)
      // Re-place the flyout against the shifted AE card next frame so it
      // tracks the new right edge — it never visibly jumps because
      // placeRight() above already set a valid position for this frame.
      requestAnimationFrame(placeRight)
    }
  }
}

// ---------------------------------------------------------------------------
// Menu state transitions
// ---------------------------------------------------------------------------

export interface CloseTimers {
  hideTimer: { current: ReturnType<typeof setTimeout> | null }
  searchLeaveTimer: { current: ReturnType<typeof setTimeout> | null }
  searchPendingTimer: { current: ReturnType<typeof setTimeout> | null }
  listLeaveTimer: { current: ReturnType<typeof setTimeout> | null }
}

/** Closes both popovers. When the search flyout is on screen, reuses its own
 *  mounted-through-exit close animation instead of unmounting it instantly,
 *  so both popovers close in the same frame. */
export function closeAllMenus(
  timers: CloseTimers,
  hoveredRowRef: { current: HTMLDivElement | null },
  searchModeRef: { current: boolean },
  state: MenuState,
  setState: (updater: (s: MenuState) => MenuState) => void,
): void {
  if (timers.hideTimer.current) clearTimeout(timers.hideTimer.current)
  if (timers.searchLeaveTimer.current) clearTimeout(timers.searchLeaveTimer.current)
  if (timers.searchPendingTimer.current) clearTimeout(timers.searchPendingTimer.current)
  if (timers.listLeaveTimer.current) clearTimeout(timers.listLeaveTimer.current)
  hoveredRowRef.current = null
  searchModeRef.current = false

  const wasSearching = state.searchPanelMounted && !state.searchPanelLeaving
  if (wasSearching) {
    setState((s) => ({ ...closedState(s), searchPanelMounted: true, searchPanelLeaving: true }))
    // Unmount after the flyout's reverse-morph exit (--duration-280, live
    // read via tokenMs) plus a 20ms buffer.
    timers.searchLeaveTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, searchPanelMounted: false, searchPanelLeaving: false }))
    }, tokenMs('--duration-280', 280) + 20)
  } else {
    // Use closedState (not INITIAL) to preserve aeLeft/aeTop so the fade-out
    // stays in place instead of jumping to the viewport left edge.
    setState((s) => closedState(s))
  }
}

/** Open the Add Elements panel clamped to the right-click position (F7:
 *  reopening elsewhere fully resets the search/nodes flyout group first, so
 *  no orphaned popover keeps a stale position or lingers as a blur ghost). */
export function openContextMenu(
  e: { preventDefault: () => void; clientX: number; clientY: number },
  shellEl: HTMLDivElement | null,
  aeOuterRef: { current: HTMLDivElement | null },
  timers: Pick<CloseTimers, 'hideTimer' | 'searchLeaveTimer' | 'searchPendingTimer'>,
  hoveredRowRef: { current: HTMLDivElement | null },
  searchModeRef: { current: boolean },
  setState: (updater: (s: MenuState) => MenuState) => void,
): void {
  e.preventDefault()
  const x = e.clientX
  const y = e.clientY

  // Convert viewport coords to shell-relative coords immediately so the panel
  // is never placed at shell-relative 0,0 (top-left) on the first render.
  const shellRect = shellEl ? shellEl.getBoundingClientRect() : { left: 0, top: 0 }
  const initialLeft = x - shellRect.left
  const initialTop = y - shellRect.top

  if (timers.hideTimer.current) clearTimeout(timers.hideTimer.current)
  if (timers.searchLeaveTimer.current) clearTimeout(timers.searchLeaveTimer.current)
  if (timers.searchPendingTimer.current) clearTimeout(timers.searchPendingTimer.current)
  hoveredRowRef.current = null
  searchModeRef.current = false

  // Show the panel at the shell-relative coordinates first so the element gets layout.
  // Then clamp in a rAF once the panel has real dimensions.
  setState((s) => ({
    ...s,
    aeVisible: true,
    aeLeft: initialLeft,
    aeTop: initialTop,
    nodesVisible: false,
    nodesLeft: 0,
    nodesTop: 0,
    hoveredId: null,
    search: '',
    searchPanelMounted: false,
    searchPanelLeaving: false,
    searchPending: false,
  }))

  // Clamp after layout is computed (panel must be in DOM for offsetWidth/Height)
  requestAnimationFrame(() => {
    const outer = aeOuterRef.current
    if (!outer) return
    const pos = clampAEPosition(x, y, outer, shellEl)
    setState((s) => ({ ...s, aeLeft: pos.left, aeTop: pos.top }))
  })
}

/** True when `target` is outside both the AE panel and the nodes flyout
 *  (verbatim De Morgan form of the original two-branch condition). */
export function isOutsideBothPanels(
  target: Node,
  aeOuter: HTMLDivElement | null,
  nodesOuter: HTMLDivElement | null,
): boolean {
  if (aeOuter && !aeOuter.contains(target) && nodesOuter && !nodesOuter.contains(target)) return true
  if (aeOuter && !aeOuter.contains(target) && !nodesOuter) return true
  return false
}

/** Direction-aware category-list tab switch (Fix 3): the outgoing tab stays
 *  mounted as a ghost layer until its exit animation completes. */
export function switchTabAnimation(
  tab: Tab,
  state: MenuState,
  setState: (updater: (s: MenuState) => MenuState) => void,
  listLeaveTimer: { current: ReturnType<typeof setTimeout> | null },
  measurePill: (tab: Tab) => void,
  listWrapEl: HTMLDivElement | null,
): void {
  if (tab === state.activeTab) return
  if (listLeaveTimer.current) clearTimeout(listLeaveTimer.current)
  setState((s) => ({
    ...s,
    activeTab: tab,
    listLeavingTab: s.activeTab,
    hoveredId: null,
    nodesVisible: false,
  }))
  measurePill(tab)
  // Unmount the ghost layer once its exit animation completes: reads the
  // scoped --panel-slide-exit-dur override on .wae-ae-list-wrap live via
  // tokenMs, plus a 20ms buffer.
  listLeaveTimer.current = setTimeout(() => {
    setState((s) => ({ ...s, listLeavingTab: null }))
  }, tokenMs('--panel-slide-exit-dur', 150, listWrapEl ?? document.documentElement) + 20)
}
