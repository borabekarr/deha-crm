import { createContext, use } from 'react'

// ---------------------------------------------------------------------------
// Snap points for Apple Maps peek / half / full behaviour
// ---------------------------------------------------------------------------
export const SNAP_POINTS = [0.18, 0.5, 0.95] as const
export const FADE_FROM_INDEX = 1

// Map snap index → overlay opacity (0 at peek, ~0.3 at half, ~0.5 at full)
export const OVERLAY_OPACITY: Record<number, number> = { 0: 0, 1: 0.3, 2: 0.5 }

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export interface MapsSheetCtx {
  activeSnapIndex: number
  reducedMotion: boolean
  transitionDuration: number
}

export const MapsSheetContext = createContext<MapsSheetCtx>({
  activeSnapIndex: 0,
  reducedMotion: false,
  transitionDuration: 280,
})

export function useMapsSheetContext(): MapsSheetCtx {
  return use(MapsSheetContext)
}
