import { createContext, use } from 'react'

export const IOSPopoverOpenContext = createContext(false)

export function useIOSPopoverOpen(): boolean {
  return use(IOSPopoverOpenContext)
}
