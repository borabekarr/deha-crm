// Non-JSX split of PickerBody's rAF wheel-scroll engine (react-doctor
// no-giant-component). This is the "shared by all three [variants],
// unmodified" imperative machinery described in Picker.tsx's own header
// comment: DOM measurement/scroll, no refs or effects moved out of their
// original closures, no timing changed. `selRef` is returned because
// stepWheel/confirmDate/confirmTime/closeDate/closeTime in PickerBody read
// it directly, exactly as before this file existed.
import { useCallback, useEffect, useRef, type RefObject } from 'react'

// Idle-snap settle duration for the JS-driven wheel snap (ds-review-inputs
// step 3). MIRROR: --duration-slow (220ms) in src/styles/motion-tokens.css --
// the same 220ms the sibling raw Picker.jsx uses for its self-driven idle snap.
// rAF cannot read a CSS custom property per frame, so the number is
// duplicated here and this comment is the sync trail.
const SNAP_DUR = 220

// The rAF goal channel writes scrollTop per frame, so the repo-wide
// `@media (prefers-reduced-motion: reduce) { scroll-behavior: auto !important }`
// guard in src/styles/global.css cannot reach it. Every goal-channel entry
// point checks this live (no effect/listener) and jumps instantly instead.
const reducedMotion = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Raw source constant (picker.html): `ITEM_H = 44`.
const ITEM_H = 44

const WHEEL_NAMES = ['day', 'month', 'hour', 'minute'] as const
export type WheelName = (typeof WHEEL_NAMES)[number]

interface WheelRuntime {
  last: number
  idle: number
  snapped: boolean
  init: number | null
  goal: number | null
  goalFrom?: number
  goalT0?: number
  goalDur?: number
}

// piecewise linear interpolation, clamped
function interp(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]) return ys[0]
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1])
  }
  return ys[ys.length - 1]
}

