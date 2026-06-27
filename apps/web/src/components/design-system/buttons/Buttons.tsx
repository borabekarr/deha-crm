import { useState } from 'react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Buttons.css'
import DeleteButton from '@/components/design-system/delete-button/DeleteButton'
import { btnRootRef, cleanupBtnRoot, runApplyBtn } from './buttons-hook'

// ---------------------------------------------------------------------------
// ApplyButton — stateful apply specimen mirroring the pipeline-card pattern.
// States: default → is-done (~1800ms) → default.
// Skips loading; transitions directly to check confirmation, then resets.
// NO card removal; the page-variant just returns to rest.
// ---------------------------------------------------------------------------

function ApplyButton() {
  const [phase, setPhase] = useState<'default' | 'loading' | 'done'>('default')

  const phaseClass = phase === 'loading' ? ' is-loading' : phase === 'done' ? ' is-done' : ''

  return (
    <button
      type="button"
      className={`btn-green btn-apply${phaseClass}`}
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

export default function Buttons() {
  return (
    <div className="btn-page-root card">
      <span className="btn-label">Buttons</span>
      <div className="btn-row">
        <button type="button" className="btn-primary">View Your Leads <span className="material-icons btn-mi">arrow_forward</span></button>
        <button type="button" className="btn-inverse">View Your Leads <span className="material-icons btn-mi">arrow_forward</span></button>
        <button type="button" className="btn-glass">Son 30 Gün <span className="material-icons btn-mi">expand_more</span></button>
        <button type="button" className="btn-text">Tüm Görevleri Gör <span className="material-icons btn-mi">arrow_forward</span></button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Apply &amp; Discuss (pipeline-card variants)</span>
      <div className="btn-row">
        {/* Stateful apply button — done → reset */}
        <ApplyButton />
        {/* Ask Jeru — static, inherits rainbow border + softened hover from .btn-apply */}
        <button type="button" className="btn-green btn-apply">
          <span className="material-symbols-outlined btn-apply-icon">neurology</span>
          Ask Jeru
        </button>
        <button type="button" className="btn-discuss">
          <span className="material-icons" style={{ fontSize: 16 }}>chat</span>
          Discuss
        </button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Colorful pill variants (green / yellow / red)</span>
      <div className="btn-row">
        <button type="button" className="btn-green">
          <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span>
          Confirm
        </button>
        <button type="button" className="btn-yellow">
          <span className="material-icons" style={{ fontSize: 16 }}>schedule</span>
          Pending
        </button>
        <button type="button" className="btn-red">
          <span className="material-icons" style={{ fontSize: 16 }}>cancel</span>
          Reject
        </button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Delete (morphing three-state)</span>
      <div className="btn-row">
        <DeleteButton onDelete={() => undefined} />
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Task footer (--fbtn color token)</span>
      <div className="btn-row">
        <button type="button" className="btn-task" style={{ '--fbtn': '#10B981' } as React.CSSProperties}>
          <span className="material-icons btn-task-icon">task_alt</span>
          Mark Done
        </button>
        <button type="button" className="btn-task" style={{ '--fbtn': '#3B82F6' } as React.CSSProperties}>
          <span className="material-icons">edit</span>
          Edit Task
        </button>
        <button type="button" className="btn-task" style={{ '--fbtn': '#F59E0B' } as React.CSSProperties}>
          <span className="material-icons">schedule</span>
          Reschedule
        </button>
        {/* More → Discuss styling */}
        <button type="button" className="btn-discuss"><span className="material-icons" style={{ fontSize: 16 }}>more_horiz</span>More</button>
      </div>
      <span className="btn-label" style={{ marginTop: 20 }}>CTA (optimization report)</span>
      <div className="btn-row">
        <button type="button" className="btn-cta" style={{ '--accent': '#10B981', '--ctaglow': 'rgba(16,185,129,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
        <button type="button" className="btn-cta" style={{ '--accent': '#EF4444', '--ctaglow': 'rgba(239,68,68,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
        <button type="button" className="btn-cta" style={{ '--accent': '#F97316', '--ctaglow': 'rgba(249,115,22,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
        <button type="button" className="btn-cta" style={{ '--accent': '#3B82F6', '--ctaglow': 'rgba(59,130,246,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
        <button type="button" className="btn-cta" style={{ '--accent': '#EAB308', '--ctaglow': 'rgba(234,179,8,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </button>
      </div>
    </div>
  )
}
