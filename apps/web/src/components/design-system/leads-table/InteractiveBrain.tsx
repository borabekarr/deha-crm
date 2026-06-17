/* =========================================================================
   InteractiveBrain.tsx -- Nine-piece image brain for the Qualification tab.
   Each of the nine brain regions is a separate <img> slice positioned
   absolutely inside .ldx-brain-canvas using percentages of BRAIN_CANVAS (800).

   CONTROLLED: does NOT own any state. Parent owns one BrainStageController
   instance (via useBrainStage) and passes it in via the `stage` prop.

   Nine region hotspots are mapped one-to-one to BRAIN_SECTIONS ids.
   Each <img> gets:
     - data-section-id="<id>"         → CSS targeting
     - className ldx-brain-piece      → base class for all region pieces
     - class is-active                → added when stage.activeId === id
     - class is-hovered               → added when stage.hoveredId === id
     - --sec-color CSS custom prop    → used by Step 3 CSS glow/ring

   Labels appear centered below each piece as .ldx-brain-piece-label spans.

   Class prefix: ldx-brain-*
   No SVG redraw. No useEffect. Valid TypeScript.
   ========================================================================= */

import type { BrainStageController } from './brain-hook'
import { BRAIN_SECTIONS } from './leadMetrics'
import { BRAIN_CANVAS, BRAIN_REGION_BOXES, BRAIN_HIT_N, BRAIN_HIT_GRID } from './brainRegions'

// ── Hit-grid helper ───────────────────────────────────────────────────────────
// Returns the BRAIN_SECTIONS index (0-8) for the topmost opaque piece at the
// given normalised canvas coords (nx, ny in [0,1]), or -1 if transparent.
// Pure function — no hooks, no side-effects.
function hitTest(nx: number, ny: number): number {
  const gx = Math.min(BRAIN_HIT_N - 1, Math.max(0, Math.floor(nx * BRAIN_HIT_N)))
  const gy = Math.min(BRAIN_HIT_N - 1, Math.max(0, Math.floor(ny * BRAIN_HIT_N)))
  const ch = BRAIN_HIT_GRID[gy * BRAIN_HIT_N + gx]
  return ch === '.' ? -1 : Number(ch)
}

