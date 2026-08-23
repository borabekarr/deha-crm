/**
 * use-adjust-timeframe-controller.ts
 *
 * All state, refs, derived values, and interaction handlers for
 * AdjustTimeframe live here. The exported component (`AdjustTimeframe.tsx`)
 * calls this hook once and passes the returned values down as props to two
 * render-only siblings (`AdjustTimeframeHeader`, `AdjustTimeframeTrack`).
 * Hooks composed through a custom hook behave identically to inlining them
 * in the component body — same fiber, same hook order, same closures — so
 * this is a pure reorganization: no state, ref, or handler moved to a child
 * component, only out of the (over-300-line) component function.
 */
import { useState, useRef, useReducer, useCallback, useLayoutEffect } from 'react'
import { useProximityGroup } from '@/lib/hooks'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { trackRef, cleanupTrack, beginDrag } from './adjust-timeframe-hook'
import { floorDay, addDays, diffDays, clamp, buildMonths, rangeReducer, ZOOM_LEVELS, type MonthInfo } from './adjust-timeframe-shared'

export function useAdjustTimeframeController() {
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

  const levelToDays = (level: number, total: number): number =>
    clamp(Math.round(total * (1 - level / 100) + MIN_DAYS * (level / 100)), MIN_DAYS, total)
  const DEFAULT_DAYS_VISIBLE = levelToDays(50, totalDays)

  /* ── State ───────────────────────────────────────────────────────────── */
  /* Default preset: "30D" (index 1). */
  const defaultPreset = presets[1]
  // startIdx/endIdx/zoomLevel/daysVisible/anim change together from the same
  // interactions (apply-preset, zoom step, drag) — one reducer keeps that
  // cluster consistent instead of five independent setState calls firing in
  // sequence. Read/write call sites below are untouched: setStartIdx(x) etc.
  // stay the same shape, just dispatching under the hood.
  const [rangeState, dispatchRange] = useReducer(rangeReducer, {
    startIdx: clamp(defaultPreset.start, 0, todayIdx),
    endIdx: todayIdx,
    zoomLevel: 50,
    daysVisible: DEFAULT_DAYS_VISIBLE,
    anim: false,
  })
  const { startIdx, endIdx, zoomLevel, daysVisible, anim } = rangeState
  const setStartIdx    = (v: number)  => dispatchRange({ type: 'startIdx', value: v })
  const setEndIdx      = (v: number)  => dispatchRange({ type: 'endIdx', value: v })
  const setZoomLevel   = (v: number)  => dispatchRange({ type: 'zoomLevel', value: v })
  const setDaysVisible = (v: number)  => dispatchRange({ type: 'daysVisible', value: v })
  const setAnim        = (v: boolean) => dispatchRange({ type: 'anim', value: v })

  const [trackW,      setTrackW]      = useState(0)
  const [scroll,      setScroll]      = useState(0)
  const [drag,        setDrag]        = useState<'start' | 'end' | 'move' | null>(null)
  /* bump key: incremented by preset / month / key actions to trigger the pop animation */
  const [bumpKey,     setBumpKey]     = useState(0)
  /* The pill the user last picked. Stays "active" (white text) even after
     the range is extended via the strip, so the active pill never turns grey. */
  const [pickedPreset, setPickedPreset] = useState<string | null>(defaultPreset.id)

  /* ── Derived display values ──────────────────────────────────────────── */
  /* Stop-if resolution (Bora, dated 2026-08-22): zoom-in must refuse a step
     that would cut the selection off, rather than the reverse (never
     achievable — see the plan's Step 3 record). `HANDLE_PAD` moved up from
     below (still the single source `fitScroll` also uses) so the deepest
     containable level can be derived before `ppd`. maxZoomIdx/effective*
     recompute every render from live trackW/startIdx/endIdx, so widening the
     selection via ANY path (drag, preset, month, keyboard) reacts the same
     way a zoom click does — no effect, no extra dispatch on drag needed.
     `zoomLevel` state keeps storing the level the user asked for;
     `effectiveZoomLevel` is what's actually safe to render and is what the
     pill/ppd/stepZoom all read, so narrowing the selection again silently
     restores the requested level once it fits again. */
  const HANDLE_PAD = 12
  let maxZoomIdx = 0
  for (let i = 0; i < ZOOM_LEVELS.length; i++) {
    const candidatePpd = trackW > 0 ? trackW / levelToDays(ZOOM_LEVELS[i], totalDays) : 0
    const fits = trackW === 0 || (endIdx - startIdx) * candidatePpd + 2 * HANDLE_PAD <= trackW
    if (fits) maxZoomIdx = i
    else break
  }
  const effectiveZoomIdx     = Math.min(ZOOM_LEVELS.indexOf(zoomLevel), maxZoomIdx)
  const effectiveZoomLevel   = ZOOM_LEVELS[effectiveZoomIdx]
  const effectiveDaysVisible = levelToDays(effectiveZoomLevel, totalDays)
  const canZoomIn = effectiveZoomIdx < maxZoomIdx
  const ppd     = trackW > 0 ? trackW / clamp(effectiveDaysVisible, MIN_DAYS, totalDays) : 6
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
  /* Render-time fit, every render, not only inside stepZoom: when the
     selection outgrows the requested level (maxZoomIdx drops below
     zoomIdx above) ppd widens on THIS render already, so the raw `scroll`
     state -- last set by whatever drag/pan touched it -- may no longer
     frame the now-wider selection. fitScroll (defined below; function
     declarations hoist) nudges minimally off `scroll`, exactly like the
     zoom-step fit pass, and is a no-op whenever the selection already
     fits, so ordinary pan/drag rendering is unchanged. */
  const viewScroll = fitScroll(scroll, startIdx, endIdx, ppd, trackW, minScroll, maxScroll)

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
     the track -- synced via useLayoutEffect (runs synchronously after
     commit, before paint, same effective timing as a render-time write)
     and read via ppdRef.current at both ensureVisible call sites below. */
  const ppdRef = useRef(ppd)
  useLayoutEffect(() => {
    ppdRef.current = ppd
  }, [ppd])

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
    // scrollRef always mirrors committed scroll state (only writer below),
    // so the "prev" a function form needs comes from the ref, not from a
    // setState updater — keeps setScroll a plain-value call.
    const next = typeof v === 'function' ? v(scrollRef.current) : v
    scrollRef.current = next
    setScroll(next)
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
      /* Step 3 seam fix: StrictMode's synchronous double-invoke measures the
         track before its final layout settles (e.g. 436px), so the flush-
         right init above pins scroll to THAT width's maxScroll. When the
         real ResizeObserver later reports the settled, wider width (438px),
         a plain clamp leaves scroll short of the NEW maxScroll (it was
         already inside the wider bound), so .tf-strip's right edge no
         longer lines up with .tf-track's — a sub-pixel seam where .tf-sel
         overhangs the track by the exact width delta. Re-anchor to the new
         max only when scroll was already pinned to the old one, so a
         flush-right view stays flush-right across the resize; any other
         scroll position still just clamps as before. */
      const oldMaxScroll = Math.max(0, totalDays * (lastTrackW.current / DEFAULT_DAYS_VISIBLE) - lastTrackW.current)
      const newMaxScroll = Math.max(0, totalDays * (w / DEFAULT_DAYS_VISIBLE) - w)
      const wasFlushRight = scrollRef.current >= oldMaxScroll - 0.5
      lastTrackW.current = w
      setTrackW(w)
      trackRectRef.current = trackElRef.current?.getBoundingClientRect() ?? null
      setScrollLive(wasFlushRight ? newMaxScroll : (s) => clamp(s, -EDGE_PAD, newMaxScroll))
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
     step, so a fast zoom never leaves a handle clipped outside the viewport.
     HANDLE_PAD itself now lives above (with maxZoomIdx) — this is a plain
     `function` declaration, so it's hoisted and callable from render-time
     `viewScroll` above despite being defined later in the file. */
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
  /* F2b: steps through ZOOM_LEVELS by index delta (+1 for "+", -1 for "-").
     Stop-if resolution: zooming further IN is capped at maxZoomIdx (the
     deepest level that still contains the whole selection) so a step can
     never land past it; zooming OUT is never constrained by containment. */
  function stepZoom(dir: number) {
    const idx = effectiveZoomIdx
    const upperBound = dir > 0 ? maxZoomIdx : ZOOM_LEVELS.length - 1
    const nextIdx = clamp(idx + dir, 0, upperBound)
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

  return {
    accent, months, presets,
    startIdx, endIdx, drag, bumpKey, anim,
    /* zoomLevel/scroll exposed here are the EFFECTIVE (render-safe) values,
       not the raw requested/stored ones — the pill label, its disabled
       checks, and the painted strip position all read the value that is
       actually being shown. */
    zoomLevel: effectiveZoomLevel, canZoomIn,
    trackW, scroll: viewScroll,
    ppd, stripW, maxScroll, minScroll, rulerW,
    selLeft, selWidth, days, startDate, endDate, endIsToday, todayIdx, totalDays,
    activeId, gliderStyle,
    panGroupRef, shellSquircleRef, cardSquircleRef, presetsCallbackRef, trackCallbackRef,
    handleBeginDrag, onTrackDown, applyPreset, stepZoom, panBy, handleShellKey, selectMonth, onHandleKey,
  }
}

/** Shape returned by the hook above; siblings `Pick<>` only the fields they render. */
export type AdjustTimeframeController = ReturnType<typeof useAdjustTimeframeController>

