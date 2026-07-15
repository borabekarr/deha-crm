/* =========================================================================
   DetailPanel.tsx -- Right-hand detail panel for the Qualification brain UI.

   CONTROLLED component: receives a shared BrainStageController from the
   parent. Does NOT call useBrainStage. Does NOT manage its own typewriter.
   All typing state is read from stage.typewriter (shared instance).

   Conventions:
   - NO raw useEffect (ESLint-enforced).
   - No new deps beyond react, ./brain-hook (types), ./leadMetrics (data).
   ========================================================================= */

import type { BrainStageController } from './brain-hook'
import { BRAIN_SECTIONS } from './leadMetrics'
import { useProximityGroup } from '../../../lib/hooks'

// ── Component ─────────────────────────────────────────────────────────────────

export function DetailPanel({ stage }: { stage: BrainStageController }) {
  const section = BRAIN_SECTIONS.find(s => s.id === stage.activeId)
  const backProxRef = useProximityGroup<HTMLDivElement>()

  // --active drives width/opacity transition; driven by panelOpen so the panel
  // animates shut BEFORE activeId clears (mounted-through-exit pattern).
  const cls = 'ldx-detail-panel' + (stage.panelOpen ? ' ldx-detail-panel--active' : '')

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!section) {
    return (
      <div className={cls}>
        <div className="ldx-dp-bezel">
          <div className="ldx-detail-empty">
            <span className="material-symbols-outlined">psychology</span>
            <span>Pick a region</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Active section ────────────────────────────────────────────────────────────
  const { thinking, typed } = stage.typewriter

  return (
    <div className={cls} ref={backProxRef}>
      {/* Back arrow — outside the bezel so CSS can pin it at panel top-left */}
      <button
        type="button"
        className="ldx-dp-back"
        aria-label="Back"
        onClick={stage.clearSelection}
        data-proximity
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      {/* Grey-bezel container — mirrors .pcx-out pipeline-card surface */}
      <div className="ldx-dp-bezel">
        {/* Colored header band — --sec-color drives the band background in CSS */}
        <div
          className="ldx-dp-header"
          style={{ '--sec-color': section.color } as React.CSSProperties}
        >
          {/* Section icon + label */}
          <span className="material-symbols-outlined ldx-dp-head-icon">{section.icon}</span>
          <span className="ldx-dp-head-label">{section.label}</span>
        </div>

        {/* Persona blurb — driven by shared typewriter */}
        <div className="ldx-detail-blurb">
          {thinking ? (
            <span className="ldx-detail-thinking">
              <span className="ldx-detail-thinking-dot" />
              <span className="ldx-detail-thinking-dot" />
              <span className="ldx-detail-thinking-dot" />
            </span>
          ) : (
            typed
          )}
        </div>

        {/* Chips — pc-tag inset-highlight ring style; stagger via CSS nth-child */}
        <div className="ldx-detail-chips">
          {section.chips.map(chip => (
            <span key={chip} className="ldx-detail-chip ldx-dp-tag">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
