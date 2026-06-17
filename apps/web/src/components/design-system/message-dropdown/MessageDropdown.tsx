import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './MessageDropdown.css'
import { useState, useRef, useCallback } from 'react'
import { mdRootRef, cleanupMdRoot } from './message-dropdown-hook'

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

  const unread = messages.filter((m) => m.unread).length

  return (
    <div
      ref={rootCallbackRef}
      className={`md-root${open ? ' open' : ''}`}
    >
      {/* Grey external shell — frames the open panel (theme-editor .te-outer style) */}
      <div className="md-panel-shell" aria-hidden="true" />

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
                <div className="md-preview">{m.preview}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="md-footer">
          <button type="button" tabIndex={open ? 0 : -1}>
            <span className="material-symbols-outlined" aria-hidden="true">arrow_outward</span>
            <span className="md-btn-label">{viewAllLabel}</span>
          </button>
          <button type="button" className="md-mark-read" tabIndex={open ? 0 : -1}>
            <span className="material-symbols-outlined" aria-hidden="true">done_all</span>
            <span className="md-btn-label">Mark all as read</span>
          </button>
        </div>
      </dialog>
    </div>
  )
}
