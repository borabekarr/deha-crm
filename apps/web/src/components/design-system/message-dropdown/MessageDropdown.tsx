import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './MessageDropdown.css'
import { useState, useRef, useCallback } from 'react'
import { mdRootRef, cleanupMdRoot } from './message-dropdown-hook'

// Helper: read a CSS custom property value as a number of milliseconds.
// Falls back to the provided default if the var is absent or unparseable.
function readCssMs(el: HTMLElement, prop: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(prop).trim()
  if (!raw) return fallback
  const num = parseFloat(raw)
  return isNaN(num) ? fallback : raw.endsWith('s') && !raw.endsWith('ms') ? num * 1000 : num
}

// ---------------------------------------------------------------------------
// MessageDropdown — Gooey dark message dropdown
// Port of /tmp/deha-brand-src/message-dropdown.html + message-dropdown.jsx
// Slug: message-dropdown | Category: Primitives | Viewport: 920×800
// ---------------------------------------------------------------------------

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  sender: string
  preview: string
  time: string
  gradient: string
  unread: boolean
}

interface MessageDropdownProps {
  messages?: Message[]
  gooey?: boolean
  open?: boolean
  onOpen?: () => void
  onClose?: () => void
  label?: string
  viewAllLabel?: string
}

// ── Sample data ───────────────────────────────────────────────────────────────

