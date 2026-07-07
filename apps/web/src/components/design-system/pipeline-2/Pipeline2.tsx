import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Pipeline2.css'

import { useCallback, useState } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { p2RootRef } from './pipeline-2-hook'

/* =========================================================================
   Deha Design System — Pipeline 2
   Vertical pipeline summary styled as an iOS grouped inset list mapped to
   Deha tokens. One inset rounded card holds six stage rows separated by
   1px hairline dividers. Each row: stage color dot (canonical token palette:
   yellow → orange → red → mint → emerald ramp toward Won, slate terminal),
   name (Montserrat), right-aligned deal count + total value (Turkish lira,
   tabular numbers), a conversion percent from the previous stage, and an
   up/down weekly trend indicator. Terminal "Lost" row reads muted
   (desaturated slate) with a subtle red trend.
   Interactions: staggered rise-and-fade entrance (pure CSS, explicit
   per-row delays) and a tap-for-detail dynamic-island popover per row
   (always mounted; open/closed is a visibility/opacity/transform state
   class). Behavior wiring lives in pipeline-2-hook.ts — zero effect hooks.
   Emerald == #10B981 == oklch(0.696 0.149 162.5).
   ========================================================================= */

/* ── Types ────────────────────────────────────────────────────────────────── */
interface Pipeline2Stage {
  key: string
  /** Stage name, rendered in Montserrat. */
  label: string
  /** Palette dot color (canonical design-tokens palette). */
  color: string
  /** Deal count in this stage. */
  count: number
  /** Pre-formatted total pipeline value, Turkish lira compact. */
  value: string
  /** Conversion % from the previous stage; null at the top of funnel. */
  convFromPrev: number | null
  /** Label of the previous stage for the conversion caption. */
  prevLabel: string | null
  /** Weekly trend direction. */
  trendDir: 'up' | 'down'
  /** Weekly trend magnitude, e.g. '3.4%'. */
  trendPct: string
  /** Average number of days deals sit in this stage. */
  avgDays: number
  /** Week-over-week deal-count delta for the popover trend detail. */
  weeklyDelta: number
  /** Terminal desaturated row (Lost). */
  muted?: boolean
}

/* ── Demo data — real-estate funnel ───────────────────────────────────────────
   Counts form a plausible funnel; conversion percents are consistent with the
   adjacent counts (Qualified 128/214=60%, Proposal 67/128=52%,
   Negotiation 31/67=46%, Won 14/31=45%). Lost is the terminal leakage row. */
const STAGES: readonly Pipeline2Stage[] = [
  { key: 'new',  label: 'New Leads',   color: '#EAB308', count: 214, value: '₺612M',  convFromPrev: null, prevLabel: null,          trendDir: 'up',   trendPct: '6.8%', avgDays: 4,  weeklyDelta: 14 },
  { key: 'qual', label: 'Qualified',   color: '#F97316', count: 128, value: '₺388M',  convFromPrev: 60,   prevLabel: 'New Leads',   trendDir: 'up',   trendPct: '3.4%', avgDays: 7,  weeklyDelta: 4 },
  { key: 'prop', label: 'Proposal',    color: '#EF4444', count: 67,  value: '₺214M',  convFromPrev: 52,   prevLabel: 'Qualified',   trendDir: 'down', trendPct: '1.2%', avgDays: 11, weeklyDelta: -1 },
  { key: 'nego', label: 'Negotiation', color: '#34D399', count: 31,  value: '₺104M',  convFromPrev: 46,   prevLabel: 'Proposal',    trendDir: 'up',   trendPct: '2.9%', avgDays: 16, weeklyDelta: 1 },
  { key: 'won',  label: 'Won',         color: '#10B981', count: 14,  value: '₺46.2M', convFromPrev: 45,   prevLabel: 'Negotiation', trendDir: 'up',   trendPct: '5.1%', avgDays: 24, weeklyDelta: 1 },
  { key: 'lost', label: 'Lost',        color: '#64748B', count: 17,  value: '₺58.4M', convFromPrev: null, prevLabel: null,          trendDir: 'down', trendPct: '2.3%', avgDays: 13, weeklyDelta: -2, muted: true },
] as const

/* ── Stage deep-dive popover (dynamic-island) ─────────────────────────────────
   Always mounted; open/closed is a pure state class (.is-open) toggling
   visibility/opacity/transform per the popover lessons — never conditional
   unmount, never display:none. Pure numbers, no named deals. */
