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
 * Given a raw right-click coordinate, compute a clamped `{left, top}` for the
 * Add Elements outer panel. Matches the openAE() logic in the source HTML.
 *
 * Must be called inside a `requestAnimationFrame` so the element already has
 * its layout dimensions (the outer panel must be in the DOM at that point).
 */
export function clampAEPosition(
  x: number,
  y: number,
  outerEl: HTMLElement,
): MenuPos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = outerEl.offsetWidth
  const h = outerEl.offsetHeight

  let nx = x
  let ny = y

  if (nx + w > vw - 10) nx = vw - w - 10
  if (ny + h > vh - 10) ny = vh - h - 10
  if (nx < 10) nx = 10
  if (ny < 10) ny = 10

  return { left: nx, top: ny }
}

// ---------------------------------------------------------------------------
// Nodes flyout position (secondary panel)
// ---------------------------------------------------------------------------

/**
 * Compute `{left, top}` for the Nodes flyout panel.
 * Places it to the right of the Add Elements outer element, vertically aligned
 * with the hovered category row. Matches the showNodes() logic in the source.
 */
export function clampNodesPosition(
  aeOuterEl: HTMLElement,
  itemEl: HTMLElement,
  nodesEl: HTMLElement,
): MenuPos {
  const aeRect = aeOuterEl.getBoundingClientRect()
  const itemRect = itemEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const nw = nodesEl.offsetWidth
  const nh = nodesEl.offsetHeight

  let nx = aeRect.right + 8
  if (nx + nw > vw - 10) nx = aeRect.left - nw - 8
  if (nx < 10) nx = 10

  let ny = itemRect.top - 10
  if (ny + nh > vh - 10) ny = vh - nh - 10
  if (ny < 10) ny = 10

  return { left: nx, top: ny }
}
