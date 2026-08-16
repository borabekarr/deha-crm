import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './BuyerBrain.css'

// ---------------------------------------------------------------------------
// Buyer-Brain Qualification — Deha Design System
// Fidelity conversion of
// apps/web/design-system/claude-design/raw/buyer-brain/buyer-brain.html
// per CONVERSION-SOP.md. Every class name, DOM node, geometry expression,
// duration, easing and colour is byte-preserved from that source; the raw
// file's imperative build loop (document.createElement in a REGIONS.forEach)
// is expressed here as the same arithmetic evaluated once at module scope and
// rendered declaratively, in the same DOM order the loop produced.
//
// Excluded from the port (authoring/page chrome, same precedent as
// SiriOrb.tsx): the raw page's fixed `.bbq-darktoggle` button (it drives
// html.dark, which the app owns) and the trailing preview/_slowmo.js script.
// The raw file's `.bbq-head` / `.bbq-tabs` CSS has no markup behind it — the
// source ships no header or tab row in <body>, so the port ships none either
// (the CSS is carried over verbatim regardless, per byte-preservation).
//
// No motion tokenization in this pass: durations and easings stay source
// literals, as the plan step directs.
// ---------------------------------------------------------------------------

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

const VARIANTS = ['main'] as const
const variant = VARIANTS[0]

// ─── source helpers ────────────────────────────────────────────────────────
function lumOf(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}
function isLight(hex: string) {
  return lumOf(hex) > 0.64
}

/* grid seams (master px, 800 canvas) — used for rectangular hit zones */
const COL = [0, 302, 496, 800]
const ROW = [0, 281, 497, 800]
/* brain box within stage (px) */
const BL = 130
const BT = 31
const BW = 300
const M2D = BW / 800

interface PieceInfo {
  u: string
  fcx: number
  fcy: number
  ccx: number
  ccy: number
  nw: number
  nh: number
  s: number
}

/* per-piece cutout: image + footprint centroid in reference (fcx/fcy, master px),
   cutout's own alpha centroid (ccx/ccy, native px), native size (nw/nh),
   and native→reference linear scale (s). Pieces assemble into the brain from these alone. */
const PIECE: Record<string, PieceInfo> = {
  aspirations: { u: 'https://i.postimg.cc/rsNcMGSG/PNG-image.png', fcx: 236.6, fcy: 184.6, ccx: 158.1, ccy: 212.5, nw: 297, nh: 374, s: 0.6222 },
  challenges: { u: 'https://i.postimg.cc/ZnxZ4P8t/PNG-image-2.png', fcx: 398.5, fcy: 153.6, ccx: 135.8, ccy: 206.9, nw: 269, nh: 385, s: 0.7477 },
  values: { u: 'https://i.postimg.cc/j24Kt6zh/PNG-image-3.png', fcx: 563.2, fcy: 182, ccx: 134.3, ccy: 212.1, nw: 291, nh: 374, s: 0.6306 },
  fears: { u: 'https://i.postimg.cc/prJxRQDG/PNG-image-4.png', fcx: 206.6, fcy: 390.5, ccx: 153.7, ccy: 167, nw: 302, nh: 332, s: 0.6673 },
  preferences: { u: 'https://i.postimg.cc/3NF7Yjgf/PNG-image-5.png', fcx: 398.5, fcy: 388.5, ccx: 148.7, ccy: 166.6, nw: 297, nh: 333, s: 0.6673 },
  dislikes: { u: 'https://i.postimg.cc/1XrPs0p2/PNG-image-6.png', fcx: 593, fcy: 390.1, ccx: 144.5, ccy: 167.9, nw: 299, nh: 334, s: 0.6761 },
  influencers: { u: 'https://i.postimg.cc/BbBs45xr/PNG-image-7.png', fcx: 226.5, fcy: 596.3, ccx: 168.3, ccy: 162.1, nw: 309, nh: 379, s: 0.6464 },
  keywords: { u: 'https://i.postimg.cc/tJjyKvVS/PNG-image-8.png', fcx: 398.5, fcy: 624.5, ccx: 142.8, ccy: 182.8, nw: 287, nh: 390, s: 0.7086 },
  purchase_factors: { u: 'https://i.postimg.cc/C5gY3rfr/PNG-image-9.png', fcx: 571.3, fcy: 596.7, ccx: 141.3, ccy: 162.8, nw: 311, nh: 379, s: 0.6511 },
}