// ── Leader-line geometry (pure) ───────────────────────────────────────────────
// For a given section, return the canvas-% coordinates of:
//   anchor  — the piece centre (where the leader line starts, on the piece)
//   chip    — the label position (where the line ends), pushed OUTWARD from the
//             canvas centre and clamped inside [CHIP_MARGIN, 100-CHIP_MARGIN] so
//             side-by-side pieces never collide and the chip never leaves stage.
// Coordinates are percentages (0-100) of the square BRAIN_CANVAS so the SVG
// (viewBox 0 0 100 100) and the absolutely-positioned chip share one space.
const CHIP_PUSH = 26    // how far (in canvas %) to push the chip out from centre
const CHIP_MARGIN = 3   // keep chip endpoint this far from the canvas edges
function leaderGeom(sectionId: string) {
  const box = BRAIN_REGION_BOXES[sectionId]
  if (!box) return null
  const ax = ((box.x + box.w / 2) / BRAIN_CANVAS) * 100
  const ay = ((box.y + box.h / 2) / BRAIN_CANVAS) * 100
  // direction away from canvas centre (50,50)
  let dx = ax - 50, dy = ay - 50
  const len = Math.hypot(dx, dy) || 1
  dx /= len; dy /= len
  let cx = ax + dx * CHIP_PUSH
  let cy = ay + dy * CHIP_PUSH
  // clamp so the chip stays on-stage (collision-free + never clipped)
  cx = Math.max(CHIP_MARGIN, Math.min(100 - CHIP_MARGIN, cx))
  cy = Math.max(CHIP_MARGIN, Math.min(100 - CHIP_MARGIN, cy))
  return { ax, ay, cx, cy }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InteractiveBrain({ stage }: { stage: BrainStageController }) {
  // Exactly ONE leader line + chip is shown at a time: the hovered piece wins,
  // else the active (selected) piece. This is derived state — no effect.
  const focusId = stage.hoveredId ?? stage.activeId
  const focusSection = focusId ? BRAIN_SECTIONS.find(s => s.id === focusId) : undefined
  const geom = focusId ? leaderGeom(focusId) : null

  return (
    <div className="ldx-brain">
      <div className="ldx-brain-canvas">
        {/* Assembled base — the 9 pieces are an exact partition cut from this
            image, so the default state is pixel-identical to default.png and the
            base also seals any sub-pixel seam under the overlaid pieces. */}
        <img
          src="/brain-ref/default.png"
          alt=""
          draggable={false}
          className="ldx-brain-base"
        />

        {/* Visual pieces — pointer-events disabled; overlay handles all hit-testing */}
        {BRAIN_SECTIONS.map(section => {
          const box = BRAIN_REGION_BOXES[section.id]
          if (!box) return null

          const isActive  = stage.activeId === section.id
          const isHovered = stage.hoveredId === section.id

          // Hovered/active lobe gets focus; siblings get dimmed when any piece is hovered/active.
          const anyFocused = stage.hoveredId !== null || stage.activeId !== null
          const isDimmed = anyFocused && !isActive && !isHovered
          const pieceClass = [
            'ldx-brain-piece',
            isActive  ? 'is-active'  : '',
            isHovered ? 'is-hovered' : '',
            isDimmed  ? 'is-dimmed'  : '',
          ].filter(Boolean).join(' ')

          // Positions as percentages of BRAIN_CANVAS
          const left   = `${(box.x / BRAIN_CANVAS) * 100}%`
          const top    = `${(box.y / BRAIN_CANVAS) * 100}%`
          const width  = `${(box.w / BRAIN_CANVAS) * 100}%`
          const height = `${(box.h / BRAIN_CANVAS) * 100}%`

          return (
            <div
              key={section.id}
              className="ldx-brain-piece-wrapper"
              style={{ position: 'absolute', left, top, width, height, pointerEvents: 'none' }}
            >
              <img
                src={`/brain-ref/regions/region-${section.id}.png`}
                alt=""
                draggable={false}
                data-section-id={section.id}
                className={pieceClass}
                style={
                  {
                    '--sec-color': section.color,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'fill',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  } as React.CSSProperties
                }
              />
            </div>
          )
        })}

        {/* ── Leader line + label chip — ONE at a time ──────────────────────
            Both live OUTSIDE the per-piece wrapper, so the piece's hover
            scale(1.08) never distorts the line stroke or the chip text. The
            SVG spans the canvas (viewBox 0 0 100 100) and uses
            non-scaling-stroke so the connector stays 1.5px crisp at any DPI /
            canvas size. The chip is pushed outward + clamped on-stage so
            side-by-side pieces never overlap their labels. */}
        <svg
          className="ldx-brain-leaders"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {geom && focusSection && (
            <>
              <line
                x1={geom.ax} y1={geom.ay} x2={geom.cx} y2={geom.cy}
                className="ldx-leader-line is-on"
                stroke={focusSection.color}
              />
              <circle
                cx={geom.ax} cy={geom.ay} r={1.6}
                className="ldx-leader-anchor"
                fill={focusSection.color}
              />
            </>
          )}
        </svg>

        {geom && focusSection && (
          <span
            className="ldx-leader-chip is-on"
            style={{
              position: 'absolute',
              left: `${geom.cx}%`,
              top: `${geom.cy}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {focusSection.label}
          </span>
        )}

        {/* Single overlay hit-tester — covers full canvas, dispatches to correct section */}
        <div
          className="ldx-brain-hit"
          style={{ position: 'absolute', inset: 0, zIndex: 10 }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width
            const ny = (e.clientY - r.top) / r.height
            if (nx < 0 || nx > 1 || ny < 0 || ny > 1) { stage.setHovered(null); return }
            const idx = hitTest(nx, ny)
            stage.setHovered(idx >= 0 ? BRAIN_SECTIONS[idx].id : null)
          }}
          onPointerLeave={() => stage.setHovered(null)}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width
            const ny = (e.clientY - r.top) / r.height
            const idx = hitTest(nx, ny)
            if (idx >= 0) {
              const s = BRAIN_SECTIONS[idx]
              stage.selectSection(s.id, s)
            }
          }}
        />

        {/* Screen-reader / keyboard a11y buttons — visually hidden, pointer-events none */}
        {BRAIN_SECTIONS.map(section => (
          <button
            type="button"
            key={`sr-${section.id}`}
            className="ldx-brain-sr-btn"
            aria-label={section.label}
            aria-pressed={stage.activeId === section.id}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
              border: 0,
              pointerEvents: 'none',
            }}
            onClick={() => stage.selectSection(section.id, section)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </div>
  )
}
