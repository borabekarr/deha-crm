import { createContext, use } from 'react'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export interface FabContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}

export const FabContext = createContext<FabContextValue | null>(null)

export function useFabContext() {
  const ctx = use(FabContext)
  if (!ctx) throw new Error('Fab compound components must be used inside <Fab.Root>')
  return ctx
}
