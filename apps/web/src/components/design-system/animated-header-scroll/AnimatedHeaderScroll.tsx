import { useCallback, useEffect, useRef } from 'react'
import './AnimatedHeaderScroll.css'

// ---------------------------------------------------------------------------
// Animated Header Scroll — Deha Design System
// A phone-framed scroll surface whose large "Pipeline" title collapses into a
// blurred, pinned compact header as the feed scrolls (the iOS large-title
// navigation pattern).
//
// Canonical source per CONVERSION-SOP.md:
// apps/web/design-system/claude-design/raw/animated-header-scroll/animated-header-scroll.html
// — the standalone demo Bora sees on claude.ai/design (device bezel, status
// bar, hero + 9 populated deal rows, scroll hint). The sibling
// AnimatedHeaderScroll.jsx in that same raw dir is a generic, prop-driven
// container API (largeTitle/subtitle/eyebrow/rightComponent/children, no
// baked-in demo content, a 52px pinned header with no status bar, 60px
// content padding, transform-origin left center) and is NOT pixel-comparable
// to the HTML demo the gate diffs against, so it was read for confirmation of
// the collapse math only — the identical clamp/smooth/p/pbar/ptitle/plarge
// pipeline and the same imperative backdrop-filter write. Same
// jsx-for-confirmation-only precedent as ExpandableCard.tsx /
// BlurCarousel.tsx / ExpandableScreen.tsx.
//
// The raw file's `.controls` tweak panel (Blur / Collapse / Theme / Accent)
// is ambient claude.ai/design authoring tooling, excluded here the same way
// every other conversion excludes it; this port fixes its two authored
// defaults at the literal values the raw source ships and its own JS reads
// back: --blur 22px and collapseDist 92.
//
// Motion: one passive scroll listener, rAF-coalesced, writing eased progress
// values as CSS custom properties on the root plus the resolved
// backdrop-filter/background on the pinned header (calc() inside
// backdrop-filter is unreliable across engines — the raw source's own
// reason for setting those imperatively). No per-frame React re-render.
// ---------------------------------------------------------------------------

// Raw source constants (animated-header-scroll.html): `var collapseDist = 92`
// and the `--blur: 22px` the script re-reads via
// getPropertyValue('--blur') || 22.
const COLLAPSE_DIST = 92
const MAX_BLUR = 22

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)
const smooth = (t: number) => t * t * (3 - 2 * t)

interface FeedRow {
  ic?: string
  in?: string
  c: string
  name: string
  meta: string
  amt: string
  time: string
  /** [label, background, color, icon] */
  pill?: [string, string, string, string]
}

// Byte-preserved demo feed from the raw source's `var feed = [...]` (the
// leading { kind: 'hero' } entry is the hero card, rendered ahead of the
// rows below rather than carried as a variant record).
const FEED: FeedRow[] = [
  { ic: 'trending_up', c: '#10B981', name: 'Northwind Traders', meta: 'Moved to Negotiation', amt: '$84.0k', time: '2h', pill: ['Hot', '#FFF7ED', '#F97316', 'local_fire_department'] },
  { in: 'AC', c: '#6366F1', name: 'Acme Corp · Renewal', meta: 'Proposal sent to Dana W.', amt: '$42.0k', time: '4h' },
  { ic: 'check_circle', c: '#10B981', name: 'Globex Inc', meta: 'Deal won — onboarding queued', amt: '$120k', time: 'Today', pill: ['Won', '#ECFDF5', '#059669', 'verified'] },
  { in: 'LR', c: '#0EA5E9', name: 'Lumen Retail', meta: 'Discovery call booked', amt: '$28.5k', time: 'Yest.' },
  { ic: 'schedule', c: '#EAB308', name: 'Vertex Systems', meta: 'Awaiting signature · 3d', amt: '$67.0k', time: '1d', pill: ['Stalled', '#FEFCE8', '#A16207', 'hourglass_top'] },
  { in: 'PD', c: '#EC4899', name: 'Pinnacle Design', meta: 'New lead assigned to you', amt: '$15.0k', time: '1d' },
  { in: 'OS', c: '#8B5CF6', name: 'Orbit Software', meta: 'Demo completed · follow up', amt: '$96.0k', time: '2d' },
  { in: 'BH', c: '#14B8A6', name: 'Beacon Health', meta: 'Contract under review', amt: '$210k', time: '3d' },
  { in: 'QF', c: '#F97316', name: 'Quanta Foods', meta: 'Re-engaged after 30 days', amt: '$33.0k', time: '4d' },
]

function Actions() {
  return (
    <div className="actions">
      <button className="icon-btn" aria-label="Search"><span className="material-icons">search</span></button>
      <button className="icon-btn accent" aria-label="Add deal"><span className="material-icons">add</span></button>
    </div>
  )
}

