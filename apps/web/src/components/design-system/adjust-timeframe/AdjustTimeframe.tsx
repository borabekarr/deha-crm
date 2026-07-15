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

  /* ── State ───────────────────────────────────────────────────────────── */
  /* Default preset: "30D" (index 1). */
  const defaultPreset = presets[1]
  const [startIdx,    setStartIdx]    = useState(() => clamp(defaultPreset.start, 0, todayIdx))
  const [endIdx,      setEndIdx]      = useState(todayIdx)
  const [trackW,      setTrackW]      = useState(0)
  const [daysVisible, setDaysVisible] = useState(() => clamp(105, MIN_DAYS, totalDays))
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
  const stripW  = totalDays * ppd
  const EDGE_PAD = 18
  const maxScroll = Math.max(0, stripW - trackW)
  const minScroll = -EDGE_PAD

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
  /* Item 6: live-scroll ref so drag math always sees current scroll.
     Updated via setScrollLive (wraps setScroll) — never written during render. */
  const scrollRef   = useRef(0)

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
      const nppd = w / clamp(105, MIN_DAYS, totalDays)
      const nStrip = totalDays * nppd
      const nMaxScroll = Math.max(0, nStrip - w)
      // startIdx/endIdx at this point are the initial preset values
      // We use functional state to compute the right center scroll
      lastTrackW.current = w
      setTrackW(w)
      setScrollLive(clamp(
        ((defaultPreset.start + todayIdx) / 2) * nppd - w / 2,
        -EDGE_PAD,
        nMaxScroll,
      ))
      didInit.current = true
    } else if (w !== lastTrackW.current) {
      // Only clamp-to-fit scroll when the track element genuinely resizes.
      // Skipping same-width calls prevents React Strict Mode double-invocation
      // (and callback-ref re-runs on re-renders) from overwriting scroll state
      // with a stale upper bound.
      lastTrackW.current = w
      setTrackW(w)
      setScrollLive((s) => clamp(s, -EDGE_PAD, Math.max(0, totalDays * (w / clamp(105, MIN_DAYS, totalDays)) - w)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — only fires from ResizeObserver, not from React re-renders

  /* ── Scroll helpers ──────────────────────────────────────────────────── */
  function ensureVisible(idx: number, curScroll: number, curPpd: number, curTrackW: number): void {
    const x = idx * curPpd - curScroll
    const margin = 26
    if (x < margin) {
      setScrollLive(clamp(idx * curPpd - margin, minScroll, maxScroll))
    } else if (x > curTrackW - margin) {
      setScrollLive(clamp(idx * curPpd - curTrackW + margin, minScroll, maxScroll))
    }
  }

  /* ── Drag ───────────────────────────────────────────────────────────── */
  function handleBeginDrag(type: 'start' | 'end' | 'move', e: React.PointerEvent) {
    e.preventDefault()
    setAnim(false)
    setDrag(type)

    // Snapshot current values at drag-start for closures
    const snapPpd     = ppd
    const snapTrackW  = trackW
    const snapStart   = startIdx
    const snapEnd     = endIdx

    beginDrag({
      type,
      clientX: e.clientX,
      pointerId: e.pointerId,
      currentTarget: e.currentTarget,
      getLive: () => {
        const rect = trackElRef.current?.getBoundingClientRect() ?? null
        /* Item 6: read live scroll from ref so drag math stays accurate near edges */
        const liveScroll = scrollRef.current
        return {
          startIdx:   snapStart,
          endIdx:     snapEnd,
          ppd:        snapPpd,
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
        ensureVisible(focusIdx, scrollRef.current, snapPpd, snapTrackW)
        // Item 3: slide glider when drag lands exactly on a preset. Pass the matched
        // id so measureGlider reads THAT pill directly — the `.active` class has not
        // committed yet, so a bare measure would read the stale (old) active pill.
        const hit = presets.find((p) => p.start === ns && p.end === ne)
        if (hit) {
          const hitId = hit.id
          setPickedPreset(hitId)
          requestAnimationFrame(() => measureGlider(hitId))
        }
        // Item 4: auto zoom-out whenever focal point is off-screen (edge condition),
        // regardless of whether scroll moved — drive off focal check alone.
        const focalPx = focusIdx * snapPpd - scrollRef.current
        if (focalPx < 26 || focalPx > snapTrackW - 26) {
          setDaysVisible((prev) => clamp(Math.round(prev * 1.5), MIN_DAYS, totalDays))
        }
      },
      onUp: () => {
        setDrag(null)
        setAnim(true)
      },
      ensureVisible: (idx) => ensureVisible(idx, scrollRef.current, snapPpd, snapTrackW),
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

  /* Item 5: zoom anchors on the current on-screen viewport center, not the
     selection lens — keeps the visible frame fixed across the zoom stage. */
  function zoom(dir: number) {
    const next =
      dir < 0
        ? Math.min(Math.round(daysVisible * 1.5), totalDays)
        : Math.max(Math.round(daysVisible / 1.5), MIN_DAYS)
    if (next === daysVisible) return
    const nppd   = trackW / next
    const nStrip = totalDays * nppd
    /* viewport-center anchor: index currently centered on-screen, measured
       with the pre-zoom ppd, kept centered after ppd changes */
    const viewCenterIdx = (scroll + trackW / 2) / ppd
    setAnim(true)
    setDaysVisible(next)
    setScrollLive(clamp(viewCenterIdx * nppd - trackW / 2, minScroll, Math.max(0, nStrip - trackW)))
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
    <div className="tf-shell" ref={shellSquircleRef}>
      <div
        className="tf-card"
        ref={cardSquircleRef}
        style={{ '--ppd': ppd + 'px', '--tf-accent': accent } as React.CSSProperties}
        data-dragging={drag ? 'true' : 'false'}
        data-moving={drag === 'move' ? 'true' : 'false'}
      >
        <fieldset className="tf-head">
          {/* Item 2: plain Montserrat 900 header — no pill chrome */}
          <div
            className={'tf-range' + (bumpKey ? ' bump' : '')}
            key={bumpKey}
            aria-live="polite"
          >
            <span className="tf-seg start">{fmtDate(startDate)}</span>
            <span className="tf-dash">–</span>
            <span className="tf-seg end">{endIsToday ? 'Today' : fmtDate(endDate)}</span>
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
            aria-label="Zoom out"
            title="Zoom out"
            disabled={daysVisible >= totalDays}
            onClick={() => zoom(-1)}
          >
            <span className="material-symbols-outlined">keyboard_double_arrow_left</span>
          </button>

          <div
            className="tf-track"
            ref={(el) => {
              if (el) {
                /* Only register the ResizeObserver once per element mount.
                   The callback-ref fires on every render; calling trackRef
                   again on the same element would re-measure and overwrite
                   scroll state (clamping with stale closure values). */
                if (trackElRef.current !== el) {
                  trackElRef.current = el
                  trackRef(el, { onTrackWidth })
                }
              } else {
                cleanupTrack(trackElRef.current)
                trackElRef.current = null
              }
            }}
            onPointerDown={onTrackDown}
          >
            <div
              className="tf-strip"
              data-anim={anim ? 'true' : 'false'}
              style={{ width: stripW + 'px', transform: `translateX(${-scroll}px)` }}
            >
              <div className="tf-ruler" style={{ width: stripW + 'px' }} />

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
          </div>

          <button
            type="button"
            className="tf-pan"
            data-proximity
            aria-label="Zoom in"
            title="Zoom in"
            disabled={daysVisible <= MIN_DAYS || (endIdx - startIdx + 1) >= Math.max(Math.round(daysVisible / 1.5), MIN_DAYS)}
            onClick={() => zoom(1)}
          >
            <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}
