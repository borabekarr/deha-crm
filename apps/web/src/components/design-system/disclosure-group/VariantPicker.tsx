import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Prototype picker — harness chrome, not part of the DisclosureGroup design.
// Markup, classes and behaviour contract come from
// .claude/skills/prototype/PICKER.md; the styles live in variants.css.
// No replay button: the panel has no entrance animation to re-trigger (its
// motion is user-triggered expansion), and PICKER.md makes replay conditional.
// ---------------------------------------------------------------------------

// PICKER.md's verbatim highlight slide, as one named constant (the curve has
// no motion-tokens.css equivalent and minting is forbidden — CONVERSION-SOP
// preference 3). Consumed by `.proto-picker[data-ready] .proto-picker-highlight`.
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

  // Measure the active pill after every switch (and on resize) so the
  // highlight lands on it. Layout effect: no flash of a mispositioned bar.
  useLayoutEffect(() => {
    const measure = () => {
      const items = navRef.current?.querySelectorAll<HTMLElement>('.proto-picker-item')
      const el = items?.[index]
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
