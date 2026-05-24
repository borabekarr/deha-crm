import { use } from 'react'
import { createContext } from 'react'
import type { MotionValue } from 'framer-motion'

export interface ProgressiveBlurContextValue {
  scrollProgress: MotionValue<number>
  reducedMotion: boolean
}

export const ProgressiveBlurContext = createContext<ProgressiveBlurContextValue>({
  scrollProgress: null as unknown as MotionValue<number>,
  reducedMotion: false,
})

export function useProgressiveBlur(): ProgressiveBlurContextValue {
  return use(ProgressiveBlurContext)
}
