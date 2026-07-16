import '../../../../design-system/preview/_base.css'
import './TaskCard.css'

// ---------------------------------------------------------------------------
// TaskCard — Kanban task card column + schema-driven task-details popover
// Faithful port of apps/web/design-system/preview/components-task-card.html
// + apps/web/design-system/preview/_task-popover.jsx
//
// NO raw useEffect anywhere in this folder.
// Timers / tween / keyboard wired via callback refs + plain refs.
// See task-card-hook.ts for the timer/tween utilities.
// ---------------------------------------------------------------------------

import { useState, useRef, useCallback, Fragment } from 'react'
import { useTween, useCountdownRef, useKeydownRef, fmtShort, competeCount } from './task-card-hook'
import { iconClass } from '../../../lib/iconClass'
import { useProximityGroup } from '@/lib/hooks'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Step { t: string; done: boolean }
interface BlockerNode { t: string; state: 'done' | 'active' | 'locked' }
interface LifecycleEvent { t: string; w: string; n?: string; kind?: 'ai' | 'base' }

interface TaskMetrics {
  time_to_deadzone: { mins: number; note: string }
  substeps?: { steps: Step[] }
  reschedule?: { count: number; note: string }
  context_switch?: { level: number; note: string }
  energy?: { points: number; note: string }
  ageing?: { days: number; span: number; frozen: boolean; note: string; statusLabel?: string }
  sync_score?: { pct: number; note: string }
  revenue_velocity?: { days: number; note: string }
  blockers?: { chain: BlockerNode[] }
  lifecycle?: { events: LifecycleEvent[] }
}

interface TaskEntity {
  name: string
  sub: string
  init: string
  color: string
}

interface Task {
  id: string
  title: string
  section: string
  workspace: string
  priority: { label: string; color: string }
  status: { label: string; color: string }
  entity: TaskEntity
  link: 'customer' | 'company'
  desc: string
  metrics: TaskMetrics
}

interface MetricSchema {
  id: string
  label: string
  icon: string
  component: string
  workspaces: string[]
}

// ── METRIC SCHEMA ─────────────────────────────────────────────────────────────

const METRIC_SCHEMA: MetricSchema[] = [
  { id: 'substeps', label: 'Sub-Steps', icon: 'donut_large', component: 'SubSteps',
    workspaces: ['real_estate', 'healthcare', 'law', 'general'] },
  { id: 'reschedule', label: 'Reschedules', icon: 'restart_alt', component: 'Reschedule',
    workspaces: ['real_estate', 'healthcare', 'law', 'general'] },
  { id: 'context_switch', label: 'Focus Cost', icon: 'psychology', component: 'FocusCost',
    workspaces: ['real_estate', 'healthcare', 'law', 'general'] },
  { id: 'energy', label: 'Effort', icon: 'battery_charging_full', component: 'Battery',
    workspaces: ['real_estate', 'healthcare', 'law', 'general'] },
  { id: 'ageing', label: 'Column Ageing', icon: 'ac_unit', component: 'Ageing',
    workspaces: ['real_estate', 'healthcare', 'law', 'general'] },
  { id: 'sync_score', label: 'Timing Fit', icon: 'my_location', component: 'SyncScore',
    workspaces: ['real_estate', 'healthcare', 'law', 'general'] },
  { id: 'revenue_velocity', label: 'Revenue Velocity', icon: 'bolt', component: 'RevenueVelocity',
    workspaces: ['real_estate', 'general'] },
  { id: 'blockers', label: 'Dependency Chain', icon: 'account_tree', component: 'Blockers',
    workspaces: ['real_estate', 'healthcare', 'law', 'general'] },
  { id: 'lifecycle', label: 'Life-cycle', icon: 'timeline', component: 'Lifecycle',
    workspaces: ['real_estate', 'healthcare', 'law', 'general'] },
]

const TP_ACC: Record<string, string> = {
  substeps: 'var(--brand-primary-500)', reschedule: '#F97316', context_switch: '#EF4444', energy: '#EAB308',
  ageing: '#3B82F6', sync_score: 'var(--brand-primary-500)', revenue_velocity: 'var(--brand-primary-500)', blockers: '#6366F1', lifecycle: '#8B5CF6',
}

// metric category groups (item 9) — each header gets an icon + gray separator
const METRIC_GROUPS: { label: string; icon: string; ids: string[] }[] = [
  { label: 'Progress & Flow', icon: 'timeline', ids: ['substeps', 'blockers', 'lifecycle', 'ageing'] },
  { label: 'Effort & Focus', icon: 'bolt', ids: ['context_switch', 'energy', 'reschedule'] },
  { label: 'Revenue & Timing', icon: 'payments', ids: ['revenue_velocity', 'sync_score'] },
]

// ── Task data ─────────────────────────────────────────────────────────────────

const IND_WS: Record<string, string> = {
  'Real Estate': 'real_estate',
  Healthcare: 'healthcare',
  Finance: 'general',
  Automotive: 'general',
}

