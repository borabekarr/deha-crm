import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import '../../../../design-system/preview/_shared-feedback.css'
import './CurrencyConverter.css'

import { useState, useRef, useCallback } from 'react'
import { iconClass } from '@/lib/iconClass'
import { useClockTick, useWindowKey, nowHM } from './currency-converter-hook'

// ---------------------------------------------------------------------------
// Currency data
// ---------------------------------------------------------------------------
interface Currency {
  code: string
  name: string
  symbol: string
  rate: number
  flag: string
}

const CURRENCIES: Currency[] = [
  { code: 'TRY', name: 'Turkish Lira',    symbol: '₺',    rate: 32.50,   flag: 'tr' },
  { code: 'USD', name: 'US Dollar',       symbol: '$',    rate: 1,       flag: 'us' },
  { code: 'EUR', name: 'Euro',            symbol: '€',    rate: 0.9200,  flag: 'eu' },
  { code: 'GBP', name: 'British Pound',   symbol: '£',    rate: 0.7900,  flag: 'gb' },
  { code: 'JPY', name: 'Japanese Yen',    symbol: '¥',    rate: 151.20,  flag: 'jp' },
  { code: 'RUB', name: 'Russian Ruble',   symbol: '₽',    rate: 92.40,   flag: 'ru' },
  { code: 'AED', name: 'UAE Dirham',      symbol: 'د.إ',  rate: 3.6725,  flag: 'ae' },
  { code: 'CHF', name: 'Swiss Franc',     symbol: 'CHF',  rate: 0.8900,  flag: 'ch' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$',  rate: 1.3600,  flag: 'ca' },
]

const byCode = (c: string) => CURRENCIES.find((x) => x.code === c)!

// ---------------------------------------------------------------------------
// Flag SVGs (inline, circular abstract simplifications)
// ---------------------------------------------------------------------------
function Flag({ code, size = 30 }: { code: string; size?: number }) {
  const svgMap: Record<string, React.ReactNode> = {
    us: (
      <g>
        <rect width="30" height="30" fill="#B22234" />
        <g fill="#fff">
          <rect y="2.4"  width="30" height="2.3" />
          <rect y="7.1"  width="30" height="2.3" />
          <rect y="11.8" width="30" height="2.3" />
          <rect y="16.5" width="30" height="2.3" />
          <rect y="21.2" width="30" height="2.3" />
          <rect y="25.9" width="30" height="2.3" />
        </g>
        <rect width="14" height="16.2" fill="#3C3B6E" />
        <g fill="#fff">
          {[0, 1, 2, 3].flatMap((r) =>
            [0, 1, 2, 3, 4].map((col) => (
              <circle
                key={`${r}-${col}`}
                cx={2 + col * 2.6 + (r % 2) * 1.3}
                cy={2 + r * 4}
                r="0.65"
              />
            ))
          )}
        </g>
      </g>
    ),
    eu: (
      <g>
        <rect width="30" height="30" fill="#003399" />
        {Array.from({ length: 12 }, (_, pos) => {
          const angle = (pos / 12) * Math.PI * 2 - Math.PI / 2
          const cx = Math.round((15 + Math.cos(angle) * 9) * 100)
          const cy = Math.round((15 + Math.sin(angle) * 9) * 100)
          return (
            <circle
              key={`eu-star-${cx}-${cy}`}
              cx={15 + Math.cos(angle) * 9}
              cy={15 + Math.sin(angle) * 9}
              r="1.2"
              fill="#FFCC00"
            />
          )
        })}
      </g>
    ),
    gb: (
      <g>
        <rect width="30" height="30" fill="#012169" />
        <path d="M0 0 L30 30 M30 0 L0 30" stroke="#fff" strokeWidth="4.2" />
        <path d="M0 0 L30 30" stroke="#C8102E" strokeWidth="1.8" />
        <path d="M30 0 L0 30" stroke="#C8102E" strokeWidth="1.8" strokeDasharray="11 8 6 7" />
        <path d="M15 0 V30 M0 15 H30" stroke="#fff" strokeWidth="6" />
        <path d="M15 0 V30 M0 15 H30" stroke="#C8102E" strokeWidth="3.2" />
      </g>
    ),
    jp: (
      <g>
        <rect width="30" height="30" fill="#fff" />
        <circle cx="15" cy="15" r="6.6" fill="#BC002D" />
      </g>
    ),
    ru: (
      <g>
        <rect width="30" height="10"  fill="#fff" />
        <rect y="10"   width="30" height="10" fill="#0039A6" />
        <rect y="20"   width="30" height="10" fill="#D52B1E" />
      </g>
    ),
    tr: (
      <g>
        <rect width="30" height="30" fill="#E30A17" />
        <circle cx="12.5" cy="15" r="6.5" fill="#fff" />
        <circle cx="14.3" cy="15" r="5.1" fill="#E30A17" />
        <polygon
          points="20,12 20.68,14.07 22.85,14.07 21.09,15.36 21.76,17.43 20,16.15 18.24,17.43 18.91,15.36 17.15,14.07 19.32,14.07"
          fill="#fff"
        />
      </g>
    ),
    ae: (
      <g>
        <rect width="30" height="30" fill="#fff" />
        <rect width="30" height="10"  fill="#00732F" />
        <rect y="20"   width="30" height="10" fill="#000" />
        <rect width="9" height="30"  fill="#FF0000" />
      </g>
    ),
    ch: (
      <g>
        <rect width="30" height="30" fill="#D52B1E" />
        <rect x="13" y="7"  width="4" height="16" fill="#fff" />
        <rect x="7"  y="13" width="16" height="4" fill="#fff" />
      </g>
    ),
    ca: (
      <g>
        <rect width="30" height="30" fill="#fff" />
        <rect width="8" height="30" fill="#D52B1E" />
        <rect x="22" width="8" height="30" fill="#D52B1E" />
        <path
          d="M15 8 L16.2 11.3 L19 11 L17.6 13.5 L20 15 L17.6 16 L18 18 L16 17.6 L15.3 20 L14.7 20 L14 17.6 L12 18 L12.4 16 L10 15 L12.4 13.5 L11 11 L13.8 11.3 Z"
          fill="#D52B1E"
        />
      </g>
    ),
  }

  const content = svgMap[code] ?? <rect width="30" height="30" fill="#ECECEC" />
  return (
    <svg viewBox="0 0 30 30" width={size} height={size} aria-hidden="true">
      {content}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Rolling digit display
// ---------------------------------------------------------------------------
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

function Roll({
  value,
  color = 'var(--cc-fg1)',
  muteColor = '#A1A1A1',
}: {
  value: string
  color?: string
  muteColor?: string
}) {
  const chars = value.split('')
  const len = chars.length
  return (
    <span className="digit-wrap">
      {chars.map((ch, i) => {
        const posFromRight = len - 1 - i
        const isDigit = /[0-9]/.test(ch)
        if (isDigit) {
          const n = +ch
          return (
            <span
              key={`d-${posFromRight}`}
              className="digit-col"
              style={{ width: '0.95ch', minWidth: '0.95ch', color }}
            >
              <span className="digit-track" style={{ transform: `translateY(-${n}em)` }}>
                {DIGITS.map((d) => <span key={d}>{d}</span>)}
              </span>
            </span>
          )
        }
        const isSymbol = !/[,.\s]/.test(ch)
        return (
          <span
            key={`c-${posFromRight}-${ch}`}
            style={{
              display: 'inline-block',
              color: isSymbol ? muteColor : color,
              padding: isSymbol ? '0 0.12em 0 0' : ch === ',' ? '0 0.04em' : '0 0.02em',
              fontWeight: isSymbol ? 800 : 900,
            }}
          >
            {ch}
          </span>
        )
      })}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
function formatAmount(amount: number, currency: Currency): string {
  const decimals = currency.code === 'JPY' ? 0 : 2
  const num = isFinite(amount) ? amount : 0
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return currency.symbol + formatted
}

function formatRate(rate: number, decimals = 4): string {
  if (rate >= 1000) return rate.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return rate.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// ---------------------------------------------------------------------------
// Currency pill — flag morph + code + chevron
// Flag crossfade: prev flag tracked via useState [prevCode, currentCode, animKey].
// Cleanup: onAnimationEnd on the morph-out span clears prevCode (no timer, no refs).
// ---------------------------------------------------------------------------
function CurrencyPill({ currency, onClick }: { currency: Currency; onClick: () => void }) {
  const [morphState, setMorphState] = useState<{
    prevCode: string | null
    currentCode: string
    animKey: number
  }>({ prevCode: null, currentCode: currency.code, animKey: 0 })

  // Detect prop change during render — allowed: conditional setState inside render
  // updates state for the SAME render pass without causing an extra render cycle.
  if (morphState.currentCode !== currency.code) {
    setMorphState((s) => ({
      prevCode: s.currentCode,
      currentCode: currency.code,
      animKey: s.animKey + 1,
    }))
  }

  const prevCurrency = morphState.prevCode
    ? CURRENCIES.find((c) => c.code === morphState.prevCode) ?? null
    : null

  // When morph-out animation ends, clear prevCode so the ghost unmounts
  const onMorphOutEnd = useCallback(() => {
    setMorphState((s) => ({ ...s, prevCode: null }))
  }, [])

  return (
    <button
      type="button"
      className="cc-pill"
      onClick={onClick}
      aria-label={`Change currency, currently ${currency.code}`}
    >
      <span className="cc-flag-ring">
        {prevCurrency && (
          <span
            key={`out-${morphState.animKey}`}
            className="cc-flag-layer morph-out"
            onAnimationEnd={onMorphOutEnd}
          >
            <Flag code={prevCurrency.flag} size={30} />
          </span>
        )}
        <span
          key={`in-${morphState.animKey}-${currency.code}`}
          className={`cc-flag-layer${prevCurrency ? ' morph-in' : ''}`}
        >
          <Flag code={currency.flag} size={30} />
        </span>
      </span>
      <span style={{ letterSpacing: '-0.005em' }}>{currency.code}</span>
      <span
        className={iconClass('keyboard_arrow_down')}
        style={{ fontSize: 14, color: '#A1A1A1', marginLeft: -2, fontVariationSettings: '"opsz" 24, "wght" 600' }}
        aria-hidden="true"
      >
        keyboard_arrow_down
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Amount display (static, output-only — rolling digit animation via Roll)
// ---------------------------------------------------------------------------
function EditableAmount({
  value,
  currency,
}: {
  value: number
  currency: Currency
}) {
  const display = formatAmount(value, currency)

  return (
    <span
      style={{
        display: 'block', textAlign: 'right',
        fontWeight: 900, fontSize: 28, letterSpacing: '0.04em',
        color: 'var(--cc-fg1)', lineHeight: 1,
        fontFamily: 'Montserrat',
      }}
    >
      <Roll value={display} />
    </span>
  )
}

// ---------------------------------------------------------------------------
// Currency picker popover
// Escape key handled via useWindowKey callback-ref.
// Uses <dialog> element for accessibility (jsx-a11y/prefer-tag-over-role).
// ---------------------------------------------------------------------------
interface PickerAnchor { centerX: number; centerY: number }

function CurrencyPicker({
  open,
  exclude,
  onPick,
  onClose,
  anchor,
}: {
  open: boolean
  exclude: string
  onPick: (c: Currency) => void
  onClose: () => void
  anchor: PickerAnchor | null
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  // Keyboard Escape handler via callback-ref (replaces window.addEventListener)
  const onEsc = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose() },
    [open, onClose]
  )
  const keyRef = useWindowKey(onEsc)

  // Focus input on open via callback-ref
  const focusRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (!node) return
      const id = setTimeout(() => node.focus(), 30)
      return () => clearTimeout(id)
    },
    []
  )

  if (!open) return null

  // Position wrapper: fixed at the converter's center; translate(-50%,-50%)
  // lives HERE (positioning only) so the shell can own a pure scale/opacity
  // entrance animation without the two transforms clobbering each other.
  const wrapStyle: React.CSSProperties = anchor
    ? { position: 'fixed', left: anchor.centerX, top: anchor.centerY, transform: 'translate(-50%, -50%)', margin: 0 }
    : { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', margin: 0 }

  const filtered = CURRENCIES.filter((c) => {
    const q = query.toLowerCase()
    return !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  })

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const c = filtered[active]
      if (c && c.code !== exclude) onPick(c)
    }
  }

  return (
    // Invisible anchor for the Escape key callback-ref
    <div ref={keyRef} style={{ display: 'contents' }}>
      <div
        className="cc-pop-backdrop"
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains('cc-pop-backdrop')) onClose()
        }}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="cc-pop-wrap" style={wrapStyle}>
        <div className="cc-pop-shell">
        <dialog
          open
          className="cc-pop"
          aria-label="Pick currency"
          style={{ padding: 0, position: 'static' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', borderBottom: '1px solid var(--cc-hairline)',
          }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 17, color: '#A1A1A1', fontVariationSettings: '"opsz" 24, "wght" 500' }}
              aria-hidden="true"
            >
              search
            </span>
            <input
              ref={focusRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0) }}
              onKeyDown={onKey}
              placeholder="Search currency..."
              aria-label="Search currency"
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontFamily: 'Montserrat', fontSize: 14, fontWeight: 500,
                color: 'var(--cc-fg1)', background: 'transparent',
              }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close currency picker"
              style={{
                fontFamily: 'Montserrat', fontSize: 10.5, fontWeight: 700,
                color: '#6B6B6B', background: 'var(--cc-chip)',
                border: 'none', padding: '3px 9px', borderRadius: 6,
                cursor: 'pointer', letterSpacing: '0.04em',
              }}
            >
              Esc
            </button>
          </div>
          <div className="cc-pop-list">
            {filtered.map((c, rowIdx) => {
              const disabled = c.code === exclude
              return (
                <button
                  key={c.code}
                  type="button"
                  className={`cc-pop-row${rowIdx === active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
                  disabled={disabled}
                  onClick={() => onPick(c)}
                  onMouseEnter={() => setActive(rowIdx)}
                  aria-label={`${c.name} (${c.code})${disabled ? ' — in use' : ''}`}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', overflow: 'hidden',
                    boxShadow: 'inset 0 0 0 1px rgba(17,17,17,0.10), 0 1px 2px rgba(17,17,17,0.06)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <Flag code={c.flag} size={26} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cc-fg1)', letterSpacing: '-0.005em' }}>{c.code}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: '#A1A1A1' }}>{c.name}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      marginLeft: 'auto',
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 11, color: '#A1A1A1',
                    }}
                  >
                    {disabled ? 'in use' : c.symbol}
                  </span>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '18px 16px', fontSize: 12.5, color: '#A1A1A1', fontWeight: 600 }}>
                No matches for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </dialog>
        </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function CurrencyConverter() {
  const [source, setSource] = useState<Currency>(byCode('EUR'))
  const [target, setTarget] = useState<Currency>(byCode('USD'))
  const [sourceAmt, setSourceAmt] = useState(920)
  const [pickerFor, setPickerFor] = useState<'source' | 'target' | null>(null)
  const [pickerAnchor, setPickerAnchor] = useState<{ centerX: number; centerY: number } | null>(null)
  const [rotation, setRotation] = useState(0)
  const [now, setNow] = useState(nowHM)
  const converterRef = useRef<HTMLDivElement | null>(null)

  // Clock tick: callback-ref on root element (replaces setInterval mount side-effect)
  const clockRef = useClockTick(() => setNow(nowHM()))

  // Compose root ref: clock + swap timer teardown + converterRef
  const rootRef = useCallback(
    (node: HTMLDivElement | null) => {
      converterRef.current = node
      clockRef(node)
    },
    [clockRef]
  )

  // Derived state — conversion recomputed every render (no side-effect)
  const rate = target.rate / source.rate
  const targetAmt = sourceAmt * rate

  // Currency selection
  const onPickSource = (c: Currency) => {
    if (c.code === source.code) { closePicker(); return }
    if (c.code === target.code) setTarget(source)
    setSource(c)
    closePicker()
  }

  const onPickTarget = (c: Currency) => {
    if (c.code === target.code) { closePicker(); return }
    if (c.code === source.code) setSource(target)
    setTarget(c)
    closePicker()
  }

  // Swap currencies + amounts
  const onSwap = () => {
    setRotation(r => r + 180)
    const newSource = target
    const newTarget = source
    const newSourceAmt = targetAmt
    setSource(newSource)
    setTarget(newTarget)
    setSourceAmt(newSourceAmt)
  }

  const openPicker = (side: 'source' | 'target') => {
    if (converterRef.current) {
      const r = converterRef.current.getBoundingClientRect()
      setPickerAnchor({ centerX: r.left + r.width / 2, centerY: r.top + r.height / 2 })
    }
    // Scroll-lock: prevent page scroll while picker is open (no useEffect — plain handler)
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    setPickerFor(side)
  }

  const closePicker = () => {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    setPickerFor(null)
  }

  return (
    <>
      <div className="cc-outer">
      <div ref={rootRef} className="cc-panel" style={{ padding: '22px 22px 18px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 13, fontSize: 18, fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--cc-fg1)' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 27, color: 'var(--cc-fg1)', fontVariationSettings: '"FILL" 1, "wght" 700, "GRAD" 0, "opsz" 24' }}
                aria-hidden="true"
              >
                currency_exchange
              </span>
              Convert
            </h1>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: 'var(--cc-chip)',
              border: '1px solid rgba(17,17,17,0.04)',
              borderRadius: 9999,
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.04), inset 0 1px 0 var(--cc-inset-hi)',
            }}>
              <span className="cc-mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--cc-fg3)', letterSpacing: '0' }}>
                1 {source.code} = {formatRate(rate)} {target.code}
              </span>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span className="cc-live-dot" aria-hidden="true" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cc-fg1)' }}>Live</span>
            <span className="cc-mono" style={{ fontSize: 11.5, fontWeight: 500, color: '#A1A1A1' }}>· {now}</span>
          </div>
        </div>

        {/* Source panel */}
        <div style={{ position: 'relative' }}>
          <div className="cc-slot-top">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <CurrencyPill currency={source} onClick={() => openPicker('source')} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right', paddingRight: 10 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: '#A1A1A1', marginBottom: 4,
                }}>
                  You Send
                </div>
                <EditableAmount value={sourceAmt} currency={source} />
              </div>
            </div>
          </div>

          {/* Swap button — overlapping the gap between slots */}
          <div style={{
            position: 'absolute', left: '50%', top: '100%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}>
            <div className="cc-swap-shell">
              <button
                type="button"
                className="cc-swap"
                onClick={onSwap}
                aria-label="Swap currencies"
              >
                <span
                  className="cc-swap-icon"
                  style={{
                    display: 'block',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform var(--dur) cubic-bezier(.5,0,.3,1)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path d="M3 6.5 H13 M11 4.5 L13 6.5 L11 8.5" fill="none" stroke="#111111" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 11.5 H5 M7 9.5 L5 11.5 L7 13.5" fill="none" stroke="#111111" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: 14 }} />

        {/* Target panel */}
        <div className="cc-slot">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <CurrencyPill currency={target} onClick={() => openPicker('target')} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right', paddingRight: 10 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#A1A1A1', marginBottom: 4,
              }}>
                They Get
              </div>
              <EditableAmount value={targetAmt} currency={target} />
            </div>
          </div>
        </div>

      </div>

      {/* Footer hint, inside the outer grey wrapper */}
      <span className="cc-footer-hint cc-mono">
        Tap a currency to switch · use the arrow to swap
      </span>
      </div>

      <CurrencyPicker
        open={pickerFor !== null}
        exclude={pickerFor === 'source' ? target.code : source.code}
        onPick={pickerFor === 'source' ? onPickSource : onPickTarget}
        onClose={closePicker}
        anchor={pickerAnchor}
      />
    </>
  )
}
