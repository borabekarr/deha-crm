import { createContext, use } from 'react'

// ---------------------------------------------------------------------------
// Internal context — tracks which tab value is currently active so Trigger
// can conditionally render the shared layoutId indicator without useEffect.
// ---------------------------------------------------------------------------
export interface MotionTabsContextValue {
  activeValue: string
  setActiveValue: (v: string) => void
}

export const MotionTabsContext = createContext<MotionTabsContextValue>({
  activeValue: '',
  setActiveValue: () => undefined,
})

export function useMotionTabsContext(): MotionTabsContextValue {
  return use(MotionTabsContext)
}