const TASK_METRICS: Record<string, TaskMetrics> = {
  'Property Viewing': {
    time_to_deadzone: { mins: 549, note: 'Viewing slot is released to other agents after this.' },
    substeps: { steps: [{ t: 'Location pin shared', done: true }, { t: 'Listing sheet ready', done: true }, { t: 'Price-revision doc', done: false }] },
    reschedule: { count: 3, note: 'This task is in a loop — change action type or reassign.' },
    context_switch: { level: 2, note: 'Fragments 4 other tasks today — block focus time.' },
    energy: { points: 4, note: 'Heavy: site visit plus two docs to prep.' },
    ageing: { days: 5, span: 7, frozen: true, note: 'Static in "Under Review" for 5 days.' },
    sync_score: { pct: 92, note: 'You close focus-work 40% faster in the morning.' },
    revenue_velocity: { days: 12, note: 'Completing now pulls the linked deal close 12 days forward.' },
    blockers: { chain: [{ t: 'Legal Approval', state: 'done' }, { t: 'Property Viewing', state: 'active' }, { t: 'Finance Approval', state: 'locked' }] },
    lifecycle: { events: [{ t: 'Created', w: 'Mon 09:00' }, { t: 'Rescheduled', w: 'Tue 14:00', n: 'client busy' }, { t: 'AI-updated', w: 'Wed 11:00', n: 'email analyzed', kind: 'ai' }] },
  },
  'Pre-op Consultation': {
    time_to_deadzone: { mins: 95, note: 'Pre-op window closes — re-book needs ~2 weeks.' },
    substeps: { steps: [{ t: 'Lab results in', done: true }, { t: 'Anesthesia clearance', done: false }, { t: 'Travel & stay confirmed', done: false }] },
    reschedule: { count: 1, note: 'Pushed once for a lab delay.' },
    context_switch: { level: 2, note: 'Blocks the OR scheduling thread — high cost.' },
    energy: { points: 5, note: 'Critical: multi-party clearance required.' },
    ageing: { days: 2, span: 5, frozen: false, note: 'Moving normally through pre-op.' },
    sync_score: { pct: 74, note: 'Better placed mid-morning when clinics respond fast.' },
    revenue_velocity: { days: 0, note: '' },
    blockers: { chain: [{ t: 'Lab Results', state: 'done' }, { t: 'Pre-op Consult', state: 'active' }, { t: 'Anesthesia Sign-off', state: 'locked' }] },
    lifecycle: { events: [{ t: 'Created', w: 'Mon 08:30' }, { t: 'Lab booked', w: 'Mon 15:00' }, { t: 'AI-flagged', w: 'Tue 09:10', n: 'clearance missing', kind: 'ai' }] },
  },
  'Loan Pre-Approval': {
    time_to_deadzone: { mins: 1320, note: 'Rate lock expires — client must re-quote after.' },
    substeps: { steps: [{ t: 'Credit pull', done: true }, { t: 'Income docs', done: true }, { t: 'Offer + rate tier', done: false }] },
    reschedule: { count: 0, note: 'On track — never pushed.' },
    context_switch: { level: 1, note: 'Moderate — fits between meetings.' },
    energy: { points: 3, note: 'Medium: document review.' },
    ageing: { days: 1, span: 6, frozen: false, note: 'Fresh in "Pending".' },
    sync_score: { pct: 81, note: 'Doc review fits your post-lunch focus block.' },
    revenue_velocity: { days: 7, note: 'Approval unblocks the deal next stage.' },
    blockers: { chain: [{ t: 'KYC Check', state: 'done' }, { t: 'Loan Pre-Approval', state: 'active' }, { t: 'Underwriting', state: 'locked' }] },
    lifecycle: { events: [{ t: 'Created', w: 'Today 09:40' }, { t: 'Docs received', w: 'Today 11:20' }, { t: 'AI-scored', w: 'Today 12:05', n: 'credit 720', kind: 'ai' }] },
  },
  'Test Drive Scheduled': {
    time_to_deadzone: { mins: 760, note: 'Demo car is reassigned to the next lead after this.' },
    substeps: { steps: [{ t: 'Slot confirmed', done: true }, { t: 'Spec sheet ready', done: false }, { t: 'Financing outline', done: false }] },
    reschedule: { count: 2, note: 'Pushed twice — confirm the slot to stop the slip.' },
    context_switch: { level: 0, note: 'Low — standalone, easy to slot in.' },
    energy: { points: 2, note: 'Light: confirm plus prep one sheet.' },
    ageing: { days: 3, span: 6, frozen: false, note: 'In "In Progress".' },
    sync_score: { pct: 88, note: 'Showroom answers fastest late afternoon.' },
    revenue_velocity: { days: 5, note: 'A booked drive accelerates the close.' },
    blockers: { chain: [{ t: 'Lead Qualified', state: 'done' }, { t: 'Test Drive', state: 'active' }, { t: 'Finance Offer', state: 'locked' }] },
    lifecycle: { events: [{ t: 'Created', w: 'Mon 10:00' }, { t: 'Rescheduled', w: 'Wed 16:00', n: 'rain' }, { t: 'AI-updated', w: 'Thu 09:00', n: 'slot proposed', kind: 'ai' }] },
  },
}

