import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './OnboardingCompletion.css'

import { useState, useCallback, useRef } from 'react'
import { ocRootRef, cleanupOc, scheduleComplete, clearOcTimers, type StatusMap } from './onboarding-completion-hook'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '@/lib/hooks'

// ── SVG icon helpers (no icon-font dependency) ────────────────────────────────

function ArrowRight({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19.5 9A7.5 7.5 0 1 0 20 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4.5V9h-4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SlackWhite({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M5.04 15.17a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52Zm1.27 0a2.52 2.52 0 0 1 5.04 0v6.31a2.52 2.52 0 0 1-5.04 0v-6.31Z" />
      <path d="M8.83 5.04a2.52 2.52 0 1 1 2.52-2.52v2.52H8.83Zm0 1.27a2.52 2.52 0 0 1 0 5.04H2.52a2.52 2.52 0 0 1 0-5.04h6.31Z" />
      <path d="M18.96 8.83a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.83Zm-1.27 0a2.52 2.52 0 0 1-5.04 0V2.52a2.52 2.52 0 0 1 5.04 0v6.31Z" />
      <path d="M15.17 18.96a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52Zm0-1.27a2.52 2.52 0 0 1 0-5.04h6.31a2.52 2.52 0 0 1 0 5.04h-6.31Z" />
    </svg>
  )
}

function PeopleIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8.2" r="3.1" stroke={color} strokeWidth="1.9" />
      <path d="M3.6 19c.5-3 2.8-4.8 5.4-4.8S13.9 16 14.4 19" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <path d="M15.5 5.5a3 3 0 0 1 .5 5.9M16.6 14.4c2 .5 3.5 2.2 3.9 4.6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function TargetIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" stroke={color} strokeWidth="1.9" />
      <circle cx="12" cy="12" r="4.4" stroke={color} strokeWidth="1.9" />
      <circle cx="12" cy="12" r="1.4" fill={color} />
    </svg>
  )
}

function ShieldIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L4 6v6c0 4.4 3.4 8.5 8 9.6C16.6 20.5 20 16.4 20 12V6l-8-4z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CoinIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  // Clean dollar/coin glyph: circle coin with centered "$" symbol
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.9" />
      <path d="M12 6.5v1M12 16.5v1M12 7.5c-1.38 0-2.5.84-2.5 2s1.12 2 2.5 2 2.5.84 2.5 2-1.12 2-2.5 2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type GlyphName = 'slack' | 'shield' | 'coin' | 'people' | 'target'

const GLYPH_MAP: Record<GlyphName, React.ComponentType<{ size?: number; color?: string }>> = {
  slack: SlackWhite,
  shield: ShieldIcon,
  coin: CoinIcon,
  people: PeopleIcon,
  target: TargetIcon,
}

// ── Small UI primitives ───────────────────────────────────────────────────────

function Spinner({ size = 20, color = 'var(--oc-accent)', track = 'rgba(0,0,0,.08)' }: { size?: number; color?: string; track?: string }) {
  return (
    <svg className="oc-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={track} strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function DrawCheck({ size = 20, play = false, stroke = 2.8 }: { size?: number; play?: boolean; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        className={`oc-check-path${play ? ' play' : ''}`}
        d="M5 12l5 5L19 7"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Chevron({ dir = 'right', size = 18, color = 'currentColor' }: { dir?: 'right' | 'left'; size?: number; color?: string }) {
  const d = dir === 'right' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProgressRing({
  value, total, size = 26, stroke = 3.4, color = 'var(--oc-accent)',
}: { value: number; total: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? value / total : 0
  const offset = circ * (1 - pct)
  return (
    <span className="oc-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--gray-200)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset calc(400ms * var(--anim-mult, 1)) var(--ease-out)' }}
        />
      </svg>
    </span>
  )
}

const CONFETTI_COLORS = ['var(--brand-primary-500)','#6366F1','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#F97316']
const CONFETTI_SHAPES = ['4px 2px','3px 6px','5px 3px','2px 5px','6px 2px']

function Confetti({ fire, count = 32, loop = false }: { fire: boolean; count?: number; loop?: boolean }) {
  if (!fire) return null
  const pieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${5 + (i / count) * 90}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
    durRaw: Math.round((1.1 + (i % 5) * 0.15) * 1000),
    delayRaw: (i % 8) * 80,
    fy: `${380 + (i % 4) * 60}px`,
    fx: `${-40 + (i % 7) * 14}px`,
    cr: `${-200 + (i % 6) * 80}deg`,
  }))
  return (
    <div className={`oc-confetti${loop ? ' oc-confetti--loop' : ''}`} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: p.left,
            background: p.color,
            borderRadius: '2px',
            width: p.shape.split(' ')[0],
            height: p.shape.split(' ')[1],
            ['--dur-raw' as string]: p.durRaw,
            ['--delay-raw' as string]: p.delayRaw,
            ['--fy' as string]: p.fy,
            ['--fx' as string]: p.fx,
            ['--cr' as string]: p.cr,
          }}
        />
      ))}
    </div>
  )
}

