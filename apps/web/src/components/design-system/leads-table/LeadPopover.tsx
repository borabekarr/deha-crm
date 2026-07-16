/* =========================================================================
   LeadPopover.tsx -- Lead Details Popover (schema + tier driven)
   Ported from apps/web/design-system/preview/_lead-popover.jsx.
   Modal overlay: fixed/centered, backdrop click or Esc to close.
   CSS reused verbatim via import -- all class names preserved for theming.
   ========================================================================= */

import { useState, useRef, useId } from 'react'
import '../../../../design-system/preview/_lead-popover.css'
import type { Lead } from './leadsData'
import { initials, fmtTL, STAGES } from './leadsData'
import {
  PILLS,
  SCHEMA,
  buildLeadMetrics,
  isActive,
  hasVoice,
  coldDropHours,
  DOC_ANNOTATIONS,
  type MetricData,
  type Pill,
} from './leadMetrics'
import {
  useTween,
  usePillIndicator,
  useTypewriter,
  useCountdown,
  useScrollResetOnChange,
  useEdgeRecheck,
  useEscToClose,
  useChannelSwitcher,
} from './popover-hook'
import { useBrainStage } from './brain-hook'
import { FilterColumn } from './FilterColumn'
import { InteractiveBrain } from './InteractiveBrain'
import { DetailPanel } from './DetailPanel'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { usePillSpring } from '../../../lib/motion-spring'

// ── Constants ─────────────────────────────────────────────────────────────────

const TONEBG: Record<string, [string, string, string]> = {
  g:['var(--g)','var(--g-bg)','var(--g-bd)'], a:['var(--a)','var(--a-bg)','var(--a-bd)'],
  r:['var(--r)','var(--r-bg)','var(--r-bd)'], b:['var(--b)','var(--b-bg)','var(--b-bd)'],
  v:['var(--v)','var(--v-bg)','var(--v-bd)'], o:['var(--o)','var(--o-bg)','var(--o-bd)'],
}
const HEALTH:   Record<string, string> = { g:'#0F9D6B', a:'#D97A2B', r:'#4A4A4A' }
const healthOf = (s: number) => s >= 70 ? 'g' : s >= 45 ? 'a' : 'r'
const HEALTH_WORD: Record<string, string> = { g:'On track', a:'Needs attention', r:'At risk' }
const STAGE_ICON: Record<string, string> = {
  lead:'person_add', qualified:'verified', proposal:'description',
  negotiation:'handshake', closing:'task_alt',
}
const TEMP: Record<string, { c: string; ic: string }> = {
  hot:  { c:'#F97316', ic:'local_fire_department' },
  warm: { c:'#EAB308', ic:'thermostat' },
  cold: { c:'#6B6B6B', ic:'ac_unit' },
}
const TONE_HEX: Record<string, string> = {
  g:'var(--g-l)', a:'var(--a-l)', r:'var(--r-l)', b:'var(--b-l)',
  v:'var(--v-l)', o:'var(--o-l)', slate:'var(--txt4)',
}
const TIER_ACC: Record<number, string> = {
  0:'var(--g-l)', 1:'var(--b-l)', 2:'var(--v-l)', 3:'var(--o-l)',
}

function sentimentCat(s: number) {
  if (s >= 72) return { ic:'sentiment_very_satisfied', word:'Positive' }
  if (s >= 55) return { ic:'sentiment_satisfied', word:'Warm' }
  if (s >= 42) return { ic:'sentiment_neutral', word:'Neutral' }
  return { ic:'sentiment_dissatisfied', word:'Negative' }
}
function weekDelta(id: number, base: number) {
  const f = (Math.sin(id * 73.13 + base * 1.7) * 1000) % 1
  return Math.round((base - 58) / 11 + f * 4 - 1)
}

// Unique SVG gradient ids come from React's useId() per instance (compiler-safe).

// useTween is imported from popover-hook.ts (animation loop encapsulated there).

// ── Viz primitives ────────────────────────────────────────────────────────────

function Bar({ pct, tone, vlabel }: { pct: number; tone: string; vlabel: string | null }) {
  const w = useTween(pct, 780)
  return (
    <div className="ldx-barbox" style={{ '--tone': tone } as React.CSSProperties}>
      <span className="ldx-bar-v">{vlabel != null ? vlabel : Math.round(w) + '%'}</span>
      <div className="ldx-bar"><i style={{ width: w + '%' }}><span className="ldx-bar-glow" /></i></div>
    </div>
  )
}

function WBar({ it }: { it: { n: string; w: number; tone: string; label?: string | null } }) {
  const w = useTween(it.w, 760)
  return (
    <div style={{ '--wtone': it.tone } as React.CSSProperties}>
      <div className="ldx-wbar-top"><span>{it.n}</span><b>{it.label != null ? it.label : Math.round(w) + '%'}</b></div>
      <div className="ldx-wbar-tr"><i style={{ width: w + '%' }} /></div>
    </div>
  )
}

function SplitSeg({ p }: { p: { pct: number; tone: string } }) {
  const w = useTween(p.pct, 720)
  return <i style={{ width: w + '%', background: p.tone }} />
}

function Ring({ pct, tone }: { pct: number; tone: string }) {
  const val = useTween(pct, 860)
  const R = 21, C = 2 * Math.PI * R, off = C * (1 - val / 100)
  const id = useId()
  return (
    <div className="ldx-ring">
      <svg width="54" height="54" viewBox="0 0 54 54">
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone} stopOpacity="0.55" /><stop offset="1" stopColor={tone} />
        </linearGradient></defs>
        <circle cx="27" cy="27" r={R} fill="none" stroke="var(--track)" strokeWidth="6.5" />
        <circle cx="27" cy="27" r={R} fill="none" stroke={`url(#${id})`} strokeWidth="6.5" strokeLinecap="round"
          strokeDasharray={C.toFixed(1)} strokeDashoffset={off.toFixed(1)} transform="rotate(-90 27 27)" />
      </svg>
      <span className="rv" style={{ color: tone }}>{Math.round(val)}</span>
    </div>
  )
}

