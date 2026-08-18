/**
 * ConnectModal — Deha Design System
 * Reusable, accessible "Connect A to B" inline card with OAuth / API Key methods.
 *
 * Props:
 *   source          : { name: string; mark: React.ReactNode }   left badge
 *   target          : { name: string; mark: React.ReactNode }   right badge
 *   methods         : ConnectMethod[]
 *   buttonStyle     : 'brand' | 'black'
 *   onConnect(payload)
 *   onClose()
 *
 * No effect hooks -- all DOM side-effects live in connect-modal-hook.ts callback refs.
 * Renders as a stable inline card (no modal overlay gating).
 */

import { useState, useRef, useCallback, type ReactNode } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { useCardRef, useTimerRef, useOverlayRef } from './connect-modal-hook'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '@/lib/hooks'
import InlineEdit from '../inline-edit/InlineEdit'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ConnectModal.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ConnectMethod {
  id: string
  label: string
  desc: string
  icon: string
  recommended?: boolean
}

export interface ConnectModalProps {
  onClose?: () => void
  onConnect?: (payload: { method: string | null; token: string | null }) => void
  source?: { name: string; mark: ReactNode }
  target?: { name: string; mark: ReactNode }
  methods?: ConnectMethod[]
  buttonStyle?: 'brand' | 'black'
}

// ---------------------------------------------------------------------------
// Internal SVG helpers
// ---------------------------------------------------------------------------
function AcmeMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#111111"
        d="M24 3.5l13.6 7.2a4 4 0 012.1 3.5v19.6a4 4 0 01-2.1 3.5L24 44.5l-13.6-7.2a4 4 0 01-2.1-3.5V14.2a4 4 0 012.1-3.5L24 3.5z"
      />
      <path fill="#fff" d="M28.5 16.5l-9 15h-4l9-15h4z" />
    </svg>
  )
}

function PetalMark() {
  const c = { a: '#36C5F0', b: '#2EB67D', c: '#ECB22E', d: '#E01E5A' }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {/* bottom-left blue */}
      <path fill={c.a} d="M19 27a4 4 0 11-4-4h4v4z" />
      <rect fill={c.a} x="17" y="23" width="4" height="11" rx="2" transform="rotate(0 19 28)" />
      {/* top green */}
      <path fill={c.b} d="M21 19a4 4 0 114 4v-4h-4z" transform="translate(0 0)" />
      <rect fill={c.b} x="14" y="17" width="11" height="4" rx="2" />
      {/* right yellow */}
      <path fill={c.c} d="M29 21a4 4 0 11 4 4h-4v-4z" />
      <rect fill={c.c} x="27" y="14" width="4" height="11" rx="2" />
      {/* bottom orange/red */}
      <rect fill={c.d} x="23" y="27" width="11" height="4" rx="2" />
      <path fill={c.d} d="M27 29a4 4 0 11-4-4h4v4z" />
    </svg>
  )
}

function CheckPath() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}

function sampleToken() {
  const seg = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')
  const tail = Math.random().toString(36).slice(2, 8)
  return `xoxb-${seg(13)}-${seg(13)}-${tail}`
}

