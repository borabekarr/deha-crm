import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Buttons.css'

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
    </div>
  )
}
