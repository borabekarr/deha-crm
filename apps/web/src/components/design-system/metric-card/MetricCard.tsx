import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './MetricCard.css'

import { useState } from 'react'
import { expOverlayRef, cleanupExpOverlay } from './metric-card-hook'

// ---------------------------------------------------------------------------
// Data — verbatim from prototype METRICS object
// ---------------------------------------------------------------------------

interface MetricData {
  icon: string
  label: string
  num: string
  goal: string
  dir: 'up' | 'down'
  delta: string
  period: string
  insight: string
  color: string
  gradId: string
  axes: string[]
  solidLine: string
  solidArea: string
  dashLine: string
  dashArea: string
  dotX: number
  dotY: number
}

const METRICS: Record<string, MetricData> = {
  leads: {
    icon: 'group', label: 'New Leads',
    num: '142', goal: '/ 160 goal',
    dir: 'up', delta: '+12%', period: 'vs last month',
    insight: 'You gained <b>+15 leads</b> this month. At this pace you\'ll hit your monthly target <b>4 days early</b>.',
    color: '#10B981', gradId: 'expG1',
    axes: ['Jan','Feb','Mar','Apr','May','Jun'],
    solidLine: 'M0,91 C20,90 40,78 60,75 C80,72 100,68 120,66 C140,64 160,57 180,50 C200,43 220,38 240,33',
    solidArea: 'M0,91 C20,90 40,78 60,75 C80,72 100,68 120,66 C140,64 160,57 180,50 C200,43 220,38 240,33 L240,120 L0,120 Z',
    dashLine: 'M240,33 C260,28 280,24 300,20',
    dashArea: 'M240,33 C260,28 280,24 300,20 L300,120 L240,120 Z',
    dotX: 240, dotY: 33
  },
  value: {
    icon: 'payments', label: 'Predicted Value',
    num: '$1.2M', goal: '/ $1.4M target',
    dir: 'down', delta: '−8.1%', period: 'vs last month',
    insight: 'Portfolio value dropped by <b>$108K</b>. 3 listings need re-evaluation to recover momentum.',
    color: '#EF4444', gradId: 'expG2',
    axes: ['Jan','Feb','Mar','Apr','May','Jun'],
    solidLine: 'M0,30 C20,32 40,37 60,40 C80,43 100,48 120,54 C140,60 160,63 180,66 C200,69 220,80 240,86',
    solidArea: 'M0,30 C20,32 40,37 60,40 C80,43 100,48 120,54 C140,60 160,63 180,66 C200,69 220,80 240,86 L240,120 L0,120 Z',
    dashLine: 'M240,86 C260,88 280,89 300,90',
    dashArea: 'M240,86 C260,88 280,89 300,90 L300,120 L240,120 Z',
    dotX: 240, dotY: 86
  }
}

// ---------------------------------------------------------------------------
// Expanded overlay content — mirrors prototype openExpanded() output
// ---------------------------------------------------------------------------

interface ExpandedCardProps {
  metricKey: string
  onClose: () => void
}

