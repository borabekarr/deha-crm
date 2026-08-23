import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ExpandableCard.css'

// ---------------------------------------------------------------------------
// Expandable Card — Deha Design System
// Three cards (Meeting / Task / Weather) sit on `.shell.zoom` bezels; a click
// (or Enter/Space) springs each card's width from 320px to 420px and reveals
// a measured-height content region beneath the always-visible header.
//
// Canonical source per CONVERSION-SOP.md: expandable-card.html — the demo
// Bora sees on claude.ai/design (three named, populated cards). The sibling
// expandable-card.jsx is a generic composable Expandable/ExpandableTrigger/
// ExpandableCard/ExpandableContent API with no baked-in demo data at all (no
// "Design Sync" / "Mobile app redesign" / "Today's Weather" content, same
// gap class as BlurCarousel.tsx / ExpandableScreen.tsx's own jsx-sibling
// notes), so it is not pixel-comparable to the HTML demo the gate diffs
// against. Its Expandable/ExpandableContent hooks state machine (isExpanded/
// measured height/opacity+transform reveal with a delayed second phase) is
// functionally identical to the HTML's own Component class (open[]/
// heights[]/cardStyle/contentStyle/innerStyle), so it was read for
// confirmation only; the state machine below follows the .html's own class
// methods (toggle/cardStyle/contentStyle/innerStyle/chevStyle) directly,
// same precedent as BlurCarousel.tsx / ExpandableScreen.tsx's
// jsx-for-confirmation-only note.
//
// hoverToExpand / expandDirection / animationDuration / slowMotion /
// darkMode are the raw source's tweaks-panel props (data-dc-script's
// data-props schema) — ambient claude.ai/design authoring tooling outside
// the component itself, same exclusion as every other <x-dc>-format
// conversion in this repo (ExpandableScreen.tsx's triggerRadius/
// contentRadius/animationDuration, Dropdown's positioning props). This port
// fixes them at their documented defaults: animationDuration 0.5s,
// expandDirection 'both' (so the vertical-only branch never taken — width
// always alternates 320/420, inner content width is always a constant
// 420-56=364px), hoverToExpand false (enter/leave handlers wired but
// permanently inert, same as raw's own `hover()` guard).
//
// `--ease-spring` / `--ease-out` / `--anim-mult` below are not tokenized —
// the raw source's own Component class already writes these as CSS custom
// property references (`var(--ease-spring)` etc, not literal cubic-beziers),
// and the project's own design-system/preview/_shared-feedback.css already
// canonically defines --ease-spring / --ease-out with the exact values the
// raw source's cousin expandable-card.jsx hardcodes for confirmation
// (cubic-bezier(.34,1.56,.64,1) / cubic-bezier(.22,1,.36,1)), loaded ahead
// of every component via src/styles/global.css. Byte-preserving the raw
// source's own `var(--ease-spring)` literal is therefore simultaneously the
// value-identical token substitution CONVERSION-SOP's later tokenization
// pass would otherwise require — nothing left to do in a separate pass.
//
// react-doctor no-giant-component split: the variant motion table, style
// helpers (cardStyle/innerStyle/chevStyle) and demo constants (ATTENDEES/
// CONDITIONS/FORECAST/VARIANTS/MOTION) now live in
// expandable-card-shared.ts; the three cards render via sibling components
// (MeetingCard/TaskCard/WeatherCard). State (open/variantIndex), the
// useAutoHeight hooks and every handler stay owned by ExpandableCardDemo
// exactly as before — only render-only JSX and pure value logic moved.
// ---------------------------------------------------------------------------

import { useCallback, useState, type KeyboardEvent } from 'react'
import { useAutoHeight } from '@/lib/hooks/use-auto-height'
import { VariantPicker } from './VariantPicker'
import { MeetingCard } from './MeetingCard'
import { TaskCard } from './TaskCard'
import { WeatherCard } from './WeatherCard'
import { HOVER_TO_EXPAND, MOTION, VARIANTS } from './expandable-card-shared'
import './variants.css'

