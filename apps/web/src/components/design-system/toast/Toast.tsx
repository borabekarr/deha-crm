import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { tokenMs } from '@/lib/token-ms'
import { VARIANTS, type VariantCfg } from './variants'
import { ToastCard } from './ToastCard'
import { ToastDemoCard } from './ToastDemoCard'
import { useToastSwipe } from './toast-swipe'
import { MULT, DEFAULT_DURATION, vm, type Phase, type Position, type ToastSpec, type ToastItem, type ToastVm } from './toast-vm'
// Same two per-component imports as Dropdown.tsx / ExpandableScreen.tsx /
// ExpandableCard.tsx et al: _base.css supplies `.shell` / `.shell.zoom` /
// `.label`, and (via its own `@import url('../colors_and_type.css')`, which
// Vite resolves for a component-level import but which does NOT survive
// global.css's Tailwind-processed import chain) the colors_and_type token set
// this source binds inline — --type-mini / --type-h4 / --fg1 / --fg4 /
// --bg-app / --bg-chip / --tracking-wider. Without it those inline var()
// references are invalid at computed-value time and silently fall back to
// inherited values.
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Toast.css'

// ---------------------------------------------------------------------------
// Toast — Deha Design System
// A demo trigger card (semantic + recipe buttons, top/bottom position
// segment, dismiss-all) driving two fixed toast viewports: stacked toasts
// that peek behind the front one, spring in and out, and optionally expand
// on press.
//
// Canonical source per CONVERSION-SOP.md:
// apps/web/design-system/claude-design/raw/toast/toast.html — the `<x-dc>` /
// `class Component extends DCLogic` prototype Bora sees on claude.ai/design.
// Everything below is that file's own markup and its Component class's own
// state machine (show/setPhase/startExit/toggleExpand/vm/group/renderVals),
// transposed to React. Every DOM class name, nesting order, inline style
// value, duration and easing is the raw file's; adaptation is limited to
// module packaging, TS types, and the two `style-hover=`/`style-active=`
// attributes the `<x-dc>` DSL declares inline and React cannot (moved to
// .ts-pill-btn / .ts-close-btn in Toast.css, values unchanged).
//
// The sibling `Toast (1).jsx` in that same raw dir is a generic
// provider/hook toast API (ToastProvider + useToast, no baked-in demo card,
// no top/bottom segment, no expandable recipe), so it is not
// pixel-comparable to the .html demo the gate diffs against; it was read for
// confirmation of the stacking math only. Same jsx-for-confirmation-only
// precedent as ExpandableCard.tsx / BlurCarousel.tsx / ExpandableScreen.tsx.
//
// Excluded, same as every other `<x-dc>`-format conversion: the raw file's
// `data-props` tweaks-panel schema (darkMode / slowMotion / duration) and
// the `applyModes()` that consumes it — ambient claude.ai/design authoring
// tooling, not part of the component. Its authored defaults are fixed at
// the literals the raw file ships and its own JS reads back: slowMotion
// false (so `mult()` === 1) and duration 3500.
//
// No motion tokenization (ds-rebuild-w3 is a fidelity rebuild): every value
// below is the source literal, except the one spring curve noted at
// SPRING_EASE, which the repo's motion-token-gate hook requires be written
// as its byte-identical token.
//
// react-doctor no-giant-component split: the per-toast view-model (vm()),
// its supporting constants and the ToastVm/ToastItem/ToastSpec/Phase/
// Position types now live in toast-vm.ts; the per-card render (ToastCard)
// and the demo/trigger card render (ToastDemoCard) are sibling components.
// State, refs, timers and the swipe gesture stay owned by ToastStage below
// exactly as before — only render-only JSX and pure value logic moved.
// ---------------------------------------------------------------------------

// Raw source: `const spring = 'cubic-bezier(.34,1.2,.5,1)'`. Written as the
// value-identical motion token instead of that literal — motion-tokens.css
// defines --ease-spring-pop as exactly cubic-bezier(.34, 1.2, .5, 1), and the
// repo's motion-token-gate hook blocks a literal cubic-bezier inside a
// transition on write. Same value-identical-substitution precedent as
// BlurCarousel.css; the rendered curve is unchanged.
// It, the wrap's resting transition and the swipe-commit thresholds live in
// variants.ts as the "main" variant config (ds-review-overlays step 6);
// "main" carries the same values this file shipped with.

