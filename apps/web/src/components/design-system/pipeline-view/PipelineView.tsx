import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './PipelineView.css'

import { useCallback, useState } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { pvRootRef } from './pipeline-view-hook'

/* =========================================================================
   Deha Design System — Pipeline View
   Vertical pipeline summary styled as an iOS grouped inset list mapped to
   Deha tokens. One inset rounded card holds six stage rows separated by
   hairline dividers. Each row: stage color dot, name (Montserrat), right-
   aligned deal count + total value (Turkish lira, tabular), a conversion
   percent from the previous stage, and an up/down weekly trend indicator.
   Terminal "Lost" row reads muted (desaturated slate) with a red trend.
   Structure carries `--i` per row so step 2 can add CSS-only stagger.
   No framer-motion. Fully static — zero effect hooks of any kind.
   Stage palette reused from funnel-chart. Emerald == #10B981.
   ========================================================================= */

/* ── Types ────────────────────────────────────────────────────────────────── */
interface PipelineStage {
  key: string
  /** Stage name, rendered in Montserrat. */
  label: string
  /** Palette dot color (funnel-chart stage palette). */
  color: string
  /** Deal count in this stage. */
  count: number
  /** Pre-formatted total pipeline value, Turkish lira compact. */
  value: string
  /** Conversion % from the previous stage; null for the top of funnel. */
  convFromPrev: number | null
  /** Label of the previous stage for the conversion caption. */
  prevLabel: string | null
  /** Weekly trend direction. */
  trendDir: 'up' | 'down'
  /** Weekly trend magnitude, e.g. '4.6%'. */
  trendPct: string
  /** Average number of days deals sit in this stage. */
  avgDays: number
  /** Terminal desaturated row (Lost). */
  muted?: boolean
}

/* ── Demo data — real-estate funnel ───────────────────────────────────────────
   Counts form a plausible funnel; conversion percents are consistent with the
   adjacent counts (Qualified 312/486=64%, Proposal 174/312=56%,
   Negotiation 88/174=51%, Won 43/88=49%). Lost is the terminal leakage row. */
const DEMO_STAGES: readonly PipelineStage[] = [
  { key: 'new',    label: 'New Leads',   color: '#3B82F6', count: 486, value: '₺1.94B', convFromPrev: null, prevLabel: null,          trendDir: 'up',   trendPct: '8.2%', avgDays: 3 },
  { key: 'qual',   label: 'Qualified',   color: '#F97316', count: 312, value: '₺1.28B', convFromPrev: 64,   prevLabel: 'New Leads',   trendDir: 'up',   trendPct: '4.6%', avgDays: 6 },
  { key: 'prop',   label: 'Proposal',    color: '#EF4444', count: 174, value: '₺742M',  convFromPrev: 56,   prevLabel: 'Qualified',   trendDir: 'up',   trendPct: '2.1%', avgDays: 9 },
  { key: 'nego',   label: 'Negotiation', color: '#8B5CF6', count: 88,  value: '₺418M',  convFromPrev: 51,   prevLabel: 'Proposal',    trendDir: 'down', trendPct: '1.4%', avgDays: 14 },
  { key: 'won',    label: 'Won',         color: '#10B981', count: 43,  value: '₺214M',  convFromPrev: 49,   prevLabel: 'Negotiation', trendDir: 'up',   trendPct: '6.7%', avgDays: 22 },
  { key: 'lost',   label: 'Lost',        color: '#64748B', count: 45,  value: '₺198M',  convFromPrev: null, prevLabel: null,          trendDir: 'down', trendPct: '3.1%', avgDays: 11, muted: true },
] as const

/* ── Stat deep-dive popover ───────────────────────────────────────────────────
   Always mounted; open/closed is a pure state class (.is-open) toggling
   visibility/opacity/transform per the popover lessons — never conditional
   unmount, never display:none. Pure numbers, no named deals. */
