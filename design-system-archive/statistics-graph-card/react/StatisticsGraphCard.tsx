import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './StatisticsGraphCard.css'

import { useState } from 'react'
import {
  type SgCardData,
  sgcCardRef,
  sgcCleanup,
  sgcDocumentClickRef,
  sgcDocumentClickCleanup,
} from './statistics-graph-card-hook'

// ---------------------------------------------------------------------------
// Data — verbatim from prototype CARDS array
// ---------------------------------------------------------------------------

const CARDS: SgCardData[] = [
  {
    stage: 'good',
    use: 'Sales CRM',
    initials: 'AC',
    name: 'Acme Corp',
    sub: 'Enterprise SaaS · Negotiation',
    vlabel: 'Deal value',
    value: 82384,
    unit: '$',
    dir: 'up',
    delta: '+6.2%',
    period: 'this week',
    likeLabel: 'Win likelihood',
    like: 74,
    cta: 'Advance deal',
    ctaIcon: 'arrow_forward',
  },
  {
    stage: 'risk',
    use: 'Sales CRM',
    initials: 'NS',
    name: 'Northstar Inc',
    sub: 'Mid-market Fintech · Qualified',
    vlabel: 'Deal value',
    value: 24800,
    unit: '$',
    dir: 'down',
    delta: '−9.4%',
    period: 'this week',
    likeLabel: 'Win likelihood',
    like: 21,
    cta: 'Re-engage',
    ctaIcon: 'send',
  },
  {
    stage: 'warn',
    icon: 'home',
    use: 'Real estate',
    name: '1242 Oak Street',
    sub: '58 days on market · Cedar Park',
    vlabel: 'List price',
    value: 589000,
    unit: '$',
    dir: 'down',
    delta: '−4.2%',
    period: 'price cut',
    likeLabel: 'Sale likelihood',
    like: 43,
    cta: 'Reprice',
    ctaIcon: 'sell',
  },
  {
    stage: 'good',
    icon: 'autorenew',
    use: 'SaaS renewal',
    name: 'Northwind Co.',
    sub: 'Annual plan · Renews in 30d',
    vlabel: 'Contract value',
    value: 48000,
    unit: '$',
    dir: 'up',
    delta: '+8.0%',
    period: 'usage MoM',
    likeLabel: 'Renewal likelihood',
    like: 86,
    cta: 'Send renewal',
    ctaIcon: 'outgoing_mail',
  },
]

// Caption copy — verbatim from prototype
const CAPS: string[] = [
  '<b>Sales CRM</b> — value rising, win likelihood high. All three signals agree.',
  '<b>The fix</b> — falling trend now reads with a <b>low</b> win likelihood (no contradiction).',
  '<b>Real estate</b> — a repriced listing. Same card; "value" = list price, "likelihood" = sale odds.',
  '<b>SaaS</b> — "likelihood" becomes renewal odds; usage up, renewal near-certain.',
]

// ---------------------------------------------------------------------------
// CardItem — one sg-card + caption
// ---------------------------------------------------------------------------

interface CardItemProps {
  data: SgCardData
  cap: string
}

