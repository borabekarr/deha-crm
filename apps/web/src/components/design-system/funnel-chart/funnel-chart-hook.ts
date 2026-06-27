/**
 * FunnelChart hook — geometry helpers and formatter, exported to keep the
 * 4-file folder shape. No DOM side effects; entrance stagger is pure CSS.
 */

/**
 * One segment cell: a smooth trapezoid tapering from `normStart` (left-edge
 * height fraction) to `normEnd` (right-edge height fraction), centred vertically.
 *
 * @param normStart  0-1 normalised left-edge height
 * @param normEnd    0-1 normalised right-edge height
 * @param segW       segment pixel width
 * @param H          segment pixel height
 * @param layerScale 0-1 scale factor for multi-layer halo rings
 * @param straight   when true emit straight lines instead of cubic bezier curves
 */
export function hSegmentPath(
  normStart: number,
  normEnd: number,
  segW: number,
  H: number,
  layerScale: number,
  straight: boolean,
): string {
  const my = H / 2
  const h0 = normStart * H * 0.44 * layerScale
  const h1 = normEnd * H * 0.44 * layerScale

  // Corner radius: capped so corners never exceed the half-heights or width
  const r = Math.max(0, Math.min(8, h0, h1, segW * 0.18))
  // Per-side clamp so corners collapse gracefully when the segment is very thin
  const rL = Math.min(r, h0)
  const rR = Math.min(r, h1)

  if (straight) {
    // Each corner is a quadratic bezier: shorten the incoming/outgoing edges by
    // the corner radius and Q through the actual corner point.
    // Top-left (TL), Top-right (TR), Bottom-right (BR), Bottom-left (BL)
    const tlX = 0,    tlY = my - h0
    const trX = segW, trY = my - h1
    const brX = segW, brY = my + h1
    const blX = 0,    blY = my + h0

    // Start on the left edge, just below TL
    return (
      `M ${tlX} ${tlY + rL}` +
      // TL corner: Q into the top edge
      ` Q ${tlX} ${tlY}, ${tlX + rL} ${tlY}` +
      // Top edge to just before TR
      ` L ${trX - rR} ${trY}` +
      // TR corner: Q into the right edge
      ` Q ${trX} ${trY}, ${trX} ${trY + rR}` +
      // Right edge to just before BR
      ` L ${brX} ${brY - rR}` +
      // BR corner: Q into the bottom edge
      ` Q ${brX} ${brY}, ${brX - rR} ${brY}` +
      // Bottom edge to just before BL
      ` L ${blX + rL} ${blY}` +
      // BL corner: Q into the left edge
      ` Q ${blX} ${blY}, ${blX} ${blY - rL}` +
      // Left edge back up to start (close)
      ` Z`
    )
  }

  // Curved branch: keep the horizontal cubic-bezier taper for top/bottom edges;
  // apply rounding only at the four corners where they meet the vertical edges.
  const cx = segW * 0.55

  // Top edge: starts at TL+rL inset (on left edge), Q rounds into horizontal taper,
  // cubic taper across, then Q rounds into TR corner down the right edge.
  const topStart  = `M 0 ${my - h0 + rL}`
  const tlCorner  = ` Q 0 ${my - h0}, ${rL} ${my - h0}`
  const topCurve  = ` C ${cx} ${my - h0}, ${segW - cx} ${my - h1}, ${segW - rR} ${my - h1}`
  const trCorner  = ` Q ${segW} ${my - h1}, ${segW} ${my - h1 + rR}`

  // Right edge down to BR
  const rightEdge = ` L ${segW} ${my + h1 - rR}`
  const brCorner  = ` Q ${segW} ${my + h1}, ${segW - rR} ${my + h1}`

  // Bottom edge: cubic taper back, then Q into BL corner up the left edge
  const botCurve  = ` C ${segW - cx} ${my + h1}, ${cx} ${my + h0}, ${rL} ${my + h0}`
  const blCorner  = ` Q 0 ${my + h0}, 0 ${my + h0 - rL}`

  return `${topStart}${tlCorner}${topCurve}${trCorner}${rightEdge}${brCorner}${botCurve}${blCorner} Z`
}

/**
 * Compact number formatter: values >= 1 000 are collapsed to "Xk".
 */
export function funnelFmtCompact(v: number): string {
  const rounded = Math.round(v)
  if (rounded >= 1000) {
    const s = (rounded / 1000).toFixed(1).replace(/\.0$/, '')
    return `${s}k`
  }
  return `${rounded}`
}
