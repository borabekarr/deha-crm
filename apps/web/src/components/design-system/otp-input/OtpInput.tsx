import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './OtpInput.css'

// ---------------------------------------------------------------------------
// OTP Input — Deha Design System
// Animated one-time-code entry field. A single invisible input drives a row
// of styled cells: the active cell bounces with a blinking caret, each
// entered digit animates in (variant-selectable: fadeSlideDown / fadeScale /
// slideUp / flip), a wrong code shakes the row red and auto-clears, and a
// correct code resolves to an emerald grid-textured pulse. Supports paste
// (full code at once) and autocomplete="one-time-code".
//
// Faithful port of
// apps/web/design-system/claude-design/raw/otp-input/otp-input.jsx —
// byte-preserved DOM/CSS/timings per CONVERSION-SOP.md. Motion legs were
// tokenized value-identically in the ds-review-inputs pass (see the header
// of OtpInput.css); rendered timings are unchanged. The JS-side timers here
// (620ms verify, 520ms shake clear, 880ms auto-reset, 320ms pop strip) are
// behavioural sequencing, not CSS motion, and stay as literals.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from 'react'

// ── icons ────────────────────────────────────────────────────────────────

function IcoCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IcoWarn() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8.5v5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.4" fill="currentColor" />
      <path d="M12 4 21 19.5H3L12 4Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  )
}

// ── the field ────────────────────────────────────────────────────────────

export type OtpVariant = 'fadeSlideDown' | 'fadeScale' | 'slideUp' | 'flip'
type OtpStatus = 'idle' | 'verifying' | 'error' | 'success'

export interface OtpInputProps {
  count: number
  expected: string
  variant: OtpVariant
  mask: boolean
  autoFocus?: boolean
  onChange?: (value: string) => void
  onFinished?: (value: string) => void
}

