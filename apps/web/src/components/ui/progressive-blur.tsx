// Compound namespace: ProgressiveBlur.Root + ProgressiveBlur.Header + ProgressiveBlur.Content
// Sub-components also exported individually for fast-refresh compatibility.
/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { useScroll, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ProgressiveBlurContext } from './progressive-blur-context'
import { Header } from './progressive-blur-header'

// ---------------------------------------------------------------------------
// Root — scroll container that tracks its own scroll progress
// ---------------------------------------------------------------------------
interface RootProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Optional gradient mask at the top of the header */
  topGradient?: boolean
}

function Root({ className, children, topGradient: _topGradient = false, ...props }: RootProps) {  // eslint-disable-line @typescript-eslint/no-unused-vars
  const containerRef = React.useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion() ?? false

  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ['start start', 'end end'],
  })

  const contextValue = React.useMemo(
    () => ({ scrollProgress: scrollYProgress, reducedMotion }),
    [scrollYProgress, reducedMotion],
  )

  return (
    <ProgressiveBlurContext.Provider value={contextValue}>
      <section
        ref={containerRef}
        data-progressive-blur-root=""
        className={cn('relative overflow-y-auto focus:outline-none', className)}
        {...props}
      >
        {children}
      </section>
    </ProgressiveBlurContext.Provider>
  )
}
Root.displayName = 'ProgressiveBlur.Root'

// ---------------------------------------------------------------------------
// Content — plain scrollable content slot
// ---------------------------------------------------------------------------
function Content({ className, children, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-progressive-blur-content=""
      className={cn('relative', className)}
      {...props}
    >
      {children}
    </div>
  )
}
Content.displayName = 'ProgressiveBlur.Content'

// ---------------------------------------------------------------------------
// Namespace export
// ---------------------------------------------------------------------------
export { Root, Content }
export const ProgressiveBlur = { Root, Header, Content }
