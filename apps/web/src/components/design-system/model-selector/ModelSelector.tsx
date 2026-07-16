import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ModelSelector.css'

import { useState, useCallback } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { useProximityGroup } from '@/lib/hooks'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useAutoHeight } from '../../../lib/hooks/use-auto-height'

// ---------------------------------------------------------------------------
// ModelSelector — AI chatbot model picker
// DOM (Step 27 restructure): .ms-shell is a static grey card that never
// morphs. .ms-header is a real <button> toggle (aria-expanded) that always
// stays mounted and visible. .ms-collapsible wraps .ms-divider + .ms-panel —
// it stays mounted through collapse (lesson: mounted-through-exit) and its
// height is driven imperatively by useAutoHeight; opacity crossfade on the
// divider/panel is a plain CSS class keyed off `open` (see .ms-collapsible.open
// in ModelSelector.css). Open easing = --ease-spring-open (bounce), close
// easing = --ease-out (no bounce), matching the header/panel motion checklist.
// Interaction: togglePanel opens/closes; pick() selects. No other useEffect.
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
    iconColor: 'var(--brand-primary-500)',
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
  // Single group over the shell — model rows are its wired members
  // (locked convention: radius 80, dy×3). Step 27 removed the separate
  // close (X) button: .ms-header is now the sole open/close control, so a
  // second clickable target duplicating it was dropped rather than
  // repositioned (see step report for the "reposition" deviation note).
  const proxRef = useProximityGroup<HTMLDivElement>()
  /* Squircle conversion (Step 12): ms-shell/ms-panel canonical grey-shell/
     white-panel concentric pair. .ms-header is classified not-a-card and
     stays untouched. */
  const shellSquircleRef = useSquircle<HTMLDivElement>()
  const panelSquircleRef = useSquircle<HTMLDivElement>()
  const shellRef = useCallback(
    (el: HTMLDivElement | null) => {
      shellSquircleRef(el)
      proxRef(el)
    },
    [shellSquircleRef, proxRef]
  )

  // Collapse/expand only the divider+panel; header + shell stay mounted and
  // sized. Asymmetric easing: open bounces, close is a smooth spring (no
  // overshoot) — matches Step 27's motion checklist.
  const { ref: collapsibleRef } = useAutoHeight<HTMLDivElement>({
    open,
    duration: 560,
    easing: open ? 'var(--ease-spring-open)' : 'var(--ease-out)',
  })

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
        Static grey shell — never morphs. Only .ms-collapsible (divider+panel)
        below animates height/opacity; .ms-header stays mounted and visible
        at all times, and IS the toggle control (real <button>).
      */}
      <div className="ms-shell" ref={shellRef}>

        {/* Header — real toggle button; content lives inside the card */}
        <button
          type="button"
          className="ms-header"
          onClick={togglePanel}
          aria-expanded={open}
          aria-controls="ms-collapsible-panel"
          aria-label={open ? 'Collapse model selector' : `Select model: ${selected.name}`}
        >
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
        </button>

        {/*
          Collapsible region: divider + rows panel. Stays mounted through
          collapse (lesson: mounted-through-exit-css-animations) — height is
          driven imperatively by useAutoHeight (ref), opacity crossfade is a
          plain state-derived class (.open) in ModelSelector.css.
        */}
        <div
          id="ms-collapsible-panel"
          className={`ms-collapsible${open ? ' open' : ''}`}
          aria-hidden={!open}
          ref={collapsibleRef}
        >

          {/* Horizontal divider between header and rows */}
          <div className="ms-divider" />

          {/* Model rows panel — sits directly inside the gray shell */}
          {/* --sel-idx drives the CSS transform on .ms-sel-indicator — no JS measurement */}
          <div
            className="ms-panel"
            ref={panelSquircleRef}
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
                  data-proximity
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

    </div>
  )
}