// F13: sprint-planner-core substitution needs the viewport stack to escape a
// transformed ancestor (fixed-position-portals-under-transformed-ancestors
// lesson) and dock below-right of a host card instead of the viewport
// corner. Both new props default to undefined/unset, which reproduces the
// toast page's own behavior byte-for-byte -- no default-path change.
// F14: hideCard skips the in-tree demo/trigger card (.ts-root and its
// contents) entirely, leaving only the portaled viewports + imperative
// show()/handle API -- default unset reproduces the toast page byte-for-byte.

// Imperative handle exposed by ToastStage so an external host (e.g. the
// sprint-planner substitution step) can drive toasts without owning the
// stage's internal show()/state -- the module previously had no cross-host
// API, only ToastDemo's own button handlers calling its local `show`.
export interface ToastStageHandle {
  show: (spec: ToastSpec) => void
}

export type { ToastSpec }

export const ToastStage = forwardRef<ToastStageHandle, { cfg: VariantCfg; portalTarget?: Element | null; anchorRef?: React.RefObject<HTMLElement | null>; hideCard?: boolean }>(function ToastStage({ cfg, portalTarget, anchorRef, hideCard }, forwardedRef) {
  const [toasts, setToastsState] = useState<ToastItem[]>([])
  // Anchor rect (in viewport coords) of the host card the stack should dock
  // below-right of. Re-measured on resize/scroll/size-change so it never
  // goes stale; null (default) leaves the viewports at the page corners,
  // exactly like the toast page.
  const [anchor, setAnchor] = useState<{ right: number; below: number } | null>(null)
  useEffect(() => {
    const el = anchorRef?.current
    if (!el) { setAnchor(null); return }
    const measure = () => {
      const r = el.getBoundingClientRect()
      setAnchor({ right: window.innerWidth - r.right, below: r.bottom })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      ro.disconnect()
    }
  }, [anchorRef])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // Deck fan-out/freeze state per corner, driven by hover on the viewport.
  const [fanned, setFanned] = useState<Record<Position, boolean>>({ top: false, bottom: false })

  const seq = useRef(0)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // Mirrors `toasts` for dismissAll's synchronous read of the live list.
  // Written from inside the setState updater (dispatch time), never during
  // render, so this stays clear of react-hooks/refs without a useEffect.
  const toastsRef = useRef<ToastItem[]>([])
  const setToasts = useCallback((updater: ToastItem[] | ((prev: ToastItem[]) => ToastItem[])) => {
    // toastsRef always mirrors committed state (it's the only writer of
    // toastsState), so deriving "next" from the ref instead of a setState
    // updater keeps setToastsState a plain-value call — no side effect
    // running inside a state updater function.
    const next = typeof updater === 'function'
      ? (updater as (prev: ToastItem[]) => ToastItem[])(toastsRef.current)
      : updater
    toastsRef.current = next
    setToastsState(next)
  }, [])
  // Dismissal-timer pause/resume bookkeeping: startedAt is the wall-clock
  // moment the currently-armed timer began, remainingMs is what's left on it.
  // pauseGroup freezes by re-deriving remaining from elapsed time and
  // clearing the timer; resumeGroup re-arms from remaining, never restarting
  // from the full duration.
  const startedAt = useRef<Record<string, number>>({})
  const remainingMs = useRef<Record<string, number>>({})

  // Raw source: componentWillUnmount clears every pending timer.
  useEffect(() => {
    const pending = timers.current
    return () => {
      Object.values(pending).forEach(clearTimeout)
    }
  }, [])

  const setPhase = useCallback((id: string, phase: Phase) => {
    setToasts((s) => s.map((t) => (t.id === id ? { ...t, phase } : t)))
  }, [setToasts])

  const startExit = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    delete startedAt.current[id]
    delete remainingMs.current[id]
    // freeze the toast's stack index so it exits from its current slot
    setToasts((s) => {
      const live = s.filter((t) => t.phase === 'enter' || t.phase === 'shown')
      const pos = (s.find((t) => t.id === id) || ({} as ToastItem)).position
      const liveP = live.filter((t) => t.position === pos)
      const idx = liveP.length - 1 - liveP.findIndex((t) => t.id === id)
      return s.map((t) => (t.id === id ? { ...t, phase: 'exit' as Phase, exitIndex: Math.max(idx, 0) } : t))
    })
    timers.current['x' + id] = setTimeout(() => {
      delete timers.current['x' + id]
      // DOM nodes are index-keyed: keep dismissed toasts as hidden 'gone'
      // placeholders so live toasts never swap nodes; purge when all gone.
      setExpanded((e) => {
        const next = { ...e }
        delete next[id]
        return next
      })
      setToasts((s) => {
        let next = s.map((t) => (t.id === id ? { ...t, phase: 'gone' as Phase } : t))
        if (next.every((t) => t.phase === 'gone')) next = []
        return next
      })
    }, tokenMs('--toast-exit-dur', 120) * MULT)
  }, [setToasts])

  // Hover-freeze: pause/resume every live dismissal timer in one corner's
  // deck, accumulating elapsed time instead of restarting the countdown.
  const pauseGroup = useCallback((pos: Position) => {
    setFanned((f) => ({ ...f, [pos]: true }))
    toastsRef.current.forEach((t) => {
      if (t.position !== pos || (t.phase !== 'enter' && t.phase !== 'shown')) return
      const timer = timers.current[t.id]
      if (!timer) return
      clearTimeout(timer)
      delete timers.current[t.id]
      const started = startedAt.current[t.id]
      if (started != null) {
        const elapsed = Date.now() - started
        remainingMs.current[t.id] = Math.max((remainingMs.current[t.id] ?? 0) - elapsed, 0)
      }
    })
  }, [])

  const resumeGroup = useCallback(
    (pos: Position) => {
      setFanned((f) => ({ ...f, [pos]: false }))
      toastsRef.current.forEach((t) => {
        if (t.position !== pos || (t.phase !== 'enter' && t.phase !== 'shown')) return
        const remaining = remainingMs.current[t.id]
        if (remaining == null) return
        startedAt.current[t.id] = Date.now()
        timers.current[t.id] = setTimeout(() => startExit(t.id), remaining)
      })
    },
    [startExit],
  )

  // Swipe-to-dismiss gesture (split into toast-swipe.ts, react-doctor
  // no-giant-component): the hook still owns its refs and is still called
  // from here, so behavior/timing is byte-identical to the former inline
  // block, only the implementation moved to its own module.
  const { onSwipeStart, onSwipeMove, onSwipeEnd, lastDx } = useToastSwipe(cfg, timers, startExit)

  // Corner routing: a notification-type toast always mounts top-right,
  // every other kind mounts bottom-right (per this step's brief -- no
  // longer an operator-facing toggle).
  const show = useCallback(
    (spec: ToastSpec) => {
      const id = 'ts' + ++seq.current
      const toast: ToastItem = {
        id,
        phase: 'enter',
        position: spec.type === 'notification' ? 'top' : 'bottom',
        duration: DEFAULT_DURATION,
        ...spec,
      }
      setToasts((s) => s.concat([toast]))
      // enter → shown after first paint so the transition runs
      timers.current['e' + id] = setTimeout(() => {
        delete timers.current['e' + id]
        setPhase(id, 'shown')
      }, 40)
      if (toast.duration > 0) {
        const durMs = toast.duration * MULT
        startedAt.current[id] = Date.now()
        remainingMs.current[id] = durMs
        timers.current[id] = setTimeout(() => startExit(id), durMs)
      }
    },
    [setPhase, startExit, setToasts],
  )

  useImperativeHandle(forwardedRef, () => ({ show }), [show])

  const toggleExpand = useCallback((id: string) => {
    setExpanded((e) => {
      const next = { ...e }
      if (next[id]) {
        delete next[id]
      } else {
        next[id] = true
      }
      return next
    })
    // sticky while reading: pause auto-dismiss on expand
    clearTimeout(timers.current[id])
    delete timers.current[id]
    delete startedAt.current[id]
    delete remainingMs.current[id]
  }, [])

  // Raw source: `group(pos)` — index over LIVE toasts only, so remaining
  // toasts re-stack fluently; exiting toasts keep their frozen slot, 'gone'
  // ones are hidden.
  const group = (pos: Position): ToastVm[] => {
    const list = toasts.filter((t) => t.position === pos)
    const live = list.filter((t) => t.phase === 'enter' || t.phase === 'shown')
    return list.map((t) => {
      let idx: number
      if (t.phase === 'exit') idx = t.exitIndex || 0
      else if (t.phase === 'gone') idx = 0
      else idx = live.length - 1 - live.indexOf(t)
      const model = vm(t, idx, !!expanded[t.id], cfg, fanned[pos])
      model.onPress = () => {
        if (t.expandText) toggleExpand(t.id)
      }
      return model
    })
  }

  const liveCount = String(toasts.filter((t) => t.phase !== 'exit').length)
  const dismissAll = () => toastsRef.current.forEach((t) => { if (t.phase !== 'exit') startExit(t.id) })

  // Toast list rendering — one identical block per viewport, exactly as the
  // raw file repeats its `<sc-for>` markup for top and bottom. Rows are keyed
  // by their stable position in the list (not by toast id) because the raw
  // source deliberately relies on index-keyed DOM nodes: a dismissed toast
  // stays in the list as a hidden 'gone' placeholder so live toasts never
  // swap nodes mid-transition (see its own comment in startExit above).
  const renderGroup = (pos: Position) =>
    group(pos).map((t) => (
      <ToastCard
        key={t.key}
        t={t}
        isExpanded={!!expanded[t.key]}
        onPointerDown={onSwipeStart(t.key)}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeEnd}
        onPress={() => {
          if (Math.abs(lastDx.current) > 6) return // a drag is not a tap
          t.onPress()
        }}
        onDismiss={() => startExit(t.key)}
      />
    ))

  // Below-right anchor: same right offset (from the host card's right edge
  // instead of the viewport's) for both viewports, both docked just below
  // the card's bottom edge -- collapses the two page-corner mounts to one
  // point per the interview's singular "below-right edge" anchor. Per-toast
  // stacking math (peek/scale/dir in vm()) is completely untouched.
  const anchoredRight = anchor ? `${anchor.right + 24}px` : '24px'
  const anchoredTop = anchor ? `${anchor.below + 12}px` : '24px'

  const viewports = (
    <>
      {/* ============ Top viewport (notification kind) ============ */}
      <div
        className="ts-viewport"
        style={{ right: anchoredRight, top: anchoredTop, bottom: 'auto' }}
        data-screen-label="Toast viewport top"
        onMouseEnter={() => pauseGroup('top')}
        onMouseLeave={() => resumeGroup('top')}
      >
        {renderGroup('top')}
      </div>

      {/* ============ Bottom viewport (every other kind) ============ */}
      <div
        className="ts-viewport"
        style={{ right: anchoredRight, top: anchor ? anchoredTop : 'auto', bottom: anchor ? 'auto' : '24px' }}
        data-screen-label="Toast viewport bottom"
        onMouseEnter={() => pauseGroup('bottom')}
        onMouseLeave={() => resumeGroup('bottom')}
      >
        {renderGroup('bottom')}
      </div>
    </>
  )

  if (hideCard) {
    return portalTarget ? createPortal(viewports, portalTarget) : viewports
  }

  return (
    <div
      className="ts-root"
      data-screen-label="Toast demo"
    >

      {/* ============ Demo / trigger card ============ */}
      <ToastDemoCard liveCount={liveCount} onShow={show} onDismissAll={dismissAll} />

      {portalTarget ? createPortal(viewports, portalTarget) : viewports}
    </div>
  )
})

export default function ToastDemo() {
  return <ToastStage cfg={VARIANTS.main} />
}