type Side = 'left' | 'right' | 'top-l' | 'top-r' | 'bottom'

interface Region {
  id: string
  r: number
  c: number
  side: Side
  icon: string
  acc: string
  label: string
  title: string
  blurb: string
  chips: string[]
}

const REGIONS: Region[] = [
  {
    id: 'aspirations', r: 0, c: 0, side: 'left', icon: 'rocket_launch', acc: '#fd5969',
    label: 'Aspirations', title: 'ASPIRATIONS',
    blurb: 'Driven by the goal of building lasting generational wealth through premium real-estate assets. Wants a property that signals success and opens doors to a broader investor network.',
    chips: ['Generational wealth', 'Prestige address', 'Portfolio growth', 'Legacy asset', 'Social proof'],
  },
  {
    id: 'challenges', r: 0, c: 1, side: 'top-l', icon: 'sync_problem', acc: '#fdd02c',
    label: 'Challenges', title: 'CHALLENGES',
    blurb: 'Navigating competing demands on capital while under time pressure from a narrowing window in the current market cycle. Needs clear ROI evidence before committing.',
    chips: ['Capital allocation', 'Market timing', 'ROI uncertainty', 'Time pressure', 'Competing offers'],
  },
  {
    id: 'values', r: 0, c: 2, side: 'right', icon: 'verified', acc: '#fe8a01',
    label: 'Values', title: 'VALUES',
    blurb: 'Places a high premium on transparency and long-term relationships with advisors. Expects a consultant who respects their time and delivers concise, evidence-backed recommendations.',
    chips: ['Transparency', 'Reliability', 'Long-term view', 'Respect for time', 'Honest counsel'],
  },
  {
    id: 'fears', r: 1, c: 0, side: 'left', icon: 'crisis_alert', acc: '#b0e731',
    label: 'Fears', title: 'FEARS',
    blurb: 'Deeply concerned about overpaying in a softening micro-market and locking liquidity into an asset that proves hard to exit. Off-plan delays rank as a secondary anxiety.',
    chips: ['Overpaying', 'Illiquidity', 'Off-plan delays', 'Hidden fees', 'Regret risk'],
  },
  {
    id: 'preferences', r: 1, c: 1, side: 'top-r', icon: 'tune', acc: '#35e895',
    label: 'Preferences', title: 'PREFERENCES',
    blurb: 'Prefers concise WhatsApp summaries over long email chains and values a single point of contact rather than handoffs between agents. Likes to see data before the pitch.',
    chips: ['WhatsApp', 'Single contact', 'Data-first', 'Brief updates', 'Sea-view units'],
  },
  {
    id: 'dislikes', r: 1, c: 2, side: 'right', icon: 'thumb_down', acc: '#14aafe',
    label: 'Dislikes', title: 'DISLIKES',
    blurb: 'Loses confidence quickly when agents push urgency without evidence or repeat information already shared. Cold-call outreach at off-hours registers as a hard negative.',
    chips: ['False urgency', 'Repeat pitching', 'Off-hours calls', 'Vague timelines', 'Over-communication'],
  },
  {
    id: 'influencers', r: 2, c: 0, side: 'left', icon: 'groups', acc: '#a437eb',
    label: 'Influencers', title: 'KEY INFLUENCERS',
    blurb: 'Financial partner and spouse carry decisive weight; no major purchase moves without their alignment. A trusted accountant also shapes the final capital-allocation decision.',
    chips: ['Spouse', 'Financial partner', 'Accountant', 'Peer investors', 'Online reviews'],
  },
  {
    id: 'keywords', r: 2, c: 1, side: 'bottom', icon: 'label', acc: '#fc6d99',
    label: 'Keywords', title: 'KEY WORDS & PHRASES',
    blurb: "Repeatedly anchors on yield, resale liquidity, and handover timeline in both written and verbal exchanges. Reacts positively to 'locked-in price' and 'title-deed ready'.",
    chips: ['Yield %', 'Resale liquidity', 'Handover timeline', 'Locked-in price', 'Title-deed ready', 'No hidden fees'],
  },
  {
    id: 'purchase_factors', r: 2, c: 2, side: 'right', icon: 'fact_check', acc: '#4a65f2',
    label: 'Purchase Factors', title: 'PURCHASE DECISION FACTORS',
    blurb: 'Location quality and projected rental yield are the primary gatekeepers; developer track record and payment-plan flexibility are secondary but required. Brand prestige tips close decisions.',
    chips: ['Location score', 'Rental yield', 'Developer track record', 'Payment plan', 'Brand prestige', 'Exit liquidity'],
  },
]

