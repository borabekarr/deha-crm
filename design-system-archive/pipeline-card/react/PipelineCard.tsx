/**
 * PipelineCard — React port of apps/web/design-system/preview/components-pipeline-card.html
 *
 * NO raw useEffect in this folder. Timers are wired via callback refs on DOM
 * elements (pattern: pipeline-card-hook.ts). State manages popover open/close
 * and inline-discuss panels. The inverted popover detail overlay is React state.
 */
import { useState, useRef, useCallback } from 'react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_pipeline-card.css'
import '../../../../design-system/preview/_darkmode.css'
import './PipelineCard.css'
import { startCountUp, spawnRipple, runApply, animateRemove, mountAiChat } from './pipeline-card-hook'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = 'high' | 'med' | 'low'
type CardType = 'marketing' | 'pricing' | 'lead' | 'automation'

interface Chip {
  icon: string
  label: string
  count?: string
  tone: string
}

interface EntityItem {
  init: string
  name: string
  sub: string
  score?: string
  scoreCls?: string
  hot?: boolean
  call?: boolean
  tag?: string
  val?: string
  strat?: string
}

interface EvidenceRow {
  ic: string
  k: string
  v: string
  trend?: 'up' | 'down' | 'flat'
  td?: string
}

interface Evidence {
  title: string
  kind: 'rows' | 'price'
  rows?: EvidenceRow[]
  current?: string
  market?: string
  suggested?: string
  draft?: string
}

interface Entities {
  title: string
  list: EntityItem[]
  more?: number
}

interface Outcomes {
  act: { v: string; sub: string }
  dont: { v: string; sub: string }
}

