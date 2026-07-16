/* =========================================================================
   FilterColumn.tsx -- Left vertical filter column listing all nine brain
   sections for the Qualification tab.

   CONTROLLED: does NOT call useBrainStage. Parent passes the shared
   BrainStageController down so filter and brain stay in sync and the
   typewriter fires on every row click.
   ========================================================================= */

import type { BrainStageController } from './brain-hook'
import { BRAIN_SECTIONS } from './leadMetrics'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'

// ── Component ─────────────────────────────────────────────────────────────────

export function FilterColumn({ stage }: { stage: BrainStageController }) {
  const filterProxRef = useProximityGroup<HTMLDivElement>()
  return (
    <div className="ldx-brain-filter" ref={filterProxRef}>
      {BRAIN_SECTIONS.map((section) => {
        const isActive  = stage.activeId === section.id
        const isHovered = stage.hoveredId === section.id
        const isDimmed  = stage.hoveredId !== null && !isHovered

        const cls = [
          'ldx-brain-filter-item',
          isActive  ? 'ldx-brain-filter-item--on'      : '',
          isHovered ? 'ldx-brain-filter-item--hovered'  : '',
          isDimmed  ? 'ldx-brain-filter-item--dimmed'   : '',
        ].filter(Boolean).join(' ')

        return (
          <button
            key={section.id}
            type="button"
            className={cls}
            style={{ '--sec-color': section.color } as React.CSSProperties}
            onClick={() => stage.selectSection(section.id, section)}
            onPointerEnter={() => stage.setHovered(section.id)}
            onPointerLeave={() => stage.setHovered(null)}
            aria-pressed={isActive}
            data-proximity
          >
            {/* Color indicator dot — picks up --sec-color from the button */}
            <span className="ldx-brain-filter-dot" aria-hidden="true" />
            <span className="material-symbols-outlined">{section.icon}</span>
            <span className="ldx-brain-filter-label">{section.label}</span>
          </button>
        )
      })}
    </div>
  )
}
