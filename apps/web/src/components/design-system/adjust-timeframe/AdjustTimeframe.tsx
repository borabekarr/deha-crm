import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import '../../../../design-system/preview/_shared-feedback.css'
import './AdjustTimeframe.css'

import { useState, useRef, useCallback } from 'react'
import { useProximityGroup } from '@/lib/hooks'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { trackRef, cleanupTrack, beginDrag } from './adjust-timeframe-hook'

/* ── Date helpers ───────────────────────────────────────────────────────── */
const MS = 86400000
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const floorDay = (d: Date): Date => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}
const addDays = (d: Date, n: number): Date => {
  const x = floorDay(d); x.setDate(x.getDate() + n); return x
}
const diffDays = (a: Date, b: Date): number =>
  Math.round((floorDay(b).getTime() - floorDay(a).getTime()) / MS)
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
const fmtDate = (d: Date): string => `${MONTHS[d.getMonth()]} ${d.getDate()}`

interface MonthInfo { label: string; startIdx: number; days: number }

function buildMonths(domainStart: Date, totalDays: number): MonthInfo[] {
  const out: MonthInfo[] = []
  let cursor = floorDay(domainStart)
  while (diffDays(domainStart, cursor) < totalDays) {
    const startIdx = diffDays(domainStart, cursor)
    const dim = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    out.push({ label: MONTHS[cursor.getMonth()], startIdx, days: dim })
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }
  return out
}

const dayWord = (n: number): string => `${n}D`