function Spark({ points, dir, tag }: { points: number[]; dir: string; tag: string }) {
  const prog = useTween(100, 920)
  const max = Math.max(...points, 1), min = Math.min(...points, 0)
  const n = points.length, W = 100, Hh = 34, rng = (max - min) || 1
  const xs = (i: number) => (i / (n - 1)) * W
  const ys = (v: number) => Hh - ((v - min) / rng) * (Hh - 6) - 3
  const line = points.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ')
  const area = `${line} L${W},${Hh} L0,${Hh} Z`
  const col = dir === 'up' ? 'var(--g-l)' : 'var(--r-l)'
  const id = useId()
  const lx = xs(n - 1), ly = ys(points[n - 1])
  return (
    <div className="ldx-spark-row">
      <svg className="ldx-spark" viewBox={`0 0 ${W} ${Hh}`} preserveAspectRatio="none">
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity="0.28" /><stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient></defs>
        <path d={area} fill={`url(#${id})`} opacity={prog / 100} />
        <path d={line} fill="none" stroke={col} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          pathLength="100" strokeDasharray="100" strokeDashoffset={100 - prog} />
        <circle cx={lx} cy={ly} r="2.6" fill={col} opacity={prog > 92 ? 1 : 0} />
      </svg>
      <span className="ldx-spark-tag" style={{ color: col }}>
        <span className="material-symbols-outlined">{dir === 'up' ? 'trending_up' : 'trending_down'}</span>{tag}
      </span>
    </div>
  )
}

