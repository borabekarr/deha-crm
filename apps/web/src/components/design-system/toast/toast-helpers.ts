import type { ToastSpec } from './toast-vm'

// Toast-with-undo variant: same main toast look, an Undo action pill in
// place of (or beside) the close button. Stable export name -- the
// sprint-planner substitution step imports this to build its own undo
// toasts against this module's ToastSpec shape.
// Split out of Toast.tsx (only-export-components): a component module may
// only export components, so this non-component helper lives here instead.
export function withUndo(spec: Omit<ToastSpec, 'action'>): ToastSpec {
  return { ...spec, action: { label: 'Undo', icon: 'undo' } }
}
