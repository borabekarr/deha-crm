import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './MotionTabs.css'
import { useState } from 'react'
import { mtRootRef, cleanupMtRoot } from './motion-tabs-hook'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { usePillSpring } from '../../../lib/motion-spring'

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

// lw = live-measured .mt-label bounding-box width (rounded up), so the pill's
// symmetric edge padding reads identical left/right in every tab.
const TABS: TabDef[] = [
  { key: 'leads',    label: 'Leads',    icon: 'groups',          lw: 53 },
  { key: 'pipeline', label: 'Pipeline', icon: 'account_tree',    lw: 68 },
  { key: 'calls',    label: 'Calls',    icon: 'call',            lw: 47 },
  { key: 'profile',  label: 'Profile',  icon: 'account_circle',  lw: 59 },
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
  color?: string
}

const PANEL_ROWS: Record<string, PanelRow[]> = {
  leads: [
    { icon: 'local_fire_department', title: 'Hot leads',      sub: 'High intent, ready to call',   count: 12, color: '#EF4444' },
    { icon: 'fiber_new',             title: 'New today',      sub: 'Captured in the last 24h',     count: 5,  color: '#3B82F6' },
    { icon: 'assignment_ind',        title: 'Assigned to me', sub: 'Your active queue',            count: 8,  color: '#8B5CF6' },
  ],
  pipeline: [
    { icon: 'tune',  title: 'Qualifying',    sub: 'Discovery in progress', count: 9, color: '#F59E0B' },
    { icon: 'send',  title: 'Proposal sent', sub: 'Awaiting response',     count: 4, color: '#14B8A6' },
    { icon: 'flag',  title: 'Closing',       sub: 'Final negotiation',     count: 3, color: 'var(--brand-primary-500)' },
  ],
  calls: [
    { icon: 'today',       title: "Today's calls", sub: 'Scheduled for today',   count: 7, color: '#F97316' },
    { icon: 'call_missed', title: 'Missed',        sub: 'Needs a callback',      count: 2, color: '#EF4444' },
    { icon: 'schedule',    title: 'Scheduled',     sub: 'Upcoming this week',    count: 5, color: '#3B82F6' },
  ],
  profile: [
    { icon: 'person',  title: 'Personal details', sub: 'Name, role, contact', color: '#111111' },
    { icon: 'palette', title: 'Appearance',        sub: 'Theme and density',   color: '#8B5CF6' },
    { icon: 'help',    title: 'Help',              sub: 'Guides and support',  color: '#14B8A6' },
  ],
}

export default function MotionTabs() {
  const [active, setActive]     = useState<string>('leads')
  const [view, setView]         = useState<string>('default')
  const [dir, setDir]           = useState<number>(0)
  const [prevView, setPrevView] = useState<string>('default')

  // Concentric squircle pair: outer .mt-dock (grey shell) + inner
  // .mt-dock-inner (white card), mirrors Cards.css .concentric-demo.
  const mtDockRef = useSquircle<HTMLDivElement>()
  const mtDockInnerRef = useSquircle<HTMLDivElement>()
  // Proximity: tab buttons only — the sliding .mt-ind indicator is a MOVING
  // element and must never be wired (it would chase itself).
  const mtTabwrapProximityRef = useProximityGroup<HTMLDivElement>()

  function close(): void {
    setPrevView('default')
    setDir(0)
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
    setPrevView(view)
    setDir(nextDir)
    setActive(key)
    setView(key)
  }

  /** Determines enter/exit animation state for each panel.
   *  dir > 0 = new tab is to the RIGHT of old tab.
   *  entering panel slides in from the direction of the new tab.
   *  exiting panel slides out in the OPPOSITE direction.
   */
  function panelState(tabKey: string): string {
    if (view === tabKey) {
      if (dir === 0) return 'active'
      return dir > 0 ? 'entering-right' : 'entering-left'
    }
    if (prevView === tabKey && dir !== 0) {
      return dir > 0 ? 'exiting-left' : 'exiting-right'
    }
    return 'idle'
  }

  // ── Derived indicator geometry (no DOM measurement) ──────────────────────
  const activeIndex = TABS.findIndex((t) => t.key === active)

  // Width of each tab slot: base + label expansion for the active tab
  // Active pill width matches CSS: .mt-tab.active = 16 + 24 + 6 + lw + 16 = 62 + lw.
  // Collapsed tab = TAB_BASE (48). So active adds (62 + lw) - 48 = lw + 14.
  function tabSlotWidth(i: number): number {
    return TAB_BASE + (i === activeIndex ? TABS[i].lw + 14 : 0)
  }

  // indX = sum of (slot widths + gap) for all tabs before active
  const indX = TABS.slice(0, activeIndex).reduce(
    (acc, _, i) => acc + tabSlotWidth(i) + TAB_GAP,
    0,
  )
  const indW = tabSlotWidth(activeIndex)

  const mtIndRef = usePillSpring<HTMLDivElement>(indX, indW)

  const isOpen = view !== 'default'

  return (
    <div className="card" style={{ padding: 0, background: '#FAFAFA' }}>
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

            {/* Dock — grey external wrapper around white inner card */}
            <div className={`mt-dock${isOpen ? ' open' : ''}`} ref={mtDockRef}>
              <div className="mt-dock-inner" ref={mtDockInnerRef}>

              {/* Height-morph via grid-rows */}
              <div className="mt-panels-wrap">
                <div className="mt-panels">

                  {TABS.map((tab) => {
                    const rows = PANEL_ROWS[tab.key]
                    const isProfileTab = tab.key === 'profile'
                    return (
                      <div
                        key={tab.key}
                        className="mt-panel"
                        data-panel-state={panelState(tab.key)}
                      >
                        {rows.map((row) => (
                          <button type="button" key={row.title} className="mt-row">
                            <div
                              className={`mt-row-ic${row.color === '#111111' ? ' mt-row-ic--black' : ''}`}
                              style={row.color ? ({ '--icon-c': row.color } as React.CSSProperties) : undefined}
                            >
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

              {/* Separator between panels and toolbar — visible when open */}
              {isOpen && <div className="mt-divider" />}

              {/* Toolbar */}
              <div className="mt-toolbar">
                <div
                  className="mt-tabwrap"
                  ref={mtTabwrapProximityRef}
                >
                {/* Single gliding indicator */}
                <div className="mt-ind" ref={mtIndRef} />

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
                      data-proximity
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
                </div>{/* /.mt-tabwrap */}
              </div>

              </div>{/* /.mt-dock-inner */}
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