function StagePopover({ stage, isOpen }: { stage: PipelineStage; isOpen: boolean }) {
  const trendSign = stage.trendDir === 'up' ? '+' : '−'
  const convText =
    stage.convFromPrev != null && stage.prevLabel
      ? `${stage.convFromPrev}% from ${stage.prevLabel}`
      : stage.muted
        ? 'Terminal stage'
        : 'Top of funnel'
  return (
    <div
      className={`pv-pop${isOpen ? ' is-open' : ''}${stage.muted ? ' pv-pop--muted' : ''}`}
      style={{ '--pv-stage': stage.color } as React.CSSProperties}
      aria-hidden={isOpen ? undefined : true}
    >
      <div className="pv-pop-head">
        <span className="pv-pop-dot" aria-hidden="true" />
        <span className="pv-pop-title">{stage.label}</span>
      </div>
      <div className="pv-pop-grid">
        <div className="pv-pop-stat">
          <span className="pv-pop-k">Total value</span>
          <span className="pv-pop-v">{stage.value}</span>
        </div>
        <div className="pv-pop-stat">
          <span className="pv-pop-k">Conversion</span>
          <span className="pv-pop-v">{convText}</span>
        </div>
        <div className="pv-pop-stat">
          <span className="pv-pop-k">Avg days in stage</span>
          <span className="pv-pop-v">{stage.avgDays}d</span>
        </div>
        <div className="pv-pop-stat">
          <span className="pv-pop-k">Weekly trend</span>
          <span className={`pv-pop-v pv-pop-trend--${stage.trendDir}`}>
            {trendSign}
            {stage.trendPct}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Row ──────────────────────────────────────────────────────────────────── */
function PipelineRow({
  stage,
  index,
  isOpen,
  onToggle,
}: {
  stage: PipelineStage
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  const trendIcon = stage.trendDir === 'up' ? 'trending_up' : 'trending_down'
  return (
    <button
      type="button"
      className={`pv-row${stage.muted ? ' pv-row--muted' : ''}${isOpen ? ' is-open' : ''}`}
      style={{ '--i': index, '--pv-stage': stage.color } as React.CSSProperties}
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span className="pv-dot" aria-hidden="true" />
      <span className="pv-label">
        <span className="pv-name">{stage.label}</span>
        <span className="pv-conv">
          {stage.convFromPrev != null && stage.prevLabel ? (
            <>
              <span className="pv-conv-pct">{stage.convFromPrev}%</span>
              {` from ${stage.prevLabel}`}
            </>
          ) : stage.muted ? (
            'Closed lost this cycle'
          ) : (
            'Top of funnel'
          )}
        </span>
      </span>
      <span className="pv-right">
        <span className="pv-value">
          <span className="pv-count">{stage.count}</span>
          <span className="pv-sep" aria-hidden="true">·</span>
          <span className="pv-money">{stage.value}</span>
        </span>
        <span
          className={`pv-trend pv-trend--${stage.trendDir}${stage.muted ? ' pv-trend--muted' : ''}`}
        >
          <span className={`pv-trend-ic ${iconClass(trendIcon)}`} aria-hidden="true">
            {trendIcon}
          </span>
          {stage.trendDir === 'up' ? '+' : '−'}
          {stage.trendPct}
        </span>
      </span>
    </button>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function PipelineView() {
  // Only one popover open at a time; null == all closed.
  const [openKey, setOpenKey] = useState<string | null>(null)

  // Callback ref (React 19 cleanup form) — wires outside-click / Escape
  // dismissal via the hook. setOpenKey is stable, so [] deps are correct and
  // the listener mounts once and unwires on unmount. No useEffect.
  const rootRef = useCallback(
    (el: HTMLElement | null): (() => void) | void =>
      el ? pvRootRef(el, () => setOpenKey(null)) : undefined,
    [],
  )

  return (
    <div className="pipeline-view" ref={rootRef}>
      <div className="pv-shell">
        <div className="pv-group-header">Pipeline</div>
        <div className="pv-inset" role="list">
          {DEMO_STAGES.map((stage, i) => {
            const isOpen = openKey === stage.key
            return (
              <div
                role="listitem"
                key={stage.key}
                className={`pv-item${isOpen ? ' is-open' : ''}`}
              >
                <PipelineRow
                  stage={stage}
                  index={i}
                  isOpen={isOpen}
                  onToggle={() =>
                    setOpenKey((prev) => (prev === stage.key ? null : stage.key))
                  }
                />
                <StagePopover stage={stage} isOpen={isOpen} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
