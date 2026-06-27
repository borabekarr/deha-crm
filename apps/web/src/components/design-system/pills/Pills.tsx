import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_controls.css'
import '../../../../design-system/preview/_darkmode.css'
import './Pills.css'

const EVENT_BADGES = [
  { color: '#EC4899', icon: 'self_improvement', label: 'Personal' },
  { color: '#3B82F6', icon: 'event', label: 'Meeting' },
  { color: '#F97316', icon: 'call', label: 'Call' },
  { color: '#10B981', icon: 'task_alt', label: 'Done' },
  { color: '#EF4444', icon: 'warning', label: 'Urgent' },
  { color: '#0F172A', icon: 'lock', label: 'Private' },
  { color: '#EAB308', icon: 'star', label: 'Featured' },
]

const ICON_BADGES = [
  { color: '#10B981', icon: 'bolt' },
  { color: '#EF4444', icon: 'favorite' },
  { color: '#F97316', icon: 'schedule' },
  { color: '#3B82F6', icon: 'insights' },
  { color: '#EAB308', icon: 'lock' },
  { color: '#0F172A', icon: 'dark_mode' },
]

export default function Pills() {
  return (
    <div className="card">
      <span className="pills-label">Priority filter</span>
      <div className="pills-row">
        <span className="pill-priority"><span className="dot" style={{ background: '#EF4444' }}></span> Yüksek</span>
        <span className="pill-priority"><span className="dot" style={{ background: '#EAB308' }}></span> Orta</span>
        <span className="pill-priority"><span className="dot" style={{ background: '#10B981' }}></span> Düşük</span>
        <span className="pill-tab dark">Tümü</span>
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

      <span className="pills-label" style={{ marginTop: 16 }}>Event badges</span>
      <div className="pills-row">
        {EVENT_BADGES.map(({ color, icon, label }) => (
          <span key={label} className="badge-event" style={{ backgroundColor: color }}>
            <span className="material-icons">{icon}</span> {label}
          </span>
        ))}
      </div>

      <span className="pills-label" style={{ marginTop: 16 }}>Icon badges</span>
      <div className="pills-row">
        {ICON_BADGES.map(({ color, icon }) => (
          <div key={icon} className="icon-badge icon-badge--lg" style={{ '--icon-c': color } as React.CSSProperties}>
            <span className="material-icons">{icon}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
