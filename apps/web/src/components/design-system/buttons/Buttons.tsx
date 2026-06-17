import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Buttons.css'
import DeleteButton from '@/components/design-system/delete-button/DeleteButton'

export default function Buttons() {
  return (
    <div className="card">
      <span className="btn-label">Buttons</span>
      <div className="btn-row">
        <button type="button" className="btn-primary">View Your Leads <span className="material-icons btn-mi">arrow_forward</span></button>
        <button type="button" className="btn-inverse">View Your Leads <span className="material-icons btn-mi">arrow_forward</span></button>
        <button type="button" className="btn-glass">Son 30 Gün <span className="material-icons btn-mi">expand_more</span></button>
        <button type="button" className="btn-text">Tüm Görevleri Gör <span className="material-icons btn-mi">arrow_forward</span></button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Apply &amp; Discuss (pipeline-card variants)</span>
      <div className="btn-row">
        <button type="button" className="btn-apply">
          <span className="material-icons" style={{ fontSize: 16 }}>check</span>
          Apply
        </button>
        <button type="button" className="btn-discuss">
          <span className="material-icons" style={{ fontSize: 16 }}>chat</span>
          Discuss
        </button>
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Delete (morphing three-state)</span>
      <div className="btn-row">
        <DeleteButton onDelete={() => undefined} />
      </div>

      <span className="btn-label" style={{ marginTop: 20 }}>Task footer (--fbtn color token)</span>
      <div className="btn-row">
        <button type="button" className="btn-task" style={{ '--fbtn': '#10B981' } as React.CSSProperties}>
          <span className="material-icons">task_alt</span>
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
        <button type="button" className="btn-task">
          <span className="material-icons">more_horiz</span>
          More
        </button>
      </div>
    </div>
  )
}
