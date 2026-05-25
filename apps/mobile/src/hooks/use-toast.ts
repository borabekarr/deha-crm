/**
 * use-toast.ts
 *
 * Module-level event emitter + useSyncExternalStore hook.
 * NO useEffect anywhere — store mutations are synchronous.
 */
import { useSyncExternalStore } from 'react';
import type { ToastProps } from '@deha/ui-contracts';

// ---------------------------------------------------------------------------
// Internal store
// ---------------------------------------------------------------------------

export interface ToastEntry extends Required<Pick<ToastProps, 'id' | 'title'>> {
  description?: string;
  variant: NonNullable<ToastProps['variant']>;
  duration: number;
  onOpenChange?: (open: boolean) => void;
}

let nextId = 1;
let _toasts: ToastEntry[] = [];
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

function _subscribe(listener: () => void): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

function _getSnapshot(): ToastEntry[] {
  return _toasts;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function toast(props: ToastProps): string {
  const id = props.id ?? String(nextId++);
  const entry: ToastEntry = {
    id,
    title: props.title ?? '',
    description: props.description,
    variant: props.variant ?? 'default',
    duration: props.duration ?? 4000,
    onOpenChange: props.onOpenChange,
  };
  _toasts = [..._toasts, entry];
  _notify();
  return id;
}

export function dismiss(id: string): void {
  _toasts = _toasts.filter((t) => t.id !== id);
  _notify();
}


// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast() {
  const toasts = useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot);
  return { toasts, toast, dismiss };
}
