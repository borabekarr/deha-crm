/* =========================================================================
   popover-hook.ts -- Custom hooks for LeadPopover.
   The no-use-effect convention permits `useEffect` ONLY inside reusable
   custom hooks living in a `*-hook.ts` module. Every effect that used to
   live inline in LeadPopover.tsx is encapsulated here behind a clean,
   typed interface. Behavior is preserved byte-for-byte.
   ========================================================================= */

import { useState, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

/* ── Animated tween (timer-based, throttle-safe) ─────────────────────────────
   Eases `target` toward its value over `dur` ms with a cubic ease-out.
   Returns the current animated value. */
export function useTween(target: number, dur: number): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    const T = performance.now()
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      const now = performance.now()
      const p = Math.min(1, (now - T) / (dur || 760))
      setV(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) id = setTimeout(tick, 16); else setV(target)
    }
    id = setTimeout(tick, 16)
    return () => clearTimeout(id)
  }, [target, dur])
  return v
}

/* ── Pill indicator measurement ──────────────────────────────────────────────
   Measures the active `.ldx-segbtn.on` button position inside `ref` and
   returns its {left,width}. Re-measures pre-paint on `active` change, plus a
   delayed re-measure (140ms) to catch font/open reflow. */
export interface PillPos { left: number; width: number }

export function usePillIndicator(
  active: number,
  ref: RefObject<HTMLDivElement | null>,
): PillPos {
  const [pos, setPos] = useState<PillPos>({ left: 3, width: 0 })
  const measure = () => {
    const root = ref.current; if (!root) return
    const btn = root.querySelector('.ldx-segbtn.on') as HTMLElement | null; if (!btn) return
    setPos(prev => (prev.left === btn.offsetLeft && prev.width === btn.offsetWidth) ? prev : { left: btn.offsetLeft, width: btn.offsetWidth })
  }
  // Re-measure pre-paint on active change, then once more after font/open
  // reflow. Deps are intentionally [active] only, matching the source behavior.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(measure, [active])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(measure, 140); return () => clearTimeout(t) }, [active])
  return pos
}

/* ── Typewriter chat tool ─────────────────────────────────────────────────────
   Encapsulates the AI-tool chat state machine: open a tool, "think" 1500ms,
   then type the response character-by-character (11ms/char). All timers are
   tracked and cleared on unmount / re-open. */
export interface TypewriterState<T> {
  chatOpen: boolean
  thinking: boolean
  typed: string
  activeTool: T | null
  openTool: (tool: T, response: string) => void
  closeChat: () => void
}

export function useTypewriter<T>(): TypewriterState<T> {
  const [chatOpen, setChatOpen] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [typed, setTyped] = useState('')
  const [activeTool, setActiveTool] = useState<T | null>(null)
  const typeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // cleanup on unmount
  useEffect(() => () => { if (typeTimer.current) clearTimeout(typeTimer.current) }, [])

  // openTool is invoked from an event handler; setTimeout chaining is fine here.
  const openTool = (tool: T, response: string) => {
    setActiveTool(tool); setChatOpen(true); setThinking(true); setTyped('')
    if (typeTimer.current) clearTimeout(typeTimer.current)
    typeTimer.current = setTimeout(() => {
      setThinking(false)
      const full = response
      let i = 0
      const step = () => { setTyped(full.slice(0, ++i)); if (i < full.length) typeTimer.current = setTimeout(step, 11) }
      step()
    }, 1500)
  }

  const closeChat = () => {
    setChatOpen(false)
    if (typeTimer.current) clearTimeout(typeTimer.current)
  }

  return { chatOpen, thinking, typed, activeTool, openTool, closeChat }
}

/* ── Countdown tick ───────────────────────────────────────────────────────────
   Drives a 1s `now` clock while `deadline` is a non-null target time.
   Returns the latest Date.now() tick value. The interval re-arms whenever
   `deadline` changes (a new lead mount supplies a fresh deadline). */
export function useCountdown(deadline: number | null): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (deadline == null) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [deadline])
  return now
}

/* ── Scroll reset on dependency change ────────────────────────────────────────
   Resets the scroll container to top and clears the "scrolled" flag whenever
   any value in `deps` changes, then recomputes the bottom edge shadow (60ms
   delay to let layout settle). Returns nothing; mutates via the supplied
   setters. */
export function useScrollResetOnChange(
  ref: RefObject<HTMLDivElement | null>,
  deps: unknown[],
  setScrolled: (v: boolean) => void,
  setEdges: (e: { top: boolean; bottom: boolean }) => void,
): void {
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.scrollTop = 0; setScrolled(false)
    const id = setTimeout(() => {
      const max = el.scrollHeight - el.clientHeight
      setEdges({ top: false, bottom: max > 6 })
    }, 60)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* ── Edge-shadow recheck on content height change ─────────────────────────────
   Re-evaluates the top/bottom edge fade shadows (preserving scroll position)
   whenever `deps` change, e.g. when widgets compute, load, or expand. */
export function useEdgeRecheck(
  ref: RefObject<HTMLDivElement | null>,
  deps: unknown[],
  setEdges: (e: { top: boolean; bottom: boolean }) => void,
): void {
  useEffect(() => {
    const el = ref.current; if (!el) return
    const id = setTimeout(() => {
      const st = el.scrollTop, max = el.scrollHeight - el.clientHeight
      setEdges({ top: st > 6, bottom: st < max - 6 })
    }, 80)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* ── Channel switcher indicator ───────────────────────────────────────────────
   Manages the active channel tab ('doc' | 'chat' | 'voice') and measures the
   indicator pill position over the active `.cs-segbtn.on` segment — same
   measurement shape as usePillIndicator. */
export type ChannelId = 'doc' | 'chat' | 'voice'

export interface ChannelSwitcherState {
  activeChannel: ChannelId
  setChannel: (id: ChannelId) => void
  indicatorPos: PillPos
  containerRef: (el: HTMLDivElement | null) => void
}

export function useChannelSwitcher(initial: ChannelId = 'doc'): ChannelSwitcherState {
  const [activeChannel, setChannel] = useState<ChannelId>(initial)
  const containerEl = useRef<HTMLDivElement | null>(null)
  const [indicatorPos, setPos] = useState<PillPos>({ left: 3, width: 0 })

  const measure = () => {
    const root = containerEl.current; if (!root) return
    const btn = root.querySelector('.cs-segbtn.on') as HTMLElement | null; if (!btn) return
    setPos(prev =>
      prev.left === btn.offsetLeft && prev.width === btn.offsetWidth
        ? prev
        : { left: btn.offsetLeft, width: btn.offsetWidth }
    )
  }

  // Pre-paint measure on active change, then one delayed re-measure to catch
  // font/open reflow — both scheduled inside a single layout effect so no plain
  // useEffect is needed (project hard-rule: zero useEffect).
  useLayoutEffect(() => {
    measure()
    const t = setTimeout(measure, 140)
    return () => clearTimeout(t)
  }, [activeChannel])

  const containerRef = (el: HTMLDivElement | null) => {
    containerEl.current = el
    if (el) measure()
  }

  return { activeChannel, setChannel, indicatorPos, containerRef }
}

/* ── Esc-to-close ─────────────────────────────────────────────────────────────
   Subscribes to window keydown and invokes `onClose` on Escape. */
export function useEscToClose(onClose: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}
