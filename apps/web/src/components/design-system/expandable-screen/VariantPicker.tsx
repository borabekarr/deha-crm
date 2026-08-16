import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

// Prototype picker — harness chrome, not part of the ExpandableScreen design.
// Local copy of the expandable-card precedent (components stay self-contained:
// nothing in a design-system component dir imports from a sibling one).
// Markup/classes/behaviour come from .claude/skills/prototype/PICKER.md; styles
// live in variants.css. No replay button (the morph is user-triggered).
// PICKER.md's highlight slide has no motion-tokens.css curve and minting is
// forbidden, so it arrives as one named constant (CONVERSION-SOP preference 3).
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

  // Measure the active pill after every switch (and on resize). Layout effect:
  // no flash of a mispositioned bar.
  useLayoutEffect(() => {
    const measure = () => {
      const el = navRef.current?.querySelectorAll<HTMLElement>('.proto-picker-item')?.[index]
      if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [index, labels.length])

  // Enable the slide only after first paint, so load doesn't animate.
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  // 1..N / ArrowLeft / ArrowRight, ignored inside text entry or with a modifier.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const num = Number.parseInt(e.key, 10)
      if (num >= 1 && num <= labels.length) onSelect(num - 1)
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