export function OtpInput({ count, expected, variant, mask, autoFocus, onChange, onFinished }: OtpInputProps) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<OtpStatus>('idle') // idle | verifying | error | success
  const [focused, setFocused] = useState(false)
  const [shake, setShake] = useState(false)
  const [pop, setPop] = useState(-1) // index of the freshly-entered digit
  const inputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const popTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const target = expected.replace(/\D/g, '').slice(0, count)

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }

  // reset when the shape changes
  useEffect(() => {
    clearTimers()
    setValue('')
    setStatus('idle')
    if (autoFocus && inputRef.current) later(() => inputRef.current?.focus(), 60)
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, expected])

  const focus = useCallback(() => inputRef.current && inputRef.current.focus(), [])

  function commit(raw: string) {
    if (status === 'success' || status === 'verifying') return
    const v = raw.replace(/\D/g, '').slice(0, count)
    setValue((prev) => {
      if (v.length > prev.length) {
        // a digit was added — pop the newest, strip the flag via a timer so the
        // resting digit stays visible even where the animation clock is frozen
        setPop(v.length - 1)
        clearTimeout(popTimer.current)
        popTimer.current = setTimeout(() => setPop(-1), 320)
      }
      return v
    })
    setStatus('idle')
    onChange && onChange(v)
    if (v.length === count) verify(v)
  }

  function verify(v: string) {
    onFinished && onFinished(v)
    setStatus('verifying')
    later(() => {
      if (v === target) {
        setStatus('success')
      } else {
        setStatus('error')
        setShake(true)
        later(() => setShake(false), 520)
        later(() => {
          setValue('')
          setStatus('idle')
          focus()
        }, 880)
      }
    }, 620)
  }

  const locked = status === 'success' || status === 'verifying'
  const activeIndex = value.length < count ? value.length : -1

  const cells = []
  for (let i = 0; i < count; i++) {
    const ch = value[i]
    const filled = ch != null
    const isActive = focused && !locked && i === activeIndex
    cells.push(
      <div key={i} className={'otp-cell' + (filled ? ' filled' : '') + (isActive ? ' active' : '')}>
        {filled ? (
          <span className={'otp-digit' + (i === pop ? ' pop' : '')} key={ch + '-' + i}>
            {mask ? '•' : ch}
          </span>
        ) : isActive ? (
          <span className="otp-caret" />
        ) : null}
      </div>,
    )
  }

  const rowClass =
    'otp-row' +
    (focused ? ' focused' : '') +
    (status === 'error' ? ' error' : '') +
    (status === 'success' ? ' success' : '') +
    (shake ? ' shake' : '')

  return (
    <>
      <div className={rowClass} data-variant={variant} onClick={focus}>
        {cells}
        <input
          ref={inputRef}
          className="otp-input"
          value={value}
          onChange={(e) => commit(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={count}
          aria-label={'Enter ' + count + '-digit code'}
          disabled={locked}
        />
      </div>
      <StatusLine status={status} />
    </>
  )
}

// ── status line ──────────────────────────────────────────────────────────

function StatusLine({ status }: { status: OtpStatus }) {
  const map: Record<OtpStatus, [string | null, string]> = {
    idle: [null, 'Enter the code sent to your device'],
    verifying: ['spin', 'Verifying…'],
    error: ['warn', 'Incorrect code — try again'],
    success: ['check', 'Verified'],
  }
  const [ico, text] = map[status]
  return (
    <div className="otp-status" data-s={status}>
      {ico === 'spin' && <span className="otp-spin" />}
      {ico === 'check' && (
        <span className="otp-status-ico">
          <IcoCheck />
        </span>
      )}
      {ico === 'warn' && (
        <span className="otp-status-ico">
          <IcoWarn />
        </span>
      )}
      <span>{text}</span>
    </div>
  )
}

// ── resend timer ─────────────────────────────────────────────────────────

function Resend() {
  const [left, setLeft] = useState(30)
  useEffect(() => {
    if (left <= 0) return
    const id = setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => clearTimeout(id)
  }, [left])
  return (
    <p className="otp-resend">
      {left > 0 ? (
        <>Resend code in {String(left).padStart(2, '0')}s</>
      ) : (
        <>
          Didn’t get it? <button onClick={() => setLeft(30)}>Resend code</button>
        </>
      )}
    </p>
  )
}

// ── default demo shell ──────────────────────────────────────────────────
// Mirrors the raw source's App() at its canonical TW-default state:
// count: 6, expected: "123456", variant: "fadeSlideDown", mask: false,
// dark: false. The raw source's tweaks panel is authoring-only tooling
// (never checked into the repo, see pixel-gate harness) and is not part of
// the converted component.

export default function OtpInputDemo() {
  const count = 6
  const expected = '123456'
  const variant: OtpVariant = 'fadeSlideDown'
  const mask = false
  const target = expected.replace(/\D/g, '').slice(0, count) || '—'
  // remount the field when shape changes so it cleanly resets, same as the
  // raw source's App() (key={fieldKey})
  const fieldKey = count + '|' + expected

  return (
    // The raw source's <body>{display:grid;place-items:center} shrinks
    // #root to the stage's intrinsic width; this wrapper reproduces that
    // packaging-only layout need (not part of the byte-preserved .otp-*
    // rule set) so the block-level .otp-stage doesn't stretch to the
    // preview route's full container width. Precedent: Shimmer.tsx.
    <div className="otp-stage-root" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="otp-stage">
        <div className="otp-surface">
          <div className="otp-head">
            <h2 className="otp-title">Verify it’s you</h2>
            <p className="otp-sub">
              Demo code <b>{target}</b> — enter it to pass, or a wrong one to see the error.
            </p>
          </div>

          <OtpInput
            key={fieldKey}
            count={count}
            expected={expected}
            variant={variant}
            mask={mask}
            autoFocus={true}
            onChange={() => {}}
            onFinished={() => {}}
          />

          <Resend />
        </div>
      </div>
    </div>
  )
}
