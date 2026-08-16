import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import './variants.css'

// ---------------------------------------------------------------------------
// Prototype picker — harness chrome, not part of the Picker design.
// Markup, classes, styling and behaviour contract come from
// .claude/skills/prototype/PICKER.md; the styles live in variants.css.
// No replay button: the picker has no entrance animation to re-trigger (its
// motion is user-triggered: the FAB morph and the wheel gesture), and
// PICKER.md makes replay conditional.
//
// Deliberately effect-free (the Step 4 brief forbids new useEffect, and the
// component under test is already rAF/interval heavy): the highlight is
// measured by a callback ref on the active button instead of a layout effect,
// and the 1..N / arrow keys are handled by an onKeyDown on the nav rather than
// a document listener. The equality guard makes the callback ref idempotent —
// it fires null/el on every render (inline identity), and only a genuine
// geometry change commits state, so there is no render loop.
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
  // `ready` gates the slide on: it only turns true once a first geometry has
  // been recorded, so the initial placement lands without animating.
  const [bar, setBar] = useState({ left: 0, width: 0, ready: false })

  const measure = (el: HTMLButtonElement | null) => {
    if (!el) return
    const left = el.offsetLeft
    const width = el.offsetWidth
    setBar((b) =>
      b.left === left && b.width === width ? b : { left, width, ready: b.width > 0 },
    )
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const num = Number.parseInt(e.key, 10)
    if (num >= 1 && num <= labels.length) onSelect(num - 1)
    else if (e.key === 'ArrowRight') onSelect((index + 1) % labels.length)
    else if (e.key === 'ArrowLeft') onSelect((index - 1 + labels.length) % labels.length)
    else return
    e.preventDefault()
  }

  return (
    <nav
      className="proto-picker"
      aria-label="Prototype variants"
      // PICKER.md's one allowed modification: the open cards are 466px tall and
      // their Today/Now footer row lands under the default bottom pill, so the
      // picker would sit on top of the work being judged.
      data-position="top"
      onKeyDown={onKeyDown}
      {...(bar.ready ? { 'data-ready': '' } : null)}
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
          ref={i === index ? measure : undefined}
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
