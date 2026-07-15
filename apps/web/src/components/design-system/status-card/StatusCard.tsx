import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './StatusCard.css'

import { useState, useRef, useCallback } from 'react'
import { useProximityGroup } from '@/lib/hooks'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { addRipple, startCountUp, makeCopyHandle } from './status-card-hook'
import type { Ripple } from './status-card-hook'

// ---------------------------------------------------------------------------
// StatusCard — Expandable issue card · tooltips · copy-link
// Port of /tmp/deha-brand-src/status-card.html + status-card.jsx
// All side-effects converted to callback-ref or event-handler patterns.
// Zero raw side-effect calls anywhere in this file.
// ---------------------------------------------------------------------------

/* ----------------------------- icons ----------------------------- */
function IcoWarn({ s = 20 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 4.2 21 19.5H3L12 4.2Z" fill="currentColor" opacity=".0" />
    <path d="M12 4.6 20.2 19H3.8L12 4.6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M12 9.8v4.4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="12" cy="16.7" r="1.3" fill="currentColor" /></svg>
}
function IcoDanger({ s = 20 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8.3 3.5h7.4L20.5 8.3v7.4L15.7 20.5H8.3L3.5 15.7V8.3L8.3 3.5Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M12 7.6v4.8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="12" cy="15.8" r="1.3" fill="currentColor" /></svg>
}
function IcoCheck({ s = 20 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IcoInfo({ s = 20 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="2.5" />
    <path d="M12 10.6v5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1.3" fill="currentColor" /></svg>
}
function IcoBell({ s = 15, c = 'currentColor' }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 10a6 6 0 0 1 12 0c0 5 1.5 6.2 2 6.8H4c.5-.6 2-1.8 2-6.8Z" stroke={c} strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M10 19.2a2.2 2.2 0 0 0 4 0" stroke={c} strokeWidth="1.9" strokeLinecap="round" /></svg>
}
function IcoTag({ s = 15, c = 'currentColor' }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4.8h6.4c.5 0 1 .2 1.4.6l7 7a2 2 0 0 1 0 2.8l-4.2 4.2a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 4 11V4.8Z" stroke={c} strokeWidth="1.9" strokeLinejoin="round" />
    <circle cx="8.4" cy="8.4" r="1.4" fill={c} /></svg>
}
function IcoCopy({ s = 14, c = 'currentColor' }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.6" stroke={c} strokeWidth="2" />
    <path d="M15.3 8.5V6.4a2 2 0 0 0-2-2H6.4a2 2 0 0 0-2 2v6.9a2 2 0 0 0 2 2h2.1" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IcoChev({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IcoCheckSm({ s = 14, c = 'currentColor' }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5 10 17.5 19 7" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

/* ----------------------------- tone map ----------------------------- */
type ToneKey = 'warning' | 'danger' | 'success' | 'info'

const TONES: Record<ToneKey, { glyph: React.ComponentType<{ s?: number }>; color: string }> = {
  warning: { glyph: IcoWarn,   color: '#FDE047' },
  danger:  { glyph: IcoDanger, color: '#EF4444' },
  success: { glyph: IcoCheck,  color: 'var(--semantic-success)' },
  info:    { glyph: IcoInfo,   color: '#2A6FDB' },
}

/* ----------------------------- Chip ----------------------------- */
interface ChipProps {
  icon: React.ReactNode
  children: React.ReactNode
  tooltip?: string | null
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  active?: boolean
  copied?: boolean
  exiting?: boolean
  trail?: React.ReactNode
  accent?: string
}

function Chip({ icon, children, tooltip, onClick, active, copied, exiting, trail, accent }: ChipProps) {
  const cls = ['sc-chip', active && 'is-active', copied && 'is-copied'].filter(Boolean).join(' ')
  return (
    <button
      className={cls}
      onClick={onClick}
      type="button"
      data-proximity
      style={accent ? ({ '--chip-accent': accent } as React.CSSProperties) : undefined}
    >
      <span className="sc-chip-ico">{icon}</span>
      <span className="sc-chip-lbl">{children}</span>
      {trail && <span className="sc-chip-trail">{trail}</span>}
      {/* copied overlay — always mounted, animated via class */}
      <span className={'sc-chip-copied' + (exiting ? ' is-exiting' : '')}
            style={{ visibility: copied ? 'visible' : 'hidden', animation: copied ? undefined : 'none' }}>
        <IcoCheckSm s={14} c="var(--brand-primary)" /> Copied
      </span>
      {tooltip && <span className="sc-tip" role="tooltip">{tooltip}<i className="sc-tip-arrow" /></span>}
    </button>
  )
}

/* ----------------------------- Skeleton ----------------------------- */
function Skeleton() {
  return (
    <article className="sc-card sc-skel" aria-busy="true" aria-label="Loading">
      <div className="sc-header">
        <span className="sk sk-ico" />
        <span className="sk sk-line" style={{ width: '46%' }} />
      </div>
      <div className="sc-collapse-inner" style={{ padding: '4px 18px 16px' }}>
        <span className="sk sk-line" style={{ width: '92%', height: 12 }} />
        <span className="sk sk-line" style={{ width: '70%', height: 12, marginTop: 9 }} />
        <div className="sc-divider" style={{ margin: '16px 0' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="sk sk-pill" /><span className="sk sk-pill" />
          <span className="sk sk-pill" style={{ marginLeft: 'auto', width: 54 }} />
        </div>
      </div>
    </article>
  )
}

/* ----------------------------- main card ----------------------------- */
interface StatusCardProps {
  tone?: ToneKey
  title?: string
  body?: string
  issueId?: string
  alerts?: number
  time?: string
  loading?: boolean
  /** Override badge background via --icon-c (e.g. '#EF4444'). Falls back to --tone. */
  iconColor?: string
}

function StatusCardInner({
  tone = 'warning',
  title = 'Data quality check',
  body = 'Employer contributions increased on the main workplace pension. Inconsistent platform data.',
  issueId = 'DQC-12',
  alerts = 3,
  time = '1 min',
  loading = false,
  iconColor,
}: StatusCardProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [ripples, setRipples] = useState<Ripple[]>([])

  // count-up: starts at 0 when closed, runs to `alerts` on open
  // driven from the event handler — no side-effect call needed
  const [alertCount, setAlertCount] = useState(alerts)
  const cancelCountRef = useRef<(() => void) | null>(null)

  // copy-link handle — stable object, created once
  const copyHandleRef = useRef(makeCopyHandle())
  const proximityRef = useProximityGroup<HTMLElement>()
  const stageSquircleRef = useSquircle<HTMLDivElement>()
  const cardSquircleRef = useSquircle<HTMLElement>()

  const T = TONES[tone] ?? TONES.warning
  const Glyph = T.glyph

  /* ---- toggle open ---- */
  const handleToggle = useCallback(() => {
    setOpen((o) => {
      const next = !o
      if (next) {
        // card is opening: reset counter and launch count-up
        setAlertCount(0)
        if (cancelCountRef.current) cancelCountRef.current()
        cancelCountRef.current = startCountUp(alerts, 520, setAlertCount)
      } else {
        // card is closing: cancel in-flight count and snap to target
        if (cancelCountRef.current) { cancelCountRef.current(); cancelCountRef.current = null }
        setAlertCount(alerts)
      }
      return next
    })
  }, [alerts])

  /* ---- pointer / ripple ---- */
  const onHeaderDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    setPressed(true)
    addRipple(e, e.currentTarget, setRipples)
  }, [])
  const onHeaderUp = useCallback(() => setPressed(false), [])

  /* ---- copy link ---- */
  const copyLink = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const link = `https://app.deha.io/issues/${issueId}`
    try { navigator.clipboard?.writeText(link) } catch { /* clipboard unavailable */ }
    copyHandleRef.current.trigger({
      onCopied:  () => { setCopied(true); setExiting(false) },
      onExiting: () => { setCopied(false); setExiting(true) },
      onDone:    () => setExiting(false),
    })
  }, [issueId])

  const stageVars = {
    '--tone': T.color,
    ...(iconColor ? { '--icon-c': iconColor } : {}),
  } as React.CSSProperties

  if (loading) {
    return <div className="sc-stage" style={stageVars} ref={stageSquircleRef}><Skeleton /></div>
  }

  return (
    <div className="sc-stage" style={stageVars} ref={stageSquircleRef}>
      <article
        ref={(el) => {
          proximityRef(el)
          cardSquircleRef(el)
        }}
        className={'sc-card' + (pressed ? ' is-pressed' : '')}
        data-open={open ? 'true' : 'false'}
      >
        <button
          className="sc-header"
          data-proximity
          onClick={handleToggle}
          onPointerDown={onHeaderDown}
          onPointerUp={onHeaderUp}
          onPointerLeave={onHeaderUp}
          aria-expanded={open}
          type="button"
        >
          {ripples.map((rp) => (
            <span key={rp.id} className="sc-ripple" style={{ left: rp.x, top: rp.y }} />
          ))}
          <span className={'sc-icon' + (tone === 'warning' ? ' sc-icon--warning' : '')}><Glyph s={16} /></span>
          <span className="sc-title">{title}</span>
          <span className="sc-chev"><IcoChev /></span>
        </button>

        <div className="sc-collapse" data-open={open ? 'true' : 'false'}>
          <div className="sc-collapse-inner">
            <p className="sc-body">{body}</p>
            <div className="sc-divider" />
            <div className="sc-foot">
              <Chip
                icon={<IcoBell />}
                tooltip={`${alerts} alerts linked`}
                onClick={(e) => e.stopPropagation()}
                accent={T.color}
              >
                {alertCount} alerts
              </Chip>
              <Chip
                icon={<IcoTag />}
                trail={<IcoCopy c="var(--chip-accent)" />}
                tooltip={copied || exiting ? null : `Copy ${tone} ticket ID`}
                onClick={copyLink}
                active
                copied={copied || exiting}
                exiting={exiting}
                accent="var(--brand-primary)"
              >
                {issueId}
              </Chip>
              <span className="sc-time">{time}</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

/* ---- default export — five variants on one page ---- */
export default function StatusCard(props: StatusCardProps = {}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '24px 0' }}>
      {/* original — warning/yellow */}
      <StatusCardInner {...props} />
      {/* red */}
      <StatusCardInner
        tone="danger"
        title="Payment gateway error"
        body="Three consecutive payment attempts failed on the enterprise account. Stripe webhook timeout suspected."
        issueId="PAY-07"
        alerts={5}
        time="3 min"
        iconColor="#EF4444"
      />
      {/* orange */}
      <StatusCardInner
        tone="warning"
        title="Budget threshold reached"
        body="Monthly cloud spend has reached 90% of the allocated budget. Usage spike detected in EU-West region."
        issueId="BDG-03"
        alerts={2}
        time="8 min"
        iconColor="#F97316"
      />
      {/* blue */}
      <StatusCardInner
        tone="info"
        title="Scheduled maintenance"
        body="Database cluster will undergo rolling restarts tonight between 02:00 and 04:00 UTC. No downtime expected."
        issueId="SYS-19"
        alerts={1}
        time="15 min"
        iconColor="#2A6FDB"
      />
      {/* green */}
      <StatusCardInner
        tone="success"
        title="Data import complete"
        body="All 14,382 contact records were imported successfully. Duplicate detection removed 47 redundant entries."
        issueId="IMP-04"
        alerts={0}
        time="22 min"
        iconColor="var(--semantic-success)"
      />
    </div>
  )
}
