// toast-hook.ts
// Pure-React toast store. Replaces the old react-native-web / Expo iframe build.
//
// All mutation funnels through setToasts(), which swaps the array reference so
// useSyncExternalStore detects the change. Auto-dismiss + promise-transition
// timers live in this module (outside React), so no component needs useEffect.

import { useSyncExternalStore } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'
export type LeaveDir = 'auto' | 'left' | 'right'

export interface ToastAction {
  label: string
  icon?: string
  ghost?: boolean
  onClick?: (id: number) => void
}

export interface ToastData {
  id: number
  type: ToastType
  title: string
  desc?: string
  collapsed: boolean
  duration: number // ms; 0 = sticky (loading / promise pending)
  showProgress: boolean
  actions?: ToastAction[]
  leaving?: LeaveDir
}

export interface PushOptions {
  type?: ToastType
  title: string
  desc?: string
  collapsed?: boolean
  duration?: number
  progress?: boolean
  actions?: ToastAction[]
}

const MAX_TOASTS = 5
const DEFAULT_DURATION = 4200
const LEAVE_MS = 280 // must match the exit keyframes in Toast.css

type Listener = () => void

let toasts: ToastData[] = []
let seq = 0
const listeners = new Set<Listener>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function setToasts(next: ToastData[]) {
  toasts = next
  listeners.forEach((l) => l())
}

function clearTimer(id: number) {
  const t = timers.get(id)
  if (t) {
    clearTimeout(t)
    timers.delete(id)
  }
}

function scheduleDismiss(id: number, duration: number) {
  clearTimer(id)
  if (duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismiss(id, 'auto'), duration),
    )
  }
}

export function push(opts: PushOptions): number {
  const id = ++seq
  const type = opts.type ?? 'info'
  const duration = opts.duration ?? (type === 'loading' ? 0 : DEFAULT_DURATION)
  const desc = opts.desc
  const toast: ToastData = {
    id,
    type,
    title: opts.title,
    desc,
    collapsed: opts.collapsed ?? !desc,
    duration,
    showProgress: opts.progress ?? (duration > 0 && !!desc),
    actions: opts.actions,
  }
  setToasts([toast, ...toasts].slice(0, MAX_TOASTS))
  scheduleDismiss(id, duration)
  return id
}

export function update(id: number, patch: Partial<ToastData>) {
  let found = false
  const next = toasts.map((t) => {
    if (t.id !== id) return t
    found = true
    return { ...t, ...patch }
  })
  if (!found) return
  setToasts(next)
  if (patch.duration !== undefined) scheduleDismiss(id, patch.duration)
}

// Two-phase removal: mark `leaving` (CSS plays the exit), then hard-remove.
export function dismiss(id: number, dir: LeaveDir = 'auto') {
  const target = toasts.find((t) => t.id === id)
  if (!target || target.leaving) return
  clearTimer(id)
  setToasts(toasts.map((t) => (t.id === id ? { ...t, leaving: dir } : t)))
  timers.set(
    id,
    setTimeout(() => remove(id), LEAVE_MS),
  )
}

export function remove(id: number) {
  clearTimer(id)
  setToasts(toasts.filter((t) => t.id !== id))
}

export function clearAll() {
  toasts.forEach((t) => clearTimer(t.id))
  setToasts([])
}

// A loading toast that resolves to success after `delay` ms.
export function pushPromise(delay = 1900): number {
  const id = push({ type: 'loading', title: 'Saving lead…', collapsed: true, duration: 0 })
  timers.set(
    id,
    setTimeout(() => {
      update(id, {
        type: 'success',
        title: 'Lead saved',
        collapsed: true,
        showProgress: false,
        duration: 2600,
      })
    }, delay),
  )
  return id
}

function subscribe(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function getSnapshot() {
  return toasts
}

export function useToasts(): ToastData[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
