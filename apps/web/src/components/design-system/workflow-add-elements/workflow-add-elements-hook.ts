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
 *    primary panel, aligned to the hovered category row, with viewport clamping.
 *  - Segmented control pill: wire the sliding pill via the shared segRef
 *    callback ref from controls-hook.ts (re-exported for convenience).
 */

// Re-export the shared seg pill wiring so the component only needs one import.
export { segRef, cleanupSeg } from '../controls/controls-hook'

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
 * Compute shell-relative `{left, top}` for the Nodes flyout panel.
 * Places it to the right of the Add Elements outer element, vertically aligned
 * with the hovered category row. Matches the showNodes() logic in the source.
 *
 * All returned coords are relative to shellEl (for `position: absolute`).
 * When shellEl is not provided, returns viewport-absolute coords (legacy).
 */
export function clampNodesPosition(
  aeOuterEl: HTMLElement,
  itemEl: HTMLElement,
  nodesEl: HTMLElement,
  shellEl?: HTMLElement | null,
): MenuPos {
  const aeRect = aeOuterEl.getBoundingClientRect()
  const itemRect = itemEl.getBoundingClientRect()
  const nw = nodesEl.offsetWidth
  const nh = nodesEl.offsetHeight

  const shellRect = shellEl ? shellEl.getBoundingClientRect() : { left: 0, top: 0 }
  const sw = shellEl ? shellEl.offsetWidth : window.innerWidth
  const sh = shellEl ? shellEl.offsetHeight : window.innerHeight

  // Shell-relative x: to the right of the AE panel
  let nx = (aeRect.right - shellRect.left) + 8
  if (nx + nw > sw - 10) nx = (aeRect.left - shellRect.left) - nw - 8
  if (nx < 10) nx = 10

  // Shell-relative y: aligned with the hovered row
  let ny = (itemRect.top - shellRect.top) - 10
  if (ny + nh > sh - 10) ny = sh - nh - 10
  if (ny < 10) ny = 10

  return { left: nx, top: ny }
}
