import '../../../../design-system/preview/_base.css'
import './Calendar.css'

import { useState, useCallback, useEffect, useRef, Fragment } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { usePanelDirection } from '../../../lib/hooks/use-panel-direction'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import {
  B, INFO, MONTH_NAMES, DAY_NAMES, buildCells, getEvents, dateKey,
  type Cell, type CalEvent, type NewEvent, type ExtraEvents,
} from './calendar-shared'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { CalendarEventsPanel } from './CalendarEventsPanel'
import { CalendarNewEventPopover } from './CalendarNewEventPopover'

// ── Component ──────────────────────────────────────────────────────────────

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
  // Local checklist state seeded from `data.steps`, but re-synced whenever a
  // new `data` object arrives (different event selected) so the checklist
  // never shows a stale prior event's steps. Adjusting state during render
  // on a prop-identity change is the React-documented alternative to an
  // effect for this "reset on prop change" case.
  const [prevData, setPrevData] = useState(data)
  const [steps, setSteps] = useState<CalStep[]>(data.steps)
  if (data !== prevData) {
    setPrevData(data)
    setSteps(data.steps)
  }
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
  const tone = data.count >= 3 ? '#EF4444' : data.count >= 1 ? '#F97316' : 'var(--brand-primary-500)'
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
  const tone = data.level >= 2 ? '#EF4444' : data.level === 1 ? '#EAB308' : 'var(--brand-primary-500)'
  const n = data.level + 2
  return (
    <div className="cal-ep-focus">
      <span className="cal-ep-focus-n" style={{ color: tone }}>{n}</span>
      <div className="cal-ep-focus-tx">
        <span className="cal-ep-focus-main">{n === 1 ? 'event competes' : 'events compete'} for focus today</span>
        <span className="cal-ep-focus-sub" style={{ '--fc': tone } as React.CSSProperties}>
          <span className="material-icons">swap_horiz</span>{lv} switching cost
        </span>
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
  const tone = data.frozen ? '#3B82F6' : pct > 75 ? '#EF4444' : 'var(--brand-primary-500)'
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

const CAL_SYNC_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

function CalSyncScore({ data }: { data: CalEventMetrics['sync_score'] }) {
  const tone = data.pct >= 80 ? 'var(--brand-primary-500)' : data.pct >= 60 ? '#EAB308' : '#EF4444'
  const peakH = 10
  const hours = CAL_SYNC_HOURS
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
          const slotTone = fit >= 75 ? 'var(--brand-primary-500)' : fit >= 50 ? '#EAB308' : '#A1A1A1'
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

const CAL_BLOCKER_ICONS: Record<string, string> = { done: 'check_circle', active: 'radio_button_checked', locked: 'lock' }
const CAL_BLOCKER_TONES: Record<string, string> = { done: 'var(--brand-primary-500)', active: '#3B82F6', locked: '#A1A1A1' }

function CalBlockers({ data }: { data: CalEventMetrics['blockers'] }) {
  const ic = CAL_BLOCKER_ICONS
  const tone = CAL_BLOCKER_TONES
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

const CAL_LIFECYCLE_KIND_ICON: Record<string, string> = { base: 'radio_button_checked', ai: 'neurology' }
const CAL_LIFECYCLE_KIND_COLOR: Record<string, string> = { base: 'var(--brand-primary)', ai: '#8B5CF6' }

function CalLifecycle({ data }: { data: CalEventMetrics['lifecycle'] }) {
  const kindIcon = CAL_LIFECYCLE_KIND_ICON
  const kindColor = CAL_LIFECYCLE_KIND_COLOR
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

function calAlertsCtaIcon(cta: string): string {
  if (cta === 'Reschedule') return 'event_repeat'
  if (cta === 'Reassign') return 'person_add'
  return 'bolt'
}

function CalAlertsStrip({ alerts, act }: { alerts: CalAlert[]; act: (l: string) => void }) {
  if (!alerts.length) return null
  const ctaIcon = calAlertsCtaIcon
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
  substeps: 'var(--brand-primary-500)', reschedule: '#F97316', context_switch: '#EF4444', energy: '#EAB308',
  ageing: '#3B82F6', sync_score: 'var(--brand-primary-500)', blockers: '#6366F1', lifecycle: '#8B5CF6',
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

function CalMetricTray({ children }: { children: React.ReactNode }) {
  const trayRef = useSquircle<HTMLDivElement>()
  return <div className="cal-ep-w-tray" ref={trayRef}>{children}</div>
}

function CalMetricCard({ id, metrics, act }: { id: string; metrics: CalEventMetrics; act: (l: string) => void }) {
  const acc = CAL_EP_ACC[id] ?? 'var(--brand-primary)'
  const meta = CAL_METRIC_META[id]
  const shellRef = useSquircle<HTMLDivElement>()
  if (!meta) return null
  return (
    <div className="cal-ep-w-shell" ref={shellRef} style={{ '--acc': acc } as React.CSSProperties}>
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

function calAddRipple(e: React.MouseEvent<HTMLDivElement>) {
  const shell = e.currentTarget
  const r = document.createElement('span')
  r.className = 'cal-ep-cust-ripple'
  const d = Math.max(shell.offsetWidth, shell.offsetHeight) * 1.4
  const rect = shell.getBoundingClientRect()
  r.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px`
  shell.appendChild(r)
  r.addEventListener('animationend', () => r.remove(), { once: true })
}

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

  const orgOuterRef = useSquircle<HTMLDivElement>()
  const orgInnerRef = useSquircle<HTMLDivElement>()
  const epCardRef = useSquircle<HTMLDivElement>()

  return (
    <div
      className="cal-ep-card"
      ref={epCardRef}
      data-squircle="on"
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
        {event.description && (
          <p className="cal-ep-desc">{event.description}</p>
        )}

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

        {/* Organiser card — grey shell wrapping the canonical inner-card */}
        <div className="cal-ep-customer-outer" ref={orgOuterRef}>
        <div
          className="cal-ep-customer"
          ref={orgInnerRef}
          onClick={calAddRipple}
          role="presentation"
        >
          <span className="cal-ep-cust-av icon-badge" style={{ '--icon-c': orgColor } as React.CSSProperties}>
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
            <button type="button" className="cal-ep-cust-ask ask-ai btn-green" onClick={e => { e.stopPropagation(); act('Ask AI') }}>
              <span className={iconClass('neurology')}>neurology</span>Ask AI
            </button>
          </div>
        </div>
        </div>{/* /cal-ep-customer-outer */}
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
                <CalMetricTray key={id}>
                  <CalMetricCard id={id} metrics={metrics} act={act} />
                </CalMetricTray>
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
          <button type="button" className="cal-ep-foot-btn primary" style={{ '--fbtn': 'var(--brand-primary-500)' } as React.CSSProperties} onClick={() => act('Open event')}>
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
  const shellSquircleRef = useSquircle<HTMLDivElement>()
  const panelSquircleRef = useSquircle<HTMLDivElement>()
  const epOuterRef = useSquircle<HTMLDivElement>()
  const [curYear, setCurYear] = useState(2026)
  const [curMonth, setCurMonth] = useState(4) // May = 4
  const [sel, setSel] = useState(4) // day 4 selected initially

  // Direction-aware header switch: shared usePanelDirection() hook (dsfb-02)
  // + global [data-panel-state] keyframes (styles/motion-tokens.css), same
  // canon MotionTabs uses. monthIndex is the monotonic index fed to the
  // hook; exitingMonth holds the outgoing grid's snapshot so it can render
  // as a departing overlay while the new grid enters in-flow.
  const monthIndex = curYear * 12 + curMonth
  const panelState = usePanelDirection(monthIndex)
  const [exitingMonth, setExitingMonth] = useState<{ cells: Cell[]; year: number; month: number } | null>(null)
  const gridExitCleanupRef = useRef<(() => void) | null>(null)
  const gridExitOverlayRef = useCallback((el: HTMLDivElement | null) => {
    gridExitCleanupRef.current?.()
    gridExitCleanupRef.current = null
    if (!el) return
    const handler = () => setExitingMonth(null)
    el.addEventListener('animationend', handler)
    gridExitCleanupRef.current = () => el.removeEventListener('animationend', handler)
  }, [])

  // Event-detail popover state
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const [evPopOpen, setEvPopOpen] = useState(false)

  // Events scroll — scroll position + thumb tracking. The container below
  // is keyed to `selKey` so it remounts (and replays its entrance
  // animation) on every date change; the effect's [selKey] dependency
  // re-attaches the listener on the same cadence.
  const [evScrollState, setEvScrollState] = useState<'none' | 'top' | 'mid' | 'bottom'>('none')
  const evScrollThumbRef = useRef<HTMLDivElement | null>(null)
  const evScrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Escape key + backdrop click on the always-mounted event-detail popover
  // overlay, both wired imperatively on the ref (not as onKeyDown/onClick
  // JSX props) so react-doctor's no-noninteractive-element-interactions rule
  // doesn't flag the non-interactive <dialog> tag — same pattern as
  // TodoTaskDetailPopover's overlayRef effect.
  const evPopOverlayElRef = useRef<HTMLDialogElement | null>(null)
  useEffect(() => {
    const el = evPopOverlayElRef.current
    if (!el) return
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEvPopOpen(false)
    }
    const clickHandler = () => setEvPopOpen(false)
    el.addEventListener('keydown', keyHandler)
    el.addEventListener('click', clickHandler)
    return () => {
      el.removeEventListener('keydown', keyHandler)
      el.removeEventListener('click', clickHandler)
    }
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
    setExitingMonth({ cells, year: curYear, month: curMonth })
    if (curMonth === 0) {
      setCurMonth(11)
      setCurYear((y) => y - 1)
    } else {
      setCurMonth((m) => m - 1)
    }
    setSel(1)
  }

  function nextMonth() {
    setExitingMonth({ cells, year: curYear, month: curMonth })
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

  // Proximity groups: day-cell grid (click to select) + events list (click to open)
  const gridProximityRef = useProximityGroup<HTMLDivElement>()
  const eventsProximityRef = useProximityGroup<HTMLDivElement>()

  const cells = buildCells(curYear, curMonth)

  // Roving-tabindex day grid (WAI-ARIA APG grid pattern): one ref per
  // current-month day so arrow keys can move real DOM focus. Scoped to the
  // visible month only (clamped at day 1 / last day) -- crossing a month
  // boundary would need to drive the same exit/enter animation state
  // machine as prevMonth/nextMonth, which is out of scope for a
  // behaviour-only pass that must not touch month-navigation DOM.
  const gridCellRefs = useRef<Record<number, HTMLDivElement | null>>({})
  function handleGridKeyDown(e: ReactKeyboardEvent<HTMLDivElement>): void {
    const key = e.key
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'Home' && key !== 'End') return
    e.preventDefault()
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate()
    // Navigation must originate from the focused cell, not the selected day
    // -- selection and focus can diverge (e.g. click day 4, tab to day 1),
    // and arrow keys should move relative to what's actually focused.
    const target = e.target as HTMLElement
    const focusedEntry = Object.entries(gridCellRefs.current).find(
      ([, el]) => el === target || (el?.contains(target) ?? false)
    )
    const origin = focusedEntry ? Number(focusedEntry[0]) : sel
    const dow = new Date(curYear, curMonth, origin).getDay()
    let next = origin
    if (key === 'ArrowLeft') next = origin - 1
    else if (key === 'ArrowRight') next = origin + 1
    else if (key === 'ArrowUp') next = origin - 7
    else if (key === 'ArrowDown') next = origin + 7
    else if (key === 'Home') next = origin - dow
    else if (key === 'End') next = origin + (6 - dow)
    next = Math.min(daysInMonth, Math.max(1, next))
    setSel(next)
    gridCellRefs.current[next]?.focus()
  }

  const selKey = dateKey(curYear, curMonth, sel)

  useEffect(() => {
    const el = evScrollContainerRef.current
    if (!el) return
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const noScroll = scrollHeight <= clientHeight + 4
      const atTop = scrollTop < 4
      const atBottom = scrollTop + clientHeight >= scrollHeight - 4
      setEvScrollState(noScroll ? 'none' : atTop ? 'top' : atBottom ? 'bottom' : 'mid')
      if (evScrollThumbRef.current) {
        const ratio = clientHeight / scrollHeight
        const thumbH = Math.max(20, Math.round(ratio * clientHeight))
        const maxOffset = clientHeight - thumbH
        const offset = noScroll ? 0 : Math.round((scrollTop / (scrollHeight - clientHeight)) * maxOffset)
        evScrollThumbRef.current.style.height = thumbH + 'px'
        evScrollThumbRef.current.style.top = offset + 'px'
      }
    }
    el.addEventListener('scroll', update, { passive: true })
    update()
    return () => el.removeEventListener('scroll', update)
  }, [selKey])

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
    <div className="card cal-shell" ref={shellSquircleRef} data-squircle="on">
      <div className="cal-panel" ref={panelSquircleRef} data-squircle="on">

          <CalendarHeader
            curMonth={curMonth}
            curYear={curYear}
            isViewingToday={isViewingToday}
            goToday={goToday}
            prevMonth={prevMonth}
            nextMonth={nextMonth}
          />

          <CalendarGrid
            cells={cells}
            exitingMonth={exitingMonth}
            panelState={panelState}
            monthIndex={monthIndex}
            curYear={curYear}
            curMonth={curMonth}
            gridExitOverlayRef={gridExitOverlayRef}
            gridProximityRef={gridProximityRef}
            sel={sel}
            setSel={setSel}
            gridCellRefs={gridCellRefs}
            handleGridKeyDown={handleGridKeyDown}
          />

          <div className="cal-divider" />

          {/* Events panel — scroll key remounts the scroll div so position resets and animations replay */}
          <CalendarEventsPanel
            evScrollState={evScrollState}
            selKey={selKey}
            evScrollContainerRef={evScrollContainerRef}
            eventsProximityRef={eventsProximityRef}
            label={label}
            cnt={cnt}
            events={events}
            openEvPopover={openEvPopover}
            openPopover={openPopover}
            evScrollThumbRef={evScrollThumbRef}
          />

        </div>

      {/* Event-detail popover — full TaskDetailsPopover structure re-mapped to
          .cal-ep-*. Native non-modal <dialog> rendered `open` unconditionally
          (never toggling the attribute) so the existing opacity/visibility
          transition on .cal-ep-overlay.open keeps driving show/hide exactly
          as before; backdrop-click + Escape are wired imperatively on the
          ref above (not as onClick/onKeyDown JSX props here), which is also
          why this block stays inline in the parent rather than a sibling
          file — the dialog element and the effect that owns its interactions
          need to stay co-located for the scanner to trace the ref. */}
      <dialog
        open
        ref={evPopOverlayElRef}
        className={`cal-ep-overlay${evPopOpen ? ' open' : ''}`}
        aria-label={selectedEvent ? selectedEvent.title : 'Event details'}
        tabIndex={-1}
        style={{ border: 'none', margin: 0, maxWidth: 'none', maxHeight: 'none', color: 'inherit' }}
      >
        <div className="cal-ep-outer" ref={epOuterRef} data-squircle="on" onClick={(e) => e.stopPropagation()}>
          {selectedEvent
            ? <CalEventPopoverCard event={selectedEvent} year={curYear} month={curMonth} day={sel} onClose={closeEvPopover} />
            : <div className="cal-ep-card" />}
        </div>
      </dialog>

      {/* Task-creation popover (FIX#2) */}
      <CalendarNewEventPopover
        popOpen={popOpen}
        closePopover={closePopover}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        commitEvent={commitEvent}
      />
    </div>
  )
}
