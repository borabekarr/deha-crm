// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ToastivaPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type ToastivaVariant = 'default' | 'success' | 'warning' | 'danger'

export interface ToastivaItem {
  id: string
  title?: string
  description?: string
  variant?: ToastivaVariant
  position?: ToastivaPosition
  duration?: number
}

type ToastivaInput = Omit<ToastivaItem, 'id'>

// ---------------------------------------------------------------------------
// Module-level store (no useEffect — uses useSyncExternalStore)
// ---------------------------------------------------------------------------
let _toastivaItems: ToastivaItem[] = []
const _toastivaSubscribers = new Set<() => void>()

function _notify() {
  _toastivaSubscribers.forEach((cb) => cb())
}

export function _subscribe(cb: () => void) {
  _toastivaSubscribers.add(cb)
  return () => { _toastivaSubscribers.delete(cb) }
}

export function _getSnapshot(): ToastivaItem[] {
  return _toastivaItems
}

export function _dismissToastiva(id: string): void {
  _toastivaItems = _toastivaItems.filter((t) => t.id !== id)
  _notify()
}

function _show(input: ToastivaInput): string {
  const id = Math.random().toString(36).slice(2)
  const dur = input.duration ?? 4000
  _toastivaItems = [..._toastivaItems, { ...input, id }]
  _notify()
  setTimeout(() => { _dismissToastiva(id) }, dur)
  return id
}

// ---------------------------------------------------------------------------
// Public imperative API (mirror of toastiva RN library shape)
// ---------------------------------------------------------------------------
export function toastiva(input: ToastivaInput): string { return _show(input) }
toastiva.success = (title: string, opts?: Omit<ToastivaInput, 'title' | 'variant'>) =>
  _show({ ...opts, title, variant: 'success' })
toastiva.warning = (title: string, opts?: Omit<ToastivaInput, 'title' | 'variant'>) =>
  _show({ ...opts, title, variant: 'warning' })
toastiva.danger = (title: string, opts?: Omit<ToastivaInput, 'title' | 'variant'>) =>
  _show({ ...opts, title, variant: 'danger' })
toastiva.dismiss = _dismissToastiva