export default function AdjustTimeframe() {
  const today       = floorDay(new Date(2025, 2, 15))
  const domainStart = floorDay(new Date(2024, 9, 1))
  const domainEnd   = floorDay(new Date(2025, 2, 15))
  const accent      = 'var(--brand-primary)'
  const MIN_DAYS    = 21
  const MIN_SPAN    = 6

  const totalDays = diffDays(domainStart, domainEnd)
  const todayIdx  = clamp(diffDays(domainStart, today), 0, totalDays)
  const months    = buildMonths(domainStart, totalDays)

  const presets = [
    { id: 'last7', label: 'Last 7D', start: Math.max(0, todayIdx - 6),  end: todayIdx },
    { id: 'd30',   label: '30D',     start: Math.max(0, todayIdx - 29), end: todayIdx },
    { id: 'd90',   label: '90D',     start: Math.max(0, todayIdx - 89), end: todayIdx },
  ]

  /* F2b: zoom pill — fixed levels, default 50%. Higher % = more zoomed in
     (fewer days visible); level 100 -> MIN_DAYS, level 25 -> near totalDays. */
  const ZOOM_LEVELS = [25, 50, 75, 100]
  const levelToDays = (level: number, total: number): number =>
    clamp(Math.round(total * (1 - level / 100) + MIN_DAYS * (level / 100)), MIN_DAYS, total)
  const DEFAULT_DAYS_VISIBLE = levelToDays(50, totalDays)

  /* ── State ───────────────────────────────────────────────────────────── */
  /* Default preset: "30D" (index 1). */
  const defaultPreset = presets[1]
  const [startIdx,    setStartIdx]    = useState(() => clamp(defaultPreset.start, 0, todayIdx))
  const [endIdx,      setEndIdx]      = useState(todayIdx)
  const [trackW,      setTrackW]      = useState(0)
  const [daysVisible, setDaysVisible] = useState(() => DEFAULT_DAYS_VISIBLE)
  const [zoomLevel,   setZoomLevel]   = useState(50)
  const [scroll,      setScroll]      = useState(0)
  const [anim,        setAnim]        = useState(false)
  const [drag,        setDrag]        = useState<'start' | 'end' | 'move' | null>(null)
  /* bump key: incremented by preset / month / key actions to trigger the pop animation */
  const [bumpKey,     setBumpKey]     = useState(0)
  /* The pill the user last picked. Stays "active" (white text) even after
     the range is extended via the strip, so the active pill never turns grey. */
  const [pickedPreset, setPickedPreset] = useState<string | null>(defaultPreset.id)

  /* ── Derived display values ──────────────────────────────────────────── */
  const ppd     = trackW > 0 ? trackW / clamp(daysVisible, MIN_DAYS, totalDays) : 6
  /* .tf-handle.start is a 22px hit box CENTERED on index 0's pixel position
     (left:0 + translate(-50%)), so it overhangs 11px past the strip's true
     left content edge -- EDGE_PAD reserves that as pure SCROLL headroom via
     minScroll's -EDGE_PAD allowance (blank track background, no strip
     content needed there). .tf-handle.end is right-anchored (right:0) fully
     INSIDE .tf-sel (see AdjustTimeframe.css ".tf-handle.end" comment), so it
     never overhangs past the strip's right content edge -- stripW/maxScroll
     must NOT carry the same EDGE_PAD on the right, or the default/flush-right
     view (and the post-zoom clamp) both anchor short/long by that padding. */
  const EDGE_PAD = 18
  const stripW  = totalDays * ppd
  const maxScroll = Math.max(0, stripW - trackW)
  const minScroll = -EDGE_PAD
  /* Ruler now spans the strip's full (unpadded) width -- ticks stop exactly
     at todayIdx and the strip/ruler right edges coincide. */
  const rulerW = stripW

  const selLeft  = startIdx * ppd
  const selWidth = (endIdx - startIdx) * ppd

  const days       = endIdx - startIdx + 1
  const startDate  = addDays(domainStart, startIdx)
  const endDate    = addDays(domainStart, endIdx)
  const endIsToday = endIdx === todayIdx
  /* Item 4: the pill that exactly matches the current range, if any. */
  const exactPreset = presets.find((p) => p.start === startIdx && p.end === endIdx)
  /* The visually-active pill: exact match wins; otherwise the last one the user
     picked keeps its white text + glider while the strip extends the range. */
  const activeId = exactPreset?.id ?? pickedPreset

  /* ── Refs (DOM only, never read during render) ───────────────────────── */
  const trackElRef  = useRef<HTMLDivElement | null>(null)
  const didInit     = useRef(false)
  /* Tracks last observed track-element width so onTrackWidth can skip redundant
     calls (e.g. React Strict Mode double-invocation of callback refs) and only
     clamp scroll when the track actually resizes. */
  const lastTrackW  = useRef(0)
  /* P2/P6: cached track getBoundingClientRect(), refreshed only at drag
     start, in the RO callback, and after each zoom step -- NOT on every
     pointermove. getLive() below reads this cache instead of calling
     getBoundingClientRect() per event. */
  const trackRectRef = useRef<DOMRect | null>(null)
  /* Item 6: live-scroll ref so drag math always sees current scroll.
     Updated via setScrollLive (wraps setScroll) — never written during render. */
  const scrollRef   = useRef(0)
  /* FAIL 2 fix: onMove's closure (registered once at pointerdown) can go
     stale mid-gesture if ppd changes (e.g. track resize). ensureVisible's
     clamp math needs the CURRENT ppd to place the settle position inside
     the track -- so it's synced during render (no effect) and read via
     ppdRef.current at both ensureVisible call sites below. */
  const ppdRef = useRef(ppd)
  ppdRef.current = ppd

  /* ── Proximity groups (hover glow, locked convention: radius 80, dy×3) ─
     tf-month / tf-handle / tf-lens-hit live inside .tf-strip, which
     translateX()s during drag/scroll — moving elements violate the
     stationary-anchor rule, so only the static pan buttons + preset
     pills are wired (see wired/skipped log in the step report). */
  const panGroupRef = useProximityGroup<HTMLDivElement>()
  const presetsProxRef = useProximityGroup<HTMLFieldSetElement>()

  /* Squircle conversion (Step 12): tf-shell/tf-card canonical grey-shell/
     white-card concentric pair (mirrors .te-outer/.te-panel, .dp-outer/.dp-panel). */
  const shellSquircleRef = useSquircle<HTMLDivElement>()
  const cardSquircleRef  = useSquircle<HTMLDivElement>()

  /* ── Item 1: segmented pill glider ──────────────────────────────────── */
  const presetsRef   = useRef<HTMLFieldSetElement | null>(null)
  const [gliderStyle, setGliderStyle] = useState<{ left: number; width: number }>({ left: 3, width: 0 })

  /* targetId: when passed (e.g. a drag that lands exactly on a preset), measure
     THAT pill directly via [data-id] — bypasses the stale `.active` DOM read that
     has not committed yet. No arg → read the currently-active pill (click path). */
  const measureGlider = useCallback((targetId?: string) => {
    const root = presetsRef.current
    if (!root) return
    const btn = targetId
      ? root.querySelector<HTMLElement>(`button[data-id="${targetId}"]`)
      : root.querySelector<HTMLElement>('button.active')
    if (!btn) return
    const nextLeft  = btn.offsetLeft
    const nextWidth = btn.offsetWidth
    setGliderStyle(prev =>
      prev.left === nextLeft && prev.width === nextWidth
        ? prev
        : { left: nextLeft, width: nextWidth }
    )
  }, [])

  /* Measure after every render that might change the active button */
  const presetsCallbackRef = useCallback((el: HTMLFieldSetElement | null) => {
    presetsRef.current = el
    presetsProxRef(el)
    if (el) {
      /* rAF so the browser has painted the buttons at their final size */
      requestAnimationFrame(() => measureGlider())
    }
  }, [measureGlider, presetsProxRef])

  /* Helper: update scroll state AND keep the live ref in sync */
  function setScrollLive(v: number | ((prev: number) => number)): void {
    if (typeof v === 'function') {
      setScroll((prev) => {
        const next = v(prev)
        scrollRef.current = next
        return next
      })
    } else {
      scrollRef.current = v
      setScroll(v)
    }
  }

  /* ── Track width callback (replaces useLayoutEffect + ResizeObserver) ── */
  const onTrackWidth = useCallback((w: number) => {
    if (!didInit.current) {
      // First-time: derive ppd from initial daysVisible and center the selection
      const nppd = w / DEFAULT_DAYS_VISIBLE
      const nStrip = totalDays * nppd // keep in sync with stripW (no right-edge pad)
      const nMaxScroll = Math.max(0, nStrip - w)
      // startIdx/endIdx at this point are the initial preset values
      // We use functional state to compute the right center scroll
      lastTrackW.current = w
      setTrackW(w)
      trackRectRef.current = trackElRef.current?.getBoundingClientRect() ?? null
      /* B1: default selection anchored flush right — scroll all the way to
         maxScroll so the selection end (todayIdx) sits at the ruler's right
         edge instead of centering the initial view. */
      setScrollLive(nMaxScroll)
      didInit.current = true
    } else if (w !== lastTrackW.current) {
      // Only clamp-to-fit scroll when the track element genuinely resizes.
      // Skipping same-width calls prevents React Strict Mode double-invocation
      // (and callback-ref re-runs on re-renders) from overwriting scroll state
      // with a stale upper bound.
      lastTrackW.current = w
      setTrackW(w)
      trackRectRef.current = trackElRef.current?.getBoundingClientRect() ?? null
      setScrollLive((s) => clamp(s, -EDGE_PAD, Math.max(0, totalDays * (w / DEFAULT_DAYS_VISIBLE) - w)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — only fires from ResizeObserver, not from React re-renders

  /* P1: stable callback ref for .tf-track (was an inline arrow — recreated
     every render). useCallback with empty deps means React only invokes this
     ref on actual mount/unmount, not per-render, so the ResizeObserver is
     created/torn down exactly once per element lifetime instead of racing a
     detach branch that nulled trackElRef before the "already registered"
     check ran. */
  const trackCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      trackElRef.current = el
      trackRef(el, { onTrackWidth })
    } else {
      cleanupTrack(trackElRef.current)
      trackElRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Step 4 (B3): shared fit pass — keeps [s,e] (+ the .tf-handle grip's own
     HANDLE_PAD half-width) inside [target, target+tw] after a manual zoom()
     step, so a fast zoom never leaves a handle clipped outside the viewport. */
  const HANDLE_PAD = 12
  function fitScroll(target: number, s: number, e: number, nppd: number, tw: number, minS: number, maxS: number): number {
    let t = target
    const l = s * nppd - HANDLE_PAD
    const r = e * nppd + HANDLE_PAD
    if (l < t) t = Math.max(minS, l)
    else if (r > t + tw) t = Math.min(maxS, r - tw)
    return clamp(t, minS, maxS)
  }

  /* ── Scroll helpers ──────────────────────────────────────────────────── */
  function ensureVisible(idx: number, curScroll: number, curPpd: number, curTrackW: number): void {
    const x = idx * curPpd - curScroll
    const margin = 26
    /* Fresh maxScroll from curPpd (not the render-scope `maxScroll` const,
       which is stale once curPpd diverges from the render's own ppd mid-drag). */
    const curMaxScroll = Math.max(0, totalDays * curPpd - curTrackW)
    if (x < margin) {
      setScrollLive(clamp(idx * curPpd - margin, minScroll, curMaxScroll))
    } else if (x > curTrackW - margin) {
      setScrollLive(clamp(idx * curPpd - curTrackW + margin, minScroll, curMaxScroll))
    }
  }

  /* ── Drag ───────────────────────────────────────────────────────────── */
  function handleBeginDrag(type: 'start' | 'end' | 'move', e: React.PointerEvent) {
    e.preventDefault()
    setAnim(false)
    setDrag(type)

    // P6: refresh the cached track rect once at drag start; getLive() below
    // reads this cache for the rest of the gesture instead of calling
    // getBoundingClientRect() on every pointermove.
    trackRectRef.current = trackElRef.current?.getBoundingClientRect() ?? null

    // Snapshot current values at drag-start for closures
    const snapTrackW  = trackW
    const snapStart   = startIdx
    const snapEnd     = endIdx

    beginDrag({
      type,
      clientX: e.clientX,
      pointerId: e.pointerId,
      currentTarget: e.currentTarget,
      getLive: () => {
        /* P2/P6: cached rect (refreshed at drag start / RO / zoom), not a
           fresh getBoundingClientRect() per pointermove. */
        const rect = trackRectRef.current
        /* Item 6: read live scroll from ref so drag math stays accurate near edges */
        const liveScroll = scrollRef.current
        return {
          startIdx:   snapStart,
          endIdx:     snapEnd,
          /* Live ppd, not the drag-start snapshot: ppd can still change
             mid-drag (e.g. track resize), and the hook uses this value every
             frame to convert pointer position -> index, so a stale ppd here
             would keep computing indices against the old scale. */
          ppd:        ppdRef.current,
          scroll:     liveScroll,
          todayIdx,
          totalDays,
          trackW:     snapTrackW,
          maxScroll,
          minScroll,
          trackRect:  rect,
        }
      },
      MIN_SPAN,
      clamp,
      onMove: (ns, ne, focusIdx) => {
        setStartIdx(ns)
        setEndIdx(ne)
        ensureVisible(focusIdx, scrollRef.current, ppdRef.current, snapTrackW)
        // Item 3: slide glider when drag lands exactly on a preset. Pass the matched
        // id so measureGlider reads THAT pill directly — the `.active` class has not
        // committed yet, so a bare measure would read the stale (old) active pill.
        const hit = presets.find((p) => p.start === ns && p.end === ne)
        if (hit) {
          const hitId = hit.id
          setPickedPreset(hitId)
          requestAnimationFrame(() => measureGlider(hitId))
        } else {
          // Step 4: dragging off a preset landmark is a special (non-preset)
          // selection — clear the stale picked id so activeId falls through to
          // undefined and the glider's data-on="false" spring+blur fade-out fires.
          setPickedPreset(null)
        }
      },
      onUp: () => {
        setDrag(null)
        setAnim(true)
      },
      ensureVisible: (idx) => ensureVisible(idx, scrollRef.current, ppdRef.current, snapTrackW),
    })
  }

  /* ── Track click (click empty ruler → move nearer handle) ───────────── */
  function onTrackDown(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target as Element
    if (
      target.closest('.tf-handle') ||
      target.closest('.tf-lens-hit') ||
      target.closest('.tf-month')
    ) return

    const rect = trackElRef.current?.getBoundingClientRect()
    if (!rect) return
    const localX = e.clientX - rect.left + scroll
    const idx    = clamp(Math.round(localX / ppd), 0, totalDays)
    setAnim(true)
    if (Math.abs(idx - startIdx) <= Math.abs(idx - endIdx)) {
      setStartIdx(clamp(idx, 0, endIdx - MIN_SPAN))
    } else {
      setEndIdx(clamp(idx, startIdx + MIN_SPAN, todayIdx))
    }
  }

  /* ── Preset / zoom / month ──────────────────────────────────────────── */
  function applyPreset(p: typeof presets[0]) {
    setAnim(true)
    setStartIdx(p.start)
    setEndIdx(p.end)
    setPickedPreset(p.id)
    setScrollLive(maxScroll)
    setBumpKey((k) => k + 1)
    /* re-measure glider after state settles — pass the picked id so we never depend
       on the not-yet-committed `.active` class */
    const pid = p.id
    requestAnimationFrame(() => measureGlider(pid))
  }

  /* Item 5/3: zoom anchors on the current on-screen viewport center, not the
     selection lens — keeps the visible frame fixed across the zoom stage.
     That anchor alone can still push the selection (and its handles) partly
     outside the track after a zoom step, in either direction. So after
     computing the center-anchored scroll, fit-check it against .tf-sel's new
     pixel bounds (+ handle half-width padding) and nudge it back in if the
     zoom step would otherwise clip either edge. */
  /* F2b: steps through ZOOM_LEVELS by index delta (+1 for "+", -1 for "-"). */
  function stepZoom(dir: number) {
    const idx = ZOOM_LEVELS.indexOf(zoomLevel)
    const nextIdx = clamp(idx + dir, 0, ZOOM_LEVELS.length - 1)
    if (nextIdx === idx) return
    const nextLevel = ZOOM_LEVELS[nextIdx]
    const next = levelToDays(nextLevel, totalDays)
    setZoomLevel(nextLevel)
    if (next === daysVisible) return
    const nppd      = trackW / next
    const nStrip    = totalDays * nppd // keep in sync with stripW (no right-edge pad)
    const nMaxScroll = Math.max(0, nStrip - trackW)
    /* viewport-center anchor: index currently centered on-screen, measured
       with the pre-zoom ppd, kept centered after ppd changes */
    const viewCenterIdx = (scroll + trackW / 2) / ppd
    const centerScroll = clamp(viewCenterIdx * nppd - trackW / 2, minScroll, nMaxScroll)
    /* Fit pass (B3): HANDLE_PAD covers
       the .tf-handle grip so it never straddles the viewport boundary, not
       just the bare .tf-sel edge; final clamp keeps it in [minScroll, nMaxScroll]
       even on a narrow track where the padded selection exceeds trackW. */
    const targetScroll = fitScroll(centerScroll, startIdx, endIdx, nppd, trackW, minScroll, nMaxScroll)

    setAnim(true)
    setDaysVisible(next)
    setScrollLive(targetScroll)
    // P6: refresh the cached rect after a manual zoom step too.
    trackRectRef.current = trackElRef.current?.getBoundingClientRect() ?? null
  }

  /* F2b: routing (pan) — moves the visible window without changing zoom. */
  function panBy(dir: number) {
    const step = trackW * 0.8 * dir
    setAnim(true)
    setScrollLive((s) => clamp(s + step, minScroll, maxScroll))
  }

  /* F2b: ArrowLeft/ArrowRight routes only while the shell itself is the
     focused element (not a descendant like a handle or pill button), so
     this handler never needs a global window/document listener. */
  function handleShellKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowLeft') { e.preventDefault(); panBy(-1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); panBy(1) }
  }

  function selectMonth(m: MonthInfo) {
    setAnim(true)
    const e = clamp(m.startIdx + m.days - 1, MIN_SPAN, todayIdx)
    const s = clamp(m.startIdx, 0, e - MIN_SPAN)
    setStartIdx(s)
    setEndIdx(e)
    setPickedPreset(null)
    setBumpKey((k) => k + 1)
    const center = (s + e) / 2
    setScrollLive(clamp(center * ppd - trackW / 2, minScroll, maxScroll))
  }

  function onHandleKey(type: 'start' | 'end', e: React.KeyboardEvent) {
    const step    = e.shiftKey ? 7 : 1
    let handled   = true
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      if (type === 'start') {
        setStartIdx(clamp(startIdx - step, 0, endIdx - MIN_SPAN))
      } else {
        setEndIdx(clamp(endIdx - step, startIdx + MIN_SPAN, todayIdx))
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      if (type === 'start') {
        setStartIdx(clamp(startIdx + step, 0, endIdx - MIN_SPAN))
      } else {
        setEndIdx(clamp(endIdx + step, startIdx + MIN_SPAN, todayIdx))
      }
    } else {
      handled = false
    }
    if (handled) { e.preventDefault(); setAnim(true) }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="tf-shell" ref={shellSquircleRef} tabIndex={0} onKeyDown={handleShellKey}>
      <div
        className="tf-card"
        ref={cardSquircleRef}
        style={{ '--ppd': ppd + 'px', '--tf-accent': accent } as React.CSSProperties}
        data-dragging={drag ? 'true' : 'false'}
        data-moving={drag === 'move' ? 'true' : 'false'}
      >
        <fieldset className="tf-head">
          {/* Item 2: plain Montserrat 900 header — no pill chrome */}
          <div className="tf-range-group">
            <span className="material-symbols-outlined tf-range-icon" aria-hidden="true">calendar_month</span>
            <div
              className={'tf-range' + (bumpKey ? ' bump' : '')}
              key={bumpKey}
              aria-live="polite"
            >
              <span className="tf-seg start">{fmtDate(startDate)}</span>
              <span className="tf-dash">–</span>
              <span className="tf-seg end">{endIsToday ? 'Today' : fmtDate(endDate)}</span>
            </div>
          </div>

          {/* Item 1: segmented pill track with sliding glider */}
          <fieldset
            className="tf-presets"
            aria-label="Quick ranges"
            ref={presetsCallbackRef}
          >
            <span
              className="tf-preset-glider"
              aria-hidden="true"
              data-on={activeId ? 'true' : 'false'}
              style={{ left: gliderStyle.left + 'px', width: gliderStyle.width + 'px' }}
            />
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                data-id={p.id}
                data-proximity
                className={`tf-preset${activeId === p.id ? ' active' : ''}`}
                aria-pressed={activeId === p.id ? 'true' : 'false'}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </fieldset>
        </fieldset>

        <div className="tf-divider" />

        <div className="tf-body" ref={panGroupRef}>
          <button
            type="button"
            className="tf-pan"
            data-proximity
            aria-label="Pan left"
            title="Pan left"
            disabled={scroll <= minScroll}
            onClick={() => panBy(-1)}
          >
            <span className="material-symbols-outlined">keyboard_double_arrow_left</span>
          </button>

          <div
            className="tf-track"
            ref={trackCallbackRef}
            onPointerDown={onTrackDown}
          >
            <div
              className="tf-strip"
              data-anim={anim ? 'true' : 'false'}
              /* Render-time safety clamp: `scroll` state can momentarily race
                 ahead of a mid-drag daysVisible/ppd change, which would otherwise let
                 the translate expose blank track past today. minScroll/
                 maxScroll are recomputed fresh every render from the CURRENT
                 ppd/stripW, so clamping here is always in sync — no matter
                 how the underlying scroll state drifted, the painted strip
                 can never fall short of the track's right edge. */
              style={{ width: stripW + 'px', transform: `translateX(${-clamp(scroll, minScroll, maxScroll)}px)` }}
            >
              <div className="tf-ruler" style={{ width: rulerW + 'px' }} />

              {months.map((m) =>
                m.startIdx === 0 ? null : (
                  <span
                    key={'tick-' + m.label}
                    className="tf-monthtick"
                    style={{ left: m.startIdx * ppd + 'px' }}
                  />
                ),
              )}

              {months.map((m) => {
                const mEnd   = Math.min(m.startIdx + m.days, totalDays)
                const center = ((m.startIdx + mEnd) / 2) * ppd
                const inRange = m.startIdx + m.days > startIdx && m.startIdx <= endIdx
                return (
                  <button
                    key={'month-' + m.label + '-' + m.startIdx}
                    type="button"
                    className="tf-month"
                    data-in={inRange ? 'true' : 'false'}
                    style={{ left: center + 'px' }}
                    onClick={() => selectMonth(m)}
                    aria-label={`Select ${m.label}`}
                  >
                    {m.label}
                  </button>
                )
              })}

              <div
                className="tf-sel"
                data-anim={anim ? 'true' : 'false'}
                style={{ left: selLeft + 'px', width: selWidth + 'px' }}
              >
                <div className="tf-lens">
                  <div className="tf-daycount">{dayWord(days)}</div>
                </div>

                <div
                  className="tf-lens-hit"
                  onPointerDown={(e) => handleBeginDrag('move', e)}
                  aria-hidden="true"
                />

                <input
                  type="range"
                  className="tf-handle start"
                  aria-label="Start date"
                  aria-valuetext={fmtDate(startDate)}
                  min={0}
                  max={todayIdx}
                  value={startIdx}
                  onChange={() => { /* controlled via pointerDown */ }}
                  data-active={drag === 'start' ? 'true' : 'false'}
                  onPointerDown={(e) => handleBeginDrag('start', e)}
                  onKeyDown={(e) => onHandleKey('start', e)}
                />

                <input
                  type="range"
                  className="tf-handle end"
                  aria-label="End date"
                  aria-valuetext={endIsToday ? 'Today' : fmtDate(endDate)}
                  min={0}
                  max={todayIdx}
                  value={endIdx}
                  onChange={() => { /* controlled via pointerDown */ }}
                  data-active={drag === 'end' ? 'true' : 'false'}
                  onPointerDown={(e) => handleBeginDrag('end', e)}
                  onKeyDown={(e) => onHandleKey('end', e)}
                />
              </div>
            </div>

            <div className="tf-zoom-pill" role="group" aria-label="Zoom level">
              <button
                type="button"
                className="tf-zoom-btn"
                aria-label="Zoom out"
                disabled={ZOOM_LEVELS.indexOf(zoomLevel) <= 0}
                onClick={() => stepZoom(-1)}
              >
                −
              </button>
              <span className="tf-zoom-pct">{zoomLevel}%</span>
              <button
                type="button"
                className="tf-zoom-btn"
                aria-label="Zoom in"
                disabled={ZOOM_LEVELS.indexOf(zoomLevel) >= ZOOM_LEVELS.length - 1}
                onClick={() => stepZoom(1)}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            className="tf-pan"
            data-proximity
            aria-label="Pan right"
            title="Pan right"
            disabled={scroll >= maxScroll}
            onClick={() => panBy(1)}
          >
            <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}
