import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ModelSelector.css'

import { useState } from 'react'
import { iconClass } from '../../../lib/iconClass'

// ---------------------------------------------------------------------------
// ModelSelector — AI chatbot model picker
// DOM: single .ms-shell morphs from compressed pill-footprint (closed) to
// full card (open). No separate trigger + card — the shell IS both.
// Animation: scaleY/scaleX spring (transform-origin: top center). No slide.
// Interaction: togglePanel opens/closes; pick() selects. No useEffect.
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
    icon: 'auto_mode',
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
    icon: 'neurology',
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

  // Derived: selected model data + index
  const selectedIndex = MODELS.findIndex((m) => m.id === selectedId)
  const selected = selectedIndex >= 0 ? MODELS[selectedIndex] : MODELS[0]

  function togglePanel() {
    setOpen((prev) => !prev)
  }

  function pick(id: string) {
    setSelectedId(id)
  }

  return (
    <div className="ms-card">

      {/*
        Single shell: closed = scaleY(0.12) scaleX(0.65) opacity(0) — pill footprint.
        Open = scaleY(1) scaleX(1) opacity(1) — full card.
        transform-origin: top center → grows downward, no slide.
        Click on closed shell (full bounding box is target) → opens.
      */}
      <div
        className={`ms-shell${open ? ' open' : ''}`}
        onClick={!open ? togglePanel : undefined}
        role={!open ? 'button' : undefined}
        aria-expanded={open}
        aria-label={!open ? `Select model: ${selected.name}` : undefined}
      >

        {/* Close button — top-right corner, absolutely positioned within shell */}
        {open && (
          <button
            type="button"
            className="ms-close-btn"
            onClick={(e) => { e.stopPropagation(); togglePanel(); }}
            aria-label="Close model selector"
          >
            <span className="material-icons">close</span>
          </button>
        )}

        {/* Header — trigger content now lives inside the card */}
        <div className="ms-header">
          {/* Icon tag: background-color transition handles color change on selection */}
          <div
            className="ms-t-icon-tag icon-badge icon-badge--sm"
            style={{ '--icon-c': selected.iconColor } as React.CSSProperties}
          >
            <span className={iconClass(selected.icon)}>{selected.icon}</span>
          </div>
          {/* Model name: key drives crossfade+scale morph animation on change */}
          <span className="ms-t-model" key={`name-${selectedId}`}>{selected.name}</span>
          <span className="ms-t-sep" />
          <span className="ms-t-label">Select Model</span>
          <span
            className="material-icons ms-t-chevron"
            style={{ transform: open ? 'rotate(180deg)' : undefined }}
          >
            expand_more
          </span>
        </div>

        {/* Horizontal divider between header and rows */}
        <div className="ms-divider" />

        {/* Model rows panel — sits directly inside the gray shell */}
        {/* --sel-idx drives the CSS transform on .ms-sel-indicator — no JS measurement */}
        <div
          className="ms-panel"
          style={{ '--sel-idx': selectedIndex } as React.CSSProperties}
        >

          {/* Sliding selection indicator — positioned via CSS transform using --sel-idx */}
          <div className="ms-sel-indicator" />

          {MODELS.map((model) => {
            const isSel = model.id === selectedId
            const rowCls = ['ms-row', isSel ? 'sel' : '', model.hasStats ? 'has-stats' : '']
              .filter(Boolean)
              .join(' ')

            return (
              <div
                key={model.id}
                className={rowCls}
                onClick={(e) => { e.stopPropagation(); pick(model.id); }}
              >
                {/* Icon */}
                <div
                  className="ms-icon icon-badge icon-badge--lg"
                  style={{ '--icon-c': model.iconColor } as React.CSSProperties}
                >
                  <span className={iconClass(model.icon)}>{model.icon}</span>
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
