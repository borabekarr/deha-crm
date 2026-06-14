import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ModelSelector.css'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// ModelSelector — AI chatbot model picker
// Faithful port of apps/web/design-system/preview/components-model-selector.html
// DOM: .ms-card > .ms-trigger + .ms-outer > .ms-panel > .ms-row[]
// Interaction: togglePanel opens/closes panel; pick() selects a row.
// Search/selection via derived state + event handlers — NO raw useEffect.
// ---------------------------------------------------------------------------

interface ModelOption {
  id: string
  name: string
  icon: string
  iconColor: string
  desc: string
  badge?: { label: string; cls: string }
  hasStats: boolean
  stats?: { icon: string; value: string }[]
}

const MODELS: ModelOption[] = [
  {
    id: 'auto',
    name: 'Auto',
    icon: 'auto_awesome',
    iconColor: '#10B981',
    desc: 'Choose for me',
    hasStats: false,
  },
  {
    id: 'instant',
    name: 'Instant',
    icon: 'bolt',
    iconColor: '#F97316',
    desc: 'Answer instantly',
    badge: { label: 'NEW', cls: 'new' },
    hasStats: true,
    stats: [
      { icon: 'speed', value: '1.6×' },
      { icon: 'psychology', value: '1×' },
      { icon: 'paid', value: '0.8×' },
    ],
  },
  {
    id: 'reasoning',
    name: 'Reasoning',
    icon: 'psychology',
    iconColor: '#EAB308',
    desc: 'Think hard',
    hasStats: true,
    stats: [
      { icon: 'speed', value: '0.7×' },
      { icon: 'psychology', value: '2.3×' },
      { icon: 'paid', value: '1.7×' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: 'rocket_launch',
    iconColor: '#EF4444',
    desc: 'Expert-level thinking',
    badge: { label: 'PRO', cls: 'pro' },
    hasStats: true,
    stats: [
      { icon: 'speed', value: '0.4×' },
      { icon: 'psychology', value: '4×' },
      { icon: 'paid', value: '2×' },
    ],
  },
]

export default function ModelSelector() {
  const [open, setOpen] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('auto')

  // Derived: selected model data for trigger display
  const selected = MODELS.find((m) => m.id === selectedId) ?? MODELS[0]

  function togglePanel() {
    setOpen((prev) => !prev)
  }

  function pick(id: string) {
    setSelectedId(id)
  }

  return (
    <div className="ms-card">

      {/* Trigger */}
      <div
        className={`ms-trigger${open ? ' open' : ''}`}
        onClick={togglePanel}
      >
        <span className="material-icons ms-t-icon">{selected.icon}</span>
        <span className="ms-t-model">{selected.name}</span>
        <span className="ms-t-sep" />
        <span className="ms-t-label">Select Model</span>
        <span className="material-icons ms-t-chevron">expand_more</span>
      </div>

      {/* Gray outer shell wrapping the white panel */}
      <div className={`ms-outer${open ? '' : ' hidden'}`}>
        <div className="ms-panel">

          {MODELS.map((model) => {
            const isSel = model.id === selectedId
            const rowCls = ['ms-row', isSel ? 'sel' : '', model.hasStats ? 'has-stats' : '']
              .filter(Boolean)
              .join(' ')

            return (
              <div
                key={model.id}
                className={rowCls}
                onClick={() => pick(model.id)}
              >
                {/* Icon */}
                <div
                  className="ms-icon"
                  style={{ '--icon-c': model.iconColor } as React.CSSProperties}
                >
                  <span className="material-icons">{model.icon}</span>
                </div>

                {/* Text */}
                <div className="ms-text">
                  <div className="ms-name-row">
                    <span className="ms-name">{model.name}</span>
                    {model.badge && (
                      <span className={`ms-badge ${model.badge.cls}`}>{model.badge.label}</span>
                    )}
                  </div>
                  <div className="ms-desc">{model.desc}</div>
                </div>

                {/* Meta: stats + check */}
                <div className="ms-meta">
                  {model.hasStats && model.stats && (
                    <div className="ms-stats">
                      {model.stats.map((s) => (
                        <span key={s.icon} className="ms-stat">
                          <span className="material-icons">{s.icon}</span>
                          {s.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="material-icons ms-check">done</span>
                </div>
              </div>
            )
          })}

        </div>
      </div>

    </div>
  )
}
