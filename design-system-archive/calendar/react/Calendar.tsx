import '../../../../design-system/preview/_base.css'
import './Calendar.css'

import { useState } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────

const B = '#3B82F6'
const O = '#F97316'
const P = '#EC4899'

interface EventInfo {
  badge: string
  icon: string
  color: string
  titles: string[]
  times: string[]
}

const INFO: Record<string, EventInfo> = {
  [B]: {
    badge: 'Meeting',
    icon: 'group',
    color: '#3B82F6',
    titles: ['Team standup', 'Client call', 'Weekly sync', 'Strategy review', 'Product meeting', 'Investor call', 'Sprint planning'],
    times: ['9:00', '9:30', '10:00', '11:00', '14:00', '15:00', '16:30'],
  },
  [O]: {
    badge: 'Review',
    icon: 'rate_review',
    color: '#F97316',
    titles: ['Property visit', 'Site inspection', 'Listing review', 'Market analysis', 'Buyer showing', 'Lease signing', 'Portfolio review'],
    times: ['10:00', '10:30', '11:30', '13:00', '14:00', '15:30', '16:00'],
  },
  [P]: {
    badge: 'Personal',
    icon: 'self_improvement',
    color: '#EC4899',
    titles: ['Yoga class', 'Gym session', 'Dinner out', 'Evening run', 'Coffee break', 'Personal errand', 'Family time'],
    times: ['7:30', '8:00', '18:00', '18:30', '19:00', '19:30', '20:00'],
  },
}

