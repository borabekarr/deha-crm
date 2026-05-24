// Compound namespace: ProgressiveBlur.Root + ProgressiveBlur.Header + ProgressiveBlur.Content
// fast-refresh compatible — only namespace exported.
/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { progressiveBlur } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ProgressiveBlurContext = React.createContext<{
  scrollProgress: import('framer-motion').MotionValue<number>
  reducedMotion: boolean
}>({
  scrollProgress: null as unknown as import('framer-motion').MotionValue<number>,
  reducedMotion: false,
})

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

  return (
    <ProgressiveBlurContext.Provider value={{ scrollProgress: scrollYProgress, reducedMotion }}>
      <div
        ref={containerRef}
        data-progressive-blur-root=""
        tabIndex={0}
        className={cn('relative overflow-y-auto focus:outline-none', className)}
        {...props}
      >
        {children}
      </div>
    </ProgressiveBlurContext.Provider>
  )
}
Root.displayName = 'ProgressiveBlur.Root'

// ---------------------------------------------------------------------------
// Header — sticky, gains backdrop-filter blur as scroll progress increases
// ---------------------------------------------------------------------------
interface HeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Show optional top gradient mask overlay */
  topGradient?: boolean
}

function Header({ className, children, topGradient = false, ...props }: HeaderProps) {
  const { scrollProgress, reducedMotion } = React.useContext(ProgressiveBlurContext)
  const blurFn = progressiveBlur({ reducedMotion })

  // Map 0..0.08 scroll band to 0..16px blur (snap to max quickly on scroll start)
  const blurPx = useTransform(scrollProgress, [0, 0.08], [blurFn(0), blurFn(1)])

  return (
    <motion.div
      data-progressive-blur-header=""
      style={{ '--blur-px': blurPx.get() !== undefined ? blurPx : undefined } as React.CSSProperties}
      className={cn(
        'sticky top-0 z-10',
        // Backdrop-filter blur with @supports fallback
        'bg-background/90',
        'supports-[backdrop-filter]:bg-background/70',
        'supports-[backdrop-filter]:[backdrop-filter:blur(var(--blur-px,0px))]',
        // Transition for non-reduced motion
        'transition-[background-color] duration-200',
        className,
      )}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.div>)}
    >
      {topGradient && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background/60 to-transparent"
        />
      )}
      {children}
    </motion.div>
  )
}
Header.displayName = 'ProgressiveBlur.Header'

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
export const ProgressiveBlur = { Root, Header, Content }
