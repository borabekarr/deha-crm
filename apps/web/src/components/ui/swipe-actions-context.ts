import { createContext, use } from 'react'

// ---------------------------------------------------------------------------
// Internal context — shares layout refs and motion state down
// ---------------------------------------------------------------------------
export interface SwipeActionsCtx {
  leftWidth: number
  rightWidth: number
  onLeftAction?: () => void
  onRightAction?: () => void
}

export const SwipeActionsContext = createContext<SwipeActionsCtx>({
  leftWidth: 0,
  rightWidth: 0,
})

export function useSwipeActionsContext(): SwipeActionsCtx {
  return use(SwipeActionsContext)
}
