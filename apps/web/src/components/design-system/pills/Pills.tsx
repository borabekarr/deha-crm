import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Pills.css'

import { useProximityGroup } from '@/lib/hooks'
import {
  COLUMN_TAGS,
  EVENT_BADGES,
  ICON_BADGES,
  PRIORITY_PILLS,
  STAT_BADGES,
  type ColumnTagSpec,
  type EventBadgeSpec,
  type IconBadgeSpec,
  type PriorityPillSpec,
  type StatBadgeSpec,
} from './variants'

// ---------------------------------------------------------------------------
// Importable Pill/Badge specimens (Toast-style split: data lives in
// variants.ts, this module exports only components).
// ---------------------------------------------------------------------------

function PriorityPill({ color, label }: PriorityPillSpec) {
  return (
    <span className="pill-priority" data-proximity>
      <span className="dot" style={{ background: color }}></span> {label}
    </span>
  )
}

function StatBadge({ tone, icon, prefix, label }: StatBadgeSpec) {
  return (
    <span className={`badge ${tone}`}>
      {prefix ? <span>{prefix}</span> : icon ? <span className="material-icons">{icon}</span> : null}
      {' '}
      {label}
    </span>
  )
}

function ColumnTagBadge({ tone, icon, label, count }: ColumnTagSpec) {
  return (
    <span className={`badge col-tag ${tone}`}>
      <span className="material-icons">{icon}</span> {label} <span className="count">{count}</span>
    </span>
  )
}

function EventBadge({ color, icon, label, tone }: EventBadgeSpec) {
  return (
    <span className="badge-event" data-tone={tone} style={{ backgroundColor: color }}>
      <span className="material-icons">{icon}</span> {label}
    </span>
  )
}

function IconBadge({ color, icon, tone }: IconBadgeSpec) {
  return (
    <div className="icon-badge icon-badge--lg" data-tone={tone} style={{ '--icon-c': color } as React.CSSProperties}>
      <span className="material-icons">{icon}</span>
    </div>
  )
}

export default function Pills() {
  const filterRowRef = useProximityGroup<HTMLDivElement>()

  return (
    <div className="card">
      <span className="pills-label">Priority filter</span>
      <div className="pills-row" ref={filterRowRef}>
        {PRIORITY_PILLS.map((spec) => (
          <PriorityPill key={spec.label} {...spec} />
        ))}
        <span className="pill-tab dark" data-proximity>Tümü</span>
      </div>

      <span className="pills-label" style={{ marginTop: 16 }}>Stat badges</span>
      <div className="pills-row">
        {STAT_BADGES.map((spec) => (
          <StatBadge key={spec.label} {...spec} />
        ))}
        <span className="badge success">Success</span>
      </div>
      <span className="pills-label" style={{ marginTop: 16 }}>Task board column tags</span>
      <div className="pills-row">
        {COLUMN_TAGS.map((spec) => (
          <ColumnTagBadge key={spec.tone} {...spec} />
        ))}
      </div>

      <span className="pills-label" style={{ marginTop: 16 }}>Event badges</span>
      <div className="pills-row">
        {EVENT_BADGES.map((spec) => (
          <EventBadge key={spec.label} {...spec} />
        ))}
      </div>

      <span className="pills-label" style={{ marginTop: 16 }}>Icon badges</span>
      <div className="pills-row">
        {ICON_BADGES.map((spec) => (
          <IconBadge key={spec.icon} {...spec} />
        ))}
      </div>
    </div>
  )
}