const TASK_CARDS = [
  {
    cls: 't-low', delay: '.05s', tag: 'var(--brand-primary-500)',
    title: 'Property Viewing', section: 'Prospect', priority: 'Low Priority', priColor: 'var(--brand-primary-500)',
    status: 'Under Review', statusColor: '#3B82F6', industry: 'Real Estate',
    link: 'customer' as const, entName: 'Canberk Yıldız', entSub: '+90 532 118 4470', entInit: 'CY', entColor: '#F59E0B',
    desc: 'Confirm the villa viewing slot, share the location pin and prepare the listing sheet for the prospect.',
    bannerIcon: 'arrow_downward',
    cardDesc: 'Confirm the villa viewing slot and share the location pin.',
    dateClass: 'overdue', dateIcon: 'event_busy', dateText: 'Overdue · 2 days',
  },
  {
    cls: 't-urgent', delay: '.13s', tag: '#EF4444',
    title: 'Pre-op Consultation', section: 'Prospect', priority: 'Urgent', priColor: '#EF4444',
    status: 'Blocked', statusColor: '#EF4444', industry: 'Healthcare',
    link: 'customer' as const, entName: 'Selin Demir', entSub: 'Patient · +90 542 309 7781', entInit: 'SD', entColor: '#EC4899',
    desc: "Confirm the rhinoplasty pre-op plan, lab results and the patient's travel & accommodation arrangements.",
    bannerIcon: 'priority_high',
    cardDesc: 'Confirm the rhinoplasty pre-op plan and patient travel.',
    dateClass: 'today', dateIcon: 'event', dateText: 'Today',
  },
  {
    cls: 't-onboard', delay: '.21s', tag: '#3B82F6',
    title: 'Loan Pre-Approval', section: 'Prospect', priority: 'On Boarding', priColor: '#3B82F6',
    status: 'Pending', statusColor: '#EAB308', industry: 'Finance',
    link: 'customer' as const, entName: 'Mert Aydın', entSub: '+90 535 220 1180', entInit: 'MA', entColor: '#6366F1',
    desc: "Review the applicant's credit profile and prepare the mortgage pre-approval offer and rate tier.",
    bannerIcon: 'person_add',
    cardDesc: 'Review the credit profile and prepare the pre-approval offer.',
    dateClass: 'soon', dateIcon: 'event', dateText: 'Due in 3 days',
  },
  {
    cls: 't-mod', delay: '.29s', tag: '#F97316',
    title: 'Test Drive Scheduled', section: 'Prospect', priority: 'Moderate Priority', priColor: '#F97316',
    status: 'In Progress', statusColor: 'var(--brand-primary-500)', industry: 'Automotive',
    link: 'company' as const, entName: 'Yıldız Motors', entSub: 'Showroom · Maslak', entInit: 'directions_car', entColor: '#06B6D4',
    desc: 'Confirm the test-drive slot, prepare the vehicle spec sheet and outline the financing options.',
    bannerIcon: 'drag_handle',
    cardDesc: 'Confirm the test-drive slot and prep the vehicle spec sheet.',
    dateClass: 'soon', dateIcon: 'event', dateText: 'Tomorrow',
  },
]

function buildTask(card: typeof TASK_CARDS[0]): Task {
  return {
    id: card.title.replace(/\s+/g, '-'),
    title: card.title,
    section: card.section,
    workspace: IND_WS[card.industry] || 'general',
    priority: { label: card.priority, color: card.priColor },
    status: { label: card.status, color: card.statusColor },
    entity: { name: card.entName, sub: card.entSub, init: card.entInit, color: card.entColor },
    link: card.link,
    desc: card.desc,
    metrics: TASK_METRICS[card.title] || TASK_METRICS['Property Viewing'],
  }
}

// ── Widget: SubSteps ──────────────────────────────────────────────────────────

