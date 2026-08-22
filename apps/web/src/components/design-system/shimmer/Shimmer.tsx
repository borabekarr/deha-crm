import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Shimmer.css'

// ---------------------------------------------------------------------------
// Shimmer — Deha Design System
// A loading-placeholder primitive. A flat base block with a soft light wave
// that continuously sweeps across it (left-to-right by default), or a
// "pulse" variant that breathes the whole block. When isLoading flips false
// it cross-fades into the real children. ShimmerGroup propagates one loading
// state and look to every Shimmer beneath it.
//
// Faithful port of
// apps/web/design-system/claude-design/raw/shimmer/shimmer.jsx —
// byte-preserved DOM/CSS/timings per CONVERSION-SOP.md. No motion
// tokenization in this pass (deferred to a later value-identical pass).
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

// ── presets ──────────────────────────────────────────────────────────────

type ShimmerPreset = 'light' | 'dark' | 'custom'
type ShimmerVariant = 'shimmer' | 'pulse'
type ShimmerDirection = 'leftToRight' | 'rightToLeft' | 'topToBottom' | 'bottomToTop'

const SHIMMER_PRESETS: Record<'light' | 'dark', { base: string; hi: string }> = {
  light: { base: '#E2E8F0', hi: 'rgba(255,255,255,0.85)' }, // slate-200 + bright sweep
  dark: { base: '#233047', hi: 'rgba(255,255,255,0.13)' }, // slate surface + faint sweep
}

function resolveColors(preset: ShimmerPreset | undefined, shimmerColors: [string, string] | undefined) {
  if (preset === 'custom' && shimmerColors && shimmerColors.length >= 2) {
    return { base: shimmerColors[0], hi: shimmerColors[1] }
  }
  return SHIMMER_PRESETS[preset === 'dark' ? 'dark' : 'light']
}

// ── group context ──────────────────────────────────────────────────────────

interface ShimmerGroupValue {
  isLoading?: boolean
  preset?: ShimmerPreset
  duration?: number
  direction?: ShimmerDirection
  variant?: ShimmerVariant
  shimmerColors?: [string, string]
}

const ShimmerCtx = createContext<ShimmerGroupValue | null>(null)

export interface ShimmerGroupProps extends ShimmerGroupValue {
  children?: ReactNode
}

export function ShimmerGroup({
  isLoading,
  preset,
  duration,
  direction,
  variant,
  shimmerColors,
  children,
}: ShimmerGroupProps) {
  const value = useMemo(
    () => ({ isLoading, preset, duration, direction, variant, shimmerColors }),
    [isLoading, preset, duration, direction, variant, shimmerColors],
  )
  return <ShimmerCtx.Provider value={value}>{children}</ShimmerCtx.Provider>
}

// ── the primitive ────────────────────────────────────────────────────────

export interface ShimmerProps {
  isLoading?: boolean
  children?: ReactNode
  width?: number | string
  height?: number | string
  radius?: number | string
  circle?: boolean
  duration?: number
  variant?: ShimmerVariant
  direction?: ShimmerDirection
  preset?: ShimmerPreset
  shimmerColors?: [string, string]
  opacity?: number
  style?: CSSProperties
}

export function Shimmer({
  isLoading,
  children,
  width,
  height,
  radius,
  circle = false,
  duration,
  variant,
  direction,
  preset,
  shimmerColors,
  opacity = 1,
  style,
}: ShimmerProps) {
  const grp = useContext(ShimmerCtx) || {}
  // a group sets the shared defaults; explicit props always win
  const loading = isLoading != null ? isLoading : grp.isLoading != null ? grp.isLoading : true
  const dur = duration != null ? duration : grp.duration != null ? grp.duration : 1500
  const vr = variant || grp.variant || 'shimmer'
  const dir = direction || grp.direction || 'leftToRight'
  const pr = preset || grp.preset || 'light'
  const colors = shimmerColors || grp.shimmerColors

  const { base, hi } = resolveColors(pr, colors)

  // When isLoading flips false mid-sweep, don't cut the animation off — let
  // the current pass finish (animationiteration/animationend), then reveal.
  // With reduced motion (or no children to reveal) there is no sweep to
  // finish, so drop straight through.
  const outerRef = useRef<HTMLSpanElement>(null)
  const [finishing, setFinishing] = useState(false)
  useEffect(() => {
    if (loading || children == null) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = outerRef.current
    if (reduced || !el) return
    setFinishing(true)
    const done = () => setFinishing(false)
    el.addEventListener('animationiteration', done)
    el.addEventListener('animationend', done)
    return () => {
      el.removeEventListener('animationiteration', done)
      el.removeEventListener('animationend', done)
    }
  }, [loading, children])
  const visualLoading = loading || finishing

  // loaded -> render the real content, faded in
  if (!visualLoading && children != null) {
    return (
      <div className="sh-reveal" style={style}>
        {children}
      </div>
    )
  }

  const skStyle: CSSProperties = {
    width: width != null ? width : '100%',
    height: height != null ? height : children ? undefined : 16,
    borderRadius: circle ? '9999px' : radius != null ? radius : 8,
    opacity,
    ['--sk-base' as string]: base,
    ['--sk-hi' as string]: hi,
    ['--shim-dur' as string]: dur + 'ms',
    ...style,
  }

  return (
    <span className="shimmer" data-variant={vr} data-dir={dir} style={skStyle} aria-hidden="true" ref={outerRef}>
      <span className="wave" />
      {/* keep children in the layout (invisible) so the skeleton sizes to them */}
      {children != null && <span style={{ visibility: 'hidden', display: 'block' }}>{children}</span>}
    </span>
  )
}

