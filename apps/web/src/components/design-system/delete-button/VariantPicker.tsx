import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { PICKER_CSS } from './picker-css'

// Prototype picker chrome (ds-review-inputs Step 6). Markup/behavior contract
// from .claude/skills/prototype/PICKER.md, copied verbatim minus the replay
// button (no variant needs a manual re-trigger — clicking the button already
// walks idle -> confirming -> done). Delete with the rest of the prototype
// surface once a direction is promoted (Hard Rule 5).
const SLIDE = '250ms cubic-bezier(0.23, 1, 0.32, 1)'

export function VariantPicker({
  labels,
  index,
  onSelect,
}: {
  labels: readonly string[]
  index: number
  onSelect: (i: number) => void
}) {
  const navRef = useRef<HTMLElement | null>(null)
  const [bar, setBar] = useState({ left: 0, width: 0 })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (document.getElementById('db-proto-picker-css')) return
    const s = document.createElement('style')
    s.id = 'db-proto-picker-css'
    s.textContent = PICKER_CSS
    document.head.appendChild(s)
  }, [])

  useLayoutEffect(() => {
    const el = navRef.current?.querySelectorAll<HTMLElement>('.proto-picker-item')[index]
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth })
  }, [index, labels.length])

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= labels.length) onSelect(n - 1)
      else if (e.key === 'ArrowRight') onSelect((index + 1) % labels.length)
      else if (e.key === 'ArrowLeft') onSelect((index - 1 + labels.length) % labels.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, labels.length, onSelect])

  return (
    <nav
      className="proto-picker"
      aria-label="Prototype variants"
      ref={navRef}
      {...(ready ? { 'data-ready': '' } : null)}
      style={{ '--proto-slide': SLIDE } as CSSProperties}
    >
      <span
        className="proto-picker-highlight"
        aria-hidden="true"
        style={{ width: `${bar.width}px`, transform: `translateX(${bar.left}px)` }}
      />
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          className="proto-picker-item"
          onClick={() => onSelect(i)}
          {...(i === index ? { 'data-active': '', 'aria-current': 'true' as const } : null)}
          {...(i === 0 ? { 'data-main': '' } : null)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
