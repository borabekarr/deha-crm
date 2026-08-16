import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './MessageDropdown.css'
import './proto/variants.css'

// ---------------------------------------------------------------------------
// MessageDropdown — Deha Design System
// Reusable notification dropdown with a gooey/fluid morph between the
// trigger circle and the open panel.
//
// How the goo works: the dark trigger circle and the dark panel-bg shape
// both live inside a wrapper with `filter: url(#deha-goo-filter)`. The SVG
// filter blurs them and re-thresholds the alpha channel — when the two
// shapes get close enough they visually merge into a single liquid blob.
// The panel-bg starts as a tiny disk hidden inside the trigger (same x/y,
// 56px circle) and animates into a 340x334 rounded rectangle below — during
// that interpolation the filter renders the in-between as a stretching
// droplet. The crisp foreground (icon, header, list items, footer) lives
// OUTSIDE the filter, layered on top, so type stays sharp.
//
// Faithful port of
// apps/web/design-system/claude-design/raw/message-dropdown/message-dropdown.jsx —
// byte-preserved DOM/CSS/timings per CONVERSION-SOP.md. Motion values are
// tokenized in MessageDropdown.css where an exact value-identical token
// exists (see that file's header); the one raw duration with no matching
// tier (380ms) is carried as a literal, unchanged from source.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ProtoPicker } from './proto/ProtoPicker'

// ---------- Sample data ----------

export interface MessageDropdownItem {
  id: string
  sender: string
  time: string
  unread?: boolean
  preview: string
  gradient: string
}

const SAMPLE_MESSAGES: MessageDropdownItem[] = [
  {
    id: 'm1',
    sender: 'Alice Johnson',
    time: '2h',
    unread: true,
    preview: 'Hey! Are we still on for the meeting at 3?',
    gradient: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)',
  },
  {
    id: 'm2',
    sender: 'Bob Smith',
    time: '2h',
    unread: true,
    preview: "Don't forget to check out the new proposal draft.",
    gradient: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
  },
  {
    id: 'm3',
    sender: 'Charlie Davis',
    time: 'Yesterday',
    unread: true,
    preview: "Can you send me the files from last week's sprint?",
    gradient: 'linear-gradient(135deg, #34D399 0%, #06B6D4 100%)',
  },
]

// ---------- Component ----------

export interface MessageDropdownProps {
  messages?: MessageDropdownItem[]
  gooey?: boolean
  speed?: 'normal' | 'slow'
  open?: boolean
  onOpen?: () => void
  onClose?: () => void
  label?: string
  viewAllLabel?: string
}