function ExpandedCard({ metricKey, onClose }: ExpandedCardProps) {
  const m = METRICS[metricKey]
  const arrowIcon = m.dir === 'up' ? 'trending_up' : 'trending_down'

  return (
    <>
      <div className="exp-top">
        <div className="exp-crumb">
          Dashboard <span style={{ color: '#CBD5E1', margin: '0 1px' }}>/</span>{' '}
          <span className="material-symbols-outlined">{m.icon}</span>
          <strong>{m.label}</strong>
        </div>
        <button type="button" className="exp-close" onClick={onClose} aria-label="Close">
          <span className="material-icons">close</span>
        </button>
      </div>
      <div className="exp-body">
        <div className="exp-goal">{m.goal}</div>
        <div className="exp-num">{m.num}</div>
        <div className="exp-badge-row">
          <span className={`exp-badge ${m.dir}`}>
            <span className="material-icons">{arrowIcon}</span>
            {m.delta}
          </span>
          <span className="exp-period">{m.period}</span>
        </div>
        {/* dangerouslySetInnerHTML mirrors the prototype's innerHTML assignment for bold insight text */}
        {/* eslint-disable-next-line no-restricted-syntax -- m.insight is trusted static showcase data, never user input; markup preserves the prototype's bold insight rendering */}
        <div className="exp-insight" dangerouslySetInnerHTML={{ __html: m.insight }} />
      </div>
      <div className="exp-chart-wrap">
        <div className="exp-chart-svg-wrap">
          <svg viewBox="0 0 300 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id={m.gradId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={m.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={m.color} stopOpacity="0.03" />
              </linearGradient>
              <linearGradient id={`${m.gradId}D`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={m.color} stopOpacity="0.12" />
                <stop offset="100%" stopColor={m.color} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={m.solidArea} fill={`url(#${m.gradId})`} />
            <path d={m.dashArea} fill={`url(#${m.gradId}D)`} />
            <path d={m.solidLine} fill="none" stroke={m.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={m.dashLine} fill="none" stroke={m.color} strokeWidth="2" strokeDasharray="5,4" strokeLinecap="round" strokeOpacity="0.6" />
          </svg>
          {/* End-dot as HTML overlay — decoupled from non-uniform SVG scaling so it stays a true circle */}
          <div
            className="exp-chart-dot"
            style={{
              left: `${(m.dotX / 300) * 100}%`,
              top:  `${(m.dotY / 120) * 100}%`,
              '--dot-color': m.color,
            } as React.CSSProperties}
          />
        </div>
        <div className="exp-axis">
          {m.axes.map((a) => <span key={a}>{a}</span>)}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MetricCard() {
  const [open, setOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  function toggle(value: boolean): void {
    setOpen(value)
    // activeKey is cleared on the overlay's exit transitionend (onTransitionEnd below)
    // so the card stays filled through the close animation — no empty white strip.
  }

  function openExpanded(key: string): void {
    setActiveKey(key)
    setOpen(true)
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) toggle(false)
  }

  return (
    <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
      <div className="frame mc-frame">
        <div className="grid">

          {/* New Leads card */}
          <div className="shell zoom">
            <div className="metric" onClick={() => openExpanded('leads')}>
              <div className="m-left">
                <div className="m-label">
                  <span className="material-symbols-outlined">group</span>
                  New Leads
                </div>
                <div className="m-num">142</div>
                <div className="m-row">
                  <span className="m-delta up">
                    <span className="material-icons">trending_up</span>
                    +12%
                  </span>
                  <span className="m-sub">vs last month</span>
                </div>
              </div>
              <div className="m-spark">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mc1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,30 C18,32 30,22 48,18 C66,14 82,8 100,6 L100,40 L0,40 Z" fill="url(#mc1)" />
                  <path d="M0,30 C18,32 30,22 48,18 C66,14 82,8 100,6" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Predicted Value card */}
          <div className="shell zoom">
            <div className="metric" onClick={() => openExpanded('value')}>
              <div className="m-left">
                <div className="m-label">
                  <span className="material-symbols-outlined">payments</span>
                  Predicted Value
                </div>
                <div className="m-num">
                  <span style={{ marginRight: '3px' }}>$</span>1.2M
                </div>
                <div className="m-row">
                  <span className="m-delta down">
                    <span className="material-icons">trending_down</span>
                    −8.1%
                  </span>
                </div>
              </div>
              <div className="m-spark">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mc3" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,8 C18,10 32,16 48,22 C64,26 78,30 100,32 L100,40 L0,40 Z" fill="url(#mc3)" />
                  <path d="M0,8 C18,10 32,16 48,22 C64,26 78,30 100,32" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Expanded detail overlay — wired via state + callback ref for Escape */}
      <div
        className={`exp-overlay${open ? ' open' : ''}`}
        onClick={handleOverlayClick}
        onTransitionEnd={(e) => {
          if (!open && e.propertyName === 'opacity') setActiveKey(null)
        }}
        ref={(el) => {
          expOverlayRef(el, toggle)
          return () => cleanupExpOverlay(el)
        }}
      >
        <div className="exp-outer">
          <div className="exp-card">
            {activeKey && (
              <ExpandedCard metricKey={activeKey} onClose={() => toggle(false)} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
