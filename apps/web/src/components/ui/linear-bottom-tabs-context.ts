import { createContext, use } from 'react'

// ---------------------------------------------------------------------------
// Context — active tab value + hover tab value + scope id
// ---------------------------------------------------------------------------
export interface LinearBottomTabsContextValue {
  activeValue: string
  setActiveValue: (v: string) => void
  hoveredValue: string | null
  setHoveredValue: (v: string | null) => void
  scopeId: string
  prefersReducedMotion: boolean
}

export const LinearBottomTabsContext = createContext<LinearBottomTabsContextValue>({
  activeValue: '',
  setActiveValue: () => undefined,
  hoveredValue: null,
  setHoveredValue: () => undefined,
  scopeId: 'linear-bottom-tabs',
  prefersReducedMotion: false,
})

export function useLinearBottomTabsContext(): LinearBottomTabsContextValue {
  return use(LinearBottomTabsContext)
}
