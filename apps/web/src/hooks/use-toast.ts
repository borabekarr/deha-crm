import { useSyncExternalStore } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  duration?: number
}

type ToastInput = Omit<ToastItem, 'id'>

// ---------------------------------------------------------------------------
// Module-level store
// ---------------------------------------------------------------------------
let toasts: ToastItem[] = []
const subscribers = new Set<() => void>()

function notify() {
  subscribers.forEach((cb) => cb())
}

function subscribe(cb: () => void) {
  subscribers.add(cb)
  return () => {
    subscribers.delete(cb)
  }
}

function getSnapshot(): ToastItem[] {
  return toasts
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function toast(input: ToastInput): string {
  const id = Math.random().toString(36).slice(2)
  const duration = input.duration ?? 4000

  toasts = [...toasts, { ...input, id }]
  notify()

  // Auto-remove after duration — setTimeout is outside a hook, not useEffect
  setTimeout(() => {
    dismissToast(id)
  }, duration)

  return id
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

// ---------------------------------------------------------------------------
// React binding — useSyncExternalStore, no useEffect
// ---------------------------------------------------------------------------
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