export function MessageDropdown({
  messages = SAMPLE_MESSAGES,
  gooey = true,
  speed = 'normal',
  open: openProp,
  onOpen,
  onClose,
  label = 'Messages',
  viewAllLabel = 'View Messages',
}: MessageDropdownProps) {
  const isControlled = openProp !== undefined
  const [innerOpen, setInnerOpen] = useState(false)
  const open = isControlled ? openProp : innerOpen
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInnerOpen(v)
      if (v && onOpen) onOpen()
      if (!v && onClose) onClose()
    },
    [isControlled, onOpen, onClose],
  )
  const toggle = () => setOpen(!open)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open, setOpen])

  // Esc to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  // Keyboard nav inside the list (when open)
  const onItemKeyDown = (e: KeyboardEvent<HTMLLIElement>, idx: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      itemRefs.current[(idx + 1) % messages.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      itemRefs.current[(idx - 1 + messages.length) % messages.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      itemRefs.current[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      itemRefs.current[messages.length - 1]?.focus()
    }
  }

  const unread = messages.filter((m) => m.unread).length

  return (
    <div ref={rootRef} className={`md-root ${open ? 'open' : ''}`} data-speed={speed}>
      {/* Global SVG goo filter — referenced by .md-goo-wrap.gooey. Scoped inline
          inside the component (rather than once at the page root like the raw
          demo page) so MessageDropdown stays a self-contained, reusable unit;
          filter values are byte-preserved from the raw source. */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <filter id="deha-goo-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 20 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Grey external shell — frames the open panel (theme-editor .te-outer style) */}
      <div className="md-panel-shell" aria-hidden="true" />

      {/* Gooey shape layer — only the dark blobs live here */}
      <div className={`md-goo-wrap ${gooey ? 'gooey' : ''}`} aria-hidden="true">
        <div className="md-trigger-bg" />
        <div className="md-panel-bg" />
      </div>

      {/* Real interactive trigger — above the goo layer */}
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
            itemRefs.current[0]?.focus()
          }
        }}
      >
        <span className="material-symbols-outlined">chat_bubble</span>
        {unread > 0 && !open && (
          <span className="md-trigger-badge" aria-hidden="true">
            {unread}
          </span>
        )}
      </button>

      {/* Content layer — crisp, on top of panel-bg */}
      {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- animated popover (opacity/pointer-events driven by .md-root.open); native <dialog> alters show/hide semantics and would fight the CSS transition, same precedent as FileFolder.tsx/Calendar.tsx */}
      <div className="md-panel-content" role="dialog" aria-modal="false" aria-label={label} aria-hidden={!open}>
        <div className="md-header">
          <h3>{label}</h3>
          {unread > 0 && (
            <span className="md-count-tag" aria-label={`${unread} new`}>
              {unread}
            </span>
          )}
        </div>

        <ul className="md-list" role="list">
          {messages.map((m, i) => (
            <li
              key={m.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className={`md-item ${m.unread ? 'md-unread' : ''}`}
              tabIndex={open ? 0 : -1}
              onKeyDown={(e) => onItemKeyDown(e, i)}
            >
              <div className="md-avatar" style={{ background: m.gradient }} aria-hidden="true" />

              <div className="md-item-text">
                <div className="md-row1">
                  <span className="md-sender">{m.sender}</span>
                  {/* Colorful tag — tint derives from the live data-primary palette. */}
                  {m.unread && <span className="md-tag">New</span>}
                  <span className="md-time">{m.time}</span>
                </div>
                <div className="md-preview">{m.preview}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="md-footer">
          <button type="button" tabIndex={open ? 0 : -1}>
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_outward
            </span>
            <span className="md-btn-label">{viewAllLabel}</span>
          </button>
          <button type="button" className="md-mark-read" tabIndex={open ? 0 : -1}>
            <span className="material-symbols-outlined" aria-hidden="true">
              done_all
            </span>
            <span className="md-btn-label">Mark all as read</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Default demo shell ----------
// Mirrors the raw source's Demo() at its canonical default state: gooey=true,
// speed="normal". The raw source has no tweaks panel for this slug (a
// standalone Demo(), not the <x-dc>/App()+tweaks-panel.jsx pattern), so
// nothing is omitted there.

function Demo() {
  return (
    <div className="md-panel">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 18,
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          {/* lineHeight: 'normal' is not in the raw source's inline style object,
              but is required for byte-identical rendered header height: the raw
              standalone page has no line-height reset (browser UA default,
              'normal'), while this app's Tailwind preflight sets line-height:1.5
              on <html>, which these headings would otherwise inherit, inflating
              the baseline-aligned header row ~5px taller than the raw baseline.
              Packaging-only fix, no design value changed. */}
          <h1
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: '#0F172A',
              lineHeight: 'normal',
            }}
          >
            Message Dropdown
          </h1>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: '-0.005em',
            }}
          >
            Gooey morph on open · click trigger to demo
          </span>
        </div>
      </div>

      {/* Single component */}
      <div className="md-card">
        <MessageDropdown gooey={true} speed="normal" />
      </div>
    </div>
  )
}

// The raw source's <body>{.stage: display:flex; align-items:center;
// justify-content:center} centers the #root mount point; this wrapper
// reproduces that packaging-only layout need (not part of the
// byte-preserved .md-* rule set) so the block-level .md-panel doesn't sit
// flush against the preview route's container edge. Precedent: OtpInputDemo,
// DropdownDemo.
// ── prototype surface (ds-review-overlays step 4) ────────────────────────
// Three pane-card directions behind the prototype skill's picker; "Main" is
// step 3's shipped result untouched and is the cherry-pick baseline (star).
// Variant styling lives entirely in proto/variants.css, keyed off a
// .mdv-<slug> class (distinct from the dropdown run's .ddv-* prefix) mirrored
// onto <html> as well as the stage root. Delete this block + proto/ to strip.
const VARIANT_SLUGS = ['main', 'tiles', 'editorial', 'vivid'] as const
const VARIANT_NAMES = ['Main', 'Tiles', 'Editorial', 'Vivid']

export default function MessageDropdownDemo() {
  const [variant, setVariant] = useState(0)
  const [nonce, setNonce] = useState(0) // replay: re-mount so the morph re-runs
  const slug = VARIANT_SLUGS[variant]

  useEffect(() => {
    const cls = 'mdv-' + slug
    document.documentElement.classList.add(cls)
    return () => document.documentElement.classList.remove(cls)
  }, [slug])

  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      <div className={'md-proto-root mdv-' + slug} data-variant={slug} key={slug + ':' + nonce}>
        <Demo />
      </div>
      <ProtoPicker
        names={VARIANT_NAMES}
        index={variant}
        mainIndex={0}
        onSelect={setVariant}
        onReplay={() => setNonce((n) => n + 1)}
      />
    </div>
  )
}