const HEAT_HOURS = [9,10,11,12,13,14,15,16,17,18,19,20]
function heatTip(i: number, lv: number, total: number) {
  const ago = total - 1 - i
  const day = ago === 0 ? 'Today' : ago === 1 ? 'Yesterday' : ago + ' days ago'
  if (!lv) return { day, n:0, times:[] as string[] }
  let seed = (i * 131 + lv * 977 + 17) % 9973
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  const used = new Set<number>(), times: string[] = []
  for (let k = 0; k < lv; k++) {
    let h = HEAT_HOURS[Math.floor(rnd() * HEAT_HOURS.length)], guard = 0
    while (used.has(h) && guard++ < 12) h = HEAT_HOURS[Math.floor(rnd() * HEAT_HOURS.length)]
    used.add(h)
    const m = [0,15,30,45][Math.floor(rnd() * 4)]
    times.push(String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0'))
  }
  times.sort()
  return { day, n:lv, times }
}
function Heatmap({ days }: { days: number[]; tag?: string; dir?: string }) {
  const prog = useTween(days.length, 1100)
  const shown = Math.round(prog)
  return (
    <div className="ldx-heat-wrap">
      <div className="ldx-heat">
        {days.map((lv, i) => {
          const tip = heatTip(i, lv, days.length)
          return (
            // eslint-disable-next-line react/no-array-index-key -- heatmap days are positional slots with no domain id; array never reorders within a component instance
            <span key={i} className={'ldx-heat-box l' + (i < shown ? lv : 0)}>
              <span className="ldx-heat-tip">
                <b>{tip.day}</b>
                <span className="ldx-heat-tip-n">{tip.n ? tip.n + ' interaction' + (tip.n > 1 ? 's' : '') : 'No interactions'}</span>
              </span>
            </span>
          )
        })}
      </div>
      <div className="ldx-heat-foot">
        <span className="ldx-heat-scale">Less <i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /> More</span>
      </div>
    </div>
  )
}

function DayWindow({ startH, endH, dayLb, rate, altRate }: { startH: number; endH: number; dayLb: string; rate: number; altRate: number }) {
  const lo = 8, hi = 21, span = hi - lo
  const left = ((startH - lo) / span) * 100, width = ((endH - startH) / span) * 100
  const grow = useTween(width, 760)
  const hours: number[] = []; for (let h = lo; h <= hi; h++) hours.push(h)
  const halves: number[] = []; for (let h = lo; h < hi; h++) halves.push(h + 0.5)
  return (
    <div className="ldx-dw">
      <div className="ldx-dw-head">
        <div className="ldx-dw-when-row">
          <span className="ldx-dw-day">{dayLb}</span>
          <span className="ldx-dw-time">{String(startH).padStart(2,'0')}:00 - {String(endH).padStart(2,'0')}:00</span>
          <span className="ldx-dw-rate-badge">{rate}%</span>
        </div>
      </div>
      <div className="ldx-dw-track">
        <div className="ldx-dw-window" style={{ left: left + '%', width: grow + '%' }}>
          <span className="ldx-dw-flag">{rate}%</span>
        </div>
        {halves.map(t => <span key={'h' + t} className="ldx-dw-tick minor" style={{ left: ((t - lo) / span) * 100 + '%' }}><i /></span>)}
        {hours.map(t => <span key={t} className="ldx-dw-tick" style={{ left: ((t - lo) / span) * 100 + '%' }}><i /><span className="ldx-dw-tick-lb">{t}</span></span>)}
      </div>
      <div className="ldx-dw-legend"><span className="ldx-dw-dot on" />Peak window&nbsp;·&nbsp;<span className="ldx-dw-dot" />{altRate}% outside it</div>
    </div>
  )
}

const CH_COLOR: Record<string, string> = {
  WhatsApp:'var(--g-l)', Phone:'var(--b-l)', Email:'var(--v-l)', Instagram:'var(--o-l)',
}
const chColor = (name: string) => CH_COLOR[name] || 'var(--txt4)'

function ChSeg({ s }: { s: { pn: number; color: string } }) {
  const w = useTween(s.pn, 720)
  return <i style={{ width: w + '%', background: s.color }} />
}

function Channels({ items }: { items: Array<{ name: string; share: number; preferred?: boolean; time: string; vs: { dir: string; pct: number }; speedTone: string; speedLb: string }> }) {
  const tot = items.reduce((a, c) => a + (c.share || 0), 0) || 1
  const segs = items.map(c => ({ c, color: chColor(c.name), pn: (c.share / tot) * 100 }))
  return (
    <div className="ldx-chwrap">
      <div className="ldx-chbar">{segs.map((s) => <ChSeg key={s.c.name} s={s} />)}</div>
      <ul className="ldx-ch-bullets">
        {segs.map((s) => {
          const c = s.c
          return (
            <li key={c.name} className="ldx-ch-bul">
              <div className="ldx-ch-bul-head">
                <span className="ldx-ch-bul-dot" style={{ background: s.color }} />
                <span className="ldx-ch-bul-name">{c.name}{c.preferred && <span className="ldx-ch-pref"><span className="material-symbols-outlined">star</span></span>}</span>
                <span className="ldx-ch-bul-time"><span className="material-symbols-outlined">schedule</span>{c.time}</span>
              </div>
              <span className={'ldx-vsbadge ' + c.vs.dir}><span className="material-icons">{c.vs.dir === 'up' ? 'trending_up' : 'trending_down'}</span>{c.vs.pct}% {c.vs.dir === 'up' ? 'faster' : 'slower'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ColBarSeg({ it, total }: { it: { v: number; tone: string; lead?: boolean }; total: number }) {
  const pct = useTween((it.v / total) * 100, 780)
  return <div className={'ldx-colbars-seg' + (it.lead ? ' lead' : '')} style={{ height: pct + '%', background: TONE_HEX[it.tone] || 'var(--txt4)' }} />
}

function ColBars({ items }: { items: Array<{ label: string; v: number; tone: string; lead?: boolean }> }) {
  const total = items.reduce((a, x) => a + x.v, 0) || 1
  return (
    <div className="ldx-colbars-stacked">
      <div className="ldx-colbars-bar">
        {[...items].reverse().map((it) => <ColBarSeg key={it.label} it={it} total={total} />)}
      </div>
      <div className="ldx-colbars-legend">
        {items.map((it) => (
          <div key={it.label} className={'ldx-colbars-leg' + (it.lead ? ' lead' : '')}>
            <i style={{ background: TONE_HEX[it.tone] || 'var(--txt4)' }} />
            <span>{it.label}</span>
            <b>{fmtTL(Math.round(it.v / 1e5) * 1e5)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function Elasticity({ spoken, max, fmt, headroom }: { spoken: number; max: number; fmt: (v: number) => string; headroom: number }) {
  const spokenPct = (spoken / max) * 100
  const spokenFill = useTween(spokenPct, 820)
  const ceilFill   = useTween(100 - spokenPct, 820)
  return (
    <div className="ldx-elx">
      <div className="ldx-elx-nums">
        <div className="ldx-elx-num"><span className="ldx-elx-k">Spoken</span><span className="ldx-elx-v">{fmt(spoken)}</span></div>
        <div className="ldx-elx-num right"><span className="ldx-elx-k">Ceiling</span><span className="ldx-elx-v hi">{fmt(max)}</span></div>
      </div>
      <div className="ldx-elx-track">
        <div className="ldx-elx-fill" style={{ width: spokenFill + '%' }} />
        <div className="ldx-elx-fill ceil" style={{ left: spokenFill + '%', width: ceilFill + '%' }} />
      </div>
      <div className="ldx-elx-foot">
        <span className="ldx-elx-headpct"><span className="material-symbols-outlined">arrow_upward</span>{headroom}%</span>
        <span className="ldx-elx-headlbl">headroom above stated budget</span>
      </div>
    </div>
  )
}

function Bullets({ rows }: { rows: Array<{ ic?: string; tone?: string; t: string }> }) {
  return (
    <ul className="ldx-bul">
      {rows.map((row) => (
        <li key={row.t} className="ldx-bul-li">
          <span className="ldx-bul-ic" style={{ color: TONE_HEX[row.tone || ''] || 'var(--txt3)' }}><span className="material-symbols-outlined">{row.ic || 'chevron_right'}</span></span>
          <span className="ldx-bul-t">{row.t}</span>
        </li>
      ))}
    </ul>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Viz({ d }: { d: any }) {
  switch (d.viz) {
    case 'playbook':   return <Bullets rows={d.rows} />
    case 'heatmap':    return <Heatmap days={d.days} tag={d.tag} dir={d.dir} />
    case 'daywindow':  return <DayWindow startH={d.startH} endH={d.endH} dayLb={d.dayLb} rate={d.rate} altRate={d.altRate} />
    case 'channels':   return <Channels items={d.items} />
    case 'colbars':    return <ColBars items={d.items} />
    case 'elasticity': return <Elasticity spoken={d.spoken} max={d.max} fmt={d.fmt} headroom={d.headroom} />
    case 'lead':       return <p className="ldx-leadline">{d.rows[0].t}</p>
    case 'stat':
      return (
        <div className="ldx-stat">
          <div className="ldx-stat-main">
            <span className={'ldx-stat-v' + (String(d.v).length > 14 ? ' sm' : '')} style={d.tone ? { color: d.tone } : undefined}>{d.v}</span>
            {d.sectorBadge && <span className={'ldx-vsbadge ' + d.sectorBadge.dir}><span className="material-icons">{d.sectorBadge.dir === 'up' ? 'trending_up' : 'trending_down'}</span>{d.sectorBadge.pct}% vs sector</span>}
          </div>
          {d.sub && <span className="ldx-stat-sub">{d.sub}</span>}
        </div>
      )
    case 'bar':
      return <Bar pct={d.pct} tone={d.tone} vlabel={d.vlabel} />
    case 'wbars':
      return <div className="ldx-wbars">{d.items.map((it: unknown) => { const w = it as { n: string; w: number; tone: string; label?: string | null }; return <WBar key={w.n} it={w} /> })}</div>
    case 'split':
      return (
        <div>
          <div className="ldx-split">{d.parts.map((p: { pct: number; tone: string; label: string }) => <SplitSeg key={p.label} p={p} />)}</div>
          <div className="ldx-split-leg">{d.parts.map((p: { tone: string; label: string; pct: number }) => <span key={p.label}><i style={{ background: p.tone }} />{p.label}<b className="ldx-split-pct"> {Math.round(p.pct)}%</b></span>)}</div>
        </div>
      )
    case 'spark':
      return <Spark points={d.points} dir={d.dir} tag={d.tag} />
    case 'ring':
      return (
        <div className="ldx-ring-row">
          <Ring pct={d.pct} tone={d.tone} />
          {d.label && <span className="ldx-stat-sub">{d.label}</span>}
        </div>
      )
    case 'level':
      return (
        <div style={{ '--tone': d.tone } as React.CSSProperties}>
          <div className="ldx-level">{([0,1,2] as const).map(lvl => <i key={lvl} className={lvl <= d.lv ? 'on' : ''} />)}</div>
          <div className="ldx-level-lb">{d.labels[d.lv]}</div>
        </div>
      )
    case 'dots':
      return (
        <div className="ldx-dots" style={{ '--tone': d.tone } as React.CSSProperties}>
          <span className="ldx-dots-n">{d.n}</span>
          <span className="ldx-dots-row">{
            // eslint-disable-next-line react/no-array-index-key -- dot positions are pure indices with no domain id; transitionDelay depends on index so position IS the identity
            Array.from({length:d.total}).map((_, i) => <i key={i} className={i < d.on ? 'on' : ''} style={{ transitionDelay:(i * 45) + 'ms' }} />)
          }</span>
        </div>
      )
    case 'chips':
      return (
        <div className="ldx-chips">
          {d.items.map((c: { tone: string; t: string }) => {
            const tb = TONEBG[c.tone] || TONEBG.g
            return (
              <span key={c.t} className="ldx-chip lead" style={{ '--ctone':tb[0], '--ctone-bg':tb[1], '--ctone-bd':tb[2] } as React.CSSProperties}>{c.t}</span>
            )
          })}
        </div>
      )
    case 'phrase':
      return (
        <div className="ldx-phrase">
          {d.rows.map((row: { ic?: string; t: string }) => (
            <div key={row.t} className="ldx-phr">
              {row.ic && <span className="material-symbols-outlined">{row.ic}</span>}
              <span>{row.t}</span>
            </div>
          ))}
        </div>
      )
    case 'pill':
      return (
        <span className="ldx-pillval" style={{ '--tone':d.tone, '--tone-bg':d.toneBg, '--tone-bd':d.toneBd } as React.CSSProperties}>
          {d.icon && <span className="material-symbols-outlined">{d.icon}</span>}{d.v}
        </span>
      )
    default:
      return null
  }
}

// ── Horizon widget (loss-risk, two-horizon toggle) ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HorizonWidget({ schema, d }: { schema: { icon: string; label: string }; d: any }) {
  const [hz, setHz] = useState<string>(d.horizons[0].id)
  const cur = d.horizons.find((h: { id: string }) => h.id === hz) || d.horizons[0]
  const hzProxRef = useProximityGroup<HTMLDivElement>()
  return (
    <div className="ldx-w-shell" style={{ '--acc': d.themeAcc || cur.tone } as React.CSSProperties}>
      <section className="ldx-w" style={{ '--acc': d.themeAcc || cur.tone } as React.CSSProperties}>
        <div className="ldx-w-head">
          <span className="ldx-w-ic"><span className="material-symbols-outlined">{schema.icon}</span></span>
          <span className="ldx-w-label">{schema.label}</span>
        </div>
        <div className="ldx-hz" ref={hzProxRef}>
          {d.horizons.map((h: { id: string; label: string }) => (
            <button type="button" key={h.id} className={'ldx-hz-btn' + (h.id === hz ? ' on' : '')} onClick={() => setHz(h.id)} data-proximity>{h.label}</button>
          ))}
        </div>
        <div className="ldx-hz-body"><Bar pct={cur.pct} tone={cur.tone} vlabel={null} /></div>
        <div className="ldx-w-note"><span className="material-symbols-outlined">tips_and_updates</span>{cur.sub}</div>
      </section>
    </div>
  )
}

function StatusStrip({ schema, d }: { schema: { icon: string; label: string }; d: { themeAcc?: string; text: string; sub: string } }) {
  return (
    <div className="ldx-w-shell" style={{ '--acc': d.themeAcc || 'var(--g-l)' } as React.CSSProperties}>
      <section className="ldx-w">
        <div className="ldx-w-head">
          <span className="ldx-w-ic"><span className="material-symbols-outlined">{schema.icon}</span></span>
          <span className="ldx-w-label">{schema.label}</span>
        </div>
        <div className="ldx-status">
          <span className="ldx-status-ic"><span className="material-symbols-outlined">check</span></span>
          <span className="ldx-status-t">{d.text}</span>
          <span className="ldx-status-sub">{d.sub}</span>
        </div>
      </section>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function accentOf(d: any, tier: number): string {
  if (d && d.themeAcc) return d.themeAcc
  if (d) {
    if (d.tone) return d.tone
    if (d.viz === 'split' && d.parts[0]) return d.parts[0].tone
    if (d.viz === 'wbars' && d.items[0]) return d.items[0].tone
    if (d.viz === 'spark') return d.dir === 'up' ? 'var(--g-l)' : 'var(--r-l)'
    if (d.viz === 'chips' && d.items[0]) { const tb = TONEBG[d.items[0].tone]; if (tb) return tb[0] }
  }
  return TIER_ACC[tier] || 'var(--v-l)'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WidgetFooter({ d }: { d: any }) {
  return (
    <>
      {d.compare && (
        <div className={'ldx-cmp ' + d.compare.dir}>
          <span className="ldx-cmp-badge"><span className="material-icons">{d.compare.dir === 'up' ? 'trending_up' : 'trending_down'}</span>{d.compare.pct}%</span>
          <span className="ldx-cmp-lb">{d.compare.label}</span>
        </div>
      )}
      {d.steps && d.steps.length > 0 && (
        <div className="ldx-steps">
          <div className="ldx-steps-k"><span className="material-symbols-outlined">playlist_add_check</span>Recommended next steps</div>
          <ul className="ldx-steps-list">
            {d.steps.map((s: { ic?: string; t: string }) => (
              <li key={s.t}><span className="ldx-steps-ic"><span className="material-symbols-outlined">{s.ic || 'arrow_forward'}</span></span>{s.t}</li>
            ))}
          </ul>
        </div>
      )}
      {d.tip && <div className="ldx-tip"><span className="material-symbols-outlined">tips_and_updates</span><span>{d.tip}</span></div>}
      {d.note && !d.tip && <div className="ldx-w-note"><span className="material-symbols-outlined">info</span>{d.note}</div>}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Widget({ schema, data }: { schema: { id: string; icon: string; label: string; tier: number }; data: any }) {
  if (!data) return null
  // interaction_vel duplicates the Pulse channel_share widget -- suppress in other pills
  if (schema.id === 'interaction_vel') return null
  if (data.viz === 'horizon') return <HorizonWidget schema={schema} d={data} />
  if (data.viz === 'status') return <StatusStrip schema={schema} d={data} />
  const hero = data.hero
  const acc = hero ? 'var(--o-l)' : accentOf(data, schema.tier)
  return (
    <div className={'ldx-w-shell' + (hero ? ' hero' : '')} style={{ '--acc': acc } as React.CSSProperties}>
      <section className="ldx-w">
        <div className="ldx-w-head">
          <span className="ldx-w-ic"><span className="material-symbols-outlined">{hero ? 'neurology' : schema.icon}</span></span>
          <span className="ldx-w-label">{hero ? 'AI verdict' : schema.label}</span>
          {data.viz === 'heatmap' && (
            <span className={'ldx-tagbadge ldx-hm-hd-badge ' + (data.dir === 'up' ? 'up' : 'down')} style={{ marginLeft:'auto' }}>
              <span className="material-icons">{data.dir === 'up' ? 'trending_up' : 'trending_down'}</span>{data.tag}
            </span>
          )}
        </div>
        <Viz d={data} />
        {schema.id !== 'velocity_trend' && schema.id !== 'pulse_summary' && <WidgetFooter d={data} />}
      </section>
    </div>
  )
}

function Skeletons() {
  return (
    <div className="ldx-skel-grid">
      {[0,1,2,3].map(i => (
        <div className="ldx-skel" key={i} style={i % 3 === 0 ? { gridColumn:'1 / -1' } : undefined}>
          <div className="ldx-skel-bar w35" />
          <div className="ldx-skel-bar w80" />
          <div className="ldx-skel-bar w50" />
          <span className="ldx-skel-tag"><span className="ldx-skel-spin" />computing...</span>
        </div>
      ))}
    </div>
  )
}

// ── Collective Skeleton Canvas (Behavior pill) ────────────────────────────────

const TONE_CLASS: Record<string, string> = {
  depth: 'is-depth',
  interest: 'is-interest',
  friction: 'is-friction',
}

function CollectiveSkeletonCanvas() {
  const { activeChannel, setChannel, indicatorPos, containerRef } = useChannelSwitcher('doc')
  const segProxRef = useProximityGroup<HTMLDivElement>()
  const segIndRef = usePillSpring<HTMLSpanElement>(indicatorPos.left, indicatorPos.width)

  return (
    <div className="ldx-canvas">
      {/* Header: channel switcher */}
      <div className="ldx-canvas-head">
        <div
          className="ldx-seg"
          ref={(el) => {
            containerRef(el)
            segProxRef(el)
          }}
        >
          <span className="ldx-seg-ind" ref={segIndRef} style={{ left: 0, transition: 'none' }} />
          <button
            type="button"
            className={'cs-segbtn' + (activeChannel === 'doc' ? ' on' : '')}
            onClick={() => setChannel('doc')}
            data-proximity
          >
            <span className="material-symbols-outlined">description</span>
            Document / PDF
          </button>
          <button
            type="button"
            className={'cs-segbtn' + (activeChannel === 'chat' ? ' on' : '')}
            onClick={() => setChannel('chat')}
            data-proximity
          >
            <span className="material-symbols-outlined">chat</span>
            WhatsApp Chat
          </button>
          <button
            type="button"
            className={'cs-segbtn' + (activeChannel === 'voice' ? ' on' : '')}
            onClick={() => setChannel('voice')}
            data-proximity
          >
            <span className="material-symbols-outlined">call</span>
            Voice Call
          </button>
        </div>
      </div>

      {/* View slots — always mounted, toggled via on class + data-attr */}
      <div className="ldx-views">
        <div className={'ldx-view ldx-view-doc' + (activeChannel === 'doc' ? ' on' : '')} data-channel="doc">
          {/* ldx-doc-inner: positioned ancestor for page skeletons + annotation overlays */}
          <div className="ldx-doc-inner">
            {/* Page skeletons */}
            <div className="ldx-page ldx-page-proposal">
              <div className="ldx-page-bar ldx-page-bar--title" />
              <div className="ldx-page-bar ldx-page-bar--subtitle" />
              <div className="ldx-page-section ldx-page-section--pricing" />
              <div className="ldx-page-bar ldx-page-bar--body" />
              <div className="ldx-page-bar ldx-page-bar--body short" />
              <div className="ldx-page-section ldx-page-section--floor-plan" />
              <div className="ldx-page-bar ldx-page-bar--body" />
              <div className="ldx-page-section ldx-page-section--payment-terms" />
              <div className="ldx-page-bar ldx-page-bar--body short" />
            </div>

            {/* DOC_ANNOTATIONS overlay — absolutely positioned inside ldx-doc-inner */}
            {DOC_ANNOTATIONS.map(anno => (
              <div key={anno.id} className={'ldx-anno ' + (anno.tone === 'depth' ? 'anno-dwell' : anno.tone === 'interest' ? 'anno-scroll' : 'anno-friction')}>
                {anno.tone === 'depth' && (
                  <>
                    <div className="ldx-anno-line" />
                    <div className={'ldx-anno-badge ' + TONE_CLASS[anno.tone]}>{anno.label}</div>
                  </>
                )}
                {anno.tone === 'interest' && (
                  <>
                    <div className="ldx-anno-scroll" />
                    <div className={'ldx-anno-badge ' + TONE_CLASS[anno.tone]}>{anno.label}</div>
                  </>
                )}
                {anno.tone === 'friction' && (
                  <>
                    <div className="ldx-anno-cross" />
                    <div className={'ldx-anno-badge ' + TONE_CLASS[anno.tone]}>{anno.label}</div>
                  </>
                )}
                <div className="ldx-tip">{anno.tooltip}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={'ldx-view ldx-view-chat' + (activeChannel === 'chat' ? ' on' : '')} data-channel="chat">
          <div className="ldx-view-placeholder">
            <span className="material-symbols-outlined">chat</span>
            <span>WhatsApp Chat view coming soon</span>
          </div>
        </div>

        <div className={'ldx-view ldx-view-voice' + (activeChannel === 'voice' ? ' on' : '')} data-channel="voice">
          <div className="ldx-view-placeholder">
            <span className="material-symbols-outlined">call</span>
            <span>Voice Call view coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Depth-tier segmented pill bar ─────────────────────────────────────────────

function SegPills({ pills, active, onSelect }: { pills: Pill[]; active: number; onSelect: (p: Pill) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = usePillIndicator(active, ref)
  const segPillRef = usePillSpring<HTMLSpanElement>(pos.left, pos.width)
  const segPillsProxRef = useProximityGroup<HTMLDivElement>()
  return (
    <div
      className="ldx-seg fill"
      ref={(el) => {
        ref.current = el
        segPillsProxRef(el)
      }}
    >
      <span className="ldx-seg-pill" ref={segPillRef} style={{ left: 0, transition: 'none' }} />
      {pills.map(p => (
        <button type="button" key={p.id} className={'ldx-segbtn' + (p.id === active ? ' on' : '')} onClick={() => onSelect(p)} data-proximity>
          <span className={'ldx-pill-dot t' + p.tier} />
          <span className="ldx-segbtn-lb">{p.label}</span>
        </button>
      ))}
    </div>
  )
}

// ── AI tools panel ────────────────────────────────────────────────────────────

const TOOL_RESPONSES: Record<string, (l: Lead) => string> = {
  'Ghostwrite follow-up': l => `Hi ${l.name.split(' ')[0]}, I wanted to follow up on our last conversation. Based on your interest in the sea-view units you revisited last week, I've shortlisted three listings that match your exact criteria. Would you be free for a quick call this Tuesday between 11:00-13:00? I can walk you through them in 15 minutes.`,
  'Match listings': l => `Based on ${l.name.split(' ')[0]}'s behavior - 87% scroll depth on floor-plan pages, 3 return visits to sea-view listings - I recommend:\n- Sky Villa 4B (${fmtTL(2100000)}) - 94% match\n- Marina Residence 3A (${fmtTL(1850000)}) - 89% match\n- Horizon Penthouse (${fmtTL(2400000)}) - 81% match`,
  'Ghost-buyer check': l => `Buyer authenticity: ${l.score}%. Signals: fast reply via WhatsApp, consistent interest in 2-bedroom units, no generic inquiry patterns detected. No ghost-buyer flags - this lead shows genuine purchase intent.`,
  'Propensity score': l => `${l.name.split(' ')[0]} has a ${l.score}% propensity to convert within 30 days. Primary drivers: high engagement velocity, budget confidence, recent price-comparison behavior. Recommended next: schedule a call Tue 11:00-13:00.`,
  'Patient tone adaptor': () => 'Tone profile: warm & collaborative. Avoid clinical language - lead with empathy, use "we" instead of "you should". Follow up within 48 hours with a personal message.',
}

interface Tool { ic: string; t: string; color: string }

function LeadTools({ ws, lead }: { ws: string; lead: Lead }) {
  const tools: Tool[] = [
    { ic:'neurology',   t:'Ghostwrite follow-up', color:'#8B5CF6' },
    { ic:'travel_explore', t:'Match listings',        color:'#3B82F6' },
    { ic:'plagiarism',     t:'Ghost-buyer check',     color:'#F97316' },
    { ic:'insights',       t:'Propensity score',      color:'var(--brand-primary-500)' },
  ]
  if (ws === 'healthcare') tools.splice(1, 0, { ic:'sentiment_satisfied', t:'Patient tone adaptor', color:'#EAB308' })

  const { chatOpen, thinking, typed, activeTool, openTool, closeChat } = useTypewriter<Tool>()
  const toolsProxRef = useProximityGroup<HTMLDivElement>()
  const chatHeadProxRef = useProximityGroup<HTMLDivElement>()

  // Resolve the deterministic response for a tool, then drive the typewriter.
  function runTool(tool: Tool) {
    const fn = TOOL_RESPONSES[tool.t]
    const full = fn ? fn(lead) : 'Analysis complete.'
    openTool(tool, full)
  }

  return (
    <div className="ldx-tools">
      <div className="ldx-tools-t"><span className="material-symbols-outlined">smart_toy</span>Lead-context AI tools</div>
      {!chatOpen ? (
        <div className="ldx-tools-btns" ref={toolsProxRef}>
          {tools.map((t) => (
            <button type="button" key={t.t} className="ldx-tool-card" style={{ '--tc': t.color } as React.CSSProperties} onClick={() => runTool(t)} data-proximity>
              <span className="ldx-tool-card-ic"><span className="material-symbols-outlined">{t.ic}</span></span>
              <span className="ldx-tool-card-t">{t.t}</span>
              <span className="material-symbols-outlined ldx-tool-arrow">arrow_forward</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="ldx-chat">
          <div className="ldx-chat-head" ref={chatHeadProxRef}>
            <span className="ldx-chat-av" style={{ '--tc': activeTool?.color } as React.CSSProperties}><span className="material-symbols-outlined">{activeTool?.ic}</span></span>
            <div className="ldx-chat-meta">
              <span className="ldx-chat-name">{activeTool?.t}</span>
              <span className="ldx-chat-status">{thinking ? 'Thinking...' : 'Done'}</span>
            </div>
            <button type="button" className="ldx-chat-x" onClick={closeChat} data-proximity><span className="material-icons">close</span></button>
          </div>
          <div className="ldx-chat-body">
            {thinking
              ? <div className="ldx-chat-dots"><span/><span/><span/></div>
              : <p className="ldx-chat-msg">{typed}<span className="ldx-chat-cursor"/></p>
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main popover component ────────────────────────────────────────────────────

export interface LeadPopoverProps {
  lead: Lead
  onClose: () => void
}

export default function LeadPopover({ lead, onClose }: LeadPopoverProps) {
  // State initializes from the mounted `lead`. The parent (LeadsTable) sets
  // `key={lead.id}` so a different lead remounts this component and naturally
  // resets every value below -- no reset effect needed (no-use-effect Rule 5).
  const [pill, setPill] = useState(1)
  const gateProxRef = useProximityGroup<HTMLDivElement>()
  const headTopProxRef = useProximityGroup<HTMLDivElement>()
  const scopeProxRef = useProximityGroup<HTMLDivElement>()
  const moreProxRef = useProximityGroup<HTMLDivElement>()
  // Workspace is fixed at real_estate; no in-popover switcher exists in the
  // source design. Kept as a const so widget/tool filtering still reads `ws`.
  const ws = 'real_estate'
  const [computed, setComputed] = useState<Set<number>>(() => {
    const init = new Set<number>([1])
    if (isActive(lead)) init.add(2)   // tier-1 auto when lead is active
    return init
  })
  const [loading, setLoading] = useState<number | null>(null)
  const [showMore, setShowMore] = useState<Record<number, boolean>>({})
  // deadline is fixed at mount from the lead's cold-drop window. Lazy-init
  // keeps the impure Date.now()/coldDropHours call out of the render path.
  const [deadline] = useState<number | null>(() => {
    const ch = coldDropHours(lead)
    return ch != null ? Date.now() + ch * 3600000 : null
  })
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [edges, setEdges] = useState({ top:false, bottom:false })

  function onBodyScroll() {
    const el = bodyRef.current; if (!el) return
    const st = el.scrollTop, max = el.scrollHeight - el.clientHeight
    const COLLAPSE_AT = 64, EXPAND_AT = 24
    setScrolled(prev => {
      if (prev) return st > EXPAND_AT  // stay collapsed until scrolled back near the top
      // expanded: only collapse if doing so leaves the body still scrollable.
      // The verdict + head-foot collapse to 0; measure their current (expanded)
      // height as the delta the body will gain.
      const card = el.closest('.ldx-card')
      const v = card?.querySelector('.ldx-verdict') as HTMLElement | null
      const hf = card?.querySelector('.ldx-head-foot') as HTMLElement | null
      const collapseDelta = (v?.offsetHeight || 0) + (hf?.offsetHeight || 0)
      return st > COLLAPSE_AT && (max - collapseDelta) > EXPAND_AT + 16
    })
    setEdges({ top: st > 6, bottom: st < max - 6 })
  }

  // 1s countdown tick (re-arms when the per-lead deadline changes).
  const now = useCountdown(deadline)
  // reset scroll + recompute bottom edge when pill/workspace changes.
  useScrollResetOnChange(bodyRef, [pill, ws], setScrolled, setEdges)
  // re-check edge shadows when content height changes.
  useEdgeRecheck(bodyRef, [computed, loading, showMore], setEdges)
  // Esc-to-close keydown subscription.
  useEscToClose(onClose)

  const brain = useBrainStage()

  const metrics: MetricData = buildLeadMetrics(lead)
  const h = healthOf(lead.score)
  const voice = hasVoice(lead)
  const stage = STAGES[lead.stage] || {}
  const curPill = PILLS.find(p => p.id === pill)!

  function startCompute(id: number, ms: number) {
    setLoading(id)
    const t = setTimeout(() => {
      setComputed(s => { const n = new Set(s); n.add(id); return n })
      setLoading(null)
    }, ms)
    timers.current.push(t)
  }
  function selectPill(p: Pill) {
    setPill(p.id)
    if (p.tier === 2 && !computed.has(p.id) && loading == null) startCompute(p.id, 850)
  }
  function recompute(id: number, ms: number) {
    setComputed(s => { const n = new Set(s); n.delete(id); return n })
    startCompute(id, ms)
  }

  // countdown text + escalation level
  let cd: string | null = null, cdLevel = 'cool'
  if (deadline != null) {
    const ms = Math.max(0, deadline - now)
    const hh = Math.floor(ms / 3600000), mm = Math.floor(ms % 3600000 / 60000), ss = Math.floor(ms % 60000 / 1000)
    cd = hh >= 1 ? `${hh}h ${String(mm).padStart(2,'0')}m` : `${mm}m ${String(ss).padStart(2,'0')}s`
    cdLevel = ms < 24 * 3600000 ? 'hot' : ms < 48 * 3600000 ? 'warm' : 'cool'
  }
  const winDelta = weekDelta(lead.id, lead.score)
  const sent = sentimentCat(lead.sentiment)

  const pillSchema = SCHEMA.filter(s => s.pill === pill && s.ws.includes(ws))
  const baseItems = pillSchema.filter(s => !s.more)
  const moreItems = pillSchema.filter(s => s.more)
  const visible = showMore[pill] ? baseItems.concat(moreItems) : baseItems

  let body: React.ReactNode
  if (loading === pill) {
    body = <Skeletons />
  } else if (curPill.tier === 3 && !computed.has(pill)) {
    body = voice ? (
      <div className="ldx-gate" ref={gateProxRef}>
        <div className="ldx-gate-ic t3"><span className="material-symbols-outlined">graphic_eq</span></div>
        <div className="ldx-gate-t">Deep voice & NLP analysis</div>
        <div className="ldx-gate-s">Runs prosody, hesitation and language-pattern models over {lead.name.split(' ')[0]}'s call recordings. This is the most expensive tier - it only runs when you ask.</div>
        <button type="button" className="ldx-gate-btn t3" onClick={() => startCompute(4, 1200)} data-proximity><span className="material-symbols-outlined">bolt</span>Run deep analysis</button>
        <div className="ldx-gate-cost"><span className="material-symbols-outlined">bolt</span>Tier 3 - ~8s - uses voice credits</div>
      </div>
    ) : (
      <div className="ldx-gate" ref={gateProxRef}>
        <div className="ldx-gate-ic gated"><span className="material-symbols-outlined">mic_off</span></div>
        <div className="ldx-gate-t">Insufficient data for voice analysis</div>
        <div className="ldx-gate-s">No call recordings or sufficient message history exist for {lead.name.split(' ')[0]} yet. Voice & deep-NLP metrics stay disabled until there's something to analyze.</div>
        <button type="button" className="ldx-gate-btn t3" disabled><span className="material-symbols-outlined">block</span>Nothing to analyze</button>
        <div className="ldx-gate-cost"><span className="material-symbols-outlined">info</span>Capture a call to unlock this tier</div>
      </div>
    )
  } else if (pill === 2) {
    body = (
      <>
        <CollectiveSkeletonCanvas />
        <LeadTools ws={ws} lead={lead} />
      </>
    )
  } else if (pill === 3) {
    body = (
      <div className={'ldx-brain-stage' + (brain.compact ? ' compact' : '')}>
        <FilterColumn stage={brain} />
        <InteractiveBrain stage={brain} />
        <DetailPanel stage={brain} />
      </div>
    )
  } else {
    body = (
      <>
        <div className="ldx-grid">
          {visible.map(s => <Widget key={s.id} schema={s} data={metrics[s.id]} />)}
        </div>
        {moreItems.length > 0 && !showMore[pill] && (
          <div ref={moreProxRef} style={{ display: 'contents' }}>
            <button type="button" className="ldx-more" onClick={() => setShowMore(s => ({ ...s, [pill]:true }))} data-proximity>
              <span className="material-symbols-outlined">expand_more</span>Show {moreItems.length} more
            </button>
          </div>
        )}
        <LeadTools ws={ws} lead={lead} />
      </>
    )
  }

  const freshComputed = (curPill.tier >= 2) && computed.has(pill) && loading !== pill

  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- custom overlay CSS depends on div; swapping to <dialog> would break fixed-positioning and backdrop layout pixel-identically
    <div className="ldx-overlay open" onClick={onClose} aria-modal="true" role="dialog" aria-label="Lead details">
      <div className="ldx-outer" onClick={e => e.stopPropagation()}>
        <div ref={cardSquircleRef} className={'ldx-card' + (scrolled ? ' compact' : '')} data-screen-label="Lead details popover">

          <div className="ldx-head" style={{ '--hbg': HEALTH[h] } as React.CSSProperties}>
            <div className="ldx-head-top" ref={headTopProxRef}>
              <button type="button" className="ldx-close" onClick={onClose} aria-label="Close" data-proximity><span className="material-icons">close</span></button>
            </div>
            <span className="ldx-health-word">
              <span className="material-symbols-outlined">{h === 'g' ? 'trending_up' : h === 'a' ? 'remove' : 'trending_down'}</span>
              {HEALTH_WORD[h]}
            </span>

            <div className="ldx-id">
              <span className="ldx-av" style={{ '--av': HEALTH[h] } as React.CSSProperties}>{initials(lead.name)}</span>
              <div className="ldx-id-meta">
                <div className="ldx-name-row">
                  <span className="ldx-name">{lead.name}</span>
                  <span className="ldx-badge" style={{ '--bg': stage.dot } as React.CSSProperties}>
                    <span className="material-symbols-outlined">{STAGE_ICON[lead.stage]}</span>{stage.label}
                  </span>
                  <span className="ldx-badge" style={{ '--bg': TEMP[lead.temp].c } as React.CSSProperties}>
                    <span className="material-symbols-outlined">{TEMP[lead.temp].ic}</span>{lead.temp}
                  </span>
                </div>
                <div className="ldx-phone"><span className="material-symbols-outlined">call</span>{lead.phone}</div>
              </div>
            </div>

            <div className="ldx-verdict">
              <div className="ldx-vcard">
                <div className="ldx-vmain">
                  <div className="ldx-vk"><span className="material-symbols-outlined">target</span>Win probability</div>
                  <div className="ldx-vrow">
                    <span className="ldx-vnum">{lead.score}<span className="ldx-vpct">%</span></span>
                    {winDelta === 0 ? (
                      <span className="ldx-vdelta flat"><span className="material-icons">remove</span>flat</span>
                    ) : (
                      <span className={'ldx-vdelta ' + (winDelta > 0 ? 'up' : 'down')}>
                        <span className="material-icons">{winDelta > 0 ? 'trending_up' : 'trending_down'}</span>
                        {winDelta > 0 ? '+' : '-'}{Math.abs(winDelta)} pts
                      </span>
                    )}
                  </div>
                  <div className="ldx-vbar"><i style={{ width: lead.score + '%' }} /></div>
                  <div className="ldx-vbar-cap">vs last week</div>
                </div>
                <div className="ldx-vside">
                  <div className="ldx-vstat">
                    <div className="ldx-vk"><span className="material-symbols-outlined">account_balance_wallet</span>Pipeline value</div>
                    <div className="ldx-vval">{lead.value ? fmtTL(lead.value) : '-'}</div>
                  </div>
                  <div className="ldx-vstat">
                    <div className="ldx-vk"><span className="material-symbols-outlined">diamond</span>Pipeline LTV</div>
                    <div className="ldx-vval">{lead.ltv ? fmtTL(lead.ltv) : '-'}</div>
                  </div>
                  <div className="ldx-vstat">
                    <div className="ldx-vk"><span className="material-symbols-outlined">{sent.ic}</span>Sentiment</div>
                    <div className="ldx-vval sm">{sent.word}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ldx-head-foot">
              <span className="ldx-pin">
                <span className="material-symbols-outlined">schedule</span>
                {Math.round(lead.last / 1440) < 1 ? 'touched today' : Math.round(lead.last / 1440) + 'd since contact'}
              </span>
              {cd && (
                <span className={'ldx-countdown lv-' + cdLevel}>
                  <span className="material-symbols-outlined">{cdLevel === 'hot' ? 'priority_high' : 'hourglass_bottom'}</span>
                  Cold-drop in {cd}
                </span>
              )}
            </div>
          </div>

          <div className="ldx-pills">
            <SegPills pills={PILLS} active={pill} onSelect={selectPill} />
          </div>

          <div className={'ldx-bodywrap' + (edges.top ? ' fade-top' : '') + (edges.bottom ? ' fade-bottom' : '')}>
            <div className="ldx-body" ref={bodyRef} onScroll={onBodyScroll}>
              <div className="ldx-scope" ref={scopeProxRef}>
                <span className="ldx-scope-lb">
                  <span className="material-symbols-outlined">monitoring</span>
                  {curPill.tier === 0 ? 'Auto-computed signals' : curPill.tier === 1 ? 'Behavioral logs' : curPill.tier === 2 ? 'AI profiling' : 'Voice & NLP'}
                </span>
                <span className="ldx-scope-meta">
                  <span className="material-symbols-outlined">update</span>
                  {curPill.tier === 0 ? 'updated 2h ago' : (freshComputed ? 'updated just now' : 'updated recently')}
                </span>
                {freshComputed && (
                  <button type="button" className="ldx-recompute" onClick={() => recompute(pill, 850)} data-proximity>
                    <span className="material-symbols-outlined">refresh</span>Recompute
                  </button>
                )}
              </div>
              {body}
            </div>
            <div className="ldx-edge top" aria-hidden="true" />
            <div className="ldx-edge bot" aria-hidden="true" />
          </div>

        </div>
      </div>
    </div>
  )
}
