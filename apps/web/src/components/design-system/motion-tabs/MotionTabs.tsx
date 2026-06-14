import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './MotionTabs.css'
import { useState } from 'react'
import { mtRootRef, cleanupMtRoot } from './motion-tabs-hook'

// ---------------------------------------------------------------------------
// MotionTabs — Morphing icon-to-label tabs with slide-up popup panels
// Redesign: consistent-width dock, CSS grid-rows height morph, single gliding
// emerald indicator (no JS measurement), no blur on panels.
// Port of apps/web/design-system/preview/components-motion-tabs.html
// ---------------------------------------------------------------------------

interface TabDef {
  key: string
  label: string
  icon: string
  lw: number
}

const TABS: TabDef[] = [
  { key: 'leads',    label: 'Leads',    icon: 'groups',          lw: 42 },
  { key: 'pipeline', label: 'Pipeline', icon: 'account_tree',    lw: 62 },
  { key: 'calls',    label: 'Calls',    icon: 'call',            lw: 34 },
  { key: 'profile',  label: 'Profile',  icon: 'account_circle',  lw: 50 },
]

// Gap between tabs in px (matches CSS --tab-gap)
const TAB_GAP = 6
// Base (collapsed) tab width in px
const TAB_BASE = 48

interface PanelRow {
  icon: string
  title: string
  sub: string
  count?: number
}

const PANEL_ROWS: Record<string, PanelRow[]> = {
  leads: [
    { icon: 'local_fire_department', title: 'Hot leads',      sub: 'High intent, ready to call',   count: 12 },
    { icon: 'fiber_new',             title: 'New today',      sub: 'Captured in the last 24h',     count: 5  },
    { icon: 'assignment_ind',        title: 'Assigned to me', sub: 'Your active queue',            count: 8  },
  ],
  pipeline: [
    { icon: 'tune',  title: 'Qualifying',    sub: 'Discovery in progress', count: 9 },
    { icon: 'send',  title: 'Proposal sent', sub: 'Awaiting response',     count: 4 },
    { icon: 'flag',  title: 'Closing',       sub: 'Final negotiation',     count: 3 },
  ],
  calls: [
    { icon: 'today',       title: "Today's calls", sub: 'Scheduled for today',   count: 7 },
    { icon: 'call_missed', title: 'Missed',        sub: 'Needs a callback',      count: 2 },
    { icon: 'schedule',    title: 'Scheduled',     sub: 'Upcoming this week',    count: 5 },
  ],
  profile: [
    { icon: 'person',  title: 'Personal details', sub: 'Name, role, contact' },
    { icon: 'palette', title: 'Appearance',        sub: 'Theme and density'   },
    { icon: 'help',    title: 'Help',              sub: 'Guides and support'  },
  ],
}

export default function MotionTabs() {
  const [active, setActive] = useState<string>('leads')
  const [view, setView]     = useState<string>('default')
  const [dir, setDir]       = useState<number>(0)

  function close(): void {
    setView('default')
  }

  function onTab(key: string): void {
    if (view === key) {
      close()
      return
    }
    const fromIdx = TABS.findIndex((t) => t.key === view)
    const toIdx   = TABS.findIndex((t) => t.key === key)
    const nextDir = view === 'default' ? 0 : Math.sign(toIdx - fromIdx)
    setDir(nextDir)
    setActive(key)
    setView(key)
  }

  // ── Derived indicator geometry (no DOM measurement) ──────────────────────
  const activeIndex = TABS.findIndex((t) => t.key === active)

  // Width of each tab slot: base + label expansion for the active tab
  function tabSlotWidth(i: number): number {
    return TAB_BASE + (i === activeIndex ? TABS[i].lw + 14 : 0)
  }

  // indX = sum of (slot widths + gap) for all tabs before active
  const indX = TABS.slice(0, activeIndex).reduce(
    (acc, _, i) => acc + tabSlotWidth(i) + TAB_GAP,
    0,
  )
  const indW = tabSlotWidth(activeIndex)

  const isOpen = view !== 'default'

  return (
    <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
      <div className="frame">
        <div className="shell">
          <div
            className="mt-root"
            ref={(el: HTMLElement | null) => {
              if (el) mtRootRef(el, close)
              else cleanupMtRoot(el)
            }}
          >
            {/* Overlay: tap outside to close */}
            <div
              className={`mt-overlay${isOpen ? ' open' : ''}`}
              onClick={close}
            />

            {/* Dock */}
            <div className={`mt-dock${isOpen ? ' open' : ''}`}>

              {/* Height-morph via grid-rows */}
              <div className="mt-panels-wrap">
                <div className="mt-panels">
                  <div className="mt-divider" />

                  {TABS.map((tab) => {
                    const rows = PANEL_ROWS[tab.key]
                    const isActive = view === tab.key
                    const isProfileTab = tab.key === 'profile'
                    return (
                      <div
                        key={tab.key}
                        className={`mt-panel${isActive ? ' active' : ''}`}
                        style={{ '--dir': dir } as React.CSSProperties}
                      >
                        {rows.map((row) => (
                          <button type="button" key={row.title} className="mt-row">
                            <div className="mt-row-ic">
                              <span className="material-symbols-outlined">{row.icon}</span>
                            </div>
                            <div className="mt-row-tx">
                              <div className="mt-row-title">{row.title}</div>
                              <div className="mt-row-sub">{row.sub}</div>
                            </div>
                            {isProfileTab ? (
                              <span className="mt-row-chev material-symbols-outlined">chevron_right</span>
                            ) : (
                              <span className="mt-row-count">{row.count}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Toolbar */}
              <div
                className="mt-toolbar"
                style={
                  {
                    '--ind-x': `${indX}px`,
                    '--ind-w': `${indW}px`,
                  } as React.CSSProperties
                }
              >
                {/* Single gliding indicator */}
                <div className="mt-ind" />

                {TABS.map((tab, i) => {
                  const isActiveTab = active === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={`mt-tab${isActiveTab ? ' active' : ''}`}
                      style={{ '--lw': `${tab.lw}px` } as React.CSSProperties}
                      onClick={() => onTab(tab.key)}
                      aria-pressed={isActiveTab}
                      aria-label={tab.label}
                      data-tab-index={i}
                    >
                      <span className="mt-hold" />
                      <span className="mt-iconbox">
                        <span className="mt-ic off">
                          <span className="material-symbols-outlined">{tab.icon}</span>
                        </span>
                        <span className="mt-ic on">
                          <span className="material-symbols-outlined">{tab.icon}</span>
                        </span>
                      </span>
                      <span className="mt-label">{tab.label}</span>
                    </button>
                  )
                })}
              </div>

            </div>{/* /.mt-dock */}
          </div>{/* /.mt-root */}
        </div>{/* /.shell */}
        <div className="hint">
          Tap the <b>active</b> tab to open · tap another to switch · tap outside to close
        </div>
      </div>
    </div>
  )
}
