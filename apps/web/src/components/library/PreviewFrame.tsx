import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import type { RegistryEntry } from '@/lib/component-registry'
import { useFitScale } from './use-fit-scale'

interface PreviewFrameProps {
  entry: RegistryEntry
  children: ReactNode
}

export function PreviewFrame({ entry, children }: PreviewFrameProps) {
  const { name, subtitle, sourceHtml, viewport } = entry
  const minWidth = viewport?.width
  const minHeight = viewport?.height
  const { ref: fitRef, contentRef, scale, contentWidth } = useFitScale(minWidth)

  // One-shot measurement of the unscaled content height, only needed when
  // the registry entry has no fixed viewport.height to scale from.
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (el && !minHeight) setContentHeight(el.scrollHeight)
    contentRef(el)
  }, [contentRef, minHeight])

  const scaled = scale < 1
  const boxHeight = minHeight
    ? minHeight * scale
    : contentHeight
      ? contentHeight * scale
      : undefined

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="anim-immediate flex items-center justify-between gap-2 border-b border-border px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate text-base font-semibold text-foreground">{name}</h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <a
          href={sourceHtml}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source HTML"
          className="flex min-h-11 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span className="hidden sm:inline">View source HTML</span>
        </a>
      </div>

      {/* Scrollable preview area */}
      <div
        ref={fitRef}
        className="flex-1 overflow-auto max-md:overflow-x-hidden bg-muted/30 p-4"
      >
        {scaled ? (
          <div style={{ height: boxHeight }} className="mx-auto">
            <div
              ref={measureRef}
              style={{
                minWidth: contentWidth ? `${contentWidth}px` : undefined,
                minHeight: minHeight ? `${minHeight}px` : undefined,
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
              }}
            >
              {children}
            </div>
          </div>
        ) : (
          <div
            style={{
              minWidth: minWidth ? `${minWidth}px` : undefined,
              minHeight: minHeight ? `${minHeight}px` : undefined,
            }}
            className="mx-auto"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