type OpenState = [boolean, boolean, boolean]

export default function ExpandableCardDemo() {
  const [open, setOpen] = useState<OpenState>([false, false, false])

  // Picker selection, persisted across reload via `?v=N` (falls back to 1 =
  // main). Read lazily and written in the click handler, so no effect is added
  // to the component itself; the picker's own listeners live in VariantPicker.
  const [variantIndex, setVariantIndex] = useState(() => {
    const raw = Number.parseInt(new URLSearchParams(window.location.search).get('v') ?? '', 10)
    return raw >= 1 && raw <= VARIANTS.length ? raw - 1 : 0
  })
  const variant = VARIANTS[variantIndex].id
  const selectVariant = useCallback((i: number) => {
    setVariantIndex(i)
    setOpen([false, false, false])
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(i + 1))
    window.history.replaceState(null, '', url)
  }, [])

  // House hook replaces raw's componentDidMount `this._measure` +
  // resize/fonts re-measure entirely: it measures the live scrollHeight at
  // toggle time, re-measures from the *rendered* height when interrupted
  // mid-animation, resolves back to `auto` (so late font/content growth
  // tracks itself via its ResizeObserver) and honours --anim-mult and
  // prefers-reduced-motion. Three fixed cards => three fixed hook calls.
  // Per-variant duration/easing; `main` resolves to the same 500ms /
  // var(--ease-spring) pair Step 1 shipped.
  const hookOpts = (i: number) => ({
    open: open[i],
    duration: MOTION[variant].heightMs(open[i]),
    easing: MOTION[variant].heightEasing,
  })
  const autoHeights = [
    useAutoHeight<HTMLDivElement>(hookOpts(0)),
    useAutoHeight<HTMLDivElement>(hookOpts(1)),
    useAutoHeight<HTMLDivElement>(hookOpts(2)),
  ]

  const setCardOpen = useCallback((i: number, v: boolean) => {
    setOpen((prev) => {
      if (prev[i] === v) return prev
      const next = [...prev] as OpenState
      next[i] = v
      return next
    })
  }, [])

  const toggle = useCallback((i: number) => {
    setOpen((prev) => {
      const next = [...prev] as OpenState
      next[i] = !next[i]
      return next
    })
  }, [])

  const keyHandler = (i: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(i)
    }
  }
  const handleEnter = (i: number) => () => {
    if (HOVER_TO_EXPAND) setCardOpen(i, true)
  }
  const handleLeave = (i: number) => () => {
    if (HOVER_TO_EXPAND) setCardOpen(i, false)
  }
  return (
    <div
      data-screen-label="Expandable Card"
      className="xc-root"
      data-variant={variant}
    >
      {/* ── Card 1 · Meeting ─────────────────────────────── */}
      <MeetingCard
        open={open[0]}
        variant={variant}
        onToggle={() => toggle(0)}
        onKeyDown={keyHandler(0)}
        onMouseEnter={handleEnter(0)}
        onMouseLeave={handleLeave(0)}
        contentRef={autoHeights[0].ref}
      />

      {/* ── Card 2 · Task ────────────────────────────────── */}
      <TaskCard
        open={open[1]}
        variant={variant}
        onToggle={() => toggle(1)}
        onKeyDown={keyHandler(1)}
        onMouseEnter={handleEnter(1)}
        onMouseLeave={handleLeave(1)}
        contentRef={autoHeights[1].ref}
      />

      {/* ── Card 3 · Weather ─────────────────────────────── */}
      <WeatherCard
        open={open[2]}
        variant={variant}
        onToggle={() => toggle(2)}
        onKeyDown={keyHandler(2)}
        onMouseEnter={handleEnter(2)}
        onMouseLeave={handleLeave(2)}
        contentRef={autoHeights[2].ref}
      />

      <VariantPicker
        labels={VARIANTS.map((v) => v.label)}
        index={variantIndex}
        onSelect={selectVariant}
      />
    </div>
  )
}