export default function AnimatedHeaderScroll() {
  const deviceRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef<HTMLDivElement>(null)
  const pinnedBarRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const ticking = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The collapse math: one scroll handler, drives CSS custom props.
  const update = useCallback(() => {
    ticking.current = false
    const device = deviceRef.current
    const scroller = scrollerRef.current
    const pinned = pinnedRef.current
    const pinnedBar = pinnedBarRef.current
    const hint = hintRef.current
    if (!device || !scroller || !pinned || !pinnedBar || !hint) return

    const p = clamp(scroller.scrollTop / COLLAPSE_DIST, 0, 1)

    const pbar = smooth(p)                                  // bar bg + blur + rule
    const ptitle = smooth(clamp((p - 0.42) / 0.58, 0, 1))    // small title slides up
    const plarge = 1 - smooth(clamp(p / 0.62, 0, 1))         // large title fades + scales

    device.style.setProperty('--p', p.toFixed(4))
    device.style.setProperty('--pbar', pbar.toFixed(4))
    device.style.setProperty('--ptitle', ptitle.toFixed(4))
    device.style.setProperty('--plarge', plarge.toFixed(4))

    // background + backdrop blur applied imperatively (calc inside backdrop-filter
    // is unreliable across engines, so we set the resolved values here)
    const maxBlur = Number.parseFloat(device.style.getPropertyValue('--blur')) || MAX_BLUR
    const blur = `blur(${(pbar * maxBlur).toFixed(1)}px) saturate(160%)`
    pinned.style.backdropFilter = blur
    pinned.style.setProperty('-webkit-backdrop-filter', blur)
    // Raw source reads the theme off the device element's own `dark` class
    // (its tweak panel's Theme segment); the app drives dark mode from
    // html.dark instead, so both are honored — the two literal rgb triplets
    // are the raw source's own.
    const isDark = device.classList.contains('dark') || document.documentElement.classList.contains('dark')
    const rgb = isDark ? '15,23,42' : '255,255,255'
    pinned.style.background = `rgba(${rgb},${(pbar * 0.78).toFixed(3)})`

    if (p > 0.06) hint.classList.add('hide')
    else hint.classList.remove('hide')

    // collapsed header only accepts clicks once it has risen into view
    pinnedBar.classList.toggle('revealed', ptitle > 0.5)
  }, [])

  const onScroll = useCallback(() => {
    // Scope the pinned header's will-change hint to active scrolling only
    // (compositor layer promotion is a standing cost; the blur/background
    // aren't changing while the feed sits still). Pure class writes, no
    // layout reads — cheap outside the rAF-coalesced update() below.
    deviceRef.current?.classList.add('is-scrolling')
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      deviceRef.current?.classList.remove('is-scrolling')
    }, 160)

    if (!ticking.current) {
      ticking.current = true
      requestAnimationFrame(update)
    }
  }, [update])

  useEffect(() => {
    deviceRef.current?.style.setProperty('--blur', `${MAX_BLUR}px`)
    update()
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [update])

  return (
    <div className="device" ref={deviceRef}>
      <div className="screen">

        {/* Pinned collapsed header (blur ramps in) */}
        <div className="pinned" ref={pinnedRef}>
          <div className="rule"></div>
          <div className="pinned-bar" ref={pinnedBarRef}>
            <div className="pinned-title">
              <div className="t">Pipeline</div>
              <div className="s">8 deals · $2.4M open</div>
            </div>
            <Actions />
          </div>
        </div>

        {/* Status bar */}
        <div className="statusbar">
          <span>9:41</span>
          <div className="dots">
            <span className="ico">signal_cellular_alt</span>
            <span className="ico">wifi</span>
            <span className="ico">battery_full</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="scroller" ref={scrollerRef} onScroll={onScroll}>
          <div className="content">
            {/* Large header */}
            <div className="large-head">
              <div className="large-head-title">
                <div className="eyebrow">Sales</div>
                <h1>Pipeline</h1>
                <div className="sub">8 deals · $2.4M open</div>
              </div>
              <Actions />
            </div>

            {/* Feed */}
            <div className="feed">
              <div className="hero">
                <div className="k">Pipeline this month</div>
                <div className="v">$2.41M</div>
                <div className="row2">
                  <span className="delta"><span className="material-icons">arrow_upward</span>12.5%</span>
                  <span style={{ opacity: 0.88 }}>vs. $2.14M last month</span>
                </div>
              </div>
              {FEED.map((it) => (
                <div className="row" key={it.name}>
                  <div className="av" style={{ background: it.c }}>
                    {it.ic ? <span className="material-icons">{it.ic}</span> : it.in}
                  </div>
                  <div className="mid">
                    <div className="name">{it.name}</div>
                    <div className="meta">{it.meta}</div>
                  </div>
                  <div className="end">
                    <div className="amt">{it.amt}</div>
                    {it.pill ? (
                      <div style={{ marginTop: 5 }}>
                        <span className="pill" style={{ background: it.pill[1], color: it.pill[2] }}>
                          <span className="material-icons">{it.pill[3]}</span>{it.pill[0]}
                        </span>
                      </div>
                    ) : (
                      <div className="time">{it.time}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="scroll-hint" ref={hintRef}><span className="material-icons">expand_more</span>Scroll to collapse</div>
        <div className="home-ind"></div>
      </div>
    </div>
  )
}