// May 2026 predefined dot data
const MAY_DOTS: Record<number, string[]> = {
  1: [B, B, P], 2: [P], 3: [P], 4: [B, O, P], 5: [B, O], 6: [B, O], 7: [B, B, O], 8: [B, O], 9: [O],
  10: [P], 11: [B, O, P], 12: [B, O, P], 13: [O, B], 14: [B, B, O], 15: [B, O, O], 16: [P],
  17: [P], 18: [B, O], 19: [B, P], 20: [P, O, B], 21: [B, B, O], 22: [P], 23: [P],
  24: [P], 25: [B, O], 26: [B, B, P], 27: [O, B], 28: [O, B, B], 29: [B, P, O], 30: [P], 31: [P],
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// ── Helpers ────────────────────────────────────────────────────────────────

function getDots(year: number, month: number, day: number): string[] {
  if (year === 2026 && month === 4) return MAY_DOTS[day] ?? []
  const h = (year * 1200 + month * 100 + day) % 19
  if (h < 4) return []
  if (h < 7) return [P]
  if (h < 10) return [B]
  if (h < 13) return [O, P]
  if (h < 16) return [B, O]
  return [B, O, P]
}

interface Cell {
  d: number
  m: 'p' | 'c' | 'n'
}

function buildCells(year: number, month: number): Cell[] {
  const firstDOW = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells: Cell[] = []
  for (let i = firstDOW - 1; i >= 0; i--) cells.push({ d: prevDays - i, m: 'p' })
  for (let d = 1; d <= daysInMon; d++) cells.push({ d, m: 'c' })
  while (cells.length < 42) cells.push({ d: cells.length - firstDOW - daysInMon + 1, m: 'n' })
  return cells
}

interface CalEvent {
  time: string
  title: string
  dot: string
  badge: string
  icon: string
  color: string
}

function getEvents(year: number, month: number, day: number): CalEvent[] {
  const dots = getDots(year, month, day)
  return dots
    .map((color, i) => {
      const info = INFO[color]
      if (!info) return null
      return {
        time: info.times[(day * 2 + i * 3) % info.times.length],
        title: info.titles[(day + i * 4) % info.titles.length],
        dot: color,
        badge: info.badge,
        icon: info.icon,
        color: info.color,
      }
    })
    .filter((x): x is CalEvent => x !== null)
    .sort((a, b) => a.time.localeCompare(b.time))
}

function countMonthEvents(year: number, month: number): number {
  const n = new Date(year, month + 1, 0).getDate()
  let total = 0
  for (let d = 1; d <= n; d++) total += getDots(year, month, d).length
  return total
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Calendar() {
  const [curYear, setCurYear] = useState(2026)
  const [curMonth, setCurMonth] = useState(4) // May = 4
  const [sel, setSel] = useState(4) // day 4 selected initially

  const isViewingToday = curYear === 2026 && curMonth === 4 && sel === 26

  function prevMonth() {
    if (curMonth === 0) {
      setCurMonth(11)
      setCurYear((y) => y - 1)
    } else {
      setCurMonth((m) => m - 1)
    }
    setSel(1)
  }

  function nextMonth() {
    if (curMonth === 11) {
      setCurMonth(0)
      setCurYear((y) => y + 1)
    } else {
      setCurMonth((m) => m + 1)
    }
    setSel(1)
  }

  function goToday() {
    setCurYear(2026)
    setCurMonth(4)
    setSel(26)
  }

  const cells = buildCells(curYear, curMonth)
  const events = getEvents(curYear, curMonth, sel)
  const dow = new Date(curYear, curMonth, sel).getDay()
  const cnt = events.length
  const label =
    DAY_NAMES[dow] +
    ', ' +
    MONTH_NAMES[curMonth].slice(0, 3).toUpperCase() +
    ' ' +
    sel +
    ' · ' +
    cnt +
    (cnt === 1 ? ' EVENT' : ' EVENTS')

  return (
    <div className="card">
      <div className="cal-outer">
        <div className="cal-panel">

          {/* Header */}
          <div className="cal-header">
            <div className="cal-title-area">
              <span className="cal-month-yr">{MONTH_NAMES[curMonth]} {curYear}</span>
              <span className="cal-count">{countMonthEvents(curYear, curMonth)}</span>
            </div>
            <div className="cal-actions">
              <button
                className={`cal-today-btn${isViewingToday ? ' is-today' : ''}`}
                onClick={goToday}
              >
                Today
              </button>
              <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">
                <span className="material-icons">chevron_left</span>
              </button>
              <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="cal-dow-row">
            <div className="cal-dow">Sun</div>
            <div className="cal-dow">Mon</div>
            <div className="cal-dow">Tue</div>
            <div className="cal-dow">Wed</div>
            <div className="cal-dow">Thu</div>
            <div className="cal-dow">Fri</div>
            <div className="cal-dow">Sat</div>
          </div>

          {/* Calendar grid */}
          <div className="cal-grid">
            {cells.map((cell, idx) => {
              const dots = cell.m === 'c' ? getDots(curYear, curMonth, cell.d) : []
              const isSelected = cell.m === 'c' && cell.d === sel
              const className = [
                'cal-cell',
                cell.m !== 'c' ? 'other-month' : '',
                isSelected ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <div
                  key={idx}
                  className={className}
                  onClick={cell.m === 'c' ? () => setSel(cell.d) : undefined}
                >
                  <div className="cal-date-num">{cell.d}</div>
                  <div className="cal-dots">
                    {dots.map((clr, di) => (
                      <div key={di} className="cal-dot" style={{ background: clr }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="cal-divider" />

          {/* Events panel — key on sel+month+year so children remount and replay CSS animations */}
          <div className="cal-events">
            <div className="cal-events-container" key={`${curYear}-${curMonth}-${sel}`}>
              <div className="cal-ev-label">{label}</div>
              {cnt > 0 ? (
                <>
                  {events.map((item, i) => (
                    <div key={i} className="cal-ev-item">
                      <div className="cev-left">
                        <div className="cev-dot" style={{ background: item.dot }} />
                        <span className="cev-time">{item.time}</span>
                        <span className="cev-badge" style={{ backgroundColor: item.color }}>
                          <span className="material-icons">{item.icon}</span>
                          {item.badge}
                        </span>
                        <span className="cev-title">{item.title}</span>
                      </div>
                    </div>
                  ))}
                  <div className="cal-add-row">
                    <div className="cal-add-icon">
                      <span className="material-icons">add</span>
                    </div>
                    <span className="cal-add-text">Add event</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="cal-no-events">No events scheduled.</div>
                  <div className="cal-add-row">
                    <div className="cal-add-icon">
                      <span className="material-icons">add</span>
                    </div>
                    <span className="cal-add-text">Add event</span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
