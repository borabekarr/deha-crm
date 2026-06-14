import '../../../../design-system/preview/_base.css'
import './Calendar.css'

import { useState, useCallback, useRef, Fragment } from 'react'

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

interface NewEvent {
  title: string
  date: string
  time: string
  color: string
}

// Extra events added by the user via the task-creation popover
type ExtraEvents = Record<string, CalEvent[]>

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ── CalEventPopoverCard ────────────────────────────────────────────────────
// Full TaskDetailsPopover structure duplicated + re-mapped to .cal-ep-* namespace.
// Populated from CalEvent fields; widgets without a direct event source use
// representative demo data so the layout renders fully (same seeding approach
// as task-card TASK_METRICS).

// ── Demo metric data seeded from event ────────────────────────────────────

interface CalStep { t: string; done: boolean }
interface CalBlockerNode { t: string; state: 'done' | 'active' | 'locked' }
interface CalLifecycleEvent { t: string; w: string; n?: string; kind?: 'ai' | 'base' }

interface CalEventMetrics {
  substeps: { steps: CalStep[] }
  reschedule: { count: number; note: string }
  context_switch: { level: number; note: string }
  energy: { points: number; note: string }
  ageing: { days: number; span: number; frozen: boolean; note: string }
  sync_score: { pct: number; note: string }
  blockers: { chain: CalBlockerNode[] }
  lifecycle: { events: CalLifecycleEvent[] }
}

function buildCalEventMetrics(ev: CalEvent): CalEventMetrics {
  // Seed deterministically from title length so each event gets slightly different values
  const seed = ev.title.length
  const rescheduleCount = seed % 3
  return {
    substeps: {
      steps: [
        { t: 'Confirm attendees', done: true },
        { t: 'Prepare agenda', done: seed % 2 === 0 },
        { t: 'Send follow-up', done: false },
      ],
    },
    reschedule: {
      count: rescheduleCount,
      note: rescheduleCount === 0 ? 'On track — never pushed.' : `Pushed ${rescheduleCount}× so far.`,
    },
    context_switch: {
      level: seed % 3,
      note: 'Overlaps with 2 other events this block.',
    },
    energy: {
      points: (seed % 4) + 1,
      note: 'Moderate preparation required.',
    },
    ageing: {
      days: (seed % 5) + 1,
      span: 7,
      frozen: false,
      note: 'Event scheduled within normal lead time.',
    },
    sync_score: {
      pct: 70 + (seed % 25),
      note: 'Good placement fit for this time slot.',
    },
    blockers: {
      chain: [
        { t: 'Invite sent', state: 'done' },
        { t: ev.badge + ' prep', state: 'active' },
        { t: 'Post-event notes', state: 'locked' },
      ],
    },
    lifecycle: {
      events: [
        { t: 'Created', w: 'Today 09:00' },
        { t: 'Confirmed', w: 'Today 10:30', n: 'all attendees' },
        { t: 'AI-updated', w: 'Today 11:15', n: 'agenda drafted', kind: 'ai' },
      ],
    },
  }
}

// ── Cal widget: SubSteps ──────────────────────────────────────────────────