function CardItem({ data, cap }: CardItemProps) {
  // We keep a stable copy of the data object per card so the hook can mutate _series etc.
  const [d] = useState<SgCardData>(() => ({ ...data }))

  const avatarInner = d.icon
    ? <span className="material-symbols-outlined">{d.icon}</span>
    : <>{d.initials}</>

  return (
    <div>
      <div className="shell zoom">
        <div
          className={`sg-card lift acc-${d.stage}`}
          tabIndex={0}
          role="button"
          aria-label={`Open detail for ${d.name}`}
          ref={(el) => {
            if (el) {
              sgcCardRef(el, d)
            } else {
              // el is null on unmount — cleanup is called via the cleanup ref below
            }
          }}
        >
          {/* chart layer */}
          <div className="sg-chart" />
          <div className="sg-dot" />
          <div className="sg-flash" />

          {/* content layer */}
          <div className="sg-inner">
            <div className="sg-head">
              <div className="sg-id">
                <div className="sg-avatar">{avatarInner}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="sg-name">{d.name}</div>
                  <div className="sg-sub">{d.sub}</div>
                </div>
              </div>
              <button className="sg-sync" data-sync aria-label="Sync data">
                <span className="material-symbols-outlined">sync</span>
                <span className="sg-upd">2h ago</span>
              </button>
            </div>

            <div className="sg-spacer" />

            <div className="sg-vlabel">
              {d.vlabel}
              <button className="sg-rangechip" data-rangechip aria-label="Change trend range">
                Monthly
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
            <div className="sg-value" data-value />

            <div className="sg-sub2">
              <span className="sg-delta-pill" />
              <span className="sg-period" />
            </div>

            <div className="sg-meter">
              <div className="sg-meter-top">
                <span className="sg-meter-label">{d.likeLabel}</span>
                <span className="sg-meter-val">0%</span>
              </div>
              <div className="sg-meter-track">
                <div className="sg-meter-fill" />
              </div>
            </div>

            <div className="sg-actions">
              <button className="sg-cta" data-cta>
                <span className="material-symbols-outlined">insights</span>
                Get Optimization Report
              </button>
            </div>
          </div>

          {/* scrim + range popup */}
          <div className="sg-scrim" data-scrim />
          <div className="sg-rangepop" data-rangepop>
            <div className="sg-poplabel">
              <span className="material-symbols-outlined">timeline</span>
              Trend range
            </div>
            <div className="seg vert" role="group" aria-label="Trend range">
              <span className="seg-pill" />
              <button type="button" data-r="Today">
                <span className="material-symbols-outlined">today</span>Today
              </button>
              <button type="button" data-r="Weekly">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                  <rect x="1.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                  <path d="M1.5 7.5h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M5.5 1.5v4M12.5 1.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <text x="9" y="14.5" textAnchor="middle" fill="currentColor" fontSize="5.8" fontWeight="900" fontFamily="Montserrat,sans-serif">7</text>
                </svg>
                Weekly
              </button>
              <button type="button" className="active" data-r="Monthly">
                <span className="material-symbols-outlined">calendar_month</span>Monthly
              </button>
              <button type="button" data-r="Quarterly">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.3"/>
                  <path d="M9 1.5A7.5 7.5 0 0 1 16.5 9L13.5 9A4.5 4.5 0 0 0 9 4.5Z" fill="currentColor"/>
                  <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.3"/>
                </svg>
                Quarterly
              </button>
              <button type="button" data-r="Yearly">
                <span className="material-symbols-outlined">event_repeat</span>Yearly
              </button>
            </div>
            <div className="sg-poploader" data-poploader />
          </div>
        </div>
      </div>
      {/* eslint-disable-next-line react/no-danger */}
      <p className="sgc-cap" dangerouslySetInnerHTML={{ __html: cap }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StatisticsGraphCard() {
  return (
    <div
      ref={(el) => {
        if (el) sgcDocumentClickRef(el)
        else sgcDocumentClickCleanup(el)
      }}
    >
      <div className="sgc-frame">
        <p className="sgc-sec">Outcome card — the metric card, evolved</p>
        <p className="sgc-sec-sub">
          A value, its 30-day trend, and the likelihood of the outcome. One component across CRM use cases — the trend
          line and the likelihood always agree.
        </p>
        <div className="sgc-grid">
          {CARDS.map((card, i) => (
            <CardItem key={card.name} data={card} cap={CAPS[i] ?? ''} />
          ))}
        </div>
      </div>

      {/* toast — singleton rendered once, shared across all cards */}
      <div className="sgc-toast" role="status" aria-live="polite">
        <span className="material-symbols-outlined">check_circle</span>
        <span id="sgcToastMsg">Done</span>
      </div>
    </div>
  )
}