// brain centre (box px) = mean of piece footprint centroids — black backings shift toward it
const BCX = (Object.keys(PIECE).reduce((a, k) => a + PIECE[k].fcx, 0) / Object.keys(PIECE).length) * M2D
const BCY = (Object.keys(PIECE).reduce((a, k) => a + PIECE[k].fcy, 0) / Object.keys(PIECE).length) * M2D

// Same arithmetic the raw REGIONS.forEach build loop runs, hoisted to module
// scope — it depends on nothing but the constants above.
interface Geom {
  rg: Region
  light: boolean
  cx: number
  cy: number
  pieceStyle: CSSProperties
  bgStyle: CSSProperties
  hitStyle: CSSProperties
  labelStyle: CSSProperties
  points: string
}

const GEOM: Geom[] = REGIONS.map((rg) => {
  const cellCx = (COL[rg.c] + COL[rg.c + 1]) / 2
  const cellCy = (ROW[rg.r] + ROW[rg.r + 1]) / 2 // master px
  const boxCx = cellCx * M2D
  const boxCy = cellCy * M2D // within 300px brain box
  const cx = BL + boxCx
  const cy = BT + boxCy // stage px (leader target)

  // organic cutout piece (assembled; in-place zoom on hover)
  const pcInfo = PIECE[rg.id]
  const s = pcInfo.s * M2D // native px -> display px
  const pw = pcInfo.nw * s
  const ph = pcInfo.nh * s
  const pleft = pcInfo.fcx * M2D - pcInfo.ccx * s // align cutout centroid to footprint centroid
  const ptop = pcInfo.fcy * M2D - pcInfo.ccy * s
  // zoom about the piece centroid so it grows in place (no lift)
  const ox = (pcInfo.ccx / pcInfo.nw) * 100 + '%'
  const oy = (pcInfo.ccy / pcInfo.nh) * 100 + '%'
  const box: CSSProperties = {
    width: pw + 'px',
    height: ph + 'px',
    left: pleft + 'px',
    top: ptop + 'px',
    ['--ox' as string]: ox,
    ['--oy' as string]: oy,
  }

  // black backing (same shape) shifted inward toward brain centre + a hair larger
  // — fills seam gaps between pieces without ringing the outer edge
  const _dx = BCX - boxCx
  const _dy = BCY - boxCy
  const _d = Math.sqrt(_dx * _dx + _dy * _dy) || 1
  const _off = 6
  const bgStyle: CSSProperties = {
    ...box,
    transform: 'translate(' + ((_dx / _d) * _off).toFixed(2) + 'px,' + ((_dy / _d) * _off).toFixed(2) + 'px) scale(1.03)',
  }

  // transparent rectangular hit zone (interaction + keyboard)
  const hitStyle: CSSProperties = {
    left: COL[rg.c] * M2D + 'px',
    top: ROW[rg.r] * M2D + 'px',
    width: (COL[rg.c + 1] - COL[rg.c]) * M2D + 'px',
    height: (ROW[rg.r + 1] - ROW[rg.r]) * M2D + 'px',
    ['--acc' as string]: rg.acc,
  }

  // label
  const LH = 26
  const labelStyle: CSSProperties = { ['--acc' as string]: rg.acc }
  let conn: [number, number]
  if (rg.side === 'left') {
    labelStyle.right = 560 - 118 + 'px'
    labelStyle.top = cy - LH / 2 + 'px'
    conn = [118, cy]
  } else if (rg.side === 'right') {
    labelStyle.left = '444px'
    labelStyle.top = cy - LH / 2 + 'px'
    conn = [442, cy]
  } else if (rg.side === 'top-l') {
    labelStyle.left = '196px'
    labelStyle.top = '2px'
    labelStyle.transform = 'translateX(-50%)'
    conn = [cx, 20]
  } else if (rg.side === 'top-r') {
    labelStyle.left = '360px'
    labelStyle.top = '2px'
    labelStyle.transform = 'translateX(-50%)'
    conn = [cx, 22]
  } else {
    labelStyle.left = cx + 'px'
    labelStyle.top = '338px'
    labelStyle.transform = 'translateX(-50%)'
    conn = [cx, 336]
  }

  // leader polyline (elbow)
  let points: string
  if (rg.side === 'left' || rg.side === 'right') {
    const mx = (conn[0] + cx) / 2
    points = conn[0] + ',' + conn[1] + ' ' + mx + ',' + conn[1] + ' ' + cx + ',' + cy
  } else {
    const my = (conn[1] + cy) / 2
    points = conn[0] + ',' + conn[1] + ' ' + conn[0] + ',' + my + ' ' + cx + ',' + cy
  }

  return { rg, light: isLight(rg.acc), cx, cy, pieceStyle: box, bgStyle, hitStyle, labelStyle, points }
})

