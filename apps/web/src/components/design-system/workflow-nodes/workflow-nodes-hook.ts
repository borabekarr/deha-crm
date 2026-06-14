/**
 * workflow-nodes-hook.ts
 *
 * All imperative DOM logic for WorkflowNodes lives here.
 * NO raw useEffect in this folder — all DOM side-effects use callback refs.
 *
 * Responsibilities:
 *  - Drag-to-connect: pointer down on a `.wf-tool.connect` button starts a
 *    SVG rubber-band preview line anchored to the button center. The line
 *    follows the pointer across the canvas and is removed on pointer up.
 *  - The canvas element ref is stored so pointer moves can be measured in
 *    canvas-local coordinates.
 *
 * Pattern mirrors chart-hook.ts: pure DOM functions, no React imports,
 * cleanup stored on the element itself.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Coordinates in the canvas coordinate space (relative to canvas top-left). */
export interface Point {
  x: number
  y: number
}

// ---------------------------------------------------------------------------
// Canvas callback ref
// ---------------------------------------------------------------------------

/**
 * Mounts pointer-move tracking on the canvas element so the SVG rubber-band
 * line can follow the cursor.
 *
 * Stores cleanup on the element; call `cleanupCanvas` on unmount.
 */
export function mountCanvas(
  canvasEl: HTMLDivElement,
  svgEl: SVGSVGElement,
): () => void {
  // Track an active drag: from-point + the live <line> element.
  let dragLine: SVGLineElement | null = null
  let fromX = 0
  let fromY = 0

  function getCanvasPoint(e: PointerEvent): Point {
    const rect = canvasEl.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  /** Begin a rubber-band line from the center of the connect button. */
  function startDrag(e: PointerEvent, connectBtn: HTMLElement): void {
    const btnRect = connectBtn.getBoundingClientRect()
    const canvasRect = canvasEl.getBoundingClientRect()
    fromX = btnRect.left + btnRect.width / 2 - canvasRect.left
    fromY = btnRect.top + btnRect.height / 2 - canvasRect.top

    // Create SVG line element
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', String(fromX))
    line.setAttribute('y1', String(fromY))
    line.setAttribute('x2', String(fromX))
    line.setAttribute('y2', String(fromY))
    line.setAttribute('stroke', '#10B981')
    line.setAttribute('stroke-width', '2')
    line.setAttribute('stroke-dasharray', '6 4')
    line.setAttribute('stroke-linecap', 'round')
    line.setAttribute('opacity', '0.85')
    svgEl.appendChild(line)
    dragLine = line

    // Capture pointer so moves reach us even outside the button
    canvasEl.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragLine) return
    const pt = getCanvasPoint(e)
    dragLine.setAttribute('x2', String(pt.x))
    dragLine.setAttribute('y2', String(pt.y))
  }

  function endDrag(): void {
    if (dragLine) {
      svgEl.removeChild(dragLine)
      dragLine = null
    }
  }

  // Delegate pointer-down from connect buttons through the canvas
  function onPointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement
    if (target.closest('.wf-tool.connect')) {
      e.preventDefault()
      startDrag(e, target.closest('.wf-tool.connect') as HTMLElement)
    }
  }

  canvasEl.addEventListener('pointerdown', onPointerDown)
  canvasEl.addEventListener('pointermove', onPointerMove)
  canvasEl.addEventListener('pointerup', endDrag)
  canvasEl.addEventListener('pointercancel', endDrag)

  return function cleanup() {
    canvasEl.removeEventListener('pointerdown', onPointerDown)
    canvasEl.removeEventListener('pointermove', onPointerMove)
    canvasEl.removeEventListener('pointerup', endDrag)
    canvasEl.removeEventListener('pointercancel', endDrag)
    if (dragLine) {
      try { svgEl.removeChild(dragLine) } catch { /* noop */ }
      dragLine = null
    }
  }
}
