import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './WeekCalendar.css'
import { CALENDAR_EVENTS } from './calendar-events'
import type { CalEvent } from './calendar-events'

import { useState, useRef, useCallback } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import {
  nowLineRef,
  cleanupNowLine,
  scrollContainerRef,
  cleanupScrollContainer,
} from './calendar-hook'

// ── Geometry ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 120
const HOURS_24 = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12 AM'
  if (i < 12) return i + ' AM'
  if (i === 12) return '12 PM'
  return (i - 12) + ' PM'
})
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December']
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ── Date helpers ─────────────────────────────────────────────────────────────

function startOfWeekMon(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const off = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - off)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function dowMon(d: Date): number { return (d.getDay() + 6) % 7 }

function ymd(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

function sameDay(a: Date, b: Date): boolean { return ymd(a) === ymd(b) }

// ── Event geometry ───────────────────────────────────────────────────────────

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function eventTop(start: string): number {
  return Math.max(0, Math.round(toMin(start) * (HOUR_HEIGHT / 60)))
}

function eventHeight(start: string, end: string): number {
  const dur = toMin(end) - toMin(start)
  return Math.max(dur < 60 ? 24 : 40, Math.round((dur / 60) * HOUR_HEIGHT))
}

function eventDur(start: string, end: string): number {
  return toMin(end) - toMin(start)
}

function nowPos(): number {
  const d = new Date()
  return Math.max(0, Math.round((d.getHours() * 60 + d.getMinutes()) * (HOUR_HEIGHT / 60)))
}

// ── People ───────────────────────────────────────────────────────────────────

const NAMES: Record<string, string> = {
  user1: 'James Brown', user2: 'Sophia Williams', user3: 'Arthur Taylor',
  user4: 'Emma Wright', user5: 'Leonel Ngoya',
}
const EMAILS: Record<string, string> = {
  user1: 'james11@gmail.com', user2: 'sophia.williams@gmail.com',
  user3: 'arthur@hotmail.com', user4: 'emma@outlook.com', user5: 'leonelngoya@gmail.com',
}

function avatar(seed: string): string {
  return 'https://api.dicebear.com/9.x/glass/svg?seed=' + seed
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const p = h >= 12 ? 'PM' : 'AM'
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return hh + ':' + String(m).padStart(2, '0') + ' ' + p
}

function longDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return WD_LONG[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0')
}

function meetingCode(): string {
  return 'dra-jhgg-mvn'
}

// ── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: CalEvent
  top: number
  height: number
  onClick: () => void
}

function EventCard({ event, top, height, onClick }: EventCardProps) {
  const dur = eventDur(event.startTime, event.endTime)
  const isShort = dur < 30
  const isMedium = dur >= 25 && dur < 60
  const timeStr = event.startTime + ' – ' + event.endTime +
    (event.timezone ? ' (' + event.timezone + ')' : '')
  const extra = event.participants.length - 3
  const style: React.CSSProperties = { top: (top + 4) + 'px', height: (height - 8) + 'px' }

  if (isShort) {
    return (
      <div
        className="cal2-ev cal2-ev-short"
        style={style}
        onClick={onClick}
        data-proximity
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      >
        <span className="cal2-ev-dot" />
        <span className="cal2-ev-title">{event.title}</span>
        <span className="cal2-ev-mini-time">{event.startTime}</span>
      </div>
    )
  }
  if (isMedium) {
    return (
      <div
        className="cal2-ev cal2-ev-med"
        style={style}
        onClick={onClick}
        data-proximity
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      >
        <div className="cal2-ev-row">
          <span className="cal2-ev-dot" />
          <span className="cal2-ev-title">{event.title}</span>
        </div>
        <p className="cal2-ev-time">{timeStr}</p>
      </div>
    )
  }
  return (
    <div
      className="cal2-ev cal2-ev-full"
      style={style}
      onClick={onClick}
      data-proximity
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    >
      <div className="cal2-ev-body">
        <h4 className={'cal2-ev-title-lg' + (dur <= 60 ? ' is-truncate' : '')}>{event.title}</h4>
        <p className="cal2-ev-time">{timeStr}</p>
        {event.participants.length > 0 && (
          <div className="cal2-ev-people">
            <div className="cal2-ev-avatars">
              {event.participants.slice(0, 3).map((p) => (
                <img key={p} className="cal2-ev-av" src={avatar(p)} alt="" />
              ))}
            </div>
            {extra > 0 && <span className="cal2-ev-extra">+{extra}</span>}
          </div>
        )}
      </div>
      {event.meetingLink && (
        <div className="cal2-ev-meet">
          <span className={iconClass('videocam') + ' cal2-ev-meet-ic'}>videocam</span>
          <span className="cal2-ev-meet-label">Join on Google Meet</span>
          <span className={iconClass('open_in_new') + ' cal2-ev-meet-ext'}>open_in_new</span>
        </div>
      )}
    </div>
  )
}

