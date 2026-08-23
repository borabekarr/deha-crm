import { useState } from 'react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Buttons.css'
import { useProximityGroup } from '@/lib/hooks'
import { btnRootRef, cleanupBtnRoot, runApplyBtn } from './buttons-hook'
import { BUTTON_VARIANT_CLASS, type ButtonProps } from './variants'

// ---------------------------------------------------------------------------
// Button — importable specimen shared by consumers (WorkflowAddElements,
// DeleteModal) and the demo rows below, mirroring the Toast-split pattern.
// Not exported via `export function`/`export const` (Fast Refresh isolation
// check); re-exported with a bare `export { Button }` at file end instead.
// ---------------------------------------------------------------------------
function Button({ variant, variant2, className, children, ...rest }: ButtonProps) {
  const cls = [BUTTON_VARIANT_CLASS[variant], variant2 ? BUTTON_VARIANT_CLASS[variant2] : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" className={cls} data-proximity {...rest}>
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// ApplyButton — stateful apply specimen mirroring the pipeline-card pattern.
// States: default → loading (~3000ms) → done (~4500ms) → default.
// Runs the full loading spinner before flipping to the check confirmation,
// then resets. NO card removal; the page-variant just returns to rest.
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

export default function Buttons() {
  const row1Ref = useProximityGroup<HTMLDivElement>()
  const row2Ref = useProximityGroup<HTMLDivElement>()
  const row3Ref = useProximityGroup<HTMLDivElement>()
  const row5Ref = useProximityGroup<HTMLDivElement>()
  const row6Ref = useProximityGroup<HTMLDivElement>()

  return (
    <div className="btn-page-root card card--flat">
      <span className="btn-label">Buttons</span>
      <div className="btn-row" ref={row1Ref}>
        <Button variant="primary">View Your Leads <span className="material-icons btn-mi">arrow_forward</span></Button>
        <Button variant="inverse">View Your Leads <span className="material-icons btn-mi">arrow_forward</span></Button>
        <Button variant="glass">Son 30 Gün <span className="material-icons btn-mi">expand_more</span></Button>
        <Button variant="text">Tüm Görevleri Gör <span className="material-icons btn-mi">arrow_forward</span></Button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Apply &amp; Discuss (pipeline-card variants)</span>
      <div className="btn-row" ref={row2Ref}>
        {/* Stateful apply button — done → reset */}
        <ApplyButton />
        {/* Ask Jeru — static, inherits rainbow border + softened hover from .btn-apply */}
        <Button variant="green" variant2="apply">
          <span className="material-symbols-outlined btn-apply-icon">neurology</span>
          Ask Jeru
        </Button>
        <Button variant="discuss">
          <span className="material-icons" style={{ fontSize: 16 }}>chat</span>
          Discuss
        </Button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Colorful pill variants (green / yellow / red)</span>
      <div className="btn-row" ref={row3Ref}>
        <Button variant="green">
          <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span>
          Confirm
        </Button>
        <Button variant="yellow">
          <span className="material-icons" style={{ fontSize: 16 }}>schedule</span>
          Pending
        </Button>
        <Button variant="red">
          <span className="material-icons" style={{ fontSize: 16 }}>cancel</span>
          Reject
        </Button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Task footer (--fbtn color token)</span>
      <div className="btn-row" ref={row5Ref}>
        <Button variant="task" style={{ '--fbtn': 'var(--brand-primary-500)' } as React.CSSProperties}>
          <span className="material-icons btn-task-icon">task_alt</span>
          Mark Done
        </Button>
        <Button variant="task" style={{ '--fbtn': '#3B82F6' } as React.CSSProperties}>
          <span className="material-icons">edit</span>
          Edit Task
        </Button>
        <Button variant="task" style={{ '--fbtn': '#F59E0B' } as React.CSSProperties}>
          <span className="material-icons">schedule</span>
          Reschedule
        </Button>
        {/* More → Discuss styling */}
        <Button variant="discuss"><span className="material-icons" style={{ fontSize: 16 }}>more_horiz</span>More</Button>
      </div>
      <span className="btn-label" style={{ marginTop: 20 }}>CTA (optimization report)</span>
      <div className="btn-row" ref={row6Ref}>
        <Button variant="cta" style={{ '--accent': 'var(--brand-primary-500)', '--ctaglow': 'var(--brand-glow)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </Button>
        <Button variant="cta" style={{ '--accent': '#EF4444', '--ctaglow': 'rgba(239,68,68,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </Button>
        <Button variant="cta" style={{ '--accent': '#F97316', '--ctaglow': 'rgba(249,115,22,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </Button>
        <Button variant="cta" style={{ '--accent': '#3B82F6', '--ctaglow': 'rgba(59,130,246,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </Button>
        <Button variant="cta" style={{ '--accent': '#EAB308', '--ctaglow': 'rgba(234,179,8,0.5)' } as React.CSSProperties}>
          <span className="material-symbols-outlined">insights</span>
          Get Optimization
        </Button>
      </div>
    </div>
  )
}

export { Button }
