import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DynamicCalendar.css'

import { useMemo, useRef, useState } from 'react'
import { iconClass } from '@/lib/iconClass'
import { useProximityGroup } from '@/lib/hooks/use-proximity-group'
import { makeDcRefs, type IslandState } from './dynamic-calendar-hook'

// ---------- Calendar helpers ----------
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
const mondayIdx = (date: Date) => (date.getDay() + 6) % 7

interface GridCell { d: number; dim: boolean; m: number; y: number }

function buildMonthGrid(year: number, month: number): GridCell[] {
  const first = new Date(year, month, 1)
  const lead = mondayIdx(first)
  const days = daysInMonth(year, month)
  const prevDays = daysInMonth(year, month - 1)
  const cells: GridCell[] = []
  for (let i = lead - 1; i >= 0; i--) {
    cells.push({ d: prevDays - i, dim: true, m: month - 1, y: month === 0 ? year - 1 : year })
  }
  for (let d = 1; d <= days; d++) cells.push({ d, dim: false, m: month, y: year })
  while (cells.length % 7 !== 0) {
    cells.push({ d: cells.length - (lead + days) + 1, dim: true, m: month + 1, y: month === 11 ? year + 1 : year })
  }
  while (cells.length < 35) {
    cells.push({ d: cells.length - (lead + days) + 1, dim: true, m: month + 1, y: month === 11 ? year + 1 : year })
  }
  return cells
}

const sameDay = (a: Date | null, b: Date | null) =>
  a != null && b != null &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const fmtRange = (s: Date, e: Date) => `${fmtTime(s)} – ${fmtTime(e)}`

