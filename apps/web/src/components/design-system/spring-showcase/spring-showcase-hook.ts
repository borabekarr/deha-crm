/**
 * spring-showcase-hook.ts — state + imperative DOM logic for Spring Lab.
 * NO raw effect hooks anywhere in this folder: state lives in ONE useReducer
 * (params/preset/version/copied); demo replays and the clipboard "Copied"
 * flip run from callback refs / event handlers only.
 *
 * `slideRef`/`scaleRef` are `useCallback(..., [state.version])` callback
 * refs — React re-invokes a callback ref whenever its identity changes, so
 * every `version` bump (preset pick, slider drag, Replay click) re-triggers
 * `animate()`. The first invocation (mount) is skipped, so there is no
 * entrance animation.
 */

import { useCallback, useMemo, useReducer, useRef } from 'react'
import { animate } from 'framer-motion/dom'
import {
  springParams, sampleSpring, toJsSpring, toCssTransition, SPRING_PRESETS, type SpringParams,
} from '@/lib/spring-math'
import { tokenMs } from '@/lib/token-ms'

export type Preset = 'pill' | 'elegant' | 'bouyant' | 'pop' | 'custom'

export interface LabParams { stiffness: number; damping: number; mass: number }

export interface LabState {
  params: LabParams
  preset: Preset
  version: number
  copied: 'js' | 'css' | null
}

export type LabAction =
  | { type: 'preset'; preset: Exclude<Preset, 'custom'> }
  | { type: 'param'; key: 'stiffness' | 'damping' | 'mass'; value: number }
  | { type: 'replay' }
  | { type: 'copied'; which: 'js' | 'css' | null }

/** Checked at call time (never cached) — matches motion-spring.ts's own
 *  convention: --anim-mult 0 or prefers-reduced-motion collapses replays. */
export function motionDisabled(): boolean {
  if (typeof window === 'undefined') return false
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult').trim()
  const mult = raw === '' ? 1 : Number.parseFloat(raw)
  if (Number.isFinite(mult) && mult <= 0) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function toLabParams(s: SpringParams): LabParams {
  return { stiffness: s.stiffness, damping: s.damping, mass: s.mass ?? 1 }
}

/** Re-adopt a named preset if manual sliders land exactly on its values. */
function matchPreset(params: LabParams): Preset {
  for (const key of Object.keys(SPRING_PRESETS) as Array<keyof typeof SPRING_PRESETS>) {
    const p = SPRING_PRESETS[key]
    if (p.stiffness === params.stiffness && p.damping === params.damping && (p.mass ?? 1) === params.mass) return key
  }
  return 'custom'
}

const INITIAL_STATE: LabState = { params: toLabParams(SPRING_PRESETS.elegant), preset: 'elegant', version: 0, copied: null }

function reducer(state: LabState, action: LabAction): LabState {
  switch (action.type) {
    case 'preset':
      return { ...state, params: toLabParams(SPRING_PRESETS[action.preset]), preset: action.preset, version: state.version + 1 }
    case 'param': {
      const params = { ...state.params, [action.key]: action.value }
      return { ...state, params, preset: matchPreset(params), version: state.version + 1 }
    }
    case 'replay':
      return { ...state, version: state.version + 1 }
    case 'copied':
      return { ...state, copied: action.which }
    default:
      return state
  }
}

/** textarea + execCommand fallback when navigator.clipboard is unavailable. */
function fallbackCopy(text: string): void {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  try { document.execCommand('copy') } catch { /* best-effort only */ }
  document.body.removeChild(ta)
}

export function useSpringLab() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const derived = useMemo(() => springParams(state.params), [state.params])
  const samples = useMemo(() => sampleSpring(state.params), [state.params])
  const metrics = useMemo(() => ({
    settleSec: samples.settleSec, overshootPct: samples.overshootPct, firstPeakSec: samples.firstPeakSec,
  }), [samples])
  const exportJs = useMemo(() => toJsSpring(state.params), [state.params])
  const exportCss = useMemo(() => `transition: ${toCssTransition(state.params)};`, [state.params])

  const slideControls = useRef<ReturnType<typeof animate> | null>(null)
  const scaleControls = useRef<ReturnType<typeof animate> | null>(null)
  const slidePlayed = useRef(false)
  const scalePlayed = useRef(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Identity flips on `version` alone (params changes always accompany a
  // version bump; a bare Replay bumps version without a new params object).
  const slideRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    if (!slidePlayed.current) { slidePlayed.current = true; el.style.transform = 'translateX(0px)'; return }
    slideControls.current?.stop()
    if (motionDisabled()) { el.style.transform = 'translateX(160px)'; return }
    slideControls.current = animate(el, { x: [0, 160] }, { type: 'spring', ...state.params })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.version])

  // See slideRef — identity keyed on `version` only.
  const scaleRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    if (!scalePlayed.current) { scalePlayed.current = true; el.style.transform = 'scale(1)'; return }
    scaleControls.current?.stop()
    if (motionDisabled()) { el.style.transform = 'scale(1)'; return }
    scaleControls.current = animate(el, { scale: [0.6, 1] }, { type: 'spring', ...state.params })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.version])

  const onCopy = useCallback((which: 'js' | 'css') => {
    const text = which === 'js' ? exportJs : exportCss
    const flip = () => {
      dispatch({ type: 'copied', which })
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => dispatch({ type: 'copied', which: null }), tokenMs('--duration-slow', 220) * 6)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(flip, () => { fallbackCopy(text); flip() })
    } else {
      fallbackCopy(text)
      flip()
    }
  }, [exportJs, exportCss])

  return { state, params: derived, samples, metrics, exportJs, exportCss, dispatch, slideRef, scaleRef, onCopy }
}