// ── EventSheet ───────────────────────────────────────────────────────────────

interface EventSheetProps {
  event: CalEvent | null
  open: boolean
  onClose: () => void
}

function EventSheet({ event, open, onClose }: EventSheetProps) {
  const [rsvp, setRsvp] = useState<string | null>(null)

  // Reset RSVP when event changes — wired as callback ref on the aside element
  // rather than useEffect. We store the last event id and clear on change.
  const lastEventIdRef = useRef<string | null>(null)
  const sheetRef = useCallback((el: HTMLElement | null) => {
    if (!el) return
    if (event && event.id !== lastEventIdRef.current) {
      lastEventIdRef.current = event.id
      setRsvp(null)
    }
  }, [event])

  const e = event
  const dateStr = e ? longDate(e.date) : ''
  const tz = (e && e.timezone) || 'GMT+7 Pontianak'
  const organizer = (e && e.participants[0]) || 'user1'
  const others = e ? e.participants.slice(1) : []

  const people = e ? [
    { id: organizer, name: NAMES[organizer] || organizer, email: EMAILS[organizer] || (organizer + '@gmail.com'), isOrganizer: true, rsvpVal: 'yes' as const },
    ...others.slice(0, 3).map((p) => ({ id: p, name: NAMES[p] || p, email: EMAILS[p] || (p + '@gmail.com'), isOrganizer: false, rsvpVal: 'yes' as const })),
    { id: 'user5', name: 'Leonel Ngoya', email: 'leonelngoya@gmail.com', isYou: true, rsvpVal: (rsvp || 'yes') as string },
  ] : []

  const yesCount = people.filter((p) => p.rsvpVal === 'yes').length

  return (
    <>
      <div className={'cal2-sh-scrim' + (open ? ' is-open' : '')} onClick={onClose} />
      <aside ref={sheetRef} className={'cal2-sh' + (open ? ' is-open' : '')} role="complementary" aria-modal="true" aria-label="Event details">
        {e && (
          <div className="cal2-sh-inner">
            <header className="cal2-sh-head">
              <div className="cal2-sh-head-top">
                <div className="cal2-sh-actions">
                  <button type="button" className="cal2-sh-ic" title="Edit" aria-label="Edit event">
                    <span className={iconClass('edit')}>edit</span>
                  </button>
                  <button type="button" className="cal2-sh-ic" title="Notes" aria-label="View notes">
                    <span className={iconClass('description')}>description</span>
                  </button>
                  <button type="button" className="cal2-sh-ic" title="Duplicate" aria-label="Duplicate event">
                    <span className={iconClass('layers')}>layers</span>
                  </button>
                  <button type="button" className="cal2-sh-ic" title="Delete" aria-label="Delete event">
                    <span className={iconClass('delete_outline')}>delete_outline</span>
                  </button>
                </div>
                <button type="button" className="cal2-sh-close" onClick={onClose} title="Close" aria-label="Close event details">
                  <span className={iconClass('close')}>close</span>
                </button>
              </div>
              <div className="cal2-sh-title-wrap">
                <h2 className="cal2-sh-title">{e.title}</h2>
                <div className="cal2-sh-meta">
                  <span>{dateStr}</span>
                  <span className="cal2-sh-dot" />
                  <span>{fmt12(e.startTime)} &ndash; {fmt12(e.endTime)}</span>
                  <span className="cal2-sh-dot" />
                  <span>{tz}</span>
                </div>
              </div>
              <button type="button" className="cal2-sh-outline-btn">
                <span>Propose new time</span>
                <span className={iconClass('north_east')}>north_east</span>
              </button>
            </header>

            <div className="cal2-sh-body">
              <div className="cal2-sh-people">
                {people.map((p) => (
                  <div className="cal2-sh-person" key={p.id + ('isYou' in p && p.isYou ? '-you' : '')}>
                    <img className="cal2-sh-av" src={avatar(p.id)} alt="" />
                    <div className="cal2-sh-person-main">
                      <div className="cal2-sh-person-row">
                        <div className="cal2-sh-person-id">
                          <div className="cal2-sh-name-line">
                            <p className="cal2-sh-name">{p.name}</p>
                            {p.isOrganizer && <span className="cal2-sh-tag cal2-sh-tag-org">Organizer</span>}
                            {'isYou' in p && p.isYou && <span className="cal2-sh-tag cal2-sh-tag-you">You</span>}
                          </div>
                          <p className="cal2-sh-email">{p.email}</p>
                        </div>
                        <span className={'cal2-sh-check ' + iconClass('check_circle')}>check_circle</span>
                      </div>
                      {'isYou' in p && p.isYou && (
                        <div className="cal2-sh-rsvp">
                          {(['yes', 'no', 'maybe'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className={'cal2-sh-rsvp-btn' + (rsvp === opt ? ' is-active' : '')}
                              onClick={() => setRsvp(opt)}
                            >
                              {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {e.meetingLink && (
                <div className="cal2-sh-section">
                  <div className="cal2-sh-meet-head">
                    <span className={iconClass('videocam') + ' cal2-sh-meet-logo'}>videocam</span>
                    <p className="cal2-sh-meet-name">Meeting in Google Meet</p>
                    <p className="cal2-sh-meet-code">Code: {meetingCode()}</p>
                  </div>
                  <div className="cal2-sh-meet-actions">
                    <button type="button" className="cal2-sh-join" onClick={() => window.open(e.meetingLink, '_blank')}>
                      <span>Join Google Meet meeting</span>
                      <span className="cal2-sh-kbds"><kbd>&#8984;</kbd><kbd>J</kbd></span>
                    </button>
                    <button type="button" className="cal2-sh-copy">
                      <span className={iconClass('link')}>link</span>
                      <span>Copy link</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="cal2-sh-section cal2-sh-info">
                <div className="cal2-sh-info-row">
                  <span className={iconClass('notifications_none')}>notifications_none</span>
                  <span>Reminder: 30min before</span>
                </div>
                <div className="cal2-sh-info-row">
                  <span className={iconClass('event')}>event</span>
                  <span>Organizer: {EMAILS[organizer] || (organizer + '@gmail.com')}</span>
                </div>
                <div className="cal2-sh-info-row">
                  <span className={iconClass('call')}>call</span>
                  <span>(US) +1 904-330-1131</span>
                </div>
                <div className="cal2-sh-info-row">
                  <span className={iconClass('group')}>group</span>
                  <span>
                    {people.length} persons
                    <span className="cal2-sh-mid-dot">&bull;</span>
                    {yesCount} yes
                  </span>
                </div>
                <div className="cal2-sh-info-row">
                  <span className={iconClass('note_add')}>note_add</span>
                  <span>Notes from Organizer</span>
                </div>
              </div>

              <div className="cal2-sh-section cal2-sh-notes">
                <p>During today&apos;s daily check-in, we had an in-depth discussion about the MVP (Minimum Viable Product). We agreed on the core features that need to be included, focusing on the AI-conducted interviews and the memoir compilation functionality.</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export interface WeekCalendarProps {
  events?: CalEvent[]
}

export default function WeekCalendar({ events = CALENDAR_EVENTS }: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMon(new Date()))
  // today is stable for the lifetime of the component — captured once on mount
  const [today] = useState<Date>(() => new Date())
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Callback ref for the now-line element — self-rescheduling timer, no useEffect
  const nowRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      // Element unmounting — clean up any pending timer stored on the previous el
      // (we can't access it here directly, but the nowLineRef cleanup path handles it)
      return
    }
    // Set initial position before the timer starts
    el.style.top = nowPos() + 'px'
    nowLineRef(el)
  }, [])

  const nowCleanupRef = useCallback((el: HTMLDivElement | null) => {
    cleanupNowLine(el)
  }, [])

  // Separate ref objects so cleanup fires when element unmounts
  const nowElRef = useRef<HTMLDivElement | null>(null)
  const nowCombinedRef = useCallback((el: HTMLDivElement | null) => {
    if (nowElRef.current && !el) {
      cleanupNowLine(nowElRef.current)
    }
    nowElRef.current = el
    if (el) {
      el.style.top = nowPos() + 'px'
      nowLineRef(el)
    }
  }, [])

  // Callback ref for scroll container — initial scroll to 8am + listener cleanup
  const scrollElRef = useRef<HTMLDivElement | null>(null)
  const scrollCombinedRef = useCallback((el: HTMLDivElement | null) => {
    if (scrollElRef.current && !el) {
      cleanupScrollContainer(scrollElRef.current)
    }
    scrollElRef.current = el
    if (el) scrollContainerRef(el)
  }, [])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayInWeek = weekDays.some((d) => sameDay(d, today))

  // Map base events (anchored by day-of-week) onto the displayed week
  const byDay: Record<string, CalEvent[]> = {}
  weekDays.forEach((day) => {
    const wd = dowMon(day)
    const dStr = ymd(day)
    byDay[dStr] = events
      .filter((ev) => dowMon(new Date(ev.date + 'T00:00:00')) === wd)
      .map((ev) => ({ ...ev, date: dStr, id: ev.id + '-' + dStr }))
  })

  const monthLabel = (() => {
    const a = weekDays[0]
    const b = weekDays[6]
    if (a.getMonth() === b.getMonth()) return MONTHS[a.getMonth()] + ' ' + a.getFullYear()
    const sameYear = a.getFullYear() === b.getFullYear()
    return MONTHS[a.getMonth()].slice(0, 3) + ' – ' + MONTHS[b.getMonth()].slice(0, 3) +
      (sameYear ? ' ' + a.getFullYear() : ' ' + a.getFullYear() + '/' + b.getFullYear())
  })()
  const rangeLabel = weekDays[0].getDate() + ' – ' + weekDays[6].getDate()

  const openEvent = (ev: CalEvent) => { setSelected(ev); setSheetOpen(true) }

  // Proximity group over all EventCards across every day column (single group,
  // default [data-proximity] selector picks up every .cal2-ev regardless of column)
  const bodyRowProximityRef = useProximityGroup<HTMLDivElement>()

  // Suppress the unused warning for nowRef/nowCleanupRef — combined ref handles both
  void nowRef
  void nowCleanupRef

  return (
    <div className="cal2">
      {/* Calendar's own header (week nav) */}
      <div className="cal2-topbar">
        <div className="cal2-title-group">
          <h1 className="cal2-month">{monthLabel}</h1>
          <span className="cal2-range">{rangeLabel}</span>
        </div>
        <div className="cal2-nav">
          <button type="button" className="cal2-today" onClick={() => setWeekStart(startOfWeekMon(new Date()))}>
            Today
          </button>
          <div className="cal2-arrows">
            <button
              type="button"
              className="cal2-arrow"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              aria-label="Previous week"
            >
              <span className={iconClass('chevron_left')}>chevron_left</span>
            </button>
            <button
              type="button"
              className="cal2-arrow"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              aria-label="Next week"
            >
              <span className={iconClass('chevron_right')}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="cal2-scroll" ref={scrollCombinedRef}>
        <div className="cal2-canvas">
          {/* Sticky header row */}
          <div className="cal2-head-row">
            <div className="cal2-corner" />
            {weekDays.map((day) => {
              const isToday = sameDay(day, today)
              return (
                <div key={ymd(day)} className={'cal2-head-cell' + (isToday ? ' is-today' : '')}>
                  <span className="cal2-hc-dow">{DOW[dowMon(day)]}</span>
                  <span className={'cal2-hc-num' + (isToday ? ' is-today' : '')}>{day.getDate()}</span>
                </div>
              )
            })}
          </div>

          {/* Body row */}
          <div className="cal2-body-row" ref={bodyRowProximityRef}>
            <div className="cal2-hours">
              {HOURS_24.map((h) => (
                <div key={h} className="cal2-hour-cell" style={{ height: HOUR_HEIGHT + 'px' }}>
                  <span className="cal2-hour-label">{h}</span>
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const dStr = ymd(day)
              const evs = byDay[dStr] || []
              const isToday = sameDay(day, today)
              return (
                <div key={dStr} className={'cal2-day-col' + (isToday ? ' is-today' : '')}>
                  {HOURS_24.map((h) => (
                    <div key={h} className="cal2-grid-cell" style={{ height: HOUR_HEIGHT + 'px' }} />
                  ))}
                  {todayInWeek && isToday && (
                    // Callback ref: self-rescheduling timer wired on mount, cleared on unmount
                    <div ref={nowCombinedRef} className="cal2-now">
                      <span className="cal2-now-dot" />
                      <span className="cal2-now-line" />
                    </div>
                  )}
                  {evs.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      top={eventTop(ev.startTime)}
                      height={eventHeight(ev.startTime, ev.endTime)}
                      onClick={() => openEvent(ev)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <EventSheet event={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