function fmtCountdown(ms: number): string {
  if (ms <= 0) return 'now'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h >= 24) return `${Math.floor(h / 24)}d`
  if (h >= 1) return `${h}h ${m}m`
  return `${m}m`
}
const fmtCountdownDisplay = (ms: number | null): string => {
  if (ms == null) return '—'
  if (ms <= 0) return 'now'
  return `in ${fmtCountdown(ms)}`
}
function fmtDuration(ms: number): string {
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

// ---------- Types ----------
interface CalEvent {
  id: string; start: Date; end: Date; title: string; kind: 'event' | 'bday'
}

// ---------- Sample events ----------
function buildSampleEvents(base: Date): CalEvent[] {
  const y = base.getFullYear(), m = base.getMonth(), d = base.getDate()
  const at = (off: number, h: number, min: number, dur: number) => {
    const s = new Date(y, m, d + off, h, min)
    return { start: s, end: new Date(s.getTime() + dur * 60000) }
  }
  return [
    { id: 'e1', ...at(0, base.getHours(), base.getMinutes() + 6, 30), title: 'Standup', kind: 'event' },
    { id: 'e2', ...at(0, 12, 40, 90), title: 'Brainstorming with Jace', kind: 'event' },
    { id: 'e3', ...at(0, 0, 0, 24 * 60), title: "Jace's Birthday", kind: 'bday' },
    { id: 'e4', ...at(0, 15, 30, 45), title: 'Design review · v0.42', kind: 'event' },
    { id: 'e5', ...at(1, 9, 0, 60), title: 'Coffee w/ Maya', kind: 'event' },
    { id: 'e6', ...at(3, 14, 0, 30), title: 'Sprint planning', kind: 'event' },
    { id: 'e7', ...at(7, 11, 0, 60), title: '1:1 with Kai', kind: 'event' },
  ]
}

// ---------- Props ----------
interface DynamicCalendarProps {
  events?: CalEvent[]
  initialDate?: Date
  trigger?: 'click' | 'hoverThenClick'
  onOpenCalendar?: (d?: Date) => void
  state?: IslandState
  onStateChange?: (s: IslandState) => void
}

export default function DynamicCalendar({
  events: eventsProp,
  initialDate,
  trigger = 'hoverThenClick',
  onOpenCalendar,
  state: stateProp,
  onStateChange,
}: DynamicCalendarProps = {}) {
  const today = useMemo(() => initialDate ?? new Date(), [initialDate])
  const events = useMemo(() => eventsProp ?? buildSampleEvents(today), [eventsProp, today])

  const [internalState, setInternalState] = useState<IslandState>('compact')
  const islandState = stateProp ?? internalState

  // Updated every 30s by the ticker in the callback-ref hook
  const [now, setNow] = useState(() => today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<Date>(today)

  // Build callback-refs + hook-owned setState once.
  // The hook's setStateFromHook keeps its internal currentState in sync and
  // also calls setInternalState — so React state and the hook's closure agree.
  const { rootCallbackRef, islandCallbackRef, setStateFromHook } = useMemo(
    () =>
      makeDcRefs(
        (next) => {
          setInternalState(next)
          onStateChange?.(next)
        },
        setNow,
      ),
    // onStateChange is intentionally excluded — it's a prop that may change but
    // the hook is created once; callers use the controlled `state` prop to drive
    // transitions from the outside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // setIslandState — wraps setStateFromHook (hook internal sync) + controlled mode
  const setIslandState = (next: IslandState) => {
    setStateFromHook(next)
    if (stateProp !== undefined) onStateChange?.(next)
  }

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // All event handlers below are passed as JSX props; they must NOT mutate any
  // captured variable (react-hooks/immutability). They only call stable dispatch
  // functions (setIslandState, setViewYear, etc.) and timer APIs.

  const onIslandClick = () => {
    if (islandState === 'expanded') return
    setIslandState('expanded')
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelected(today)
  }
  const onIslandKeyDown = (e: React.KeyboardEvent) => {
    if (islandState !== 'expanded' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onIslandClick()
    }
  }
  const onMouseEnter = () => {
    if (trigger !== 'hoverThenClick' || islandState !== 'compact') return
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setIslandState('preview'), 40)
  }
  const onMouseLeave = () => {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current)
    if (islandState === 'preview') setIslandState('compact')
  }

  const prevMonth = () => {
    setViewMonth((m) => (m === 0 ? 11 : m - 1))
    setViewYear((y) => (viewMonth === 0 ? y - 1 : y))
  }
  const nextMonth = () => {
    setViewMonth((m) => (m === 11 ? 0 : m + 1))
    setViewYear((y) => (viewMonth === 11 ? y + 1 : y))
  }

  // Derived
  const nextEvent = useMemo(
    () =>
      events
        .filter((e) => e.end > now && e.kind === 'event')
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null,
    [events, now],
  )
  const eventsToday = useMemo(
    () =>
      events
        .filter((e) => sameDay(e.start, selected ?? today))
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, selected, today],
  )
  const eventDateKeys = useMemo(() => {
    const s = new Set<string>()
    events.forEach((e) => s.add(`${e.start.getFullYear()}-${e.start.getMonth()}-${e.start.getDate()}`))
    return s
  }, [events])
  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const countdownMs = nextEvent ? nextEvent.start.getTime() - now.getTime() : null

  // Cell keyboard nav
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  // Proximity: month-grid day cells (clickable, select a date)
  const gridProximityRef = useProximityGroup<HTMLTableElement>()
  const onCellKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (islandState !== 'expanded') return
    let next = -1
    if (e.key === 'ArrowRight') next = idx + 1
    else if (e.key === 'ArrowLeft') next = idx - 1
    else if (e.key === 'ArrowDown') next = idx + 7
    else if (e.key === 'ArrowUp') next = idx - 7
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const c = cells[idx]
      setSelected(new Date(c.y, c.m, c.d))
      return
    }
    if (next >= 0 && next < cells.length) {
      e.preventDefault()
      cellRefs.current[next]?.focus()
    }
  }

  return (
    <div className="dc-shell" onMouseDown={(e) => e.stopPropagation()}>
      {/* Fake macOS menu bar — decorative */}
      <div className="dc-menubar" aria-hidden="true">
        <span className="dc-apple"></span>
        <span style={{ fontWeight: 800 }}>Calendar</span>
        <span>File</span><span>Edit</span><span>View</span><span>Window</span><span>Help</span>
        <span className="dc-right">
          <span className={`dc-menubar-icon ${iconClass('wifi')}`}>wifi</span>
          <span className={`dc-menubar-icon ${iconClass('battery_4_bar')}`}>battery_4_bar</span>
          {/* `now` is updated every 30s by the ticker; deterministic in tests */}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </span>
      </div>

      <div className="dc-island-wrap" ref={rootCallbackRef}>
        {/*
          The island div acts as button when compact/preview and as a dialog when expanded.
          We use role="dialog" only in expanded state; in compact/preview state we rely on
          tabIndex + keyboard handler (prefer-tag-over-role disallows role="button" on divs).
        */}
        <div
          ref={islandCallbackRef}
          className={`dc-island ${islandState}`}
          tabIndex={0}
          role={islandState === 'expanded' ? 'dialog' : undefined}
          aria-expanded={islandState !== 'compact'}
          aria-label={
            islandState === 'compact'
              ? `Calendar. Next event ${countdownMs != null ? fmtCountdownDisplay(countdownMs) : 'soon'}. Press Enter to expand.`
              : 'Calendar'
          }
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onIslandClick}
          onKeyDown={onIslandKeyDown}
        >
          {/*
            ---------- Compact + Preview (shared chip) ----------
            Item 3 — compact and preview share ONE persistent layer. The header
            (icon + pulse + countdown) is the SAME DOM in both states, so on hover
            it MOVES/translates to its new place instead of fading one set of text
            out and a new set in. Only the preview-only event detail reveals.
          */}
          <div
            className={`dc-layer dc-chip-layer ${
              islandState === 'expanded' ? 'behind' : 'active'
            } is-${islandState}`}
          >
            <div className="dc-chip">
              <div className="dc-chip-top">
                <div className="dc-compact-left">
                  <span className="dc-cal-icon">
                    <span className={`dc-icon ${iconClass('event')}`}>event</span>
                  </span>
                  <span className="dc-pulse" aria-hidden="true" />
                </div>
                <span className="dc-countdown" aria-live="polite">
                  {fmtCountdownDisplay(countdownMs)}
                </span>
              </div>
              <div className="dc-preview-event">
                <div className="dc-event-stripe" />
                <div className="dc-event-title">
                  {nextEvent ? nextEvent.title : 'No upcoming events'}
                </div>
                {nextEvent && (
                  <div className="dc-event-when">
                    <span className={`dc-icon ${iconClass('schedule')}`}>schedule</span>
                    <span className="dc-event-when-text">
                      {fmtDuration(nextEvent.end.getTime() - nextEvent.start.getTime())}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---------- Expanded (click) ---------- */}
          <div className={`dc-layer dc-expanded-layer ${islandState === 'expanded' ? 'active' : 'behind'}`}>
            <div className="dc-expanded-grid">

              {/* LEFT — today / selected summary + events */}
              <div className="dc-left">
                <button
                  type="button"
                  className="dc-open-cal-btn"
                  onClick={(e) => { e.stopPropagation(); onOpenCalendar?.(selected) }}
                  aria-label={onOpenCalendar ? 'Open Calendar app' : 'Selected date'}
                >
                  <div className="dc-today-row">
                    <span className="dc-today-dow">
                      {selected.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                  <h2 className="dc-today-num">{selected.getDate()}</h2>
                </button>

                <div className="dc-event-list-wrap">
                  <div className="dc-event-list">
                    {eventsToday.map((ev, i) => (
                      <div
                        key={ev.id}
                        className={`dc-event-row kind-${ev.kind}${
                          sameDay(ev.start, today) && ev.kind === 'event' && nextEvent && ev.id === nextEvent.id
                            ? ' is-focus' : ''
                        }`}
                        style={{ '--dc-delay': `${120 + i * 70}ms` } as React.CSSProperties}
                      >
                        {ev.kind === 'bday' ? (
                          <span className="dc-glyph">
                            <span className={`dc-icon ${iconClass('cake')}`}>cake</span>
                          </span>
                        ) : (
                          <span className="dc-dot" />
                        )}
                        <div className="dc-event-row-text">
                          <div className="dc-event-row-title">{ev.title}</div>
                          {ev.kind === 'event' && (
                            <div className="dc-event-row-time">{fmtRange(ev.start, ev.end)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {eventsToday.length === 0 && (
                      <div
                        className="dc-more"
                        style={{ '--dc-delay': '120ms' } as React.CSSProperties}
                      >
                        Nothing scheduled
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT — month grid */}
              <div className="dc-right">
                <div className="dc-month-head">
                  <span className="dc-month-name">
                    {MONTHS[viewMonth]}
                    <span className="dc-year">{viewYear}</span>
                  </span>
                  <div className="dc-month-nav">
                    <button
                      type="button"
                      className="dc-nav-btn"
                      onClick={(e) => { e.stopPropagation(); prevMonth() }}
                      aria-label="Previous month"
                    >
                      <span className={`dc-icon ${iconClass('chevron_left')}`}>chevron_left</span>
                    </button>
                    <button
                      type="button"
                      className="dc-nav-btn"
                      onClick={(e) => { e.stopPropagation(); nextMonth() }}
                      aria-label="Next month"
                    >
                      <span className={`dc-icon ${iconClass('chevron_right')}`}>chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Use a real <table> for the grid so th/td provide the correct semantics
                    without needing role="columnheader" / role="gridcell" on divs. */}
                <table
                  className="dc-grid"
                  role="grid"
                  aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
                  ref={gridProximityRef}
                >
                  <thead>
                    <tr>
                      {DOW_SHORT.map((d, i) => (
                        <th key={DOW_LABELS[i]} scope="col" className="dc-dow">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.ceil(cells.length / 7) }, (_, rowIdx) => (
                      <tr key={`row-${viewYear}-${viewMonth}-${rowIdx}`}>
                        {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((c) => {
                          const cellDate = new Date(c.y, c.m, c.d)
                          const isToday = sameDay(cellDate, today)
                          const isSelected = sameDay(cellDate, selected)
                          const cellKey = `${c.y}-${c.m}-${c.d}`
                          const hasEvent = eventDateKeys.has(cellKey)
                          const idx = rowIdx * 7 + cells.slice(rowIdx * 7, rowIdx * 7 + 7).indexOf(c)
                          return (
                            <td key={cellKey} className="dc-cell-td">
                              <button
                                type="button"
                                ref={(el) => { cellRefs.current[idx] = el }}
                                className={[
                                  'dc-cell',
                                  c.dim && 'dim',
                                  isToday && 'today',
                                  isSelected && 'selected',
                                  hasEvent && !isToday && 'has-event',
                                ].filter(Boolean).join(' ')}
                                aria-selected={isSelected}
                                aria-label={cellDate.toDateString()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelected(cellDate)
                                  if (c.m !== viewMonth) {
                                    setViewMonth(c.m)
                                    setViewYear(c.y)
                                  }
                                }}
                                onKeyDown={(e) => onCellKeyDown(e, idx)}
                                style={{ '--dc-delay': `${120 + idx * 12}ms` } as React.CSSProperties}
                                data-proximity
                              >
                                {c.d}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              className="dc-close"
              aria-label="Close calendar"
              onClick={(e) => { e.stopPropagation(); setIslandState('compact') }}
            >
              <span className={`dc-icon ${iconClass('close')}`}>close</span>
            </button>
          </div>
        </div>
      </div>

      <div className="dc-hint">
        <span className="dc-hint-pill">
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--brand-primary-500)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--brand-primary-500) 18%, transparent)',
            }}
          />
          {' '}Hover the island for a preview · Click to expand · <kbd>Esc</kbd> to close
        </span>
      </div>
    </div>
  )
}