// ── Step data ─────────────────────────────────────────────────────────────────

interface Step {
  id: string
  glyph: GlyphName
  color: string
  title: string
  desc: string
  cta: string
}

const STEP_POOL: Step[] = [
  { id: 'slack',   glyph: 'slack',  color: '#2A6FDB', title: 'Connect to Slack',   desc: 'Link your workspace so updates land where your team already works.',       cta: 'Connect Slack' },
  { id: 'access',  glyph: 'shield', color: '#EAB308', title: 'Review access',       desc: 'Confirm who can view and manage your workspace data.',                    cta: 'Review access' },
  { id: 'payouts', glyph: 'coin',   color: 'var(--brand-primary-500)', title: 'Customize payouts',   desc: 'Choose a payout schedule and the account funds are sent to.',              cta: 'Set up payouts' },
  { id: 'team',    glyph: 'people', color: '#F97316', title: 'Invite your team',    desc: 'Bring teammates in so everyone gets started together.',                    cta: 'Send invites' },
  { id: 'goals',   glyph: 'target', color: '#EF4444', title: 'Set your goals',      desc: 'Tell us what success looks like so we can tune your dashboard.',           cta: 'Set goals' },
]

const DEFAULT_STEPS = STEP_POOL.slice(0, 3)

type Variant = 'prompt' | 'card' | 'checklist'

// ── Sub-components ────────────────────────────────────────────────────────────

// Yellow tags (#EAB308 family) get brighter yellow bg; icon color = black for legibility
const BRIGHT_YELLOW = '#FBBF24'
const YELLOW_BG_COLORS: Record<string, string> = { '#EAB308': BRIGHT_YELLOW }

function GlyphTile({ glyph, color, done, size = 'md' }: { glyph: GlyphName; color: string; done?: boolean; size?: 'md' | 'lg' }) {
  const G = GLYPH_MAP[glyph] ?? GLYPH_MAP.slack
  // If the step color is the yellow access tone, upgrade to brighter yellow and use black icon
  const bgColor = YELLOW_BG_COLORS[color] ?? color
  const iconColor = YELLOW_BG_COLORS[color] ? '#000' : '#fff'
  return (
    <span
      className={`oc-glyph oc-glyph--${size}${done ? ' is-done' : ''}`}
      style={{ '--icon-c': bgColor } as React.CSSProperties}
    >
      <G size={size === 'lg' ? 30 : 22} color={iconColor} />
    </span>
  )
}

function RippleButton({
  className, children, onClick, disabled,
}: {
  className?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const ref = useRef<HTMLButtonElement>(null)

  const fire = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const id = Date.now() + Math.random()
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
    setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 620)
    onClick?.(e)
  }

  return (
    <button ref={ref} type="button" className={className} data-proximity onClick={fire} disabled={disabled}>
      {ripples.map((rp) => (
        <span key={rp.id} className="oc-ripple" style={{ left: rp.x, top: rp.y }} />
      ))}
      <span className="oc-cta-inner">{children}</span>
    </button>
  )
}