// ====================================================================
// DEMO — a profile card that toggles between skeleton + real content.
// Skeleton mirrors the loaded layout 1:1, wrapped in a ShimmerGroup so
// one set of tweaks drives every block at once.
// ====================================================================

function Stat({ num, lab }: { num: string; lab: string }) {
  return (
    <div className="pc-stat">
      <span className="pc-num">{num}</span>
      <span className="pc-lab">{lab}</span>
    </div>
  )
}

function ProfileCard({ loading, group }: { loading: boolean; group: ShimmerGroupValue }) {
  return (
    <ShimmerGroup {...group} isLoading={loading}>
      <div className="pc-head">
        {/* avatar */}
        <Shimmer circle width={56} height={56}>
          <div className="pc-avatar">DH</div>
        </Shimmer>
        {/* name + handle */}
        <div className="pc-id" style={{ flex: 1 }}>
          <Shimmer width={loading ? 140 : undefined} height={15} radius={6}>
            <p className="pc-name">Dana Holloway</p>
          </Shimmer>
          <Shimmer width={loading ? 92 : undefined} height={11} radius={6}>
            <p className="pc-handle">@dana · Product</p>
          </Shimmer>
        </div>
      </div>

      {/* stats — three columns */}
      {loading ? (
        <div className="sk-stats">
          {[0, 1, 2].map((i) => (
            <Shimmer key={i} height={62} radius={12} />
          ))}
        </div>
      ) : (
        <div className="pc-stats sh-reveal">
          <Stat num="248" lab="Deals" />
          <Stat num="92%" lab="Win rate" />
          <Stat num="14" lab="Streak" />
        </div>
      )}

      {/* action */}
      <Shimmer height={46} radius={16}>
        <button type="button" className="pc-btn">View profile</button>
      </Shimmer>
    </ShimmerGroup>
  )
}

// ── default demo shell ──────────────────────────────────────────────────
// Mirrors the raw source's App() at its canonical TW-default state:
// loading: true, variant: shimmer, direction: leftToRight, duration: 1500,
// dark: false. The raw source's tweaks panel is authoring-only tooling
// (never checked into the repo, see pixel-gate harness) and is not part
// of the converted component.

const DEMO_GROUP: ShimmerGroupValue = {
  preset: 'light',
  duration: 1500,
  direction: 'leftToRight',
  variant: 'shimmer',
}

export default function ShimmerDemo() {
  // Button-triggered: idle shows real content, no animation runs until the
  // trigger fires. Loading then simulates content arriving; the Shimmer
  // primitive itself finishes the in-flight sweep before crossfading.
  const [loading, setLoading] = useState(false)
  const trigger = () => {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 2200)
  }

  const group = DEMO_GROUP

  return (
    // The raw source's <body>{display:grid;place-items:center} shrinks
    // #root to the stage's intrinsic width; this wrapper reproduces that
    // packaging-only layout need (not part of the byte-preserved .sh-*
    // rule set) so the block-level .sh-stage doesn't stretch to the
    // preview route's full container width.
    <div style={{ display: 'grid', placeItems: 'center', gap: 16 }}>
      <div className="sh-stage">
        <div className="sh-surface">
          <ProfileCard loading={loading} group={group} />
        </div>
      </div>
      <button type="button" className="sh-trigger" onClick={trigger} disabled={loading}>
        {loading ? 'Loading…' : 'Trigger loading'}
      </button>
    </div>
  )
}
