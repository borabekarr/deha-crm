import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Fab.css'

import { useState } from 'react'
import { fabScreenRef, cleanupFabScreen } from './fab-hook'
import { useProximityGroup } from '@/lib/hooks'

export default function Fab() {
  const [open, setOpen] = useState(false)
  const fabGroupRef = useProximityGroup<HTMLDivElement>()

  function toggle(value: boolean): void {
    setOpen(value)
  }

  function onFabClick(): void {
    if (!open) toggle(true)
  }

  function onPickItem(e: React.MouseEvent): void {
    e.stopPropagation()
    toggle(false)
  }

  return (
    <div className="card" style={{ padding: 0, background: '#FAFAFA' }}>
      <div className="frame">
        <div>
          <div className="shell">
            <div
              className={`fab-screen${open ? ' open' : ''}`}
              ref={(el) => {
                if (el) fabScreenRef(el, toggle)
                else cleanupFabScreen(el)
                fabGroupRef(el)
              }}
            >

              {/* Backdrop content */}
              <div className="sc-content">
                <div className="sc-top">
                  <div>
                    <div className="sc-greet">Good afternoon</div>
                    <div className="sc-name">Riley Chen</div>
                  </div>
                  <div className="sc-avatar">RC</div>
                </div>
                <div className="sc-hero">
                  <div className="sc-hero-label">Pipeline value</div>
                  <div className="sc-hero-row">
                    <div className="sc-hero-num">$1.24M</div>
                    <span className="sc-hero-pill">
                      <span className="material-icons">trending_up</span>12%
                    </span>
                  </div>
                </div>
                <div className="sc-sec">Recent activity</div>
                <div className="sc-list">
                  <div className="sc-item">
                    <div className="sc-ic">AM</div>
                    <div>
                      <div className="sc-it-name">Acme Manufacturing</div>
                      <div className="sc-it-meta">Proposal sent · 2h ago</div>
                    </div>
                    <div className="sc-it-amt">$84K</div>
                  </div>
                  <div className="sc-item">
                    <div className="sc-ic">NW</div>
                    <div>
                      <div className="sc-it-name">Northwind Co.</div>
                      <div className="sc-it-meta">Call logged · 5h ago</div>
                    </div>
                    <div className="sc-it-amt">$32K</div>
                  </div>
                  <div className="sc-item">
                    <div className="sc-ic">VL</div>
                    <div>
                      <div className="sc-it-name">Vertex Labs</div>
                      <div className="sc-it-meta">New lead · Yesterday</div>
                    </div>
                    <div className="sc-it-amt">$19K</div>
                  </div>
                </div>
              </div>

              {/* Blur veil (click to close) */}
              <div className="fab-veil" onClick={() => toggle(false)} />

              {/* Morphing FAB */}
              <div className="fab" onClick={onFabClick}>
                <span className="fab-plus">
                  <span className="material-icons">add</span>
                </span>

                <div className="fab-menu">

                  {/* Header row: title + close aligned together, no dead space */}
                  <div className="fab-menu-hd">
                    <div className="fab-head">
                      <div className="fab-head-title">
                        <span className="material-symbols-outlined fab-head-icon">add_circle</span>
                        Quick create
                      </div>
                      <div className="fab-head-sub">Add something to your workspace</div>
                    </div>
                    <button
                      type="button"
                      className="fab-close"
                      data-proximity
                      onClick={(e) => { e.stopPropagation(); toggle(false) }}
                      aria-label="Close"
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>

                  <div className="fab-menu-sep" />

                  {/* New lead — emerald */}
                  <div
                    className="fab-item" data-proximity
                    style={{ '--ic-bg': 'var(--brand-primary-500)' } as React.CSSProperties}
                    onClick={(e) => onPickItem(e)}
                  >
                    <div className="fab-item-ic">
                      <span className="material-symbols-outlined">person_add</span>
                    </div>
                    <div className="fab-item-tx">
                      <div className="fab-item-title">New lead</div>
                      <div className="fab-item-sub">Capture a contact and start a pipeline.</div>
                    </div>
                    <span className="material-symbols-outlined chev">chevron_right</span>
                  </div>

                  {/* Log activity — blue */}
                  <div
                    className="fab-item" data-proximity
                    style={{ '--ic-bg': '#3B82F6' } as React.CSSProperties}
                    onClick={(e) => onPickItem(e)}
                  >
                    <div className="fab-item-ic">
                      <span className="material-symbols-outlined">bolt</span>
                    </div>
                    <div className="fab-item-tx">
                      <div className="fab-item-title">Log activity</div>
                      <div className="fab-item-sub">Record a call, email, or meeting note.</div>
                    </div>
                    <span className="material-symbols-outlined chev">chevron_right</span>
                  </div>

                  {/* Create task — violet */}
                  <div
                    className="fab-item" data-proximity
                    style={{ '--ic-bg': '#8B5CF6' } as React.CSSProperties}
                    onClick={(e) => onPickItem(e)}
                  >
                    <div className="fab-item-ic">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div className="fab-item-tx">
                      <div className="fab-item-title">Create task</div>
                      <div className="fab-item-sub">Add a follow-up with an owner and due date.</div>
                    </div>
                    <span className="material-symbols-outlined chev">chevron_right</span>
                  </div>

                  {/* New deal — orange */}
                  <div
                    className="fab-item" data-proximity
                    style={{ '--ic-bg': '#F97316' } as React.CSSProperties}
                    onClick={(e) => onPickItem(e)}
                  >
                    <div className="fab-item-ic">
                      <span className="material-symbols-outlined">handshake</span>
                    </div>
                    <div className="fab-item-tx">
                      <div className="fab-item-title">New deal</div>
                      <div className="fab-item-sub">Open an opportunity in your pipeline.</div>
                    </div>
                    <span className="material-symbols-outlined chev">chevron_right</span>
                  </div>

                </div>{/* /.fab-menu */}
              </div>{/* /.fab */}

            </div>{/* /.fab-screen */}
          </div>{/* /.shell */}
          <div className="hint">Tap the <b>+</b> button · Esc to close</div>
        </div>
      </div>
    </div>
  )
}