function StagePopover({ stage, isOpen }: { stage: Pipeline2Stage; isOpen: boolean }) {
  const trendSign = stage.trendDir === 'up' ? '+' : '−'
  const deltaSign = stage.weeklyDelta >= 0 ? '+' : '−'
  const convText =
    stage.convFromPrev != null && stage.prevLabel
      ? `${stage.convFromPrev}% from ${stage.prevLabel}`
      : stage.muted
        ? 'Terminal stage'
        : 'Top of funnel'
  return (
    <div
      className={`p2-pop${isOpen ? ' is-open' : ''}${stage.muted ? ' p2-pop--muted' : ''}`}
      style={{ '--p2-stage': stage.color } as React.CSSProperties}
      aria-hidden={isOpen ? undefined : true}
    >
      <div className="p2-pop-head">
        <span className="p2-pop-dot" aria-hidden="true" />
        <span className="p2-pop-title">{stage.label}</span>
      </div>
      <div className="p2-pop-grid">
        <div className="p2-pop-stat">
          <span className="p2-pop-k">Total value</span>
          <span className="p2-pop-v">{stage.value}</span>
        </div>
        <div className="p2-pop-stat">
          <span className="p2-pop-k">Conversion</span>
          <span className="p2-pop-v">{convText}</span>
        </div>
        <div className="p2-pop-stat">
          <span className="p2-pop-k">Avg days in stage</span>
          <span className="p2-pop-v">{stage.avgDays}d</span>
        </div>
        <div className="p2-pop-stat">
          <span className="p2-pop-k">Weekly trend</span>
          <span className={`p2-pop-v p2-pop-trend--${stage.trendDir}`}>
            {trendSign}
            {stage.trendPct}
            {' · '}
            {deltaSign}
            {Math.abs(stage.weeklyDelta)} deals
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Row ──────────────────────────────────────────────────────────────────── */
function Pipeline2Row({
  stage,
  isOpen,
  onToggle,
}: {
  stage: Pipeline2Stage
  isOpen: boolean
  onToggle: () => void
}) {
  const trendIcon = stage.trendDir === 'up' ? 'trending_up' : 'trending_down'
  return (
    <button
      type="button"
      className={`p2-row${stage.muted ? ' p2-row--muted' : ''}${isOpen ? ' is-open' : ''}`}
      style={{ '--p2-stage': stage.color } as React.CSSProperties}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={`${stage.label} stage details`}
    >
      <span className="p2-dot" aria-hidden="true" />
      <span className="p2-label">
        <span className="p2-name">{stage.label}</span>
        <span className="p2-conv">
          {stage.convFromPrev != null && stage.prevLabel ? (
            <>
              <span className="p2-conv-pct">{stage.convFromPrev}%</span>
              {` from ${stage.prevLabel}`}
            </>
          ) : stage.muted ? (
            'Closed lost this cycle'
          ) : (
            'Top of funnel'
          )}
        </span>
      </span>
      <span className="p2-right">
        <span className="p2-value">
          <span className="p2-count">{stage.count}</span>
          <span className="p2-sep" aria-hidden="true">·</span>
          <span className="p2-money">{stage.value}</span>
        </span>
        <span
          className={`p2-trend p2-trend--${stage.trendDir}${stage.muted ? ' p2-trend--muted' : ''}`}
        >
          <span className={`p2-trend-ic ${iconClass(trendIcon)}`} aria-hidden="true">
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
export default function Pipeline2() {
  // Only one popover open at a time; null == all closed.
  const [openKey, setOpenKey] = useState<string | null>(null)

  // Callback ref (React 19 cleanup form) — wires outside-click / Escape
  // dismissal via the hook. setOpenKey is stable, so [] deps are correct and
  // the listener mounts once and unwires on unmount. No effect hooks.
  const rootRef = useCallback(
    (el: HTMLElement | null): (() => void) | void =>
      el ? p2RootRef(el, () => setOpenKey(null)) : undefined,
    [],
  )

  return (
    <div className="pipeline-2" ref={rootRef}>
      <div className="p2-shell">
        <div className="p2-group-header">Pipeline</div>
        <ul className="p2-inset">
          {STAGES.map((stage) => {
            const isOpen = openKey === stage.key
            return (
              <li
                key={stage.key}
                className={`p2-item${isOpen ? ' is-open' : ''}`}
              >
                <Pipeline2Row
                  stage={stage}
                  isOpen={isOpen}
                  onToggle={() =>
                    setOpenKey((prev) => (prev === stage.key ? null : stage.key))
                  }
                />
                <StagePopover stage={stage} isOpen={isOpen} />
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