function CalSubSteps({ data }: { data: CalEventMetrics['substeps'] }) {
  const [steps, setSteps] = useState<CalStep[]>(data.steps)
  const done = steps.filter(s => s.done).length
  const total = steps.length
  const pct = Math.round(done / total * 100)
  const toggle = (i: number) =>
    setSteps(s => s.map((x, j) => j === i ? { ...x, done: !x.done } : x))
  return (
    <div className="cal-ep-donut-row">
      <span
        className="cal-ep-donut"
        style={{ background: `conic-gradient(var(--brand-primary) ${pct}%, var(--bg-chip) 0)` }}
      >
        <span className="cal-ep-donut-mid"><b>{done}/{total}</b></span>
      </span>
      <ul className="cal-ep-steps">
        {steps.map((s, i) => (
          <li key={s.t} className={s.done ? 'done' : ''}>
            <button type="button" className="cal-ep-step-tog" onClick={() => toggle(i)}
              aria-label={s.done ? 'Mark incomplete' : 'Mark complete'}>
              <span className="material-icons">{s.done ? 'check_circle' : 'radio_button_unchecked'}</span>
            </button>
            <span className="cal-ep-step-t">{s.t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Cal widget: Reschedule ────────────────────────────────────────────────

function CalReschedule({ data }: { data: CalEventMetrics['reschedule'] }) {
  const dots = Math.max(data.count, 4)
  const tone = data.count >= 3 ? '#EF4444' : data.count >= 1 ? '#F97316' : '#10B981'
  return (
    <div className="cal-ep-resched">
      <span className="cal-ep-resched-n" style={{ color: tone }}>{data.count}&times;</span>
      <span className="cal-ep-dots">
        {Array.from({ length: dots }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <i key={i} className={i < data.count ? 'on' : ''} style={i < data.count ? { background: tone } : undefined} />
        ))}
      </span>
      <span className="cal-ep-resched-cap">
        {data.count === 0 ? 'never pushed' : data.count >= 3 ? 'looping' : `pushed ${data.count}×`}
      </span>
    </div>
  )
}

// ── Cal widget: FocusCost ─────────────────────────────────────────────────

function CalFocusCost({ data }: { data: CalEventMetrics['context_switch'] }) {
  const lv = (['Low', 'Medium', 'High'] as const)[data.level] ?? 'Medium'
  const tone = data.level >= 2 ? '#EF4444' : data.level === 1 ? '#EAB308' : '#10B981'
  const n = data.level + 2
  return (
    <div className="cal-ep-focus">
      <span className="cal-ep-focus-n" style={{ color: tone }}>{n}</span>
      <div className="cal-ep-focus-tx">
        <span className="cal-ep-focus-main">{n === 1 ? 'event competes' : 'events compete'} for focus today</span>
        <span className="cal-ep-focus-sub" style={{ '--fc': tone } as React.CSSProperties}>{lv} switching cost</span>
      </div>
    </div>
  )
}

// ── Cal widget: Battery ───────────────────────────────────────────────────

function CalBattery({ data }: { data: CalEventMetrics['energy'] }) {
  return (
    <div className="cal-ep-batt-row">
      <span className={`cal-ep-batt p${data.points}`}>
        {[0, 1, 2, 3, 4].map(i => <i key={i} className={i < data.points ? 'on' : ''} />)}
        <span className="cal-ep-batt-nub" />
      </span>
      <span className="cal-ep-batt-val">{data.points}/5 effort</span>
    </div>
  )
}

// ── Cal widget: Ageing ────────────────────────────────────────────────────

function CalAgeing({ data }: { data: CalEventMetrics['ageing'] }) {
  const pct = Math.min(100, Math.round(data.days / data.span * 100))
  const tone = data.frozen ? '#3B82F6' : pct > 75 ? '#EF4444' : '#10B981'
  return (
    <div className="cal-ep-age">
      <div className="cal-ep-age-chips">
        <span className="cal-ep-age-chip" style={{ '--ac': tone } as React.CSSProperties}>
          <span className="material-icons">{data.frozen ? 'ac_unit' : 'schedule'}</span>
          {data.frozen ? 'Frozen · ' : ''}{data.days}d{data.frozen ? '' : ' lead time'}
        </span>
        <span className="cal-ep-age-of">{data.days} of {data.span} days</span>
      </div>
      <div className="cal-ep-age-meter">
        <i style={{ width: pct + '%', background: tone, display: 'block' }} />
      </div>
    </div>
  )
}

// ── Cal widget: SyncScore ─────────────────────────────────────────────────

function CalSyncScore({ data }: { data: CalEventMetrics['sync_score'] }) {
  const tone = data.pct >= 80 ? '#10B981' : data.pct >= 60 ? '#EAB308' : '#EF4444'
  const peakH = 10
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
  const fitFor = (h: number) => Math.max(12, Math.round(data.pct - Math.abs(h - peakH) * 11))
  return (
    <div className="cal-ep-sync">
      <div className="cal-ep-sync-head">
        <b style={{ color: tone }}>{data.pct}%</b>
        <span>placement fit &middot; {data.note}</span>
      </div>
      <div className="cal-ep-sync-table">
        {hours.map(h => {
          const fit = fitFor(h)
          const isPeak = h === peakH
          const slotTone = fit >= 75 ? '#10B981' : fit >= 50 ? '#EAB308' : '#94A3B8'
          return (
            <div key={h} className={'cal-ep-sync-row' + (isPeak ? ' peak' : '')}>
              <span className="cal-ep-sync-hh">{String(h).padStart(2, '0')}:00</span>
              <div className="cal-ep-sync-bar">
                <i style={{ width: fit + '%', background: slotTone }} />
              </div>
              <span className="cal-ep-sync-pct" style={{ color: slotTone }}>{fit}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Cal widget: Blockers ──────────────────────────────────────────────────

function CalBlockers({ data }: { data: CalEventMetrics['blockers'] }) {
  const ic: Record<string, string> = { done: 'check_circle', active: 'radio_button_checked', locked: 'lock' }
  const tone: Record<string, string> = { done: '#10B981', active: '#3B82F6', locked: '#94A3B8' }
  return (
    <div className="cal-ep-chain-steps">
      {data.chain.map((b, i) => (
        <Fragment key={b.t}>
          {i > 0 && (
            <div className="cal-ep-chain-conn">
              <span className="material-icons">arrow_downward</span>
            </div>
          )}
          <div className={'cal-ep-chain-step ' + b.state}>
            <span className="cal-ep-chain-step-ic" style={{ color: tone[b.state] }}>
              <span className="material-icons">{ic[b.state]}</span>
            </span>
            <span className="cal-ep-chain-step-lbl">{b.t}</span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

// ── Cal widget: Lifecycle ─────────────────────────────────────────────────

function CalLifecycle({ data }: { data: CalEventMetrics['lifecycle'] }) {
  const kindIcon: Record<string, string> = { base: 'radio_button_checked', ai: 'neurology' }
  const kindColor: Record<string, string> = { base: 'var(--brand-primary)', ai: '#8B5CF6' }
  return (
    <ul className="cal-ep-life-bul">
      {data.events.map((e) => {
        const kind = e.kind || 'base'
        return (
          <li key={`${e.t}-${e.w}`} className="cal-ep-life-item">
            <span className="cal-ep-life-item-ic" style={{ color: kindColor[kind] }}>
              <span className={kindIcon[kind] === 'neurology' ? 'material-symbols-outlined' : 'material-icons'}>{kindIcon[kind] ?? 'radio_button_checked'}</span>
            </span>
            <div className="cal-ep-life-item-tx">
              <span className="cal-ep-life-item-lbl">{e.t}</span>
              <span className="cal-ep-life-item-when">
                {e.w}{e.n ? <span className="cal-ep-life-n"> &middot; {e.n}</span> : ''}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Cal widget alert strip ────────────────────────────────────────────────

interface CalAlert { tone: string; ic: string; t: string; cta: string }

function CalAlertsStrip({ alerts, act }: { alerts: CalAlert[]; act: (l: string) => void }) {
  if (!alerts.length) return null
  const ctaIcon = (cta: string) => {
    if (cta === 'Reschedule') return 'event_repeat'
    if (cta === 'Reassign') return 'person_add'
    return 'bolt'
  }
  return (
    <div className="cal-ep-alerts">
      <div className="cal-ep-alerts-k">
        <span className="material-icons">warning</span>Active alerts &middot; {alerts.length}
      </div>
      <div className="cal-ep-alerts-list">
        {alerts.map((a) => (
          <div key={a.t} className={'cal-ep-alert ' + a.tone}>
            <span className="cal-ep-alert-ic"><span className="material-icons">{a.ic}</span></span>
            <span className="cal-ep-alert-t">{a.t}</span>
            <button type="button" className="cal-ep-alert-cta" onClick={() => act(a.cta)}>
              <span className="material-icons">{ctaIcon(a.cta)}</span>{a.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Metric widget groups ──────────────────────────────────────────────────

const CAL_METRIC_GROUPS: { label: string; icon: string; ids: string[] }[] = [
  { label: 'Progress & Flow', icon: 'timeline', ids: ['substeps', 'blockers', 'lifecycle', 'ageing'] },
  { label: 'Effort & Focus', icon: 'bolt', ids: ['context_switch', 'energy', 'reschedule'] },
  { label: 'Timing Fit', icon: 'my_location', ids: ['sync_score'] },
]

const CAL_EP_ACC: Record<string, string> = {
  substeps: '#10B981', reschedule: '#F97316', context_switch: '#EF4444', energy: '#EAB308',
  ageing: '#3B82F6', sync_score: '#10B981', blockers: '#6366F1', lifecycle: '#8B5CF6',
}

const CAL_METRIC_META: Record<string, { label: string; icon: string }> = {
  substeps:        { label: 'Checklist',        icon: 'donut_large' },
  reschedule:      { label: 'Reschedules',       icon: 'restart_alt' },
  context_switch:  { label: 'Focus Cost',        icon: 'psychology' },
  energy:          { label: 'Effort',            icon: 'battery_charging_full' },
  ageing:          { label: 'Lead Time',         icon: 'ac_unit' },
  sync_score:      { label: 'Timing Fit',        icon: 'my_location' },
  blockers:        { label: 'Dependency Chain',  icon: 'account_tree' },
  lifecycle:       { label: 'Life-cycle',        icon: 'timeline' },
}

function CalWidgetBody({ id, metrics }: { id: string; metrics: CalEventMetrics }) {
  switch (id) {
    case 'substeps':       return <CalSubSteps data={metrics.substeps} />
    case 'reschedule':     return <CalReschedule data={metrics.reschedule} />
    case 'context_switch': return <CalFocusCost data={metrics.context_switch} />
    case 'energy':         return <CalBattery data={metrics.energy} />
    case 'ageing':         return <CalAgeing data={metrics.ageing} />
    case 'sync_score':     return <CalSyncScore data={metrics.sync_score} />
    case 'blockers':       return <CalBlockers data={metrics.blockers} />
    case 'lifecycle':      return <CalLifecycle data={metrics.lifecycle} />
    default:               return null
  }
}

function CalMetricCard({ id, metrics, act }: { id: string; metrics: CalEventMetrics; act: (l: string) => void }) {
  const acc = CAL_EP_ACC[id] ?? 'var(--brand-primary)'
  const meta = CAL_METRIC_META[id]
  if (!meta) return null
  return (
    <div className="cal-ep-w-shell" style={{ '--acc': acc } as React.CSSProperties}>
      <section className="cal-ep-w" style={{ '--acc': acc } as React.CSSProperties}>
        <div className="cal-ep-w-head">
          <span className="cal-ep-w-ic"><span className="material-icons">{meta.icon}</span></span>
          <span className="cal-ep-w-label">{meta.label}</span>
        </div>
        <CalWidgetBody id={id} metrics={metrics} />
        <div className="cal-ep-tip">
          <span className="material-icons">tips_and_updates</span>
          <span className="cal-ep-tip-t">
            {id === 'substeps' && 'Tick off items above to track event readiness.'}
            {id === 'reschedule' && (metrics.reschedule.count >= 3 ? 'Event keeps moving — confirm or reassign.' : metrics.reschedule.note)}
            {id === 'context_switch' && 'Block a focus slot before this event to reduce context cost.'}
            {id === 'energy' && metrics.energy.note}
            {id === 'ageing' && metrics.ageing.note}
            {id === 'sync_score' && metrics.sync_score.note}
            {id === 'blockers' && 'Clear the active step to unblock downstream tasks.'}
            {id === 'lifecycle' && 'AI keeps this timeline current from the calendar event log.'}
          </span>
          {id === 'reschedule' && metrics.reschedule.count >= 3 && (
            <button type="button" className="cal-ep-tip-cta" style={{ '--cc': '#F97316' } as React.CSSProperties}
              onClick={() => act('Reschedule')}>
              <span className="material-icons">event_repeat</span>Reschedule
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

// ── CalEventPopoverCard ───────────────────────────────────────────────────

function CalEventPopoverCard({
  event,
  year,
  month,
  day,
  onClose,
}: {
  event: CalEvent
  year: number
  month: number
  day: number
  onClose: () => void
}) {
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const act = (label: string) => {
    setToast(label + ' — action queued')
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2200)
  }

  const metrics = buildCalEventMetrics(event)

  const rescheduleLoop = metrics.reschedule.count >= 3
  const highLoad = metrics.context_switch.level >= 2

  const alerts: CalAlert[] = []
  if (rescheduleLoop) alerts.push({ tone: 'a', ic: 'restart_alt', t: `Rescheduled ${metrics.reschedule.count}× — likely looping.`, cta: 'Reschedule' })
  if (highLoad) alerts.push({ tone: 'a', ic: 'psychology', t: 'High focus cost — overlaps with other events today.', cta: 'Block time' })

  const dateStr = `${DAY_NAMES[new Date(year, month, day).getDay()]}, ${MONTH_NAMES[month]} ${day}, ${year}`

  // Customer/organiser shell — treat as "organiser" linked from the event badge
  const orgName = event.badge === 'Meeting' ? 'Team workspace'
    : event.badge === 'Review' ? 'Field team'
    : 'Personal calendar'
  const orgSub = event.badge === 'Meeting' ? 'Sync · internal'
    : event.badge === 'Review' ? 'On-site · external'
    : 'Self-scheduled'
  const orgInit = event.icon
  const orgColor = event.color

  const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const shell = e.currentTarget
    const r = document.createElement('span')
    r.className = 'cal-ep-cust-ripple'
    const d = Math.max(shell.offsetWidth, shell.offsetHeight) * 1.4
    const rect = shell.getBoundingClientRect()
    r.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px`
    shell.appendChild(r)
    r.addEventListener('animationend', () => r.remove(), { once: true })
  }

  return (
    <div
      className="cal-ep-card"
      style={{ '--ep-color': event.color } as React.CSSProperties}
    >
      {/* Head — color header matching event.color */}
      <div className="cal-ep-head">
        <div className="cal-ep-head-top">
          <div className="cal-ep-head-title">{event.title}</div>
          <button type="button" className="cal-ep-close" onClick={onClose} aria-label="Close">
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="cal-ep-htags">
          <span className="cal-ep-badge-tag" style={{ backgroundColor: event.color }}>
            <span className="material-icons">{event.icon}</span>
            {event.badge}
          </span>
          <span className="cal-ep-time-tag">
            <span className="material-icons">schedule</span>
            {event.time}
          </span>
          <span className="cal-ep-date-tag">
            <span className="material-icons">calendar_today</span>
            {dateStr}
          </span>
        </div>

        {/* Organiser shell (mirrors tp-cust-shell) */}
        <div className="cal-ep-cust-shell" onClick={addRipple}>
          <div className="cal-ep-customer">
            <span className="cal-ep-cust-av" style={{ background: orgColor }}>
              <span className="material-icons">{orgInit}</span>
            </span>
            <div className="cal-ep-cust-meta">
              <div className="cal-ep-cust-k">Organiser</div>
              <div className="cal-ep-cust-name-row">
                <span className="cal-ep-cust-name">{orgName}</span>
              </div>
              <div className="cal-ep-cust-sub">
                <span className="material-icons" style={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '4px', opacity: 0.85 }}>info</span>
                {orgSub}
              </div>
            </div>
            <div className="cal-ep-cust-actions">
              <button type="button" className="cal-ep-cust-act" aria-label="Message" onClick={e => { e.stopPropagation(); act('Message') }}>
                <span className="material-icons">chat</span>
              </button>
              <button type="button" className="cal-ep-cust-ask ask-ai" onClick={e => { e.stopPropagation(); act('Ask AI') }}>
                <span className="material-icons">bolt</span>Ask AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body — alerts strip + metric groups */}
      <div className="cal-ep-body">
        <CalAlertsStrip alerts={alerts} act={act} />

        <div className="cal-ep-list">
          {CAL_METRIC_GROUPS.map((group, gi) => (
            <Fragment key={group.label}>
              <div className={'cal-ep-category-header' + (gi === 0 ? ' first' : '')}>
                <span className="material-icons">{group.icon}</span>
                <span className="cal-ep-category-label">{group.label}</span>
                {gi === 0 && <span className="cal-ep-category-ts">updated just now</span>}
              </div>
              {group.ids.map(id => (
                <CalMetricCard key={id} id={id} metrics={metrics} act={act} />
              ))}
            </Fragment>
          ))}
        </div>

        {/* Footer */}
        <div className="cal-ep-footer-actions">
          <button type="button" className="cal-ep-foot-btn" style={{ '--fbtn': '#F97316' } as React.CSSProperties} onClick={() => act('Reschedule')}>
            <span className="material-icons">event_repeat</span>Reschedule
          </button>
          <button type="button" className="cal-ep-foot-btn" style={{ '--fbtn': '#3B82F6' } as React.CSSProperties} onClick={() => act('Invite')}>
            <span className="material-icons">person_add</span>Invite
          </button>
          <button type="button" className="cal-ep-foot-btn primary" style={{ '--fbtn': '#10B981' } as React.CSSProperties} onClick={() => act('Open event')}>
            <span className="material-icons">open_in_new</span>Open event
          </button>
        </div>
      </div>

      {/* Toast */}
      <div className={'cal-ep-toast' + (toast ? ' show' : '')}>
        <span className="material-icons">check_circle</span>{toast}
      </div>
    </div>
  )
}

// ── Calendar ───────────────────────────────────────────────────────────────

export default function Calendar() {
  const [curYear, setCurYear] = useState(2026)
  const [curMonth, setCurMonth] = useState(4) // May = 4
  const [sel, setSel] = useState(4) // day 4 selected initially

  // Event-detail popover state
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const [evPopOpen, setEvPopOpen] = useState(false)

  // Callback ref: Escape key wired without useEffect
  const evPopEscCleanupRef = useRef<(() => void) | null>(null)
  const evPopOverlayRef = useCallback((el: HTMLDivElement | null) => {
    if (evPopEscCleanupRef.current) {
      evPopEscCleanupRef.current()
      evPopEscCleanupRef.current = null
    }
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEvPopOpen(false)
    }
    el.addEventListener('keydown', handler)
    evPopEscCleanupRef.current = () => el.removeEventListener('keydown', handler)
  }, [])

  function openEvPopover(ev: CalEvent) {
    setSelectedEvent(ev)
    setEvPopOpen(true)
  }

  function closeEvPopover() {
    setEvPopOpen(false)
  }

  // Task-creation popover state
  const [popOpen, setPopOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<NewEvent>({ title: '', date: '', time: '', color: B })
  const [extraEvents, setExtraEvents] = useState<ExtraEvents>({})

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

  function openPopover() {
    const mm = String(curMonth + 1).padStart(2, '0')
    const dd = String(sel).padStart(2, '0')
    setNewEvent({ title: '', date: `${curYear}-${mm}-${dd}`, time: '', color: B })
    setPopOpen(true)
  }

  function closePopover() {
    setPopOpen(false)
  }

  function commitEvent() {
    if (!newEvent.title.trim()) return
    const info = INFO[newEvent.color]
    if (!info) return
    const ev: CalEvent = {
      time: newEvent.time || '12:00',
      title: newEvent.title.trim(),
      dot: newEvent.color,
      badge: info.badge,
      icon: info.icon,
      color: info.color,
    }
    // Derive key from the date field (may differ from currently viewed month)
    const [yr, mo, dy] = newEvent.date.split('-').map(Number)
    const key = dateKey(yr, mo - 1, dy)
    setExtraEvents((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), ev] }))
    setPopOpen(false)
  }

  const cells = buildCells(curYear, curMonth)
  const selKey = dateKey(curYear, curMonth, sel)
  const baseEvents = getEvents(curYear, curMonth, sel)
  const events = [...baseEvents, ...(extraEvents[selKey] ?? [])].sort((a, b) => a.time.localeCompare(b.time))
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
                type="button"
                className={`cal-today-btn${isViewingToday ? ' is-today' : ''}`}
                onClick={goToday}
              >
                Today
              </button>
              <button type="button" className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">
                <span className="material-icons">chevron_left</span>
              </button>
              <button type="button" className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">
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
            {cells.map((cell) => {
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
                  key={`${cell.m}-${cell.d}`}
                  className={className}
                  onClick={cell.m === 'c' ? () => setSel(cell.d) : undefined}
                >
                  <div className="cal-date-num">{cell.d}</div>
                  <div className="cal-dots">
                    {dots.map((clr) => (
                      <div key={clr} className="cal-dot" style={{ background: clr }} />
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
                  {events.map((item) => (
                    <div
                      key={`${item.time}-${item.title}`}
                      className="cal-ev-item"
                      onClick={() => openEvPopover(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openEvPopover(item) }}
                    >
                      <div className="cev-left">
                        <div className="cev-dot" style={{ background: item.dot }} />
                        <span className="cev-time">{item.time}</span>
                        <span className="cev-badge" style={{ backgroundColor: item.color }}>
                          <span className="material-icons">{item.icon}</span>
                          {item.badge}
                        </span>
                        <span className="cev-title">{item.title}</span>
                      </div>
                      <span className="cev-chevron material-icons">chevron_right</span>
                    </div>
                  ))}
                  <div className="cal-add-row" onClick={openPopover}>
                    <div className="cal-add-icon">
                      <span className="material-icons">add</span>
                    </div>
                    <span className="cal-add-text">Add event</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="cal-no-events">No events scheduled.</div>
                  <div className="cal-add-row" onClick={openPopover}>
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

      {/* Event-detail popover — full TaskDetailsPopover structure re-mapped to .cal-ep-* */}
      <div
        ref={evPopOverlayRef}
        className={`cal-ep-overlay${evPopOpen ? ' open' : ''}`}
        onClick={closeEvPopover}
        role="dialog"
        aria-modal="true"
        aria-label={selectedEvent ? selectedEvent.title : 'Event details'}
        tabIndex={-1}
      >
        <div className="cal-ep-outer" onClick={(e) => e.stopPropagation()}>
          {selectedEvent
            ? <CalEventPopoverCard event={selectedEvent} year={curYear} month={curMonth} day={sel} onClose={closeEvPopover} />
            : <div className="cal-ep-card" />}
        </div>
      </div>

      {/* Task-creation popover (FIX#2) */}
      {popOpen && (
        <div className="cal-popover-backdrop" onClick={closePopover}>
          <div className="cal-popover" onClick={(e) => e.stopPropagation()}>
            <p className="cal-pop-title">New Event</p>

            <div className="cal-pop-field">
              <label className="cal-pop-label">Title</label>
              <input
                className="cal-pop-input"
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent((n) => ({ ...n, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="cal-pop-field">
              <label className="cal-pop-label">Date</label>
              <input
                className="cal-pop-input"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent((n) => ({ ...n, date: e.target.value }))}
              />
            </div>

            <div className="cal-pop-field">
              <label className="cal-pop-label">Time</label>
              <input
                className="cal-pop-input"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent((n) => ({ ...n, time: e.target.value }))}
              />
            </div>

            <div className="cal-pop-field">
              <label className="cal-pop-label">Type</label>
              <div className="cal-pop-colors">
                {[B, O, P].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`cal-pop-color-btn${newEvent.color === c ? ' active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewEvent((n) => ({ ...n, color: c }))}
                    aria-label={INFO[c]?.badge ?? c}
                  />
                ))}
              </div>
            </div>

            <div className="cal-pop-actions">
              <button type="button" className="cal-pop-cancel" onClick={closePopover}>Cancel</button>
              <button type="button" className="cal-pop-add" onClick={commitEvent}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