function StepRow({
  step, status, onComplete,
}: {
  step: Step
  status: string
  onComplete: (id: string) => void
}) {
  const done = status === 'done'
  const processing = status === 'processing'
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const ref = useRef<HTMLButtonElement>(null)

  const onDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (done || processing || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const id = Date.now() + Math.random()
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
    setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 620)
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`oc-row${done ? ' is-done' : ''}${processing ? ' is-processing' : ''}`}
      data-proximity
      onPointerDown={onDown}
      onClick={() => !done && !processing && onComplete(step.id)}
      disabled={done || processing}
      aria-label={done ? `${step.title} — completed` : `Complete ${step.title}`}
    >
      {ripples.map((rp) => (
        <span
          key={rp.id}
          className="oc-row-ripple"
          style={{ left: rp.x, top: rp.y, background: `color-mix(in srgb, ${step.color} 26%, transparent)` }}
        />
      ))}
      <GlyphTile glyph={step.glyph} color={step.color} done={done} />
      <span className="oc-row-title">{step.title}</span>
      <span className="oc-row-end">
        {processing ? (
          <Spinner size={20} />
        ) : done ? (
          <span className="oc-row-check"><DrawCheck size={15} play stroke={3.6} /></span>
        ) : (
          <Chevron dir="right" size={18} color="var(--gray-400)" />
        )}
      </span>
    </button>
  )
}