interface CardData {
  id: string
  type: CardType
  priority: Priority
  isError?: boolean
  category?: string
  catTone?: string
  impact: number
  impactWhy: string
  title: string
  desc: string
  potential?: number
  atRisk?: boolean
  potentialLabel?: string
  applyLabel: string
  chips?: Chip[]
  discussSugg?: string[]
  finding: string
  reco?: string
  confidence: number
  evidence?: Evidence
  entities?: Entities
  outcomes?: Outcomes
  history?: string
  workflowLink?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRI: Record<Priority, { label: string }> = {
  high: { label: 'HIGH PRIORITY' },
  med:  { label: 'MEDIUM PRIORITY' },
  low:  { label: 'LOW PRIORITY' },
}

const TYPES: Record<CardType, { badge: string; icon: string; cls: string; short: string; applyIcon: string; tone: string }> = {
  marketing:  { badge: 'Campaign Decision', icon: 'campaign',         cls: 't-marketing',  short: 'campaign',     applyIcon: 'pause_circle',    tone: 'orange' },
  pricing:    { badge: 'Price Update',      icon: 'sell',             cls: 't-pricing',    short: 'price update', applyIcon: 'send',            tone: 'violet' },
  lead:       { badge: 'Qualified Lead',    icon: 'how_to_reg',       cls: 't-lead',       short: 'lead list',    applyIcon: 'call',            tone: 'sky'    },
  automation: { badge: 'Automation',        icon: 'settings_suggest', cls: 't-automation', short: 'automation',   applyIcon: 'build',           tone: 'slate'  },
}

const INITIAL_CARDS: CardData[] = [
  {
    id: 'auto1', type: 'automation', priority: 'high', isError: true, category: 'Automation · Error', catTone: 'red',
    impact: 88, impactWhy: 'The queued fix — retry the step and switch the sender domain — cleared 9 of the last 10 delivery failures like this one.',
    title: '"Proposal Follow-up" automation is failing',
    desc: 'Mail delivery failed on the last 3 triggers — 12 customers have dropped out of the sequence since Tuesday.',
    potential: 19200, atRisk: true, potentialLabel: 'revenue at risk', applyLabel: 'Apply fix',
    chips: [{ icon: 'bolt', label: 'Automation', count: '1', tone: 'red' }, { icon: 'group', label: 'Affected', count: '12', tone: 'slate' }],
    discussSugg: ['What exactly broke?', 'Is the fix safe?'],
    finding: 'Surfaced because a live revenue automation has been silently erroring for 36 hours. Three consecutive triggers failed at the same step, and the affected contacts are mid-funnel — every hour without delivery widens the drop-off.',
    reco: 'Suggested fix is already queued: retry the failed send and switch the sender domain. One approval applies it.',
    confidence: 5,
    evidence: { title: 'What broke', kind: 'rows', rows: [
      { ic: 'error',    k: 'Failing step',    v: 'Send email · "Day 3 nudge"' },
      { ic: 'replay',   k: 'Failed triggers', v: '3 of last 3', trend: 'down', td: '100%' },
      { ic: 'schedule', k: 'Failing since',   v: '36 hours ago' },
    ]},
    entities: { title: 'Affected contacts', list: [
      { init: 'EY', name: 'Emre Yıldız',  sub: 'Stuck at "Day 3 nudge" · 2 days' },
      { init: 'SA', name: 'Selin Acar',   sub: 'Stuck at "Day 3 nudge" · 2 days' },
      { init: 'KT', name: 'Kaan Toprak',  sub: 'Stuck at "Day 3 nudge" · 1 day'  },
    ], more: 9 },
    outcomes: {
      act:  { v: '₺19,200', sub: 'pipeline kept moving — 12 contacts re-enter the sequence' },
      dont: { v: '12 → 0',  sub: 'contacts go cold and new triggers keep failing too' },
    },
    history: 'The last delivery failure in Q1 lost 7 contacts before anyone caught it — the same retry-and-swap fix recovered the sequence within an hour.',
    workflowLink: 'Proposal Follow-up',
  },
  {
    id: 'mkt1', type: 'marketing', priority: 'high',
    impact: 79, impactWhy: 'In comparable campaigns, pausing at this ROAS preserved about 79% of the remaining budget for redeployment.',
    title: 'Beşiktaş campaign budget runs out in 2 days',
    desc: 'CTR fell from 1.2% to 0.4% over 7 days and ROAS is down to 1.2× — spend is burning with almost no return.',
    potential: 24000, atRisk: true, potentialLabel: 'budget at risk', applyLabel: 'Approve pause',
    chips: [{ icon: 'campaign', label: 'Campaign', count: '1', tone: 'orange' }, { icon: 'donut_large', label: 'Segments', count: '2', tone: 'slate' }],
    discussSugg: ['Why pause now?', 'Is there an alternative?'],
    finding: 'Surfaced because daily spend is accelerating while conversions have flattened for 5 days straight. The budget empties in roughly 48 hours, so today is the last window to redirect it before it is gone.',
    reco: 'Pause the budget and redirect the remaining ₺24,000 to the high-intent Kadıköy segment.',
    confidence: 4,
    evidence: { title: 'Campaign metrics — 7-day trend', kind: 'rows', rows: [
      { ic: 'visibility',              k: 'Impressions',    v: '48.2k',      trend: 'up',   td: '18%' },
      { ic: 'ads_click',               k: 'Click-through rate', v: '0.4%',   trend: 'down', td: '67%' },
      { ic: 'shopping_cart_checkout',  k: 'Conversions',   v: '3 this week', trend: 'down', td: '72%' },
    ]},
    entities: { title: 'Affected campaigns', list: [
      { init: 'BŞ', name: 'Beşiktaş Spring Launch', sub: '₺24,000 remaining · ends in 2 days', val: '1.2× ROAS' },
      { init: 'KD', name: 'Kadıköy Retargeting',     sub: 'suggested redirect target', tag: 'TARGET' },
    ]},
    outcomes: {
      act:  { v: '₺24,000', sub: 'remaining budget protected and moved to a converting segment' },
      dont: { v: '₺0',      sub: 'budget fully spent at 1.2× ROAS over the next 48 hours' },
    },
    history: 'A similar pause in March recovered 60% of a stalling campaign\'s budget and lifted blended ROAS to 2.4×.',
  },
  {
    id: 'lead1', type: 'lead', priority: 'med',
    impact: 74, impactWhy: 'Across the three leads, the average historical conversion for this behaviour pattern — repeat views plus a WhatsApp open — is about 74%.',
    title: '3 new qualified leads — call today',
    desc: 'Mehmet Y. viewed the Beşiktaş apartment twice yesterday and opened WhatsApp. The buying window is narrowing.',
    potential: 52000, atRisk: false, potentialLabel: 'potential GCI', applyLabel: 'Start calls',
    chips: [{ icon: 'group', label: 'Leads', count: '3', tone: 'sky' }, { icon: 'local_fire_department', label: 'Hottest', tone: 'red' }],
    discussSugg: ['Who do I call first?', 'Draft an opener'],
    finding: 'Surfaced because three leads crossed the qualified threshold in the last 24 hours, and the strongest just showed buying intent twice. Call-back conversion drops by roughly half after 24 hours, so today is the window.',
    reco: 'Call Mehmet first while intent is hot, then work down the list by score.',
    confidence: 4,
    evidence: { title: 'Preferred contact channel', kind: 'rows', rows: [
      { ic: 'forum', k: 'From historical replies', v: 'WhatsApp — 3× faster than email' },
    ]},
    entities: { title: 'Leads — hottest first', list: [
      { init: 'MY', name: 'Mehmet Yılmaz', score: '92 · HOT',  scoreCls: '',     hot: true, call: true, sub: 'Viewed Beşiktaş apt ×2 · opened WhatsApp · 14h ago', strat: 'Lead with the price advantage — mention you noticed his interest and that a similar unit just sold.' },
      { init: 'Zİ', name: 'Zeynep İnce',   score: '81 · WARM', scoreCls: 'warm', call: true, sub: 'Requested the floor plan · 1 day ago' },
      { init: 'OK', name: 'Onur Kaya',     score: '68 · WARM', scoreCls: 'warm', call: true, sub: 'Used the mortgage calculator · 2 days ago' },
    ]},
    outcomes: {
      act:  { v: '3 calls',       sub: 'queued now while intent is high — tasks created automatically' },
      dont: { v: 'Window closes', sub: 'call-back conversion roughly halves after 24 hours' },
    },
    history: 'Leads called within the day this quarter closed at 2.3× the rate of next-day callbacks.',
  },
  {
    id: 'price1', type: 'pricing', priority: 'low',
    impact: 66, impactWhy: 'Listings re-priced to within 3% of the market closed about 66% faster across this portfolio over the past two quarters.',
    title: '3% discount suggestion for Kadıköy portfolio',
    desc: '2 units have sat unsold for 45 days and competing listings are 3% lower — a small cut should accelerate a close.',
    potential: 38000, atRisk: false, potentialLabel: 'portfolio value', applyLabel: 'Apply & notify',
    chips: [{ icon: 'group', label: 'Customers', count: '8', tone: 'sky' }, { icon: 'sell', label: 'Discount', count: '3%', tone: 'emerald' }],
    discussSugg: ['Why 3%, not 5%?', 'Show the comparables'],
    finding: 'Surfaced because two listings have aged past 45 days while comparable units nearby reduced their asking prices last week. A 3% adjustment closes the gap and gives 8 watching customers a reason to act now.',
    reco: 'Apply the 3% cut and auto-send the notification draft below to the 8 watching customers.',
    confidence: 3,
    evidence: { title: 'Price comparison', kind: 'price', current: '₺1.42M', market: '₺1.38M', suggested: '₺1.38M',
      draft: 'Good news — the Kadıköy unit you saved is now ₺1.38M, a 3% reduction. Would you like to schedule a viewing this week before it moves?' },
    entities: { title: 'Customers to notify', list: [
      { init: 'AD', name: 'Ayşe Demir',   sub: 'Saved this listing · last contact 6 days ago' },
      { init: 'BÇ', name: 'Burak Çelik',  sub: 'Viewed twice · last contact 11 days ago' },
      { init: 'EK', name: 'Elif Korkmaz', sub: 'Inquired in March · last contact 24 days ago' },
    ], more: 5 },
    outcomes: {
      act:  { v: '~9 days',  sub: 'estimated time-to-close · 8 customers notified instantly' },
      dont: { v: '45+ days', sub: 'listings keep aging while nearby prices stay lower' },
    },
    history: 'The last 3% adjustment in this portfolio closed a 50-day-old unit within a week.',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return '₺' + Math.round(n).toLocaleString('en-US')
}

function fmtK(n: number | null | undefined): string {
  if (n == null) return '—'
  const a = Math.abs(n)
  if (a >= 1000) {
    const k = n / 1000
    return '₺' + (a >= 10000 ? Math.round(k) : Math.round(k * 10) / 10) + 'K'
  }
  return '₺' + Math.round(n)
}

function applyToast(d: CardData): string {
  return ({
    marketing:  'Campaign paused · budget redirected',
    pricing:    'Price updated · 8 customers notified',
    lead:       'Calls queued · 3 tasks created',
    automation: 'Fix applied · sequence resumed',
  } as Record<CardType, string>)[d.type] || 'Applied'
}

// ---------------------------------------------------------------------------
// Sub-components (pure markup, no side effects)
// ---------------------------------------------------------------------------

function Tag({ icon, label, count, tone }: Chip) {
  const hasCount = count != null && count !== ''
  return (
    <span className={`pc-tag t-${tone}${hasCount ? '' : ' no-count'}`}>
      <span className="material-symbols-outlined">{icon}</span>
      {label}
      {hasCount && <span className="ct-count">{count}</span>}
    </span>
  )
}

function CatTag({ d }: { d: CardData }) {
  const T = TYPES[d.type]
  const tone = d.catTone || T.tone
  return (
    <span className={`pc-tag pc-cat-tag no-count t-${tone}`}>
      <span className="material-symbols-outlined">{T.icon}</span>
      {d.category || T.badge}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Card left panel
// ---------------------------------------------------------------------------

interface LeftPanelProps {
  d: CardData
  priority: Priority
  whyOpen: boolean
  onToggleWhy: () => void
}

function LeftPanel({ d, priority, whyOpen, onToggleWhy }: LeftPanelProps) {
  const T = TYPES[d.type]

  // Callback ref: runs count-up tween on the impact number element
  const impactRef = useCallback((el: HTMLSpanElement | null) => {
    if (!el) return
    const cleanup = startCountUp(el, 0, d.impact, 700, (v) => String(Math.round(v)))
    ;(el as HTMLSpanElement & { __pcCleanup?: () => void }).__pcCleanup = cleanup
  }, [d.impact])

  // Callback ref: runs count-up tween on the potential number element
  const potRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const cleanup = startCountUp(el, 0, d.potential ?? 0, 760, fmtK)
    ;(el as HTMLDivElement & { __pcCleanup?: () => void }).__pcCleanup = cleanup
  }, [d.potential])

  return (
    <div
      className={`pc-left pri-${priority}${d.isError ? ' is-error' : ''}${whyOpen ? ' why-open' : ''}`}
      onClick={(e) => { e.stopPropagation(); onToggleWhy() }}
    >
      <div className="pc-pri"><span className="pc-pri-dot"></span>{PRI[priority].label}</div>
      <div className="pc-ghost"><span className="material-symbols-outlined">{T.icon}</span></div>
      <div className="pc-mid">
        <div className="pc-stats">
          <div className="pc-stat-cell impact">
            <div className="pc-impact-row">
              <span className="pc-impact-n" ref={impactRef}>0</span>
              <span className="pc-impact-pct">%</span>
            </div>
            <div className={`pc-stat-l toggle${whyOpen ? ' open' : ''}`}>
              Impact score<span className="material-symbols-outlined">expand_more</span>
            </div>
            <div className="pc-bar">
              <div className="pc-bar-fill" style={{ width: d.impact + '%' }}></div>
            </div>
          </div>
          {d.potential != null ? (
            <div className="pc-stat-cell">
              <div className={`pc-stat-n${d.atRisk ? ' at-risk' : ''}`} ref={potRef}>{fmtK(0)}</div>
              <div className="pc-stat-l">{d.potentialLabel || 'potential'}</div>
            </div>
          ) : (
            <div className="pc-stat-cell">
              <div className="pc-stat-n na">—</div>
              <div className="pc-stat-l">{d.potentialLabel || 'potential'}</div>
            </div>
          )}
        </div>
        <div className={`pc-why${whyOpen ? ' open' : ''}`}>
          <div className="pc-why-in">
            <span className="material-symbols-outlined">auto_awesome</span>
            {d.impactWhy}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card right panel
// ---------------------------------------------------------------------------

interface RightPanelProps {
  d: CardData
  discussOpen: boolean
  snoozeOpen: boolean
  onOpenDetail: () => void
  onToggleDiscuss: () => void
  onToggleSnooze: () => void
  onSnoozeItem: (action: 'tomorrow' | 'low') => void
  onApply: (e: React.MouseEvent, btn: HTMLElement) => void
  onSendDiscuss: (msg: string) => void
  onShowToast: (msg: string) => void
}

function RightPanel({
  d, discussOpen, snoozeOpen,
  onOpenDetail, onToggleDiscuss, onToggleSnooze, onSnoozeItem,
  onApply, onSendDiscuss, onShowToast,
}: RightPanelProps) {
  const T = TYPES[d.type]
  const applyRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div
      className="pc-right"
      onClick={(e) => {
        if ((e.target as Element).closest('button, input, a, .pc-pop, .pc-discuss')) return
        onOpenDetail()
      }}
    >
      {/* Header row */}
      <div className="pc-r-head">
        <CatTag d={d} />
        <div className="pc-head-tools">
          <div className="pc-snooze-wrap">
            <button
              className={`pc-snooze${snoozeOpen ? ' open' : ''}`}
              aria-haspopup="menu"
              aria-label="Snooze options"
              onClick={(e) => { e.stopPropagation(); onToggleSnooze() }}
            >
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
            <div className={`pc-pop${snoozeOpen ? ' open' : ''}`} role="menu">
              <button className="pc-pop-item" role="menuitem" onClick={(e) => { e.stopPropagation(); onSnoozeItem('tomorrow') }}>
                <span className="material-symbols-outlined">bedtime</span>Snooze to tomorrow
              </button>
              <button className="pc-pop-item" role="menuitem" onClick={(e) => { e.stopPropagation(); onSnoozeItem('low') }}>
                <span className="material-symbols-outlined">south</span>Lower priority
              </button>
            </div>
          </div>
          <button className="pc-expand" aria-label="Open details" aria-haspopup="dialog" onClick={(e) => { e.stopPropagation(); onOpenDetail() }}>
            <span className="material-symbols-outlined">open_in_full</span>
          </button>
        </div>
      </div>

      {/* Body text */}
      <div className="pc-body-txt">
        <div className="pc-title">{d.title}</div>
        <div className="pc-desc">{d.desc}</div>
        <div className="pc-chips">{(d.chips || []).map((c, i) => <Tag key={i} {...c} />)}</div>
      </div>

      {/* Inline discuss */}
      <div className={`pc-discuss${discussOpen ? ' open' : ''}`}>
        <div className="pc-discuss-in">
          <div className="pc-discuss-ctx">
            <span className="pc-ai-orb"><span className="material-symbols-outlined">auto_awesome</span></span>
            <span>I&apos;ve loaded everything about this {T.short} — ask before you decide.</span>
          </div>
          <div className="pc-discuss-sugg">
            {(d.discussSugg || []).map((s, i) => (
              <button key={i} className="pc-sugg" onClick={(e) => { e.stopPropagation(); onShowToast('Thinking that through…') }}>
                {s}
              </button>
            ))}
          </div>
          <div className="pc-discuss-input">
            <input
              ref={inputRef}
              placeholder="Ask about this card…"
              aria-label="Ask about this card"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="pc-discuss-send"
              aria-label="Send"
              onClick={(e) => {
                e.stopPropagation()
                const val = inputRef.current?.value.trim() || ''
                if (val) { onSendDiscuss(val); if (inputRef.current) inputRef.current.value = '' }
              }}
            >
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="pc-foot">
        <div className="pc-actions">
          <button
            className={`pc-discuss-btn${discussOpen ? ' open' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleDiscuss()
              if (!discussOpen) setTimeout(() => inputRef.current?.focus(), 140)
            }}
          >
            <span className="material-symbols-outlined">forum</span>Discuss
          </button>
          <button
            ref={applyRef}
            className="pc-apply"
            onClick={(e) => { e.stopPropagation(); if (applyRef.current) onApply(e, applyRef.current) }}
          >
            <span className="pc-apply-label">
              <span className="material-symbols-outlined">{T.applyIcon}</span>
              {d.applyLabel}
            </span>
            <span className="pc-spin"></span>
            <span className="pc-check"><span className="material-symbols-outlined">check</span></span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail overlay sub-blocks
// ---------------------------------------------------------------------------

function EvidenceBlock({ evidence }: { evidence: Evidence }) {
  let inner: React.ReactNode = null
  if (evidence.kind === 'rows' && evidence.rows) {
    inner = (
      <div className="pcx-ev-rows">
        {evidence.rows.map((r, i) => (
          <div key={i} className="pcx-ev-row">
            <span className="pcx-ev-ic"><span className="material-symbols-outlined">{r.ic}</span></span>
            <div className="pcx-ev-txt">
              <div className="pcx-ev-k">{r.k}</div>
              <div className="pcx-ev-v">{r.v}</div>
            </div>
            {r.trend && (
              <span className={`pcx-trend ${r.trend}`}>
                <span className="material-symbols-outlined">
                  {r.trend === 'up' ? 'trending_up' : r.trend === 'down' ? 'trending_down' : 'trending_flat'}
                </span>
                {r.td || ''}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  } else if (evidence.kind === 'price') {
    inner = (
      <div className="pcx-price">
        <div className="pcx-price-cell"><div className="pcx-price-l">Current</div><div className="pcx-price-v">{evidence.current}</div></div>
        <div className="pcx-price-cell"><div className="pcx-price-l">Market avg</div><div className="pcx-price-v">{evidence.market}</div></div>
        <div className="pcx-price-cell sug"><div className="pcx-price-l">Suggested</div><div className="pcx-price-v">{evidence.suggested}</div></div>
      </div>
    )
  }

  return (
    <div className="pcx-block">
      <p className="pcx-sec-title">{evidence.title}</p>
      {inner}
      {evidence.draft && (
        <div className="pcx-draft" style={{ marginTop: '10px' }}>
          <div className="pcx-draft-head"><span className="material-symbols-outlined">edit_note</span>AI-drafted notification</div>
          <div className="pcx-draft-body">{evidence.draft}</div>
          <div className="pcx-draft-foot"><span className="material-symbols-outlined">lock</span>Sent only after you approve</div>
        </div>
      )}
    </div>
  )
}

function EntitiesBlock({ entities, onToast }: { entities: Entities; onToast: (msg: string) => void }) {
  return (
    <div className="pcx-block">
      <p className="pcx-sec-title">{entities.title}</p>
      <div className="pcx-ent">
        {entities.list.map((p, i) => (
          <div key={i} className="pcx-ent-row">
            <span className={`pcx-ent-av${p.hot ? ' hot' : ''}`}>{p.init}</span>
            <div className="pcx-ent-main">
              <div className="pcx-ent-name">
                {p.name}
                {p.score && <span className={`pcx-ent-score ${p.scoreCls || ''}`}>{p.score}</span>}
                {p.tag && <span className="pcx-ent-score cool">{p.tag}</span>}
              </div>
              <div className="pcx-ent-sub">{p.sub}</div>
              {p.strat && (
                <div className="pcx-strat">
                  <span className="material-symbols-outlined">campaign</span>
                  <span>{p.strat}</span>
                </div>
              )}
            </div>
            {p.val && <span className="pcx-ent-val">{p.val}</span>}
            {p.call && (
              <button
                className="pcx-ent-call"
                aria-label={`Call ${p.name}`}
                onClick={(e) => { e.stopPropagation(); onToast('Calling ' + p.name + '…') }}
              >
                <span className="material-symbols-outlined">call</span>
              </button>
            )}
          </div>
        ))}
      </div>
      {entities.more && (
        <button
          className="pcx-ghost-link"
          style={{ marginTop: '8px' }}
          onClick={(e) => { e.stopPropagation(); onToast('Showing all affected') }}
        >
          <span className="material-symbols-outlined">expand_more</span>
          +{entities.more} more
        </button>
      )}
    </div>
  )
}

function OutcomesBlock({ outcomes }: { outcomes: Outcomes }) {
  return (
    <div className="pcx-block">
      <p className="pcx-sec-title">Expected outcome</p>
      <div className="pcx-outcomes">
        <div className="pcx-out dont">
          <div className="pcx-out-in">
            <div className="pcx-out-ic"><span className="material-symbols-outlined">close</span></div>
            <div className="pcx-out-head">If you don&apos;t</div>
            <div className="pcx-out-v">{outcomes.dont.v}</div>
            <div className="pcx-out-sub">{outcomes.dont.sub}</div>
          </div>
        </div>
        <div className="pcx-out act">
          <div className="pcx-out-in">
            <div className="pcx-out-ic"><span className="material-symbols-outlined">check</span></div>
            <div className="pcx-out-head">If you apply</div>
            <div className="pcx-out-v">{outcomes.act.v}</div>
            <div className="pcx-out-sub">{outcomes.act.sub}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AskBlock({ d }: { d: CardData }) {
  const T = TYPES[d.type]
  const askPromptRef = useRef<HTMLDivElement | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)
  const [asked, setAsked] = useState(false)

  function handleAskOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (chatRef.current) {
      mountAiChat(chatRef.current, {
        typeShort: T.short,
        finding: d.finding,
        reco: d.reco,
        confidence: d.confidence,
      })
      setAsked(true)
    }
  }

  return (
    <div className="pcx-block pcx-ask">
      <div className={`pcx-ask-prompt${asked ? ' asked' : ''}`} ref={askPromptRef}>
        <div className="pcx-ask-q">
          <div className="pcx-ask-label">AI insight</div>
          <div className="pcx-ask-question">Why did the AI surface this {T.short}?</div>
        </div>
        <button className="pcx-ask-btn" onClick={handleAskOpen}>
          Ask AI<span className="material-symbols-outlined">keyboard_arrow_down</span>
        </button>
      </div>
      <div className="pcx-chat" ref={chatRef}></div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail overlay (inverted popover)
// ---------------------------------------------------------------------------

interface DetailOverlayProps {
  d: CardData | null
  onClose: () => void
  onApply: (e: React.MouseEvent, btn: HTMLElement, done: () => void) => void
  onToast: (msg: string) => void
  onRemoveCard: (id: string) => void
}

function DetailOverlay({ d, onClose, onApply, onToast, onRemoveCard }: DetailOverlayProps) {
  const [impactOpen, setImpactOpen] = useState(false)
  const xApplyRef = useRef<HTMLButtonElement | null>(null)

  if (!d) return null

  const headCls = d.priority === 'med' ? 'pri-med' : d.priority === 'low' ? 'pri-low' : ''
  const T = TYPES[d.type]

  function handleSecAction(sec: string) {
    const m: Record<string, string> = {
      wf:     'Opening automation editor…',
      snooze: 'Snoozed to tomorrow',
      assign: 'Assign to teammate…',
      about:  'About this card type',
    }
    onToast(m[sec] || 'Done')
    if (sec === 'snooze' && d) { onClose(); setTimeout(() => onRemoveCard(d.id), 280) }
  }

  return (
    <div
      className="pcx-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="pcx-outer">
        <div className="pcx-card" onClick={(e) => e.stopPropagation()}>
          {/* Sticky inverted header */}
          <div className={`pcx-head ${headCls}`}>
            <div className="pcx-head-top">
              <div className="pcx-head-meta">
                <CatTag d={d} />
                <span className="pc-pri pcx-pri">
                  <span className="pc-pri-dot"></span>{PRI[d.priority].label}
                </span>
              </div>
              <button className="pcx-close" aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose() }}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="pcx-head-title">{d.title}</div>
            <div className="pcx-head-desc">{d.desc}</div>
            <div className="pcx-head-statsrow">
              <div className="pcx-head-stats">
                <div
                  className={`pcx-hstat pcx-imp${impactOpen ? ' open' : ''}`}
                  aria-expanded={impactOpen}
                  onClick={(e) => { e.stopPropagation(); setImpactOpen((v) => !v) }}
                >
                  <div className="pcx-hstat-n">{d.impact}<span className="pcx-hstat-pct">%</span></div>
                  <div className="pcx-hstat-l">Impact score<span className="material-symbols-outlined pcx-impact-chev">expand_more</span></div>
                </div>
                <div className="pcx-hstat-div"></div>
                <div className="pcx-hstat">
                  <div className="pcx-hstat-n">{d.potential == null ? '—' : fmt(d.potential)}</div>
                  <div className="pcx-hstat-l">{d.potentialLabel || 'potential'}</div>
                </div>
              </div>
              <div className="pcx-head-actions">
                <button
                  className="pc-discuss-btn"
                  onClick={(e) => { e.stopPropagation(); onToast('Context chat loaded for this ' + T.short) }}
                >
                  <span className="material-symbols-outlined">forum</span>Discuss
                </button>
                <button
                  ref={xApplyRef}
                  className="pc-apply"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (xApplyRef.current) {
                      onApply(e, xApplyRef.current, () => {
                        onClose()
                        setTimeout(() => onRemoveCard(d.id), 280)
                      })
                    }
                  }}
                >
                  <span className="pc-apply-label">
                    <span className="material-symbols-outlined">{T.applyIcon}</span>
                    {d.applyLabel}
                  </span>
                  <span className="pc-spin"></span>
                  <span className="pc-check"><span className="material-symbols-outlined">check</span></span>
                </button>
              </div>
            </div>
            {d.impactWhy && (
              <div className={`pcx-head-why${impactOpen ? ' open' : ''}`}>
                <div className="pcx-head-why-in">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  {d.impactWhy}
                </div>
              </div>
            )}
          </div>

          {/* Scrollable body */}
          <div className="pcx-body">
            <AskBlock d={d} />
            {d.evidence && <EvidenceBlock evidence={d.evidence} />}
            {d.outcomes && <OutcomesBlock outcomes={d.outcomes} />}
            {d.entities && <EntitiesBlock entities={d.entities} onToast={onToast} />}
            {d.history && (
              <div className="pcx-block">
                <p className="pcx-sec-title">Related history</p>
                <div className="pcx-hist">
                  <span className="material-symbols-outlined">history</span>
                  <p className="pcx-hist-p">{d.history}</p>
                </div>
              </div>
            )}
            {/* Secondary footer actions */}
            <div className="pcx-secondary">
              {d.workflowLink && (
                <button className="pcx-ghost-link" onClick={(e) => { e.stopPropagation(); handleSecAction('wf') }}>
                  <span className="material-symbols-outlined">open_in_new</span>
                  Open &ldquo;{d.workflowLink}&rdquo; editor
                </button>
              )}
              <button className="pcx-ghost-link" onClick={(e) => { e.stopPropagation(); handleSecAction('snooze') }}>
                <span className="material-symbols-outlined">bedtime</span>Snooze (tomorrow)
              </button>
              <button className="pcx-ghost-link" onClick={(e) => { e.stopPropagation(); handleSecAction('assign') }}>
                <span className="material-symbols-outlined">person_add</span>Assign to someone
              </button>
              <button className="pcx-ghost-link" onClick={(e) => { e.stopPropagation(); handleSecAction('about') }}>
                <span className="material-symbols-outlined">help</span>About this card type
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div className={`pc-toast${visible ? ' show' : ''}`}>
      <span className="material-symbols-outlined">check_circle</span>
      <span>{msg}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  const bars = [5, 3, 7, 4, 6, 2, 4]
  return (
    <div className="shell">
      <div style={{
        background: 'var(--r-bg,#fff)', borderRadius: '24px', padding: '34px 26px', textAlign: 'center',
        fontFamily: "'Montserrat'", boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      }}>
        <div style={{
          width: '54px', height: '54px', borderRadius: '16px', margin: '0 auto 14px',
          display: 'grid', placeItems: 'center', color: '#fff',
          background: 'linear-gradient(150deg,#34D399,#10B981)',
          boxShadow: '0 8px 22px rgba(16,185,129,0.34),inset 0 1px 0 rgba(255,255,255,0.5)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>task_alt</span>
        </div>
        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>No actions for today</div>
        <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748B', marginTop: '5px', lineHeight: 1.5 }}>
          Your pipeline looks healthy. The briefing refills overnight.
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '5px', height: '38px', marginTop: '18px' }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              width: '13px', borderRadius: '4px 4px 2px 2px',
              height: h * 5 + 6 + 'px',
              background: i === 6 ? '#10B981' : '#CBD5E1',
            }}></div>
          ))}
        </div>
        <div style={{ fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94A3B8', marginTop: '8px' }}>
          Cards handled this week
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BriefingCard — single card in the stack
// ---------------------------------------------------------------------------

interface BriefingCardProps {
  d: CardData
  onOpenDetail: (d: CardData) => void
  onRemove: (id: string) => void
  onDemote: (id: string) => void
  onToast: (msg: string) => void
}

function BriefingCard({ d, onOpenDetail, onRemove, onDemote, onToast }: BriefingCardProps) {
  const [priority, setPriority] = useState<Priority>(d.priority)
  const [whyOpen, setWhyOpen] = useState(false)
  const [discussOpen, setDiscussOpen] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement | null>(null)

  function handleSnoozeItem(action: 'tomorrow' | 'low') {
    setSnoozeOpen(false)
    if (action === 'low') {
      const order: Priority[] = ['high', 'med', 'low']
      const i = order.indexOf(priority)
      if (i >= 0 && i < order.length - 1) {
        const next = order[i + 1]
        setPriority(next)
        onToast('Priority lowered to ' + PRI[next].label.replace(' PRIORITY', ''))
      }
      onDemote(d.id)
    } else {
      onToast('Snoozed to tomorrow')
      if (shellRef.current) {
        animateRemove(shellRef.current, () => onRemove(d.id))
      }
    }
  }

  function handleApply(e: React.MouseEvent, btn: HTMLElement) {
    spawnRipple(e, btn)
    runApply(btn, () => {
      onToast(applyToast(d))
      if (shellRef.current) {
        animateRemove(shellRef.current, () => onRemove(d.id))
      }
    })
  }

  // Close snooze on outside click
  function handleRootClick() {
    if (snoozeOpen) setSnoozeOpen(false)
  }

  return (
    <div className="shell" data-id={d.id} ref={shellRef} onClick={handleRootClick}>
      <div className="pc">
        <LeftPanel
          d={d}
          priority={priority}
          whyOpen={whyOpen}
          onToggleWhy={() => setWhyOpen((v) => !v)}
        />
        <RightPanel
          d={d}
          discussOpen={discussOpen}
          snoozeOpen={snoozeOpen}
          onOpenDetail={() => onOpenDetail(d)}
          onToggleDiscuss={() => setDiscussOpen((v) => !v)}
          onToggleSnooze={() => setSnoozeOpen((v) => !v)}
          onSnoozeItem={handleSnoozeItem}
          onApply={handleApply}
          onSendDiscuss={(msg) => { onToast('Sent to AI assistant'); void msg }}
          onShowToast={onToast}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function PipelineCard() {
  const [cards, setCards] = useState<CardData[]>(INITIAL_CARDS)
  const [detailCard, setDetailCard] = useState<CardData | null>(null)
  const [toast, setToast] = useState({ msg: 'Done', visible: false })
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Header stats
  const total = cards.reduce((a, x) => a + (x.potential || 0), 0)
  const critCount = cards.filter((x) => x.priority === 'high').length
  const n = cards.length

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ msg, visible: true })
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 1800)
  }

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  function handleApplyInDetail(e: React.MouseEvent, btn: HTMLElement, done: () => void) {
    spawnRipple(e, btn)
    const activeCard = detailCard
    if (!activeCard) return
    runApply(btn, () => {
      showToast(applyToast(activeCard))
      done()
    })
  }

  // Close snooze pops + detail on global click/escape
  // We implement escape key via an event on the root wrapper
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (detailCard) setDetailCard(null)
    }
  }

  return (
    <div className="card" style={{ padding: 0 }} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="frame">
        {/* Daily summary header */}
        <div className="brief-head">
          <span className="brief-sun"><span className="material-symbols-outlined">wb_twilight</span></span>
          <div className="brief-head-txt">
            <span className="brief-eyebrow">Good morning · Tue 3 Jun</span>
            <span className="brief-title">Your daily briefing</span>
          </div>
          <div className="brief-stats">
            <button className="brief-stat" onClick={() => showToast('Showing all actions')}>
              <span className="brief-stat-n">{n}</span>
              <span className="brief-stat-l">{n === 1 ? 'action' : 'actions'}</span>
            </button>
            <button className="brief-stat" onClick={() => showToast('Sorting by potential value')}>
              <span className="brief-stat-n">{fmt(total)}</span>
              <span className="brief-stat-l">in play</span>
            </button>
            <button className="brief-stat" onClick={() => showToast('Filtering to critical actions')}>
              <span className="brief-stat-n crit">{critCount}</span>
              <span className="brief-stat-l">critical</span>
            </button>
          </div>
        </div>

        <p className="sec">AI-ranked — most critical action first</p>

        <div className="stack">
          {cards.length === 0 ? (
            <EmptyState />
          ) : (
            cards.map((d) => (
              <BriefingCard
                key={d.id}
                d={d}
                onOpenDetail={setDetailCard}
                onRemove={removeCard}
                onDemote={() => {/* priority is local to BriefingCard */}}
                onToast={showToast}
              />
            ))
          )}
        </div>
      </div>

      {/* Inverted detail popover */}
      {detailCard && (
        <DetailOverlay
          d={detailCard}
          onClose={() => setDetailCard(null)}
          onApply={handleApplyInDetail}
          onToast={showToast}
          onRemoveCard={(id) => { setDetailCard(null); removeCard(id) }}
        />
      )}

      {/* Toast */}
      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  )
}
