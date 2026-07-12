import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DynamicIslandReader.css'
import { useState, useCallback, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import {
  RM,
  type DiMode,
  type DiAccent,
  type DiShowMode,
  type DiPillStyle,
  dirScrollerRef,
  cleanupDirScroller,
  updateDirCollapseIdle,
  dirFillGlowReplay,
} from './dynamic-island-reader-hook'

// ---------------------------------------------------------------------------
// Dynamic Island Reader
// Light-mode article with animated Dynamic Island reading-progress indicator.
// Port of dynamic-island-reader.html + reader-island.jsx
// No raw effect calls — all DOM side-effects live in dynamic-island-reader-hook.ts
// ---------------------------------------------------------------------------

// ---- accent palettes -------------------------------------------------------
const ACCENTS: Record<DiAccent, { base: string; bright: string; glow: string }> = {
  emerald: { base: 'var(--brand-primary-500)', bright: 'var(--brand-primary-400)', glow: 'var(--brand-glow)' },
  blue:    { base: '#3B82F6', bright: '#60A5FA', glow: 'rgba(59,130,246,0.55)' },
  violet:  { base: '#8B5CF6', bright: '#A78BFA', glow: 'rgba(139,92,246,0.55)' },
  amber:   { base: '#F59E0B', bright: '#FBBF24', glow: 'rgba(245,158,11,0.55)' },
}

// ---- article content -------------------------------------------------------
const ARTICLE = {
  category: 'Craft',
  title: 'The Quiet Craft of Interface Motion',
  author: 'Mara Lindqvist',
  initials: 'ML',
  date: 'May 29, 2026',
  readMin: 6,
  blocks: [
    { t: 'p', x: 'Good motion is the part of an interface you are not supposed to notice. It does its work in the gaps between taps — softening a transition, hinting at where a thing came from, telling you that the system heard you. When it is done well, people describe the product as "fast" or "polished" without ever pointing at the animation itself.' },
    { t: 'h', x: 'Motion is meaning' },
    { t: 'p', x: 'Every movement on screen is a small sentence. A panel that slides up from the bottom says it is temporary and dismissible. A card that scales out of a list says "this is the same object, now larger." Break that grammar — animate a modal in from the left for no reason — and users feel the friction even if they cannot name it.' },
    { t: 'p', x: 'So the first question is never "what should move?" but "what does this movement say?" If the answer is nothing, the honest choice is stillness.' },
    { t: 'quote', x: 'Animation is not decoration laid on top of a screen. It is the continuity of the screen itself.' },
    { t: 'h', x: 'The two-hundred-millisecond window' },
    { t: 'p', x: 'There is a narrow band of time — roughly 150 to 300 milliseconds — where transitions feel responsive rather than sluggish or jarring. Faster than that and the eye misses the connection between before and after. Slower, and the interface starts to feel like it is wading through syrup.' },
    { t: 'p', x: 'Most micro-interactions should live near the bottom of that window. A button depressing, a chip toggling, a row expanding: 180 to 220 milliseconds is plenty. Reserve the longer durations for larger spatial changes, where the eye genuinely needs the extra time to follow an object across the screen.' },
    { t: 'h', x: 'Easing is editorial' },
    { t: 'p', x: 'Linear motion almost never feels right, because nothing in the physical world starts and stops instantly. The easing curve is where you inject character. A gentle ease-out lands things softly and reads as calm and trustworthy. A slight overshoot — a spring that settles just past its target — reads as playful and alive.' },
    { t: 'p', x: 'The trick is consistency. Pick two or three curves and use them everywhere: one for entrances, one for exits, one for the occasional celebratory moment. A system with a coherent motion vocabulary feels designed; a system with a different curve on every element feels accidental.' },
    { t: 'quote', x: 'Restraint is the most advanced motion technique there is.' },
    { t: 'h', x: 'Restraint as a feature' },
    { t: 'p', x: 'The temptation, once you have a good animation engine, is to animate everything. Resist it. Motion draws the eye, and an eye pulled in ten directions at once sees nothing. The most sophisticated interfaces spend their motion budget carefully — one well-orchestrated moment of delight beats a dozen competing twitches.' },
    { t: 'p', x: 'A reading-progress indicator is a perfect example. It should appear when it is useful, report quietly while you read, and celebrate exactly once, at the finish line. Everything else is noise.' },
    { t: 'h', x: 'Designing for the finish' },
    { t: 'p', x: 'The end of an article is a genuine accomplishment for the reader, and it deserves a small, honest reward — a fill that completes, a check that lands, a brief burst of color that fades before it overstays its welcome. The reward works precisely because the rest of the experience was restrained.' },
    { t: 'p', x: 'That is the whole craft, really: knowing the difference between motion that serves the reader and motion that serves the designer\'s ego. Get that right, and the interface disappears, leaving only the words — which is exactly where the reader wanted to be all along.' },
    { t: 'end', x: 'You\'ve reached the end.' },
  ],
}

// ---- confetti pieces — generated once at module load (stable, never impure during render) ----
// Each accent generates its own set so swapping accent shows new colours.
type ConfettiPiece = {
  tx: string; ty: string; rot: string; color: string; delay: number; round: boolean; id: string
}
function makeConfettiPieces(accent: DiAccent): ConfettiPiece[] {
  const a = ACCENTS[accent]
  const cols = [a.base, a.bright, '#FFFFFF', '#FBBF24', a.base]
  return Array.from({ length: 14 }, (_, i) => {
    const ang = Math.PI * 2 * i / 14 + (Math.random() - 0.5)
    const dist = 26 + Math.random() * 26
    return {
      tx: Math.cos(ang) * dist + 'px',
      ty: Math.sin(ang) * dist - 6 + 'px',
      rot: Math.random() * 360 - 180 + 'deg',
      color: cols[i % cols.length],
      delay: Math.random() * 60,
      round: Math.random() > 0.5,
      id: `cp-${accent}-${i}`,
    }
  })
}
// Pre-generate for all accents so useMemo never calls Math.random during render
const CONFETTI_PIECES: Record<DiAccent, ConfettiPiece[]> = {
  emerald: makeConfettiPieces('emerald'),
  blue:    makeConfettiPieces('blue'),
  violet:  makeConfettiPieces('violet'),
  amber:   makeConfettiPieces('amber'),
}

// ---- iOS signal bar heights (stable constant) ----
const SIGNAL_BARS: Array<{ height: number; id: string; dim: boolean }> = [
  { height: 3, id: 'sb-0', dim: false },
  { height: 4, id: 'sb-1', dim: false },
  { height: 5, id: 'sb-2', dim: false },
  { height: 6, id: 'sb-3', dim: true },
]

// ---- sub-components --------------------------------------------------------

interface ArticleBodyProps {
  accent: DiAccent
  dark: boolean
}

function ArticleBody({ accent, dark }: ArticleBodyProps) {
  const fg1 = dark ? '#F5F5F5' : '#111111'
  const fg2 = dark ? '#D4D4D4' : '#232323'
  const fg3 = dark ? '#A1A1A1' : '#6B6B6B'
  const hair = dark ? 'rgba(161,161,161,0.18)' : '#EEF1F5'
  const a = ACCENTS[accent] || ACCENTS.emerald

  return (
    <div style={{ padding: '70px 26px 64px', boxSizing: 'border-box' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 11px', borderRadius: 999,
        background: dark ? 'color-mix(in srgb, var(--brand-primary-500) 16%, transparent)' : a.base,
        color: dark ? a.bright : '#fff',
        fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
        boxShadow: dark ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1.5px 0 rgba(0,0,0,0.14)',
      }}>{ARTICLE.category}</span>

      <h1 style={{
        margin: '16px 0 0', fontSize: 28, fontWeight: 900, lineHeight: 1.12,
        letterSpacing: '-0.025em', color: fg1, textWrap: 'pretty' as const,
      }}>{ARTICLE.title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 18 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${a.bright}, ${a.base})`,
          display: 'grid', placeItems: 'center',
          color: '#fff', fontSize: 13, fontWeight: 800,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
        }}>{ARTICLE.initials}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: fg1 }}>{ARTICLE.author}</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: fg3 }}>
            {ARTICLE.date} · {ARTICLE.readMin} min read
          </span>
        </div>
      </div>

      <div style={{
        marginTop: 22, height: 188, borderRadius: 18, overflow: 'hidden',
        position: 'relative', border: `1px solid ${hair}`,
        background: dark ? '#0E1626' : '#F6F8FB',
        backgroundImage: `repeating-linear-gradient(135deg, ${dark ? 'rgba(161,161,161,0.10)' : 'rgba(17,17,17,0.05)'} 0 10px, transparent 10px 20px)`,
        display: 'grid', placeItems: 'center',
      }}>
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 11, fontWeight: 600, color: fg3,
          background: dark ? 'rgba(14,22,38,0.8)' : 'rgba(255,255,255,0.8)',
          padding: '5px 10px', borderRadius: 8, letterSpacing: '0.04em',
        }}>cover · 16:9</span>
      </div>

      <div style={{ marginTop: 26 }}>
        {ARTICLE.blocks.map((b) => {
          if (b.t === 'h') return (
            <h2 key={b.x} style={{
              margin: '30px 0 0', fontSize: 19, fontWeight: 800,
              letterSpacing: '-0.015em', color: fg1, lineHeight: 1.25,
            }}>{b.x}</h2>
          )
          if (b.t === 'quote') return (
            <blockquote key={b.x} style={{
              margin: '28px 0', padding: '4px 0 4px 18px',
              borderLeft: `3px solid ${a.base}`,
              fontSize: 18, fontWeight: 600, fontStyle: 'italic',
              lineHeight: 1.45, color: fg1, letterSpacing: '-0.01em', textWrap: 'pretty' as const,
            }}>{b.x}</blockquote>
          )
          if (b.t === 'end') return (
            <div key={b.x} style={{
              margin: '40px 0 0', padding: '20px', borderRadius: 16,
              border: `1px dashed ${dark ? 'color-mix(in srgb, var(--brand-primary-500) 40%, transparent)' : a.base}`,
              background: dark ? 'color-mix(in srgb, var(--brand-primary-500) 8%, transparent)' : a.base + '12',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: a.base }}>check_circle</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: fg1 }}>{b.x}</span>
            </div>
          )
          return (
            <p key={b.x.slice(0, 40)} style={{
              margin: '14px 0 0', fontSize: 15.5, fontWeight: 500,
              lineHeight: 1.72, color: fg2, textWrap: 'pretty' as const,
              letterSpacing: '-0.003em',
            }}>{b.x}</p>
          )
        })}
      </div>
    </div>
  )
}

interface IOSStatusBarProps {
  dark: boolean
}

function IOSStatusBar({ dark }: IOSStatusBarProps) {
  const fg = dark ? 'rgba(255,255,255,0.88)' : '#111111'
  return (
    <div style={{
      height: 50, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px 0 28px',
    }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: fg, letterSpacing: '-0.01em' }}>9:41</span>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        {SIGNAL_BARS.map((bar) => (
          <div key={bar.id} style={{
            width: 3, height: bar.height, borderRadius: 1,
            background: fg, opacity: bar.dim ? 0.35 : 1,
          }} />
        ))}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" style={{ marginLeft: 2 }}>
          <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill={fg} />
          <path d="M4.3 7.2A5.3 5.3 0 0 1 8 5.7c1.4 0 2.7.55 3.7 1.5" stroke={fg} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M1.5 4.5A9.3 9.3 0 0 1 8 2c2.5 0 4.8 1 6.5 2.5" stroke={fg} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
        </svg>
        <div style={{
          width: 25, height: 12, borderRadius: 3,
          border: `1.5px solid ${fg}`, position: 'relative',
          display: 'flex', alignItems: 'center', padding: '2px',
        }}>
          <div style={{ width: '80%', height: '100%', borderRadius: 1.5, background: fg }} />
          <div style={{
            position: 'absolute', right: -4, top: '50%',
            transform: 'translateY(-50%)',
            width: 2.5, height: 6, borderRadius: 1, background: fg, opacity: 0.5,
          }} />
        </div>
      </div>
    </div>
  )
}

interface ConfettiProps {
  accent: DiAccent
}

function Confetti({ accent }: ConfettiProps) {
  // Use pre-generated pieces from module-level constant (no Math.random during render)
  const pieces = useMemo(() => CONFETTI_PIECES[accent] || CONFETTI_PIECES.emerald, [accent])
  if (RM) return null
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {pieces.map((p) => (
        <span key={p.id} className="di-confetti-piece" style={{
          background: p.color,
          borderRadius: p.round ? '50%' : 2,
          animationDelay: p.delay + 'ms',
          ['--tx' as string]: p.tx,
          ['--ty' as string]: p.ty,
          ['--rot' as string]: p.rot,
        }} />
      ))}
    </div>
  )
}

interface DynamicIslandProps {
  progress: number
  mode: DiMode
  accent: DiAccent
  showMode: DiShowMode
  pillStyle: DiPillStyle
  pulseKey: number
  celebrate: boolean
  islandDark: boolean
  darkArticle: boolean
  onTap: () => void
}

function DynamicIsland({
  progress, mode, accent, showMode, pillStyle, pulseKey, celebrate, islandDark, darkArticle, onTap,
}: DynamicIslandProps) {
  const a = ACCENTS[accent] || ACCENTS.emerald
  const glass = pillStyle === 'glass'
  const expanded = mode !== 'compact'
  const complete = mode === 'complete'
  // Never surface "100%": cap the readout at 99 until the done state takes over.
  const pct = Math.min(99, Math.round(progress * 100))
  const minsLeft = Math.max(0, Math.ceil(ARTICLE.readMin * (1 - progress)))

  const W = expanded ? 330 : 126
  const H = expanded ? 50 : 37
  const R = expanded ? 25 : 22

  // When darkArticle is true, force light-theme colors on the island face
  const effectiveDark = darkArticle ? false : islandDark
  const trackBg = effectiveDark ? 'rgba(255,255,255,0.12)' : 'rgba(17,17,17,0.10)'
  const labelColor = effectiveDark ? '#F5F5F5' : '#111111'
  const iconColor = effectiveDark ? 'rgba(255,255,255,0.55)' : '#4A4A4A'

  const surface = glass
    ? (effectiveDark ? {
        background: 'rgba(15,15,18,0.82)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.30), 0 12px 30px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      } : {
        background: 'rgba(255,255,255,0.72)',
        boxShadow: '0 1px 2px rgba(17,17,17,0.10), 0 12px 30px -10px rgba(17,17,17,0.28), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(17,17,17,0.06)',
        backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      })
    : (effectiveDark ? {
        background: '#0F0F12',
        boxShadow: expanded
          ? '0 2px 6px rgba(0,0,0,0.45), 0 16px 36px -10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.05)',
      } : {
        background: '#FFFFFF',
        boxShadow: expanded
          ? '0 2px 6px rgba(0,0,0,0.22), 0 16px 36px -10px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(17,17,17,0.06)'
          : '0 2px 6px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(17,17,17,0.06)',
      })

  // Fill glow replay — callback-ref pattern (no effect hook)
  const prevPulseKey = useRef(0)
  const fillCallbackRef = useCallback((el: HTMLElement | null) => {
    if (!el) return
    if (pulseKey !== prevPulseKey.current) {
      prevPulseKey.current = pulseKey
      dirFillGlowReplay(el)
    }
  }, [pulseKey])

  // Reverse-on-exit: when leaving the complete state (sliding up), play the
  // "99% -> done" badge animation backwards instead of snapping. Tracked with a
  // ref + conditional setState-during-render (no effect hook). closeKey bumps
  // each time complete -> not-complete so the badge remounts and replays reversed.
  const [prevComplete, setPrevComplete] = useState(complete)
  const [closing, setClosing] = useState(false)
  const [closeKey, setCloseKey] = useState(0)
  if (prevComplete !== complete) {
    setPrevComplete(complete)
    if (!complete && !RM) {
      // entered the exit transition — mount the reversing badge
      setClosing(true)
      setCloseKey((k) => k + 1)
    } else if (complete && closing) {
      // re-entered complete before close finished — drop the reverse badge
      setClosing(false)
    }
  }
  const onCloseDone = useCallback(() => setClosing(false), [])
  // Reverse badge never shows confetti (only the forward/complete badge does).
  const showCloseBadge = closing && !complete

  return (
    <div style={{
      position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50,
    }}>
      {/* Use button for native role="button" accessibility */}
      <button
        type="button"
        className={`di-pill di-tap${darkArticle ? ' is-dark-article' : ''}`}
        aria-label={complete
          ? 'Reading complete. Tap to scroll to top.'
          : `Reading progress ${pct} percent. Tap to scroll to top.`}
        onClick={onTap}
        style={{
          width: W, height: H, borderRadius: R,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'visible', position: 'relative',
          outline: 'none', border: 'none', padding: 0, cursor: 'pointer',
          ...surface,
        }}
      >
        {/* pulse wrapper (milestone scale bump) */}
        <div
          key={pulseKey}
          className={pulseKey > 0 && !RM ? 'di-pulse' : ''}
          style={{
            width: '100%', height: '100%', position: 'relative',
            display: 'flex', alignItems: 'center',
          }}
        >
          {/* COMPACT FACE */}
          <div className="di-face" style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 13px',
            opacity: expanded ? 0 : 1,
            pointerEvents: expanded ? 'none' : 'auto',
          }}>
            {progress > 0.001 ? (
              <>
                <span className="material-symbols-outlined" style={{
                  fontSize: 15, color: iconColor,
                  fontVariationSettings: '"FILL" 1',
                }}>{complete ? 'check_circle' : 'menu_book'}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" fill="none" stroke={trackBg} strokeWidth="2.5" />
                  <circle
                    cx="10" cy="10" r="8" fill="none" stroke={iconColor} strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 8}
                    strokeDashoffset={2 * Math.PI * 8 * (1 - progress)}
                    transform="rotate(-90 10 10)"
                    style={{ transition: RM ? 'none' : 'stroke-dashoffset 200ms ease' }}
                  />
                </svg>
              </>
            ) : <span />}
          </div>

          {/* EXPANDED / COMPLETE FACE */}
          <div className="di-face" style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 16px',
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'scale(1)' : 'scale(0.96)',
            pointerEvents: expanded ? 'auto' : 'none',
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 18, color: iconColor,
              fontVariationSettings: '"FILL" 1', flexShrink: 0,
            }}>menu_book</span>

            {/* progress track */}
            <div style={{
              flex: 1, height: 8, borderRadius: 999, background: trackBg,
              position: 'relative', overflow: 'hidden',
            }}>
              <div ref={fillCallbackRef} style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: progress * 100 + '%',
                borderRadius: 999,
                background: `linear-gradient(90deg, ${a.base}, ${a.bright})`,
                boxShadow: `0 0 10px ${a.glow}`,
              }}>
                {!RM && !complete && progress > 0.02 && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 999, overflow: 'hidden' }}>
                    <span style={{
                      position: 'absolute', top: 0, bottom: 0, left: '-30%', width: 36,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                      animation: 'diShine 1.8s ease-in-out infinite',
                    }} />
                  </div>
                )}
              </div>
            </div>

            {/* trailing label OR check badge */}
            {complete ? (
              <div style={{ position: 'relative', flexShrink: 0, width: 28, height: 28 }}>
                <div className="di-check-pop" style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${a.bright}, ${a.base})`,
                  display: 'grid', placeItems: 'center',
                  boxShadow: `0 0 12px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      style={RM ? {} : {
                        strokeDasharray: 28,
                        strokeDashoffset: 28,
                        animation: 'diCheckDraw 360ms 120ms cubic-bezier(.65,0,.35,1) forwards',
                      }}
                    />
                  </svg>
                </div>
                {celebrate && <Confetti accent={accent} />}
              </div>
            ) : showMode === 'off' ? null : (
              <span style={{
                flexShrink: 0, minWidth: showMode === 'time' ? 54 : 38, textAlign: 'right',
                fontSize: 14, fontWeight: 800, color: labelColor,
                letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
              }}>
                {showMode === 'time' ? `${minsLeft} min` : `${pct}%`}
              </span>
            )}
          </div>

          {/* REVERSE-ON-EXIT badge: plays the "99% -> done" pop backwards when
              sliding up out of the complete state. No confetti. Overlaid at the
              same trailing position as the forward complete badge. */}
          {showCloseBadge && (
            <div
              key={closeKey}
              aria-hidden="true"
              style={{
                position: 'absolute', right: 16, top: '50%',
                width: 28, height: 28, marginTop: -14,
                pointerEvents: 'none', zIndex: 2,
                opacity: expanded ? 1 : 0,
              }}
            >
              <div
                className="di-check-pop"
                onAnimationEnd={onCloseDone}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${a.bright}, ${a.base})`,
                  display: 'grid', placeItems: 'center',
                  boxShadow: `0 0 12px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                  animationDirection: 'reverse',
                } as CSSProperties}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

// ---- tweak state -----------------------------------------------------------
type TweakKey = 'accent' | 'showMode' | 'pillStyle' | 'collapseIdle' | 'celebrate' | 'darkArticle' | 'darkIsland'

interface Tweaks {
  accent: DiAccent
  showMode: DiShowMode
  pillStyle: DiPillStyle
  collapseIdle: boolean
  celebrate: boolean
  darkArticle: boolean
  darkIsland: boolean
}

const TWEAK_DEFAULTS: Tweaks = {
  accent: 'emerald',
  showMode: 'percent',
  pillStyle: 'island',
  collapseIdle: false,
  celebrate: true,
  darkArticle: false,
  darkIsland: true,
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DynamicIslandReader() {
  const [tweaks, setTweaks] = useState<Tweaks>(TWEAK_DEFAULTS)
  const setTweak = <K extends TweakKey>(key: K, val: Tweaks[K]) =>
    setTweaks((prev) => ({ ...prev, [key]: val }))

  const [disp, setDisp] = useState(0)
  const [mode, setMode] = useState<DiMode>('compact')
  const [pulseKey, setPulseKey] = useState(0)
  const [scale, setScale] = useState(1)

  const scrollerElRef = useRef<HTMLElement | null>(null)

  const scrollerCallbackRef = useCallback((el: HTMLElement | null) => {
    if (el) {
      scrollerElRef.current = el
      // collapseIdle defaults to false at mount; use updateDirCollapseIdle for changes
      dirScrollerRef(el, { setDisp, setMode, setPulseKey, setScale }, false)
    } else {
      cleanupDirScroller(scrollerElRef.current)
      scrollerElRef.current = null
    }
  }, []) // intentionally stable — re-attachment resets scroll position

  // Propagate collapseIdle toggle to running scroll listener via the hook helper
  const handleCollapseIdleChange = (val: boolean) => {
    setTweak('collapseIdle', val)
    updateDirCollapseIdle(scrollerElRef.current, val)
  }

  const scrollToTop = () => {
    const el = scrollerElRef.current
    if (!el) return
    el.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' })
  }

  const dark = tweaks.darkArticle
  const screenBg = dark ? '#0A0A0A' : '#FFFFFF'

  return (
    <div className="dir-root">
      {/* iPhone frame */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <div style={{
          padding: 12, background: '#0a0a0a', borderRadius: 56,
          boxShadow: '0 50px 90px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: 402, height: 874, borderRadius: 46, overflow: 'hidden',
            position: 'relative', background: screenBg,
          }}>
            {/* status bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
              <IOSStatusBar dark={dark} />
            </div>

            {/* scrollable article */}
            <div
              ref={scrollerCallbackRef as React.RefCallback<HTMLDivElement>}
              className="di-scroll"
              style={{ height: '100%', overflowY: 'auto', position: 'relative', WebkitOverflowScrolling: 'touch' as const }}
            >
              <ArticleBody accent={tweaks.accent} dark={dark} />
            </div>

            {/* dynamic island (floats above content) */}
            <DynamicIsland
              progress={disp}
              mode={mode}
              accent={tweaks.accent}
              showMode={tweaks.showMode}
              pillStyle={tweaks.pillStyle}
              pulseKey={pulseKey}
              celebrate={tweaks.celebrate}
              islandDark={tweaks.darkIsland}
              darkArticle={tweaks.darkArticle}
              onTap={scrollToTop}
            />

            {/* home indicator */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
              height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              paddingBottom: 9, pointerEvents: 'none',
            }}>
              <div style={{
                width: 139, height: 5, borderRadius: 100,
                background: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.28)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tweaks panel — inline, no harness dependency */}
      <div style={{
        position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)',
        borderRadius: 16, padding: '16px 14px', display: 'flex', flexDirection: 'column',
        gap: 10, minWidth: 170, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Indicator</span>

        <label htmlFor="dir-dark-island" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}>
          <span style={{ fontSize: 12, color: '#D4D4D4' }}>Dark island</span>
          <input id="dir-dark-island" aria-label="Dark island" type="checkbox" checked={tweaks.darkIsland} onChange={(e) => setTweak('darkIsland', e.target.checked)} />
        </label>

        {/* Accent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#A1A1A1' }}>Accent</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {(['emerald', 'blue', 'violet', 'amber'] as DiAccent[]).map((ac) => (
              <button
                key={ac}
                type="button"
                onClick={() => setTweak('accent', ac)}
                aria-label={ac}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: tweaks.accent === ac ? '2px solid #fff' : '2px solid transparent',
                  background: ACCENTS[ac].base, cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Readout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#A1A1A1' }}>Readout</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['percent', 'time', 'off'] as DiShowMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTweak('showMode', v)}
                style={{
                  fontSize: 10, padding: '3px 7px', borderRadius: 6,
                  background: tweaks.showMode === v ? 'var(--brand-primary-500)' : 'rgba(255,255,255,0.08)',
                  color: tweaks.showMode === v ? '#fff' : '#A1A1A1',
                  border: 'none', cursor: 'pointer',
                }}
              >{v}</button>
            ))}
          </div>
        </div>

        {/* Pill style */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#A1A1A1' }}>Pill style</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['island', 'glass'] as DiPillStyle[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTweak('pillStyle', v)}
                style={{
                  fontSize: 10, padding: '3px 7px', borderRadius: 6,
                  background: tweaks.pillStyle === v ? 'var(--brand-primary-500)' : 'rgba(255,255,255,0.08)',
                  color: tweaks.pillStyle === v ? '#fff' : '#A1A1A1',
                  border: 'none', cursor: 'pointer',
                }}
              >{v}</button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Behavior</span>

        <label htmlFor="dir-collapse-idle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}>
          <span style={{ fontSize: 12, color: '#D4D4D4' }}>Collapse idle</span>
          <input id="dir-collapse-idle" aria-label="Collapse when idle" type="checkbox" checked={tweaks.collapseIdle} onChange={(e) => handleCollapseIdleChange(e.target.checked)} />
        </label>

        <label htmlFor="dir-celebrate" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}>
          <span style={{ fontSize: 12, color: '#D4D4D4' }}>Confetti</span>
          <input id="dir-celebrate" aria-label="Confetti on finish" type="checkbox" checked={tweaks.celebrate} onChange={(e) => setTweak('celebrate', e.target.checked)} />
        </label>

        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Article</span>

        <label htmlFor="dir-dark-article" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}>
          <span style={{ fontSize: 12, color: '#D4D4D4' }}>Dark article</span>
          <input id="dir-dark-article" aria-label="Dark article" type="checkbox" checked={tweaks.darkArticle} onChange={(e) => setTweak('darkArticle', e.target.checked)} />
        </label>
      </div>
    </div>
  )
}
