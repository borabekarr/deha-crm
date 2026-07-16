import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import '../../../../design-system/preview/_shared-feedback.css'
import './GithubCalendar.css'

import { useMemo, useState } from 'react'
import { gcCardRef, cleanupGcCard } from './github-calendar-hook'
import { iconClass } from '../../../lib/iconClass'
import { useSquircle } from '../../../lib/hooks/use-squircle'

/* =========================================================================
   GitHub Calendar — Deha Design System
   Contribution heatmap: emerald ramp, glossy cells, hover tooltip,
   diagonal pop-in wave, optional city-lights glow. Data is deterministic.
   ========================================================================= */

/* ----------------------------- accent ramps ----------------------------- */
/* [empty, L1, L2, L3, L4] for light and dark, + glow color */
const SCHEMES: Record<string, {
  light: [string, string, string, string, string],
  dark: [string, string, string, string, string],
  glow: string,
}> = {
  emerald: {
    light: ['#E9EEF3', 'var(--brand-primary-200)', 'var(--brand-primary-400)', 'var(--brand-primary-500)', 'var(--brand-primary-700)'],
    dark:  ['#202020', '#0C5A43', 'var(--brand-primary-800)', 'var(--brand-primary-500)', 'var(--brand-primary-400)'],
    glow:  'var(--brand-primary-500)',
  },
  ocean: {
    light: ['#E9EEF3', '#BAE6FD', '#38BDF8', '#0284C7', '#0369A1'],
    dark:  ['#202020', '#0C4A6E', '#075985', '#0284C7', '#38BDF8'],
    glow:  '#38BDF8',
  },
  violet: {
    light: ['#E9EEF3', '#DDD6FE', '#A78BFA', '#7C3AED', '#5B21B6'],
    dark:  ['#202020', '#2E1065', '#3B0764', '#7C3AED', '#A78BFA'],
    glow:  '#A78BFA',
  },
  amber: {
    light: ['#E9EEF3', '#FDE68A', '#FBBF24', '#D97706', '#92400E'],
    dark:  ['#202020', '#451A03', '#78350F', '#D97706', '#FBBF24'],
    glow:  '#FBBF24',
  },
  slate: {
    light: ['#E9EEF3', '#D4D4D4', '#A1A1A1', '#6B6B6B', '#232323'],
    dark:  ['#202020', '#232323', '#4A4A4A', '#A1A1A1', '#D4D4D4'],
    glow:  '#A1A1A1',
  },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ----------------------------- deterministic PRNG ----------------------------- */
/** Mulberry32 — same seed = same sequence every render */
function mulberry(seed: number) {
  return function (): number {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ----------------------------- data helpers ----------------------------- */
type DayCell = { date: Date; count: number; level: 0 | 1 | 2 | 3 | 4 } | null

function buildData(): { weeks: DayCell[][]; total: number } {
  const rnd = mulberry(424242)
  const end = new Date(2026, 5, 14)          // anchored "today" — deterministic
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - 1)
  // rewind to the Sunday of start week
  start.setDate(start.getDate() - start.getDay())

  const weeks: DayCell[][] = []
  const cursor = new Date(start)
  let total = 0

  while (cursor <= end) {
    const week: DayCell[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(cursor)
      if (day > end) {
        week.push(null)
      } else {
        const r = rnd()
        const count = r < 0.55 ? 0
                    : r < 0.70 ? Math.floor(rnd() * 3) + 1
                    : r < 0.85 ? Math.floor(rnd() * 5) + 3
                    : r < 0.95 ? Math.floor(rnd() * 6) + 6
                    :            Math.floor(rnd() * 8) + 10
        const level = count === 0 ? 0
                    : count <= 2  ? 1
                    : count <= 5  ? 2
                    : count <= 9  ? 3
                    :               4
        total += count
        week.push({ date: day, count, level: level as 0 | 1 | 2 | 3 | 4 })
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return { weeks, total }
}


interface MonthLabel { col: number; label: string }

function monthLabels(weeks: DayCell[][]): MonthLabel[] {
  const labels: MonthLabel[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const first = week.find((d) => d !== null)
    if (!first) return
    const m = first.date.getMonth()
    if (m !== lastMonth) {
      labels.push({ col: wi, label: MONTHS[m]! })
      lastMonth = m
    }
  })
  return labels
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ----------------------------- icons ----------------------------- */
function IcoPulse() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12h3.2l2.2-6 3.4 13 2.6-9 1.6 4h4.4"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


/* ----------------------------- types ----------------------------- */
type Scheme = 'emerald' | 'ocean' | 'violet' | 'amber' | 'slate'
type CellShape = 'square' | 'rounded' | 'circle'

interface TipState {
  x: number
  y: number
  count: number
  date: Date
}

interface GithubCalendarProps {
  scheme?: Scheme
  shape?: CellShape
  glow?: boolean
}

/* ----------------------------- component ----------------------------- */
export default function GithubCalendar({
  scheme = 'emerald',
  shape = 'rounded',
  glow = false,
}: GithubCalendarProps) {
  const { weeks, total } = useMemo(() => buildData(), [])
  const labels = useMemo(() => monthLabels(weeks), [weeks])

  const [tip, setTip] = useState<TipState | null>(null)

  const sc = SCHEMES[scheme] ?? SCHEMES['emerald']!
  // dark-mode ramp is selected via html.dark + CSS custom properties;
  // here we expose both ramps as CSS vars and let CSS pick via html.dark overrides.
  // The light ramp is the default; dark ramp overridden in CSS below via data attrs.
  const ramp = sc.light
  const cellR = shape === 'circle' ? '50%' : shape === 'square' ? '0px' : '3px'
  const vars = {
    '--l0': ramp[0], '--l1': ramp[1], '--l2': ramp[2], '--l3': ramp[3], '--l4': ramp[4],
    '--glow': sc.glow, '--cell-r': cellR,
    // expose dark ramp as additional vars so CSS html.dark rule can override
    '--dl0': sc.dark[0], '--dl1': sc.dark[1], '--dl2': sc.dark[2], '--dl3': sc.dark[3], '--dl4': sc.dark[4],
  } as React.CSSProperties

  function handleCellEnter(e: React.MouseEvent<HTMLDivElement>, d: DayCell) {
    if (!d) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    setTip({
      x: rect.left + rect.width / 2,
      y: rect.top,
      count: d.count,
      date: d.date,
    })
  }

  const levelClass = ['gc-l0', 'gc-l1', 'gc-l2', 'gc-l3', 'gc-l4'] as const
  const outerSquircleRef = useSquircle<HTMLDivElement>()
  const cardSquircleRef = useSquircle<HTMLElement>()

  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <>
      <div className="gc-outer" ref={outerSquircleRef}>
      <article
        className="gc-card"
        ref={(el) => {
          gcCardRef(el)
          cardSquircleRef(el)
          return () => {
            cleanupGcCard(el)
            cardSquircleRef(null)
          }
        }}
        style={vars}
        data-glow={glow ? 'on' : 'off'}
        data-anim="off"
        data-scheme={scheme}
      >
        {/* Header */}
        <header className="gc-head">
          <div className="gc-id">
            <span className="gc-avatar"><IcoPulse /></span>
            <div>
              <div className="gc-name">@deha-labs</div>
              <div className="gc-sub">Public contribution activity</div>
            </div>
          </div>
          <div className="gc-total">
            <b>{total.toLocaleString()}</b> contributions in the last year
          </div>
        </header>

        {/* Graph */}
        <div className="gc-scroller">
          {/* Month labels */}
          <div
            className="gc-months"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, var(--cell))` }}
          >
            {labels.map((l) => (
              <span key={l.col} style={{ gridColumnStart: l.col + 1 }}>
                {l.label}
              </span>
            ))}
          </div>

          {/* DOW labels + grid */}
          <div className="gc-body">
            <div className="gc-dow">
              {DOW_LABELS.map((label, i) => (
                <span key={label} style={{ gridRow: i + 1 }}>{label}</span>
              ))}
            </div>

            <div className="gc-grid" onMouseLeave={() => setTip(null)}>
              {weeks.map((week, wi) => {
                // Find first real (non-null) cell to determine column row offset
                const firstRealIdx = week.findIndex((d) => d !== null)
                return week.map((d, di) => {
                  if (!d) return null
                  const delay = wi * 7 + di * 16
                  // Pin the first real cell of each week-column to its weekday row
                  // so partial columns (first/last week) align correctly without empty nodes
                  const rowStart = di === firstRealIdx ? di + 1 : undefined
                  return (
                    <div
                      key={`${wi}-${di}`} // eslint-disable-line react/no-array-index-key
                      className={`gc-cell ${levelClass[d.level]}`}
                      style={{
                        '--d': `${delay}ms`,
                        ...(rowStart !== undefined ? { gridRowStart: rowStart } : {}),
                      } as React.CSSProperties}
                      aria-label={`${d.count} contributions on ${fmtDate(d.date)}`}
                      onMouseEnter={(e) => handleCellEnter(e, d)}
                    />
                  )
                })
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="gc-foot">
          <div className="gc-streak" style={{ backgroundColor: '#F97316' }}>
            <span className={`${iconClass('local_fire_department')} gc-flame`} aria-hidden="true">local_fire_department</span>
            <span className="gc-streak-label">7 Day Streak!</span>
          </div>
          <div className="gc-legend">
            <span>Less</span>
            <div className="gc-legend-cells">
              {([0, 1, 2, 3, 4] as const).map((lvl) => (
                <div
                  key={lvl}
                  className={`gc-legend-cell ${levelClass[lvl]}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </footer>
      </article>
      </div>

      {/* Tooltip — rendered outside the card to avoid clipping */}
      {tip !== null && (
        <div
          className="gc-tip"
          style={{ left: tip.x, top: tip.y }}
          role="tooltip"
          aria-live="polite"
        >
          <b>{tip.count === 0 ? 'No' : tip.count} contribution{tip.count === 1 ? '' : 's'}</b>
          <span>on {fmtDate(tip.date)}</span>
        </div>
      )}
    </>
  )
}