const SAMPLE_MESSAGES: Message[] = [
  {
    id: 'm1', sender: 'Alice Johnson', time: '2h', unread: true,
    preview: 'Hey! Are we still on for the meeting at 3?',
    gradient: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)',
  },
  {
    id: 'm2', sender: 'Bob Smith', time: '2h', unread: true,
    preview: "Don't forget to check out the new proposal draft.",
    gradient: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
  },
  {
    id: 'm3', sender: 'Charlie Davis', time: 'Yesterday', unread: true,
    preview: "Can you send me the files from last week's sprint?",
    gradient: 'linear-gradient(135deg, #34D399 0%, #06B6D4 100%)',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function MessageDropdown({
  messages = SAMPLE_MESSAGES,
  gooey = true,
  open: openProp,
  onOpen,
  onClose,
  label = 'Messages',
  viewAllLabel = 'View Messages',
}: MessageDropdownProps) {
  const isControlled = openProp !== undefined
  const [innerOpen, setInnerOpen] = useState(false)
  const open = isControlled ? openProp : innerOpen

  // Fix (4): mark-all-as-read animation state
  // 'idle' -> 'ticking' (double-ticks appear) -> 'sliding' (rows slide out) -> 'done'
  const [markState, setMarkState] = useState<'idle' | 'ticking' | 'sliding' | 'done'>('idle')
  // Persistent flag: once mark-all runs, badge stays gone even after markState resets to idle
  const [allRead, setAllRead] = useState(false)
  const markTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Shared mutable ref so window listeners can read current open state without
  // being re-registered. Written only inside event handlers / setOpen (never during render).
  const openRef = useRef(false)

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const itemEls = useRef<Array<HTMLLIElement | null>>([])

  const setOpen = useCallback((v: boolean) => {
    openRef.current = v       // update ref synchronously in handler, not during render
    if (!isControlled) setInnerOpen(v)
    if (v && onOpen) onOpen()
    if (!v && onClose) onClose()
  }, [isControlled, onOpen, onClose])

  const toggle = () => setOpen(!openRef.current)

  // Fix (4): handle mark-all-as-read sequence entirely inside an event handler.
  // No useEffect -- all timing uses setTimeout (legal: side-effect is in handler, not render).
  const handleMarkAllRead = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (markState !== 'idle') return
    // Clear any stale timers
    markTimers.current.forEach(clearTimeout)
    markTimers.current = []

    // Read --md-dur from the root element for anim-mult-aware timing
    const root = (e.currentTarget.closest('.md-root') as HTMLElement) ?? document.body
    const mdDur = readCssMs(root, '--md-dur', 560)

    // Phase 1: show blue double-ticks on each row
    setMarkState('ticking')

    // Phase 2: 2s after ticks appear, start sliding rows out
    const t1 = setTimeout(() => {
      setMarkState('sliding')

      // Phase 3: after slide animation finishes, close the dropdown
      const t2 = setTimeout(() => {
        setMarkState('done')
        setAllRead(true)
        setOpen(false)
        // Reset to idle after close animation completes so re-open is clean
        const t3 = setTimeout(() => setMarkState('idle'), mdDur + 100)
        markTimers.current.push(t3)
      }, mdDur)
      markTimers.current.push(t2)
    }, 2000)
    markTimers.current.push(t1)
  }, [markState, setOpen])

  // Keyboard navigation inside the list (no window listener; synthetic events only)
  const onItemKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      itemEls.current[(idx + 1) % messages.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      itemEls.current[(idx - 1 + messages.length) % messages.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      itemEls.current[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      itemEls.current[messages.length - 1]?.focus()
    }
  }

  // Callback ref for root element — wires window listeners with teardown
  const rootCallbackRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) {
        mdRootRef(el, openRef, setOpen, triggerRef, itemEls)
      } else {
        cleanupMdRoot(el)
      }
    },
    // setOpen is stable (useCallback with stable deps); openRef/triggerRef/itemEls are refs
    [setOpen],
  )

  // Fix (4): badge disappears after mark-all completes and stays gone (allRead persists)
  const unread = allRead || markState === 'done' ? 0 : messages.filter((m) => m.unread).length

  return (
    <div
      ref={rootCallbackRef}
      className={`md-root${open ? ' open' : ''}${markState !== 'idle' ? ` md-mark-state-${markState}` : ''}`}
    >
      {/* Grey external shell — frames the open panel (theme-editor .te-outer style).
          Fix (5): no aria-hidden so Agentation can hit-test the outer rim via pointer-events:auto when open. */}
      <div className="md-panel-shell" />

      {/* Gooey shape layer — only the dark blobs live here */}
      <div className={`md-goo-wrap${gooey ? ' gooey' : ''}`} aria-hidden="true">
        <div className="md-trigger-bg" />
        <div className="md-panel-bg" />
      </div>

      {/* Real interactive trigger — above the goo layer.
          (Default-view "Messages" label removed per feedback — button only.) */}
      <button
        ref={triggerRef}
        className="md-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={open ? `Close ${label}` : `Open ${label} (${unread} new)`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggle()
          } else if (e.key === 'ArrowDown' && open) {
            e.preventDefault()
            itemEls.current[0]?.focus()
          }
        }}
      >
        <span className="material-symbols-outlined">chat_bubble</span>
        {unread > 0 && !open && (
          <span className="md-trigger-badge" aria-hidden="true">{unread}</span>
        )}
      </button>

      {/* Content layer — crisp, on top of panel-bg. Stays MOUNTED; toggled via
          visibility/opacity on the parent .md-root.open class.
          Using <dialog> element (non-modal) for semantics; open attr reflects state. */}
      <dialog
        className="md-panel-content"
        aria-label={label}
        open={open || undefined}
      >
        <ul className="md-list" role="list">
          {messages.map((m, i) => (
            <li
              key={m.id}
              ref={(el) => { itemEls.current[i] = el }}
              className={`md-item${m.unread ? ' md-unread' : ''}`}
              tabIndex={open ? 0 : -1}
              onKeyDown={(e) => onItemKeyDown(e, i)}
              style={{ '--md-item-i': i } as React.CSSProperties}
            >
              <div
                className="md-avatar"
                style={{ background: m.gradient }}
                aria-hidden="true"
              />
              <div className="md-item-text">
                <div className="md-row1">
                  <span className="md-sender">{m.sender}</span>
                  <span className="md-time">{m.time}</span>
                </div>
                {/* Fix (4): preview row contains the overlay tick + blur reveal */}
                <div className="md-preview-wrap">
                  <div className="md-preview">{m.preview}</div>
                  <div className="md-tick-overlay" aria-hidden="true">
                    <span className="material-symbols-outlined md-tick-icon">done_all</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="md-footer">
          <button type="button" tabIndex={open ? 0 : -1}>
            <span className="material-symbols-outlined" aria-hidden="true">arrow_outward</span>
            <span className="md-btn-label">{viewAllLabel}</span>
          </button>
          <button
            type="button"
            className="md-mark-read"
            tabIndex={open ? 0 : -1}
            onClick={handleMarkAllRead}
            disabled={markState !== 'idle'}
            aria-label="Mark all messages as read"
          >
            <span className="material-symbols-outlined" aria-hidden="true">done_all</span>
            <span className="md-btn-label">Mark all as read</span>
          </button>
        </div>
      </dialog>
    </div>
  )
}