function Success({ n, onReset, fire }: { n: number; onReset: () => void; fire: boolean }) {
  return (
    <div className="oc-success">
      <div className="oc-bloom" />
      {/* Soft radial glow watermark — no hard edges, gradient only */}
      <div className="oc-success-glow" aria-hidden="true" />
      <Confetti fire={fire} loop />
      <div className="oc-success-body">
        <span className="oc-success-badge">
          <DrawCheck size={30} play stroke={2.8} />
        </span>
        <h3 className="oc-success-title">You&apos;re all set</h3>
        <p className="oc-success-desc">Everything&apos;s connected and ready to go. Welcome aboard.</p>
      </div>
      <div className="oc-card-foot oc-success-foot">
        <RippleButton className="oc-cta" onClick={() => {}}>
          <span>View Dashboard</span><span className="oc-cta-ico"><ArrowRight size={20} /></span>
        </RippleButton>
        <button type="button" className="oc-replay" data-proximity onClick={onReset}>
          <RefreshIcon size={15} />
          Replay
        </button>
      </div>
      {/* keep n in scope for aria */}
      <span className="sr-only">{n} steps completed</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

// ── Inline CSS overrides for all 6 feedback fixes ────────────────────────────
const OC_OVERRIDES = `
  /* FIX 1 — Option cards / checklist rows: canon inner-card recipe now lives
     in OnboardingCompletion.css (.oc-card, .oc-prompt, .oc-row share the
     --card-bg/--card-border/--card-radius + inset hairline tokens with
     .card-inner). This block previously duplicated a partial version of
     that fix here with equal cascade specificity, silently shadowing the
     base CSS; removed so the .css file is the single source of truth.
     useSquircle's --corner-radius binding for .oc-card still lives there
     too (OnboardingCompletion.css .oc-card[data-squircle="on"] rule). */
  /* Focus card body in card variant */
  .oc-focus { background: transparent; }

  /* FIX 2 — Step transitions: smoother easing, longer, no abrupt cut */
  .oc-card { animation: ocCardIn calc(580ms * var(--anim-mult, 1)) var(--ease-out-soft); }
  .oc-focus { animation: ocFocusIn calc(620ms * var(--anim-mult, 1)) var(--ease-out-soft); }
  @keyframes ocCardIn {
    from { opacity: 0; transform: translateY(14px) scale(.98); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes ocFocusIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: none; }
  }
  .oc-prompt { animation: ocCardIn calc(580ms * var(--anim-mult, 1)) var(--ease-out-soft); }

  /* FIX 3 — Remove drop-shadow from all glyph icons; color/bg handled in TSX */
  .oc-glyph svg, .oc-prompt-ico svg { filter: none !important; }

  /* FIX 4 — CoinIcon: handled in TSX (cleaner SVG path) */

  /* FIX 5 — Success & default all-set: soft radial gradient glow, no hard edges */
  .oc-success-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(ellipse 70% 55% at 50% 38%,
        color-mix(in srgb, var(--oc-accent) 32%, transparent) 0%,
        color-mix(in srgb, var(--oc-accent) 10%, transparent) 45%,
        transparent 70%
      );
    animation: ocGlowFade calc(800ms * var(--anim-mult, 1)) var(--ease-out) both;
  }
  @keyframes ocGlowFade {
    from { opacity: 0; transform: scale(.7); }
    to   { opacity: 1; transform: none; }
  }
  /* Replace the hard-cornered bloom with a pure gradient — no edges */
  .oc-bloom {
    background:
      radial-gradient(ellipse 100% 70% at 50% 20%,
        color-mix(in srgb, var(--oc-accent) 18%, transparent) 0%,
        transparent 65%
      );
    border-radius: 0;
    animation: ocBloom calc(700ms * var(--anim-mult, 1)) var(--ease-out) both;
  }
  /* Ensure body content sits above the glow */
  .oc-success-body { z-index: 1; }
  .oc-success-foot { z-index: 1; }

  /* FIX 6 — Confetti: loop mode makes animation iterate infinite */
  .oc-confetti--loop span {
    animation-iteration-count: infinite;
    /* stagger total cycle so pieces restart at slightly different times */
    animation-duration: calc(var(--dur-raw, 1300) * 1ms * var(--anim-mult, 1));
    animation-fill-mode: none;
    opacity: 0;
  }
`

export default function OnboardingCompletion() {
  const steps = DEFAULT_STEPS
  const accent = 'var(--brand-primary-500)'
  const n = steps.length

  const [status, setStatus] = useState<StatusMap>(
    () => Object.fromEntries(steps.map((s) => [s.id, 'todo' as const]))
  )
  const [fire, setFire] = useState(false)
  const [variant, setVariant] = useState<Variant>('checklist')

  // Squircle ref: shared between the two mutually-exclusive .oc-card mounts
  // (card / checklist variants) — only one is in the DOM at a time.
  const ocCardSquircleRef = useSquircle<HTMLDivElement>()

  // Root element ref — timers are stored on the DOM node
  const rootElRef = useRef<HTMLElement | null>(null)
  const proximityRef = useProximityGroup<HTMLElement>()
  // setFire is stable (from useState) — safe to close over in timer callbacks
  const setFireStable = useRef(setFire)

  const doneCount = steps.filter((s) => status[s.id] === 'done').length
  const allDone = doneCount === n
  const focused = steps.find((s) => status[s.id] !== 'done') ?? steps[n - 1]
  const FocusGlyph = GLYPH_MAP[focused.glyph] ?? GLYPH_MAP.slack
  const compact = variant === 'prompt'
  const showSuccess = allDone

  // complete: delegates the full todo→processing→done sequence to scheduleComplete.
  // scheduleComplete owns the timing; no synchronous state mutation here so the
  // 'todo' guard inside scheduleComplete is not pre-empted.
  const complete = useCallback((id: string) => {
    scheduleComplete(rootElRef.current, id, setStatus, 0, n, setFireStable)
  }, [n])

  const finishAll = useCallback(() => {
    const rem = steps.filter((s) => status[s.id] !== 'done')
    rem.forEach((s, i) => {
      scheduleComplete(rootElRef.current, s.id, setStatus, i * 200, n, setFireStable)
    })
  }, [steps, status, n])

  const reset = useCallback(() => {
    clearOcTimers(rootElRef.current)
    setFire(false)
    setStatus(Object.fromEntries(steps.map((s) => [s.id, 'todo'])))
  }, [steps])

  // Stable callback ref — empty deps so React invokes it only on real mount/
  // unmount, never on every re-render. An inline ref gets a fresh identity each
  // render, so React detaches it (→ cleanupOc clears ALL pending timers) and
  // reattaches it on every render; the todo→processing re-render would cancel
  // the pending processing→done timer, stranding the step in 'processing'.
  const setRootRef = useCallback((el: HTMLElement | null) => {
    proximityRef(el)
    if (el) {
      rootElRef.current = el
      ocRootRef(el)
    } else {
      cleanupOc(rootElRef.current)
      rootElRef.current = null
    }
  }, [proximityRef])

  return (
    <div
      className="oc-stage"
      style={{ '--oc-accent': accent } as React.CSSProperties}
      ref={setRootRef as unknown as React.Ref<HTMLDivElement>}
    >
      {/* eslint-disable-next-line no-restricted-syntax -- OC_OVERRIDES is a static component-authored CSS constant (no interpolation, no external/user input); injected as a late <style> for cascade precedence over the imported stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: OC_OVERRIDES }} />
      <div className={`oc-panel-wrap${compact ? ' is-compact' : ''}`}>

        {/* ── PROMPT ── */}
        {variant === 'prompt' && (
          showSuccess ? (
            <div className="oc-prompt is-success">
              <Confetti fire={true} count={26} />
              <span className="oc-prompt-tick"><DrawCheck size={20} play stroke={3.6} /></span>
              <span className="oc-prompt-text">
                <span className="oc-prompt-title">You&apos;re all set</span>
                <span className="oc-prompt-sub">{n}/{n} Completed</span>
              </span>
              <button type="button" className="oc-icon-btn" data-proximity onClick={reset} aria-label="Start over">
                <RefreshIcon size={20} />
              </button>
            </div>
          ) : (
            <button type="button" className="oc-prompt" data-proximity onClick={() => complete(focused.id)}>
              <ProgressRing value={doneCount} total={n} size={46} stroke={4} color="var(--oc-accent)" />
              <span className="oc-prompt-text">
                <span className="oc-prompt-title-row">
                  <span className="oc-prompt-ico" style={{ '--prompt-ico-c': YELLOW_BG_COLORS[focused.color] ?? focused.color } as React.CSSProperties}>
                    <FocusGlyph size={['shield', 'coin'].includes(focused.glyph) ? 19 : 15} color={YELLOW_BG_COLORS[focused.color] ? '#000' : '#fff'} />
                  </span>
                  <span className="oc-prompt-title">{focused.title}</span>
                </span>
                <span className="oc-prompt-sub">{doneCount}/{n} Completed</span>
              </span>
              <Chevron dir="right" size={20} color="var(--gray-400)" />
            </button>
          )
        )}

        {/* ── CARD ── */}
        {variant === 'card' && (
          <div className="oc-card" ref={ocCardSquircleRef}>
            {showSuccess ? (
              <Success n={n} onReset={reset} fire={fire} />
            ) : (
              <>
                <div className="oc-head">
                  <div className="oc-head-l">
                    <ProgressRing value={doneCount} total={n} size={26} stroke={3.4} color="var(--oc-accent)" />
                    <span className="oc-head-title">Get Started</span>
                  </div>
                  <span className="oc-head-count">{doneCount}/{n}</span>
                </div>
                <div className="oc-divider" />
                <div className="oc-card-body">
                  <div className="oc-focus" key={focused.id}>
                    <GlyphTile glyph={focused.glyph} color={focused.color} size="lg" />
                    <h3 className="oc-focus-title">{focused.title}</h3>
                    <p className="oc-focus-desc">{focused.desc}</p>
                  </div>
                </div>
                <div className="oc-card-foot">
                  <RippleButton
                    className="oc-cta"
                    onClick={() => complete(focused.id)}
                    disabled={status[focused.id] === 'processing'}
                  >
                    {status[focused.id] === 'processing' ? (
                      <><Spinner size={18} color="#fff" track="rgba(255,255,255,.35)" /> <span>Working…</span></>
                    ) : (
                      <><span>{focused.cta}</span><span className="oc-cta-ico"><ArrowRight size={20} /></span></>
                    )}
                  </RippleButton>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CHECKLIST ── */}
        {variant === 'checklist' && (
          <div className="oc-card" ref={ocCardSquircleRef}>
            {showSuccess ? (
              <Success n={n} onReset={reset} fire={fire} />
            ) : (
              <>
                <div className="oc-head">
                  <span className="oc-head-title">Get Started</span>
                  <span className="oc-head-count">{doneCount}/{n} Completed</span>
                </div>
                <div className="oc-divider" />
                <div className="oc-card-body oc-list">
                  {steps.map((s) => (
                    <StepRow key={s.id} step={s} status={status[s.id]} onComplete={complete} />
                  ))}
                </div>
                <div className="oc-card-foot">
                  <RippleButton className="oc-cta" onClick={finishAll}>
                    <span>Finish setup</span><span className="oc-cta-ico"><ArrowRight size={20} /></span>
                  </RippleButton>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Variant switcher ── */}
      <div className="oc-seg" role="tablist" aria-label="View">
        <span
          className="oc-seg-thumb"
          style={{ left: `calc(3px + ${(['prompt', 'card', 'checklist'] as Variant[]).indexOf(variant)} * (100% - 6px) / 3)` }}
        />
        {(['Prompt', 'Card', 'Checklist'] as const).map((v) => {
          const id = v.toLowerCase() as Variant
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={variant === id}
              className={`oc-seg-btn${variant === id ? ' is-on' : ''}`}
              data-proximity
              onClick={() => setVariant(id)}
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}