export function usePickerWheelEngine(
  rootRef: RefObject<HTMLDivElement | null>,
  step: number,
  openDate: boolean,
  openTime: boolean,
) {
  const wstRef = useRef<Partial<Record<WheelName, WheelRuntime>>>({})
  const selRef = useRef<Partial<Record<WheelName, number>>>({})

  const getWheel = useCallback(
    (name: WheelName) => rootRef.current?.querySelector<HTMLElement>(`[data-wheel="${name}"]`) ?? null,
    [rootRef],
  )

  const writeOutputs = useCallback(() => {
    const val = (name: WheelName) => {
      const w = getWheel(name)
      if (!w) return ''
      const items = w.querySelectorAll<HTMLElement>('[data-item]')
      const i = selRef.current[name] || 0
      return items[i] ? (items[i].textContent ?? '').trim() : ''
    }
    const dateOut = rootRef.current?.querySelector<HTMLElement>('[data-out="date"]')
    if (dateOut) dateOut.textContent = `${val('day')} ${val('month').slice(0, 3)}`
    const timeOut = rootRef.current?.querySelector<HTMLElement>('[data-out="time"]')
    if (timeOut) timeOut.textContent = `${val('hour')}:${val('minute')}`
  }, [getWheel, rootRef])

  const updateWheel = useCallback((name: WheelName) => {
    const w = getWheel(name)
    if (!w) return
    const sc = w.querySelector<HTMLElement>('[data-scroller]')
    if (!sc) return
    const items = sc.querySelectorAll<HTMLElement>('[data-item]')
    const st = sc.scrollTop / ITEM_H
    items.forEach((el, i) => {
      const nd = st - i
      const ad = Math.abs(nd)
      const opacity = interp(ad, [0, 0.3, 0.6, 1, 1.5, 2], [1, 0.85, 0.6, 0.35, 0.15, 0.05])
      const scale = interp(ad, [0, 1, 2], [1, 0.96, 0.94])
      const ty = interp(nd, [-3, -2, -1, 0, 1, 2, 3], [15, 10, 5, 0, -5, -10, -15])
      const rx = interp(nd, [-3, -2, -1, 0, 1, 2, 3], [85, 60, 30, 0, -30, -60, -85])
      const blur = interp(ad, [0, 0.6, 1.2, 2], [0, 0.8, 1.5, 2.5])
      const sel = ad < 0.5
      Object.assign(el.style, {
        opacity: String(opacity),
        transform: `perspective(1400px) translateY(${ty}px) rotateX(${rx}deg) scale(${scale})`,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '',
        color: sel ? 'var(--fg1)' : '',
        fontWeight: sel ? '800' : '600',
      })
    })
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(st)))
    if (selRef.current[name] !== idx) {
      selRef.current[name] = idx
      writeOutputs()
    }
  }, [getWheel, writeOutputs])

  // Programmatic scrolls are driven by our own rAF animation in tick()
  // (native smooth scrollTo stalls when it races the idle-snap logic).
  const scrollWheelTo = useCallback((name: WheelName, index: number, smooth: boolean) => {
    const w = getWheel(name)
    if (!w) return
    const sc = w.querySelector<HTMLElement>('[data-scroller]')
    if (!sc) return
    const s = wstRef.current[name]
      || (wstRef.current[name] = { last: -1, idle: 0, snapped: true, init: null, goal: null })
    const target = index * ITEM_H
    // reduced motion: the Today/Now jump (and click-to-item) lands instantly --
    // the rAF goal channel is invisible to the global scroll-behavior guard.
    if (!smooth || reducedMotion()) {
      s.goal = null
      s.init = target // asserted every tick until it sticks
      sc.scrollTop = target
    } else {
      s.init = null
      s.goal = target
      s.goalFrom = sc.scrollTop
      s.goalT0 = performance.now()
      s.goalDur = Math.min(350, Math.max(140, Math.abs(target - sc.scrollTop) * 0.6))
        * (document.documentElement.getAttribute('data-anim-slow') === 'true' ? 4 : 1)
    }
  }, [getWheel])

  const expectedCount = useCallback(
    (name: WheelName) => ({ day: 31, month: 12, hour: 24, minute: Math.ceil(60 / step) })[name],
    [step],
  )

  const initWheels = useCallback(() => {
    const d = new Date()
    const initial: Record<WheelName, number> = {
      day: d.getDate() - 1,
      month: d.getMonth(),
      hour: d.getHours(),
      minute: Math.round(d.getMinutes() / step) % Math.ceil(60 / step),
    }
    let allReady = true
    WHEEL_NAMES.forEach((name) => {
      const w = getWheel(name)
      if (!w) { allReady = false; return }
      const sc = w.querySelector<HTMLElement>('[data-scroller]')
      if (!sc) { allReady = false; return }
      const count = sc.querySelectorAll('[data-item]').length
      if (count < expectedCount(name)) { allReady = false; return }
      if (!sc.dataset.wired) {
        sc.dataset.wired = '1'
        sc.addEventListener('click', (e) => {
          const item = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-item]')
          if (!item) return
          const items = Array.from(sc.querySelectorAll<HTMLElement>('[data-item]'))
          scrollWheelTo(name, items.indexOf(item), true)
        })
        // user input cancels any in-flight programmatic scroll
        const cancel = () => {
          const st2 = wstRef.current[name]
          if (st2) { st2.goal = null; st2.init = null }
        }
        sc.addEventListener('wheel', cancel, { passive: true })
        sc.addEventListener('touchstart', cancel, { passive: true })
        wstRef.current[name] = {
          last: -1, idle: performance.now(), snapped: true,
          init: initial[name] * ITEM_H, goal: null,
        }
        sc.scrollTop = initial[name] * ITEM_H
      }
      updateWheel(name)
    })
    writeOutputs()
    return allReady
  }, [expectedCount, getWheel, scrollWheelTo, updateWheel, writeOutputs, step])

  // Raw source componentDidMount(): poll initWheels() every 80ms until every
  // wheel's items exist, plus the rAF tick loop. componentWillUnmount()
  // clears both.
  useEffect(() => {
    let raf = 0
    const initTimer = window.setInterval(() => {
      if (initWheels()) window.clearInterval(initTimer)
    }, 80)

    const tick = () => {
      const now = performance.now()
      WHEEL_NAMES.forEach((name) => {
        const w = getWheel(name)
        if (!w) return
        const sc = w.querySelector<HTMLElement>('[data-scroller]')
        if (!sc || !sc.dataset.wired) return
        const s = wstRef.current[name]
          || (wstRef.current[name] = { last: -1, idle: now, snapped: false, init: null, goal: null })
        // re-assert initial position until it sticks (layout/React commits can
        // reset it)
        if (s.init != null) {
          if (sc.scrollTop !== s.init) sc.scrollTop = s.init
          if (sc.scrollTop === s.init) s.init = null
          s.idle = now
          s.snapped = true
        }
        // drive programmatic smooth scroll ourselves
        if (s.goal != null) {
          const p = Math.min(1, (now - (s.goalT0 ?? now)) / (s.goalDur || 1))
          const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
          sc.scrollTop = (s.goalFrom ?? 0) + (s.goal - (s.goalFrom ?? 0)) * e
          s.idle = now
          s.snapped = true
          if (p >= 1) s.goal = null
        }
        const st = sc.scrollTop
        if (st !== s.last) {
          s.last = st
          s.idle = now
          s.snapped = false
          updateWheel(name)
        } else if (s.goal == null && s.init == null && !s.snapped && now - s.idle > 140) {
          const max = (sc.querySelectorAll('[data-item]').length - 1) * ITEM_H
          const target = Math.max(0, Math.min(max, Math.round(st / ITEM_H) * ITEM_H))
          s.snapped = true
          // ds-review-inputs step 3: route the idle snap through the SAME rAF
          // goal channel the Today/Now jump already uses, instead of the native
          // `scrollTo({behavior:'smooth'})` it used to call. Three reasons:
          // (a) interruption -- the wired `wheel`/`touchstart` cancel handlers
          //     null `goal`, so a second scroll mid-snap hands control straight
          //     back to the user; a native smooth scroll ignores them and keeps
          //     fighting the finger to its own stale target;
          // (b) one physics -- easeOutCubic settles every wheel movement, so the
          //     snap and the jump no longer feel like two different components;
          // (c) the UA smooth scroll is not --anim-mult / data-anim-slow aware,
          //     so Slow-Down debug mode used to skip right past the snap.
          if (Math.abs(st - target) > 0.5) {
            if (reducedMotion()) {
              // reduced motion: settle instantly. CSS `scroll-behavior: auto
              // !important` used to cover this when the snap was a native
              // scrollTo({behavior:'smooth'}); on the rAF channel we must
              // short-circuit in JS ourselves.
              s.goal = null
              s.last = target
              sc.scrollTop = target
              updateWheel(name)
            } else {
              s.goal = target
              s.goalFrom = st
              s.goalT0 = now
              // MIRROR: --duration-slow (220ms); x4 under the raw source's own
              // slowMotion flag, same expression as scrollWheelTo(). Skipped
              // entirely under prefers-reduced-motion (branch above).
              s.goalDur = SNAP_DUR * (document.documentElement.getAttribute('data-anim-slow') === 'true' ? 4 : 1)
            }
          }
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.clearInterval(initTimer)
      cancelAnimationFrame(raf)
    }
  }, [getWheel, initWheels, updateWheel])

  // Raw source componentDidUpdate(): re-run initWheels() after every state
  // change (applyGlobalModes() is the excluded tweaks-panel half).
  useEffect(() => {
    initWheels()
  }, [openDate, openTime, initWheels])

  return { selRef, scrollWheelTo, getWheel }
}
