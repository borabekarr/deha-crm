import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './MorphSurface.css'

import { useState, useCallback, useRef } from 'react'
import { useProximityGroup } from '@/lib/hooks'
import { useTextareaRef, useClickOutside, useSuccessFlash } from './morph-surface-hook'

export interface MorphSurfaceProps {
  label?: string
  triggerLabel?: string
  placeholder?: string
  collapsedWidth?: number
  collapsedHeight?: number
  expandedWidth?: number
  expandedHeight?: number
  onSubmit?: (value: string) => void
}

export default function MorphSurface({
  label = 'Morph Surface',
  triggerLabel = 'Feedback',
  placeholder = "What's on your mind?",
  collapsedWidth = 360,
  collapsedHeight = 44,
  expandedWidth = 360,
  expandedHeight = 200,
  onSubmit,
}: MorphSurfaceProps) {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)

  const close = useCallback(() => setOpen(false), [])
  const { triggerFlash } = useSuccessFlash(setSuccess)

  /* stable ref to read textarea value imperatively in submit */
  const taElRef = useRef<HTMLTextAreaElement | null>(null)

  /* callback-refs — no useEffect */
  const textareaCallbackRef = useTextareaRef(open)
  const clickOutsideRef = useClickOutside(open, close)
  const proximityRef = useProximityGroup<HTMLDivElement>()
  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      clickOutsideRef(el)
      proximityRef(el)
    },
    [clickOutsideRef, proximityRef],
  )

  /* compose the autofocus callback-ref with the stable element ref */
  const textareaRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      taElRef.current = el
      textareaCallbackRef(el)
    },
    [textareaCallbackRef],
  )

  function submit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const ta = taElRef.current
    const v = ta ? ta.value.trim() : ''
    if (!v) {
      if (ta) ta.focus()
      return
    }
    if (onSubmit) onSubmit(v)
    setOpen(false)
    if (ta) ta.value = ''
    triggerFlash()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') close()
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }

  /* Inline styles drive the morph — CSS transitions pick them up */
  const surfaceStyle: React.CSSProperties = {
    width: open ? expandedWidth : collapsedWidth,
    height: open ? expandedHeight : collapsedHeight,
    borderRadius: open ? 14 : 9999,
  }

  /* dot glides from bar centre (bottom ~13px, 18×18) up to form top-left (bottom ~173px, 8×8) */
  const dotBottom = open ? expandedHeight - 27 : (collapsedHeight - 18) / 2
  const dotStyle: React.CSSProperties = {
    bottom: dotBottom,
    left: 16,
    width: open ? 8 : 18,
    height: open ? 8 : 18,
    backgroundSize: open ? 'cover, 4px 4px, 4px 4px' : 'cover, 6px 6px, 6px 6px',
  }

  return (
    <div className="ms2-wrap">
      <div
        ref={rootRef}
        className={`ms2-surface${open ? ' ms2-open' : ''}`}
        style={surfaceStyle}
        onClick={() => { if (!open) setOpen(true) }}
      >
        {/* morphing brand dot — glides from bar centre up to form top-left */}
        <span
          className={`ms2-dot${success ? ' ms2-success' : ''}`}
          style={dotStyle}
          aria-hidden="true"
        >
          <svg className="ms2-check" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13L9 17L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {/* collapsed bar — always mounted, hidden via opacity when open */}
        <div className="ms2-bar">
          <span className="ms2-label">{label}</span>
          <button
            type="button"
            className="ms2-trigger"
            data-proximity
            tabIndex={open ? -1 : 0}
            onClick={(e) => { e.stopPropagation(); setOpen(true) }}
          >
            {triggerLabel}
          </button>
        </div>

        {/* expanded feedback form — always mounted, hidden via opacity when closed */}
        <form className="ms2-form" onSubmit={submit}>
          <div className="ms2-form-head">
            <span className="ms2-form-title">{triggerLabel}</span>
            <button type="submit" className="ms2-submit" data-proximity tabIndex={open ? 0 : -1}>
              <kbd>⌘</kbd>
              <kbd>Enter</kbd>
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className="ms2-textarea"
            name="message"
            aria-label={triggerLabel}
            placeholder={placeholder}
            spellCheck={false}
            onKeyDown={onKeyDown}
            tabIndex={open ? 0 : -1}
          />
        </form>
      </div>
    </div>
  )
}