const BY_INDEX: Record<string, number> = {}
GEOM.forEach((g, i) => {
  BY_INDEX[g.rg.id] = i
})

// ─── component ─────────────────────────────────────────────────────────────
type BlurbPhase = 'think' | 'typing' | 'done'

export default function BuyerBrain() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  // Mirrors the raw `detail.innerHTML=''` teardown 300ms after close: the card
  // stays mounted through the collapse transition, then unmounts.
  const [cardId, setCardId] = useState<string | null>(null)
  const [phase, setPhase] = useState<BlurbPhase>('think')
  const [typed, setTyped] = useState('')

  const hitRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rmRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const clearT = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (closeRef.current) clearTimeout(closeRef.current)
  }, [])

  const activeId = hoverId || selectedId
  const focused = !!activeId

  const closeDetail = useCallback(() => {
    clearT()
    setSelectedId(null)
    if (closeRef.current) clearTimeout(closeRef.current)
    closeRef.current = setTimeout(() => {
      setCardId(null)
    }, rmRef.current ? 0 : 300)
  }, [clearT])

  const select = useCallback(
    (id: string) => {
      if (!(id in BY_INDEX)) return
      const rg = REGIONS[BY_INDEX[id]]
      if (closeRef.current) {
        clearTimeout(closeRef.current)
        closeRef.current = null
      }
      clearT()
      setSelectedId(id)
      setCardId(id)
      if (rmRef.current) {
        setPhase('done')
        setTyped(rg.blurb)
        return
      }
      setPhase('think')
      setTyped('')
      // raw: 400ms think delay, then one character every 14ms
      timerRef.current = setTimeout(() => {
        const txt = rg.blurb
        let i = 0
        setPhase('typing')
        const step = () => {
          setTyped(txt.slice(0, i))
          if (i <= txt.length) {
            i++
            timerRef.current = setTimeout(step, 14)
          } else {
            setTyped(txt)
            setPhase('done')
          }
        }
        step()
      }, 400)
    },
    [clearT]
  )

  const onHitKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, idx: number) => {
    const k = e.key
    const rg = REGIONS[idx]
    if (k === 'Enter' || k === ' ') {
      e.preventDefault()
      select(rg.id)
    } else if (k === 'Escape') {
      closeDetail()
      hitRefs.current[rg.id]?.blur()
    } else if (k === 'ArrowRight' || k === 'ArrowDown') {
      e.preventDefault()
      hitRefs.current[REGIONS[(idx + 1) % REGIONS.length].id]?.focus()
    } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
      e.preventDefault()
      hitRefs.current[REGIONS[(idx - 1 + REGIONS.length) % REGIONS.length].id]?.focus()
    }
  }

  const cardRegion = cardId ? REGIONS[BY_INDEX[cardId]] : null
  const cardLight = cardRegion ? isLight(cardRegion.acc) : false

  return (
    <div className="buyer-brain-root" data-variant={variant}>
      <div className="bbq-card" data-screen-label="Buyer-Brain Qualification">
        <div className="bbq-panel">
          <div className="bbq-behaviour" id="panelBehaviour">
            <div className="ph">
              <span className="material-symbols-outlined">ads_click</span>Behaviour timeline lives here
            </div>
          </div>

          <div className={'bbq-qual show' + (selectedId ? ' detail-open' : '')} id="panelQual">
            <div className={'bbq-stage' + (focused ? ' focused' : '')} id="stage">
              <div className={'bbq-brain' + (focused ? ' focused' : '')} id="brain">
                <div className="bbq-brainbg">
                  {GEOM.map((g) => (
                    <img
                      key={g.rg.id}
                      className="bbq-piecebg"
                      src={PIECE[g.rg.id].u}
                      alt=""
                      aria-hidden="true"
                      style={g.bgStyle}
                    />
                  ))}
                </div>
                {GEOM.map((g, idx) => (
                  <Fragment key={g.rg.id}>
                    <img
                      className={'bbq-piece' + (activeId === g.rg.id ? ' on' : '')}
                      data-id={g.rg.id}
                      alt=""
                      src={PIECE[g.rg.id].u}
                      style={{ ...g.pieceStyle, ['--acc' as string]: g.rg.acc }}
                    />
                    <button
                      className="bbq-hit"
                      data-id={g.rg.id}
                      aria-label={g.rg.title}
                      tabIndex={0}
                      style={g.hitStyle}
                      ref={(el) => {
                        hitRefs.current[g.rg.id] = el
                      }}
                      onMouseEnter={() => setHoverId(g.rg.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => select(g.rg.id)}
                      onFocus={() => setHoverId(g.rg.id)}
                      onBlur={() => {
                        if (!selectedId) setHoverId(null)
                      }}
                      onKeyDown={(e) => onHitKeyDown(e, idx)}
                    />
                  </Fragment>
                ))}
              </div>
              <svg id="lineSvg" viewBox="0 0 560 362" preserveAspectRatio="none" aria-hidden="true">
                {GEOM.map((g) => (
                  <Fragment key={g.rg.id}>
                    <polyline
                      className={'bbq-line' + (activeId === g.rg.id ? ' on' : '')}
                      style={{ ['--acc' as string]: g.rg.acc }}
                      points={g.points}
                    />
                    <circle
                      className={'bbq-knob' + (activeId === g.rg.id ? ' on' : '')}
                      r="3.2"
                      cx={g.cx}
                      cy={g.cy}
                      style={{ ['--acc' as string]: g.rg.acc }}
                    />
                  </Fragment>
                ))}
              </svg>
              {GEOM.map((g) => (
                <button
                  key={g.rg.id}
                  className={
                    'bbq-label' + (g.light ? ' lighttext' : '') + (activeId === g.rg.id ? ' on' : '')
                  }
                  data-id={g.rg.id}
                  style={g.labelStyle}
                  onMouseEnter={() => setHoverId(g.rg.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => select(g.rg.id)}
                >
                  <span className="material-symbols-outlined">{g.rg.icon}</span>
                  {g.rg.label}
                </button>
              ))}
            </div>

            <div className="bbq-detail" id="detail">
              {cardRegion && (
                <div
                  className={'bbq-detail-card' + (cardLight ? ' lighttext' : '')}
                  style={{ ['--acc' as string]: cardRegion.acc }}
                >
                  <button
                    className="bbq-back"
                    aria-label="Back to brain"
                    onClick={() => {
                      const id = cardRegion.id
                      closeDetail()
                      hitRefs.current[id]?.focus()
                    }}
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div className="bbq-band">
                    <div className="bbq-band-ic">
                      <span className="material-symbols-outlined">{cardRegion.icon}</span>
                    </div>
                    <div className="bbq-band-tx">
                      <div className="kicker">AI Profiling</div>
                      <div className="ttl">{cardRegion.title}</div>
                    </div>
                  </div>
                  <div className="bbq-detail-body">
                    <div className="bbq-blurb" id="blurb">
                      {phase === 'think' && (
                        <span className="bbq-think">
                          <span />
                          <span />
                          <span />
                        </span>
                      )}
                      {phase === 'typing' && (
                        <>
                          <span id="bt">{typed}</span>
                          <span className="bbq-caret" />
                        </>
                      )}
                      {phase === 'done' && cardRegion.blurb}
                    </div>
                    <div
                      className="bbq-chips"
                      id="chips"
                      style={{ visibility: phase === 'done' ? 'visible' : 'hidden' }}
                    >
                      {phase === 'done' &&
                        cardRegion.chips.map((c, i) => (
                          <span
                            key={c}
                            className="bbq-chip"
                            style={{ animationDelay: (rmRef.current ? 0 : i * 45) + 'ms' }}
                          >
                            {c}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
