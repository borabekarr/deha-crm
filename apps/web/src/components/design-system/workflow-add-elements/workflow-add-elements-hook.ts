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
 */

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
 * Anchored immediately to the right of the Add Elements outer element,
 * top-aligned with it (never row-relative — a per-row anchor drifted the
 * flyout out of the "immediately adjacent, top-aligned" spec as the user
 * hovered further down the list). Matches the showNodes() logic in the source.
 *
 * All returned coords are relative to shellEl (for `position: absolute`).
 * When shellEl is not provided, returns viewport-absolute coords (legacy).
 */
export function clampNodesPosition(
  aeOuterEl: HTMLElement,
  nodesEl: HTMLElement,
  shellEl?: HTMLElement | null,
): MenuPos {
  const aeRect = aeOuterEl.getBoundingClientRect()
  const nw = nodesEl.offsetWidth
  const nh = nodesEl.offsetHeight

  const shellRect = shellEl ? shellEl.getBoundingClientRect() : { left: 0, top: 0 }
  const sw = shellEl ? shellEl.offsetWidth : window.innerWidth
  const sh = shellEl ? shellEl.offsetHeight : window.innerHeight

  // Shell-relative x: immediately to the right of the AE panel
  let nx = (aeRect.right - shellRect.left) + 8
  if (nx + nw > sw - 10) nx = (aeRect.left - shellRect.left) - nw - 8
  if (nx < 10) nx = 10

  // Shell-relative y: top-aligned with the AE panel
  let ny = aeRect.top - shellRect.top
  if (ny + nh > sh - 10) ny = sh - nh - 10
  if (ny < 10) ny = 10

  return { left: nx, top: ny }
}