function SubSteps({ data }: { data: NonNullable<TaskMetrics['substeps']> }) {
  // Steps are local state; synced to props via key (parent sets key=task.id+':substeps')
  const [steps, setSteps] = useState<Step[]>(data.steps)
  const stepsProxRef = useProximityGroup<HTMLUListElement>()
  const done = steps.filter(s => s.done).length
  const total = steps.length
  const pct = Math.round(done / total * 100)
  const v = useTween(pct, 700)
  const toggle = (i: number) =>
    setSteps(s => s.map((x, j) => j === i ? { ...x, done: !x.done } : x))

  return (
    <div className="tp-donut-row">
      <span
        className="tp-donut"
        style={{ background: `conic-gradient(var(--brand-primary) ${v}%, var(--bg-chip) 0)` }}
      >
        <span className="tp-donut-mid"><b>{done}/{total}</b></span>
      </span>
      <ul className="tp-steps" ref={stepsProxRef}>
        {steps.map((s, i) => (
          <li key={s.t} className={s.done ? 'done' : ''}>
            <button
              type="button"
              className="tp-step-tog"
              onClick={() => toggle(i)}
              aria-label={s.done ? 'Mark incomplete' : 'Mark complete'}
              data-proximity
            >
              <span className="material-icons">{s.done ? 'check_circle' : 'radio_button_unchecked'}</span>
            </button>
            <span className="tp-step-t">{s.t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Widget: Reschedule ────────────────────────────────────────────────────────

function Reschedule({ data }: { data: NonNullable<TaskMetrics['reschedule']> }) {
  const dots = Math.max(data.count, 4)
  const tone = data.count >= 3 ? '#EF4444' : data.count >= 1 ? '#F97316' : 'var(--brand-primary-500)'
  return (
    <div className="tp-resched">
      <span className="tp-resched-n" style={{ color: tone }}>{data.count}&times;</span>
      <span className="tp-dots">
        {Array.from({ length: dots }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <i key={i} className={i < data.count ? 'on' : ''} style={i < data.count ? { background: tone } : undefined} />
        ))}
      </span>
      <span className="tp-resched-cap">
        {data.count === 0 ? 'never pushed' : data.count >= 3 ? 'looping' : `pushed ${data.count}×`}
      </span>
    </div>
  )
}

// ── Widget: FocusCost ─────────────────────────────────────────────────────────

function FocusCost({ data }: { data: NonNullable<TaskMetrics['context_switch']> }) {
  const n = competeCount(data)
  const lv = (['Low', 'Medium', 'High'] as const)[data.level] ?? 'Medium'
  const tone = data.level >= 2 ? '#EF4444' : data.level === 1 ? '#EAB308' : 'var(--brand-primary-500)'
  return (
    <div className="tp-focus">
      <span className="tp-focus-n" style={{ color: tone }}>{n}</span>
      <div className="tp-focus-tx">
        <span className="tp-focus-main">{n === 1 ? 'task competes' : 'tasks compete'} for focus today</span>
        <span className="tp-focus-sub" style={{ '--fc': tone } as React.CSSProperties}>{lv} switching cost</span>
      </div>
    </div>
  )
}

// ── Widget: Battery ───────────────────────────────────────────────────────────

function Battery({ data }: { data: NonNullable<TaskMetrics['energy']> }) {
  return (
    <div className="tp-batt-row">
      <span className={`tp-batt p${data.points}`}>
        {[0, 1, 2, 3, 4].map(i => <i key={i} className={i < data.points ? 'on' : ''} />)}
        <span className="tp-batt-nub" />
      </span>
      <span className="tp-batt-val">{data.points}/5 effort</span>
    </div>
  )
}

// ── Widget: Ageing ────────────────────────────────────────────────────────────

function Ageing({ data }: { data: NonNullable<TaskMetrics['ageing']> }) {
  const pct = Math.min(100, Math.round(data.days / data.span * 100))
  const w = useTween(pct, 760)
  const tone = data.frozen ? '#3B82F6' : pct > 75 ? '#EF4444' : 'var(--brand-primary-500)'
  return (
    <div className="tp-age">
      <div className="tp-age-chips">
        <span className="tp-age-chip" style={{ '--ac': tone } as React.CSSProperties}>
          <span className="material-icons">{data.frozen ? 'ac_unit' : 'schedule'}</span>
          {data.frozen ? 'Frozen · ' : ''}{data.days}d{data.frozen ? '' : ' in column'}
        </span>
        <span className="tp-age-of">{data.days} of {data.span} days</span>
      </div>
      <div className="tp-age-meter">
        <i style={{ width: w + '%', background: tone, display: 'block' }} />
      </div>
    </div>
  )
}

// ── Widget: SyncScore ─────────────────────────────────────────────────────────

function SyncScore({ data }: { data: NonNullable<TaskMetrics['sync_score']> }) {
  const tone = data.pct >= 80 ? 'var(--brand-primary-500)' : data.pct >= 60 ? '#EAB308' : '#EF4444'
  const peakH = 11
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
  const fitFor = (h: number) => Math.max(12, Math.round(data.pct - Math.abs(h - peakH) * 11))
  const v = useTween(data.pct, 840)
  return (
    <div className="tp-sync">
      <div className="tp-sync-head">
        <b style={{ color: tone }}>{Math.round(v)}%</b>
        <span>placement fit &middot; {data.note}</span>
      </div>
      <div className="tp-sync-table">
        {hours.map(h => {
          const fit = fitFor(h)
          const isPeak = h === peakH
          const slotTone = fit >= 75 ? 'var(--brand-primary-500)' : fit >= 50 ? '#EAB308' : '#A1A1A1'
          return (
            <div key={h} className={'tp-sync-row' + (isPeak ? ' peak' : '')}>
              <span className="tp-sync-hh">{String(h).padStart(2, '0')}:00</span>
              <div className="tp-sync-bar">
                <i style={{ width: fit + '%', background: slotTone }} />
              </div>
              <span className="tp-sync-pct" style={{ color: slotTone }}>{fit}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Widget: RevenueVelocity ───────────────────────────────────────────────────

function RevenueVelocity({ data }: { data: NonNullable<TaskMetrics['revenue_velocity']> }) {
  const v = useTween(data.days, 780)
  return (
    <div className="tp-rev">
      <span className="tp-rev-pill">
        <span className="material-icons">trending_up</span>+{Math.round(v)} days
      </span>
      <span className="tp-rev-cap">pulls the linked deal close sooner</span>
    </div>
  )
}

// ── Widget: Blockers ──────────────────────────────────────────────────────────

const TASK_BLOCKER_ICONS: Record<string, string> = { done: 'check_circle', active: 'radio_button_checked', locked: 'lock' }
const TASK_BLOCKER_TONES: Record<string, string> = { done: 'var(--brand-primary-500)', active: '#3B82F6', locked: '#A1A1A1' }

function Blockers({ data }: { data: NonNullable<TaskMetrics['blockers']> }) {
  const ic = TASK_BLOCKER_ICONS
  const tone = TASK_BLOCKER_TONES
  return (
    <div className="tp-chain-steps">
      {data.chain.map((b, i) => (
        <Fragment key={b.t}>
          {i > 0 && (
            <div className="tp-chain-conn">
              <span className="material-icons">arrow_downward</span>
            </div>
          )}
          <div className={'tp-chain-step ' + b.state}>
            <span className="tp-chain-step-ic" style={{ color: tone[b.state] }}>
              <span className="material-icons">{ic[b.state]}</span>
            </span>
            <span className="tp-chain-step-lbl">{b.t}</span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

// ── Widget: Lifecycle ─────────────────────────────────────────────────────────

function Lifecycle({ data }: { data: NonNullable<TaskMetrics['lifecycle']> }) {
  const kindIcon: Record<string, string> = { base: 'radio_button_checked', ai: 'neurology' }
  const kindColor: Record<string, string> = { base: 'var(--acc, var(--brand-primary))', ai: '#8B5CF6' }
  return (
    <ul className="tp-life-bul">
      {data.events.map((e) => {
        const kind = e.kind || 'base'
        return (
          <li key={`${e.t}-${e.w}`} className="tp-life-item">
            <span className="tp-life-item-ic" style={{ color: kindColor[kind] }}>
              <span className={iconClass(kindIcon[kind] ?? 'radio_button_checked')}>{kindIcon[kind] ?? 'radio_button_checked'}</span>
            </span>
            <div className="tp-life-item-tx">
              <span className="tp-life-item-lbl">{e.t}</span>
              <span className="tp-life-item-when">
                {e.w}{e.n ? <span className="tp-life-n"> &middot; {e.n}</span> : ''}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Widget dispatch ───────────────────────────────────────────────────────────

type WidgetProps = {
  schema: MetricSchema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status: any
  act: (label: string) => void
  taskId: string
}

function WidgetBody({ schema, data, taskId }: WidgetProps) {
  switch (schema.component) {
    case 'SubSteps': return <SubSteps key={taskId + ':' + schema.id} data={data} />
    case 'Reschedule': return <Reschedule data={data} />
    case 'FocusCost': return <FocusCost data={data} />
    case 'Battery': return <Battery data={data} />
    case 'Ageing': return <Ageing data={data} />
    case 'SyncScore': return <SyncScore key={taskId + ':' + schema.id} data={data} />
    case 'RevenueVelocity': return <RevenueVelocity key={taskId + ':' + schema.id} data={data} />
    case 'Blockers': return <Blockers data={data} />
    case 'Lifecycle': return <Lifecycle data={data} />
    default: return null
  }
}

// ── Tip logic ─────────────────────────────────────────────────────────────────

interface Tip {
  t: React.ReactNode
  cta?: { label: string; ic: string; tone: string }
}

function tipFor(id: string, data: Record<string, unknown>): Tip | null {
  switch (id) {
    case 'substeps': {
      const steps = (data.steps as Step[]) ?? []
      const next = steps.find(s => !s.done)?.t
      return next
        ? { t: <Fragment>Next: <b>{next}</b> &mdash; tick it off above to unblock the chain.</Fragment> }
        : { t: 'All sub-steps done — ready to advance the stage.' }
    }
    case 'reschedule':
      return (data.count as number) >= 3
        ? { t: 'Rescheduled 3×+ — this is looping. Reassign or change the action type to break it.', cta: { label: 'Reassign', ic: 'person_add', tone: '#F97316' } }
        : { t: data.note as string }
    case 'context_switch':
      return { t: `Fragments ${competeCount(data as { level: number; note?: string })} other tasks — block a focus slot before you start.`, cta: { label: 'Block focus time', ic: 'event_busy', tone: '#EF4444' } }
    case 'energy':
      return { t: data.note as string }
    case 'ageing':
      return (data.frozen as boolean)
        ? { t: `Stuck ${data.days} days in "${(data.statusLabel as string) || 'this column'}" — advance the stage or escalate today.`, cta: { label: 'Advance stage', ic: 'arrow_forward', tone: '#3B82F6' } }
        : { t: data.note as string }
    case 'sync_score':
      return { t: data.note as string }
    case 'revenue_velocity':
      return (data.days as number) > 0
        ? { t: `Finish now to pull the linked deal close ${data.days} days forward.` }
        : { t: 'No measurable deal-velocity impact for this task.' }
    case 'blockers': {
      const chain = (data.chain as BlockerNode[]) ?? []
      const next = chain.find(b => b.state === 'locked')?.t
      return next
        ? { t: <Fragment>You're the active blocker &mdash; clearing this unlocks <b>{next}</b>.</Fragment> }
        : { t: 'No downstream tasks are waiting on this one.' }
    }
    case 'lifecycle':
      return { t: 'AI keeps this timeline current from the event log — watch for repeated reschedules.' }
    default:
      return data.note ? { t: data.note as string } : null
  }
}

// ── MetricCard (row) ──────────────────────────────────────────────────────────

function MetricCard({ schema, data, status, act, taskId }: WidgetProps) {
  const acc = TP_ACC[schema.id] ?? 'var(--brand-primary)'
  const tip = data ? tipFor(schema.id, data as Record<string, unknown>) : null
  const tipProxRef = useProximityGroup<HTMLDivElement>()
  return (
    <div className="tp-w-shell" style={{ '--acc': acc } as React.CSSProperties}>
      <section className="tp-w" style={{ '--acc': acc } as React.CSSProperties}>
        <div className="tp-w-head">
          <span className="tp-w-ic"><span className="material-icons">{schema.icon}</span></span>
          <span className="tp-w-label">{schema.label}</span>
        </div>
        {data && <WidgetBody schema={schema} data={data} status={status} act={act} taskId={taskId} />}
        {tip && (
          <div className="tp-tip" ref={tipProxRef}>
            <span className="material-icons">tips_and_updates</span>
            <span className="tp-tip-t">{tip.t}</span>
            {tip.cta && (
              <button
                type="button"
                className="tp-tip-cta"
                style={{ '--cc': tip.cta.tone } as React.CSSProperties}
                onClick={() => act(tip.cta!.label)}
                data-proximity
              >
                <span className="material-icons">{tip.cta.ic}</span>{tip.cta.label}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

// ── AlertsStrip ───────────────────────────────────────────────────────────────

interface Alert { tone: string; ic: string; t: string; cta: string }

function AlertsStrip({ alerts, act }: { alerts: Alert[]; act: (l: string) => void }) {
  const alertsProxRef = useProximityGroup<HTMLDivElement>()
  if (!alerts.length) return null
  const ctaIcon = (cta: string) => {
    if (cta === 'Reschedule') return 'event_repeat'
    if (cta === 'Reassign') return 'person_add'
    if (cta === 'Advance stage') return 'arrow_upward'
    return 'bolt'
  }
  return (
    <div className="tp-alerts">
      <div className="tp-alerts-k">
        <span className="material-icons">warning</span>Active alerts &middot; {alerts.length}
      </div>
      <div className="tp-alerts-list" ref={alertsProxRef}>
        {alerts.map((a) => (
          <div key={a.t} className={'tp-alert ' + a.tone}>
            <span className="tp-alert-ic"><span className="material-icons">{a.ic}</span></span>
            <span className="tp-alert-t">{a.t}</span>
            <button type="button" className="tp-alert-cta" onClick={() => act(a.cta)} data-proximity>
              <span className="material-icons">{ctaIcon(a.cta)}</span>{a.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TaskDetailsPopover ────────────────────────────────────────────────────────
// The source uses two useEffect calls:
//   1. [task]: sets deadlineRef from task data and resets "now"
//   2. [open]: starts/clears the 1-second tick interval
//
// Replacement strategy:
//   - deadline is computed once per task via a derivation on render (no effect)
//   - "now" ticking: callback ref on the overlay element starts the interval
//   - Escape key: callback ref on the outer div
//   - toast timer: plain ref, no effect needed

function TaskDetailsPopover({
  task,
  open,
  onClose,
}: {
  task: Task | null
  open: boolean
  onClose: () => void
}) {
  const [now, setNow] = useState(Date.now)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tpCardRef = useProximityGroup<HTMLElement>()

  // Deadline computed once per task (title-keyed). Stored in state so it can
  // be read during render without a ref. The task key ref tracks which task
  // the deadline was computed for — when the task changes we update deadline
  // synchronously (derived-state-from-props pattern, no effect needed).
  const [deadline, setDeadline] = useState<number>(() =>
    task ? Date.now() + task.metrics.time_to_deadzone.mins * 60000 : 0
  )
  const taskKeyRef = useRef<string | null>(task?.title ?? null)
  // Derived-state-from-props: when the task identity changes, update the
  // deadline synchronously so the countdown reflects the new task immediately.
  // taskKeyRef read/write is safe — it is never used for rendering, only for
  // change detection. Date.now() here fires at most once per task change.
  // eslint-disable-next-line react-hooks/refs
  if (task && taskKeyRef.current !== task.title) {
    // eslint-disable-next-line react-hooks/refs
    taskKeyRef.current = task.title
    // eslint-disable-next-line react-hooks/purity, local/no-nondeterministic-render
    setDeadline(Date.now() + task.metrics.time_to_deadzone.mins * 60000)
  }

  // Countdown tick — callback ref on the overlay element (starts when open)
  const countdownRef = useCountdownRef(setNow, open)

  // Escape key — callback ref on root container
  const escRef = useKeydownRef(onClose)

  // Combine refs
  const overlayRef = useCallback(
    (el: HTMLDivElement | null) => {
      countdownRef(el)
      escRef(el)
    },
    [countdownRef, escRef],
  )

  const act = (label: string) => {
    setToast(label + ' — action queued')
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2200)
  }

  // TODO: route to lead details page once route exists
  const openLeadDetails = () => { /* TODO: route to lead details */ }

  if (!task) return <div className="tp-overlay" />

  const ws = task.workspace
  const remainingMs = Math.max(0, deadline - now)
  const M = task.metrics

  const overdue = remainingMs < 3_600_000
  const frozen = M.ageing?.frozen ?? false
  const loop = (M.reschedule?.count ?? 0) >= 3
  const highLoad = (M.context_switch?.level ?? 0) >= 2

  const alerts: Alert[] = []
  if (overdue) alerts.push({ tone: 'r', ic: 'hourglass_bottom', t: `Critical in ${fmtShort(remainingMs)} — the slot releases after this.`, cta: 'Reschedule' })
  if (frozen && M.ageing) alerts.push({ tone: 'a', ic: 'ac_unit', t: `Frozen ${M.ageing.days} days in "${task.status.label}".`, cta: 'Advance stage' })
  if (loop && M.reschedule) alerts.push({ tone: 'a', ic: 'restart_alt', t: `Rescheduled ${M.reschedule.count}× — likely looping.`, cta: 'Reassign' })
  if (highLoad && M.context_switch) alerts.push({ tone: 'a', ic: 'psychology', t: `High focus cost — fragments ${competeCount(M.context_switch)} tasks today.`, cta: 'Block time' })

  const visible = METRIC_SCHEMA.filter(m => m.workspaces.includes(ws))

  // Pass status label into ageing tip data
  const metricsWithStatus = { ...M }
  if (metricsWithStatus.ageing) {
    metricsWithStatus.ageing = { ...metricsWithStatus.ageing, statusLabel: task.status.label }
  }

  // Determine entity avatar display
  const entInit = task.entity.init
  const entIsIcon = /\s/.test(entInit) || entInit.length > 3

  return (
    <div
      ref={overlayRef}
      className={'tp-overlay' + (open ? ' open' : '')}
      onClick={onClose}
    >
      <div className="tp-outer" onClick={e => e.stopPropagation()}>
        <aside
          ref={tpCardRef}
          className="tp-card"
          style={{ '--ph': task.priority.color, '--sc': task.status.color } as React.CSSProperties}
        >
          <div className="tp-head">
            <div className="tp-head-top">
              <div className="tp-head-title">{task.title}</div>
              <button type="button" className="tp-close" data-proximity onClick={onClose} aria-label="Close">
                <span className="material-icons">close</span>
              </button>
            </div>

            {task.desc && <div className="tp-head-desc">{task.desc}</div>}

            <div className="tp-htags">
              <span className="tp-pri-tag" style={{ '--tc': task.priority.color } as React.CSSProperties}>
                <span className="tp-pc-dot" />{task.priority.label}
              </span>
              <span className="tp-status" style={{ '--tc': task.status.color } as React.CSSProperties}>
                <span className="tp-pc-dot" />{task.status.label}
              </span>
              <span className={'tp-countdown' + (overdue ? ' urgent' : '')}>
                <span className="material-icons">{overdue ? 'priority_high' : 'hourglass_bottom'}</span>
                {fmtShort(remainingMs)}
              </span>
            </div>

            <div className="tp-cust-shell" onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                // (7) Press ripple — paints the grey frame behind the white customer card
                const shell = e.currentTarget
                const r = document.createElement('span')
                r.className = 'tp-cust-ripple'
                const d = Math.max(shell.offsetWidth, shell.offsetHeight) * 1.4
                const rect = shell.getBoundingClientRect()
                r.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - rect.left - d / 2}px;top:${e.clientY - rect.top - d / 2}px`
                shell.appendChild(r)
                r.addEventListener('animationend', () => r.remove(), { once: true })
              }}>
              {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- wraps nested <button>s (Message / Ask AI); a native <button> cannot contain interactive children */}
              <div className="tp-customer tp-customer-link" role="button" tabIndex={0}
                onClick={openLeadDetails}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openLeadDetails() }}
                aria-label={`Open ${task.link === 'company' ? 'company' : 'customer'} details`}
              >
                <span className="tp-cust-av" style={{ background: task.entity.color }}>
                  {entIsIcon
                    ? <span className="material-icons">{entInit}</span>
                    : entInit}
                </span>
                <div className="tp-cust-meta">
                  <div className="tp-cust-k">{task.link === 'company' ? 'Related company' : 'Related customer'}</div>
                  <div className="tp-cust-name-row">
                    <span className="tp-cust-name">{task.entity.name}</span>
                    <span className="material-icons tp-cust-open-ic">open_in_new</span>
                  </div>
                  <div className="tp-cust-sub">
                    <span className="material-icons" style={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '4px', opacity: 0.85 }}>call</span>
                    {task.entity.sub}
                  </div>
                </div>
                <div className="tp-cust-actions">
                  <button type="button" className="tp-cust-act" aria-label="Message" data-proximity
                    onClick={e => { e.stopPropagation(); act('Message') }}>
                    <span className="material-icons">chat</span>
                  </button>
                  <button type="button" className="tp-cust-ask ask-ai" data-proximity
                    onClick={e => { e.stopPropagation(); act('Ask AI') }}>
                    <span className="material-icons">bolt</span>Ask AI
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="tp-body">
            <AlertsStrip alerts={alerts} act={act} />

            <div className="tp-list">
              {METRIC_GROUPS.map((group, gi) => {
                const groupMetrics = visible.filter(m => group.ids.includes(m.id))
                if (!groupMetrics.length) return null
                return (
                  <Fragment key={group.label}>
                    <div className={'tp-category-header' + (gi === 0 ? ' first' : '')}>
                      <span className="material-icons">{group.icon}</span>
                      <span className="tp-category-label">{group.label}</span>
                      {gi === 0 && <span className="tp-category-ts">updated just now</span>}
                    </div>
                    {groupMetrics.map(m => {
                      const data = metricsWithStatus[m.id as keyof TaskMetrics]
                      return (
                        <MetricCard
                          key={task.id + ':' + m.id}
                          schema={m}
                          data={data}
                          status={task.status}
                          act={act}
                          taskId={task.id}
                        />
                      )
                    })}
                  </Fragment>
                )
              })}
            </div>

            <div className="tp-footer">
              <button type="button" className="tp-foot-btn" style={{ '--fbtn': '#F97316' } as React.CSSProperties} data-proximity onClick={() => act('Reschedule')}>
                <span className="material-icons">event_repeat</span>Reschedule
              </button>
              <button type="button" className="tp-foot-btn" style={{ '--fbtn': '#3B82F6' } as React.CSSProperties} data-proximity onClick={() => act('Reassign')}>
                <span className="material-icons">person_add</span>Reassign
              </button>
              <button type="button" className="tp-foot-btn primary" style={{ '--fbtn': 'var(--brand-primary-500)' } as React.CSSProperties} data-proximity onClick={() => act('Open deal')}>
                <span className="material-icons">open_in_new</span>View deal
              </button>
            </div>
          </div>

          <div className={'tp-toast' + (toast ? ' show' : '')}>
            <span className="material-icons">check_circle</span>{toast}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── TaskCard (top-level) ──────────────────────────────────────────────────────

export default function TaskCard() {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const columnRef = useProximityGroup<HTMLDivElement>()

  const openTask = (task: Task) => {
    setActiveTask(task)
    setPopoverOpen(true)
  }

  const closePopover = () => setPopoverOpen(false)

  return (
    <div className="card" style={{ padding: 0, background: 'var(--bg-app)' }}>
      <div className="frame">
        <div className="column" ref={columnRef}>

          <div className="col-head">
            <div className="col-title">
              <span className="col-bar" />
              <span className={`${iconClass('person_search')} col-title-ic`} aria-hidden>person_search</span>
              <h2>Prospect</h2>
            </div>
            <div className="col-actions">
              <button type="button" className="col-btn" data-proximity><span className="material-icons">add</span></button>
              <button type="button" className="col-btn" data-proximity><span className="material-icons">more_horiz</span></button>
            </div>
          </div>

          <div className="col-sub">
            4 Tasks<span className="sep" />Updated 4 hours ago
          </div>

          {TASK_CARDS.map(card => (
            <div
              key={card.title}
              className={`task ${card.cls}`}
              style={{ animationDelay: card.delay, '--tag': card.tag } as React.CSSProperties}
              data-proximity
              onClick={() => openTask(buildTask(card))}
            >
              <div className="tag-banner">
                <span className={`material-icons bnr-ico`}>{card.bannerIcon}</span>
                {card.priority}
              </div>
              <div className="task-body">
                <div className="task-inner">
                  <div className="t-ind">
                    <span className="material-icons">{card.industry === 'Real Estate' ? 'apartment' : card.industry === 'Healthcare' ? 'medical_services' : card.industry === 'Finance' ? 'account_balance' : 'directions_car'}</span>
                    {card.industry}
                  </div>
                  <div className="t-title">{card.title}</div>
                  <div className="t-desc">{card.cardDesc}</div>
                  <div className="entity">
                    <span
                      className="ent-round"
                      style={{ background: card.entColor }}
                    >
                      {/\s/.test(card.entInit) || card.entInit.length > 3
                        ? <span className="material-icons">{card.entInit}</span>
                        : card.entInit}
                    </span>
                    <div className="ent-meta">
                      <div className="ent-name">{card.entName}</div>
                      <div className="ent-sub">{card.entSub}</div>
                    </div>
                  </div>
                </div>
                <div className="task-foot">
                  <span className={`date ${card.dateClass}`}>
                    <span className="material-icons">{card.dateIcon}</span>
                    {card.dateText}
                  </span>
                  <button
                    type="button"
                    className="ask-ai"
                    data-proximity
                    onClick={e => { e.stopPropagation(); openTask(buildTask(card)) }}
                  >
                    <span className="material-icons">bolt</span>Ask AI
                  </button>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

      <TaskDetailsPopover
        task={activeTask}
        open={popoverOpen}
        onClose={closePopover}
      />
    </div>
  )
}
