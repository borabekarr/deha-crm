import { useState } from 'react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_controls.css'
import '../../../../design-system/preview/_darkmode.css'
import './Pills.css'

type SegOption = 'Daily' | 'Weekly' | 'Monthly'

export default function Pills() {
  const [seg, setSeg] = useState<SegOption>('Daily')

  return (
    <div className="card">
      <span className="pills-label">Priority filter</span>
      <div className="pills-row">
        <span className="pill-priority"><span className="dot" style={{ background: '#EF4444' }}></span> Yüksek</span>
        <span className="pill-priority"><span className="dot" style={{ background: '#EAB308' }}></span> Orta</span>
        <span className="pill-priority"><span className="dot" style={{ background: '#10B981' }}></span> Düşük</span>
        <span className="pill-tab dark">Tümü</span>
      </div>

      <span className="pills-label" style={{ marginTop: 16 }}>Segmented</span>
      <div className="pills-row">
        <div className="pills-seg">
          {(['Daily', 'Weekly', 'Monthly'] as SegOption[]).map((opt) => (
            <button
              key={opt}
              className={seg === opt ? 'active' : ''}
              onClick={() => setSeg(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <span className="pills-label" style={{ marginTop: 16 }}>Stat badges</span>
      <div className="pills-row">
        <span className="badge success"><span className="material-icons">trending_up</span> +12%</span>
        <span className="badge danger"><span className="material-icons">trending_down</span> -34%</span>
        <span className="badge gci"><span>$</span> 45K GCI</span>
        <span className="badge time"><span className="material-icons">schedule</span> 12:00</span>
        <span className="badge tag"><span className="material-icons">home_work</span> Değerleme</span>
        <span className="badge tag"><span className="material-icons">sell</span> Satış</span>
        <span className="badge tag"><span className="material-icons">volunteer_activism</span> Nurture</span>
      </div>
      <span className="pills-label" style={{ marginTop: 16 }}>Task board column tags</span>
      <div className="pills-row">
        <span className="badge col-tag todo"><span className="material-icons">inbox</span> Todo <span className="count">4</span></span>
        <span className="badge col-tag progress"><span className="material-icons">bolt</span> In Progress <span className="count">3</span></span>
        <span className="badge col-tag review"><span className="material-icons">visibility</span> Review <span className="count">2</span></span>
        <span className="badge col-tag done"><span className="material-icons">task_alt</span> Done <span className="count">3</span></span>
      </div>
    </div>
  )
}