// ---------------------------------------------------------------------------
// Default sample methods — used when no methods prop is supplied (e.g. preview)
// ---------------------------------------------------------------------------
const DEFAULT_METHODS: ConnectMethod[] = [
  {
    id: 'oauth',
    label: 'Sign in with OAuth',
    desc: 'Securely authenticate via your existing account — no API key needed.',
    icon: 'shield_lock',
    recommended: true,
  },
  {
    id: 'apikey',
    label: 'API Key',
    desc: 'Paste a workspace token if you prefer key-based access.',
    icon: 'key',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ConnectModal({
  onClose,
  onConnect,
  source = { name: 'Acme', mark: <AcmeMark /> },
  target = { name: 'Slack', mark: <PetalMark /> },
  methods = DEFAULT_METHODS,
  buttonStyle = 'brand',
}: ConnectModalProps) {
  // ---- state ----
  const [dismissed, setDismissed] = useState(false)
  const [method, setMethod] = useState<string | null>(null)
  const [token, setToken] = useState('')
  // Stable example key shown as InlineEdit's displayed value until a real token is committed.
  const [sampleKey] = useState(sampleToken)
  const [secure, setSecure] = useState(false)
  const [pasted, setPasted] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success'>('idle')

  // ---- timer helpers (callback-ref pattern, no effect hooks) ----
  const enterTimer = useTimerRef()
  const closeTimer = useTimerRef()
  const lockTimer = useTimerRef()
  const flashTimer = useTimerRef()

  // ---- input ref (stays unset; useCardRef's Enter-in-input guard treats any
  // focused INPUT as "not the connect trigger" as long as this is null) ----
  const inputRef = useRef<HTMLInputElement | null>(null)

  // ---- derived values ----
  const needsKey = method === 'apikey'
  const valid = method === 'oauth' || (needsKey && token.trim().length >= 8)

  // ---- handlers ----
  function triggerSecure() {
    setSecure(false)
    lockTimer.clear()
    setTimeout(() => setSecure(true), 16)
    lockTimer.set(480, () => setSecure(false))
  }

  function selectMethod(id: string) {
    setMethod(id)
  }

  // Fires from InlineEdit's onCommit (Enter key; its save button is hidden here).
  function commitKey(next: string) {
    setToken(next)
    if (next.trim().length >= 8) triggerSecure()
  }

  async function handlePaste() {
    let text = ''
    try {
      if (navigator.clipboard?.readText) {
        text = await navigator.clipboard.readText()
      }
    } catch {
      /* permission denied -- fall through to sample */
    }
    if (!text || text.length < 8) text = sampleToken()
    setToken(text)
    setPasted(true)
    triggerSecure()
    flashTimer.set(900, () => setPasted(false))
  }

  function clearToken() {
    setToken('')
    setPasted(false)
  }

  function handleClose() {
    setDismissed(true)
    onClose?.()
  }

  function handleConnect() {
    if (!valid || phase !== 'idle') return
    setPhase('loading')
    setTimeout(() => {
      setPhase('success')
      setTimeout(() => {
        onConnect?.({ method, token: needsKey ? token : null })
        onClose?.()
      }, 850)
    }, 1300)
  }

  // ---- callback refs (replace keyboard/focus effects) ----
  // handleConnect is passed directly; useCardRef rebuilds its closure whenever
  // valid or phase changes (both are in the dep array), so it never goes stale.
  const cardRef = useCardRef({
    open: !dismissed,
    valid,
    phase,
    onClose: handleClose,
    handleConnect,
    inputRef,
  })

  // overlay ref: teardown timers when overlay unmounts
  const clearAll = useCallback(() => {
    enterTimer.clear()
    closeTimer.clear()
    lockTimer.clear()
    flashTimer.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const overlayRef = useOverlayRef(clearAll)

  // Squircle conversion (Step 5): cm-shell/cm-card is a natural concentric
  // pair. cm-card already carries useCardRef's focus-trap ref, so the
  // squircle ref is composed alongside it rather than replacing it; the
  // composed callback is memoized on cardRef's own identity so it stays
  // stable across renders where cardRef doesn't change.
  const shellSquircleRef = useSquircle<HTMLDivElement>()
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  const cardProxRef = useProximityGroup<HTMLDivElement>()
  const composedCardRef = useCallback(
    (el: HTMLDivElement | null) => {
      cardRef(el)
      cardSquircleRef(el)
      cardProxRef(el)
    },
    [cardRef, cardSquircleRef, cardProxRef],
  )

  // ---- CTA label ----
  const ctaLabel =
    phase === 'loading' ? (
      <span className="cm-spinner" aria-hidden="true" />
    ) : phase === 'success' ? (
      <>
        <svg className="cm-okcheck" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13l4 4 10-11" />
        </svg>
        <span>Connected</span>
      </>
    ) : (
      <>
        <span>Continue</span>
        <span className={`${iconClass('arrow_forward')} cm-cta-ic`} aria-hidden="true">
          arrow_forward
        </span>
      </>
    )

  if (dismissed) return null

  return (
    <div ref={overlayRef} className="cm-shell-wrap">
      <div className="cm-shell" ref={shellSquircleRef}>
        <div
          ref={composedCardRef}
          className="cm-card"
          tabIndex={-1}
          aria-labelledby="cm-title"
          aria-describedby="cm-sub"
        >
          <button type="button" className="cm-close" data-proximity aria-label="Close" onClick={handleClose}>
            <span className={iconClass('close')}>close</span>
          </button>

          <div className="cm-badges">
            <div className="cm-badge" aria-label={source.name}>{source.mark}</div>
            <div className="cm-connector" aria-hidden="true">
              {Array.from({ length: 15 }).map((_, idx) => {
                const col = idx % 5
                const row = Math.floor(idx / 5)
                const rowDelay = [0, 0.12, 0.2][row]
                return (
                  <i
                    key={`dot-${row}-${col}`}
                    style={{ animationDelay: col * 0.07 + rowDelay + 's' }}
                  />
                )
              })}
            </div>
            <div className="cm-badge" aria-label={target.name}>{target.mark}</div>
          </div>

          <h2 className="cm-title" id="cm-title">
            Connect {source.name} to {target.name}
          </h2>
          <p className="cm-sub" id="cm-sub">
            Choose how you&apos;d like to connect your {target.name} workspace to {source.name}{' '}
            and get started today.
          </p>

          <div className="cm-methods" role="radiogroup" aria-label="Connection method">
            {methods.map((m) => (
              // radio group members: button + role="radio" is the correct ARIA pattern
              // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
              <button
                type="button"
                key={m.id}
                className="cm-method"
                role="radio"
                aria-checked={method === m.id}
                aria-label={m.label}
                onClick={() => selectMethod(m.id)}
              >
                <span
                  className="cm-icontile"
                  data-active={method === m.id && valid ? 'true' : undefined}
                  aria-hidden="true"
                >
                  <span className={iconClass(m.icon)}>{m.icon}</span>
                </span>
                <span className="cm-mbody">
                  <span className="cm-mhead">
                    <span className="cm-mname">{m.label}</span>
                    {m.recommended && (
                      <span className="cm-badge-rec">
                        <span className={iconClass('verified')}>verified</span>
                        Recommended
                      </span>
                    )}
                  </span>
                  <span className="cm-mdesc">{m.desc}</span>
                </span>
                <span className="cm-radio" aria-hidden="true">
                  <span className="cm-ring" />
                  <span className="cm-fill">
                    <CheckPath />
                  </span>
                </span>
              </button>
            ))}

            {/* expanding API-key panel */}
            <div className="cm-expand" data-open={needsKey ? 'true' : undefined}>
              <div className="cm-expand-inner">
                <div className="cm-keypad">
                  <label className="cm-keylabel">
                    Enter your {target.name} API key
                  </label>
                  {/*
                    cm-field composes the shared InlineEdit (design-system/inline-edit/InlineEdit.tsx)
                    with the lock icon and paste/clear button either side. InlineEdit is imported
                    unmodified: click-to-edit, Enter-to-commit, Escape/click-outside-to-cancel are all
                    its own normal behavior. Its edit/save pencil button and "saved" toast are hidden
                    via cm-keypad-scoped CSS -- Bora's ask is no separate edit button here.
                  */}
                  <div className="cm-field" data-filled={token.length > 0 ? 'true' : undefined}>
                    <span
                      className="cm-lock"
                      data-secure={secure ? 'true' : undefined}
                      data-filled={token.length > 0 ? 'true' : undefined}
                      aria-hidden="true"
                    >
                      <span className={iconClass(token.length > 0 ? 'lock' : 'lock_open_right')}>
                        {token.length > 0 ? 'lock' : 'lock_open_right'}
                      </span>
                    </span>
                    <InlineEdit
                      fieldLabel={`${target.name} API key`}
                      prefix={false}
                      value={token || sampleKey}
                      onCommit={commitKey}
                    />

                    {token.length > 0 ? (
                      <button
                        type="button"
                        className={`cm-paste${pasted ? ' cm-pasteflash' : ''}`}
                        data-proximity
                        data-variant="clear"
                        aria-label="Remove key"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={clearToken}
                      >
                        <span className={iconClass(pasted ? 'check' : 'close')}>
                          {pasted ? 'check' : 'close'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="cm-paste"
                        data-proximity
                        aria-label="Paste from clipboard"
                        data-variant="paste"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={handlePaste}
                      >
                        <span className={iconClass('content_paste')}>content_paste</span>
                        <span aria-hidden="true">Paste</span>
                        <span className="cm-tip" role="tooltip">
                          Paste from clipboard
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cm-footer">
            <button
              type="button"
              className="cm-cta"
              data-proximity
              data-enabled={valid && phase === 'idle' ? 'true' : undefined}
              data-style={buttonStyle}
              disabled={!valid || phase !== 'idle'}
              aria-disabled={!valid}
              onClick={handleConnect}
            >
              {ctaLabel}
            </button>
            <p className="cm-note">
              <span className={iconClass('info')} aria-hidden="true">info</span>
              <span>
                By clicking Continue, you agree to the{' '}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Privacy Policy
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
