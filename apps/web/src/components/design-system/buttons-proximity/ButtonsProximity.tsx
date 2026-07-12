import { useState } from 'react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ButtonsProximity.css'
import DeleteButton from '@/components/design-system/delete-button/DeleteButton'
import { useProximityGroup } from '@/lib/hooks'
import { btnRootRef, cleanupBtnRoot, runApplyBtn } from './buttons-proximity-hook'

// ---------------------------------------------------------------------------
// ButtonsProximity — pilot duplicate of the Buttons page (Phase 2 test).
// Every specimen carries data-proximity; each .btn-row is a proximity group
// (useProximityGroup callback ref on the row container, scanning descendants).
// Original buttons/ page and _shared-feedback.css are untouched (locked).
//
// Interaction Breakdown (emil-design-eng, mandatory before motion code):
// | Part | Interaction | Animate? | Primitive | Easing | Duration |
// |---|---|---|---|---|---|
// | All specimen buttons (rows 1,3,5,6 + Discuss/More + Delete wrapper) | pointer approach, hover/focus | yes | proximity scale+brightness+drop-shadow, composes with each button's existing hover | linear (prox ramp) | var(--duration-instant) |
// | ApplyButton + Ask Jeru (.btn-apply) | pointer approach, hover/focus, press | yes | proximity + existing softened hover; press scale unchanged | linear / existing | var(--duration-instant) / existing |
// | Press feedback (:active scale, all) | click/tap | yes (pre-existing, unchanged) | per-button :active scale | existing per-button | existing per-button |
// ---------------------------------------------------------------------------

function ApplyButton() {
  const [phase, setPhase] = useState<'default' | 'loading' | 'done'>('default')

  const phaseClass = phase === 'loading' ? ' is-loading' : phase === 'done' ? ' is-done' : ''

  return (
    <button
      type="button"
      className={`btn-green btn-apply${phaseClass}`}
      data-proximity
      ref={(el) => {
        btnRootRef(el)
        if (!el) cleanupBtnRoot(el)
      }}
      onClick={(e) => runApplyBtn(e.currentTarget, setPhase)}
    >
      {/* Label — slides left + fades during loading/done */}
      <span className="btn-apply-label">
        <span className="material-symbols-outlined btn-apply-icon">check</span>
        Apply
      </span>
      {/* Radial spinner -- visible only in is-loading */}
      <span className="btn-apply-spinner" aria-hidden="true">
        <svg className="btn-apply-spin-svg" viewBox="0 0 32 32" fill="none">
          <circle className="btn-apply-spin-track" cx="16" cy="16" r="11" />
          <circle className="btn-apply-spin-arc" cx="16" cy="16" r="11" />
        </svg>
      </span>
      {/* Check mark — visible only in is-done */}
      <span className="btn-apply-check" aria-hidden="true">
        <span className="material-symbols-outlined btn-apply-check-ic">check</span>
      </span>
    </button>
  )
}

export default function ButtonsProximity() {
  // One useProximityGroup callback ref per .btn-row: each row is an
  // independent dock-style proximity group (true per-row dock semantics).
  const row1Ref = useProximityGroup<HTMLDivElement>()
  const row2Ref = useProximityGroup<HTMLDivElement>()
  const row3Ref = useProximityGroup<HTMLDivElement>()
  const row4Ref = useProximityGroup<HTMLDivElement>()
  const row5Ref = useProximityGroup<HTMLDivElement>()
  const row6Ref = useProximityGroup<HTMLDivElement>()

  return (
    <div className="btn-prox-root card">
      <span className="btn-label">Buttons Proximity</span>
      <div className="btn-row" ref={row1Ref}>
        <button type="button" className="btn-primary" data-proximity>View Your Leads <span className="material-icons btn-mi">arrow_forward</span></button>
        <button type="button" className="btn-inverse" data-proximity>View Your Leads <span className="material-icons btn-mi">arrow_forward</span></button>
        <button type="button" className="btn-glass" data-proximity>Son 30 Gün <span className="material-icons btn-mi">expand_more</span></button>
        <button type="button" className="btn-text" data-proximity>Tüm Görevleri Gör <span className="material-icons btn-mi">arrow_forward</span></button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Apply &amp; Discuss (pipeline-card variants)</span>
      <div className="btn-row" ref={row2Ref}>
        {/* Stateful apply button — done → reset */}
        <ApplyButton />
        {/* Ask Jeru — static, inherits rainbow border + softened hover from .btn-apply */}
        <button type="button" className="btn-green btn-apply" data-proximity>
          <span className="material-symbols-outlined btn-apply-icon">neurology</span>
          Ask Jeru
        </button>
        <button type="button" className="btn-discuss" data-proximity>
          <span className="material-icons" style={{ fontSize: 16 }}>chat</span>
          Discuss
        </button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Colorful pill variants (green / yellow / red)</span>
      <div className="btn-row" ref={row3Ref}>
        <button type="button" className="btn-green" data-proximity>
          <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span>
          Confirm
        </button>
        <button type="button" className="btn-yellow" data-proximity>
          <span className="material-icons" style={{ fontSize: 16 }}>schedule</span>
          Pending
        </button>
        <button type="button" className="btn-red" data-proximity>
          <span className="material-icons" style={{ fontSize: 16 }}>cancel</span>
          Reject
        </button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Delete (morphing three-state)</span>
      <div className="btn-row" ref={row4Ref}>
        {/* DeleteButton is locked/imported; wrap in a proximity-marked span
            so the pilot's data-proximity contract still reaches it without
            touching the component itself. */}
        <span className="btn-prox-wrap" data-proximity>
          <DeleteButton onDelete={() => undefined} />
        </span>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Task footer (--fbtn color token)</span>
      <div className="btn-row" ref={row5Ref}>
        <button type="button" className="btn-task" data-proximity style={{ '--fbtn': 'var(--brand-primary-500)' } as React.CSSProperties}>
          <span className="material-icons btn-task-icon">task_alt</span>
          Mark Done
        </button>
        <button type="button" className="btn-task" data-proximity style={{ '--fbtn': '#3B82F6' } as React.CSSProperties}>
          <span className="material-icons">edit</span>
          Edit Task
        </button>
        <button type="button" className="btn-task" data-proximity style={{ '--fbtn': '#F59E0B' } as React.CSSProperties}>
          <span className="material-icons">schedule</span>
          Reschedule
        </button>
        {/* More → Discuss styling */}
        <button type="button" className="btn-discuss" data-proximity><span className="material-icons" style={{ fontSize: 16 }}>more_horiz</span>More</button>
      </div>
      <span className="btn-label" style={{ marginTop: 20 }}>CTA (optimization report)</span>
      <div className="btn-row" ref={row6Ref}>
        <button type="button" className="btn-cta" data-proximity style={{ '--accent': 'var(--brand-primary-500)', '--ctaglow': 'var(--brand-glow)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
        <button type="button" className="btn-cta" data-proximity style={{ '--accent': '#EF4444', '--ctaglow': 'rgba(239,68,68,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
        <button type="button" className="btn-cta" data-proximity style={{ '--accent': '#F97316', '--ctaglow': 'rgba(249,115,22,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
        <button type="button" className="btn-cta" data-proximity style={{ '--accent': '#3B82F6', '--ctaglow': 'rgba(59,130,246,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
        <button type="button" className="btn-cta" data-proximity style={{ '--accent': '#EAB308', '--ctaglow': 'rgba(234,179,8,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
      </div>
    </div>
  )
}
