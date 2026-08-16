// Prototype variant picker (skills/prototype PICKER.md). Behaviour contract:
// click / number keys / arrow keys switch, R replays, the highlight slides
// while the variant swap itself stays instant, selection persists in ?v=N.
// Chrome only -- no project tokens, no theme awareness.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PICKER_CSS } from './picker-css'

export interface ProtoPickerProps {
  names: string[]
  index: number
  onSelect: (i: number) => void
  onReplay?: () => void
  mainIndex?: number
}

export function ProtoPicker({ names, index, onSelect, onReplay, mainIndex }: ProtoPickerProps) {
  const hlRef = useRef<HTMLSpanElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (document.getElementById('proto-picker-css')) return
    const s = document.createElement('style')
    s.id = 'proto-picker-css'
    s.textContent = PICKER_CSS
    document.head.appendChild(s)
  }, [])

  // measure after every render, and again on resize
  useLayoutEffect(() => {
    const el = itemRefs.current[index]
    const hl = hlRef.current
    if (!el || !hl) return
    hl.style.width = el.offsetWidth + 'px'
    hl.style.transform = `translateX(${el.offsetLeft}px)`
  })
  useEffect(() => {
    const onResize = () => {
      const el = itemRefs.current[index]
      const hl = hlRef.current
      if (!el || !hl) return
      hl.style.width = el.offsetWidth + 'px'
      hl.style.transform = `translateX(${el.offsetLeft}px)`
    }
    window.addEventListener('resize', onResize)
    // enable the slide only after first paint, so load does not animate
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(r)
    }
  }, [index])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(index + 1))
    window.history.replaceState(null, '', url)
  }, [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= names.length) onSelect(n - 1)
      else if (e.key === 'ArrowRight') onSelect((index + 1) % names.length)
      else if (e.key === 'ArrowLeft') onSelect((index - 1 + names.length) % names.length)
      else if (e.key === 'r' || e.key === 'R') onReplay && onReplay()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, names.length, onSelect, onReplay])

  return (
    // data-position="top": PICKER.md's one allowed modification -- the open pane
    // ends bottom-center of the viewport on this route, so a bottom pill would
    // cover the footer buttons under review.
    <nav
      className="proto-picker"
      aria-label="Prototype variants"
      data-position="top"
      {...(ready ? { 'data-ready': '' } : {})}
    >
      <span className="proto-picker-highlight" aria-hidden="true" ref={hlRef} />
      {names.map((n, i) => (
        <button
          key={n}
          type="button"
          className="proto-picker-item"
          ref={(el) => {
            itemRefs.current[i] = el
          }}
          {...(i === index ? { 'data-active': '', 'aria-current': 'true' as const } : {})}
          {...(i === mainIndex ? { 'data-main': '' } : {})}
          onClick={() => onSelect(i)}
        >
          {n}
        </button>
      ))}
      <span className="proto-picker-divider" aria-hidden="true" />
      <button
        type="button"
        className="proto-picker-item proto-picker-replay"
        aria-label="Replay animation (R)"
        onClick={() => onReplay && onReplay()}
      >
        ↻
      </button>
    </nav>
  )
}
