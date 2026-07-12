import type { ReactNode } from 'react'
import type { RegistryEntry } from '@/lib/component-registry'
import { makeRevealRef } from '@/lib/make-reveal-ref'

interface PreviewFrameProps {
  entry: RegistryEntry
  children: ReactNode
}

export function PreviewFrame({ entry, children }: PreviewFrameProps) {
  const { name, subtitle, sourceHtml, viewport } = entry
  const minWidth = viewport?.width
  const minHeight = viewport?.height

  return (
    <div ref={makeRevealRef({ from: 'first' })} className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-semibold text-foreground">{name}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <a
          href={sourceHtml}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          View source HTML
        </a>
      </div>

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <div
          style={{
            minWidth: minWidth ? `${minWidth}px` : undefined,
            minHeight: minHeight ? `${minHeight}px` : undefined,
          }}
          className="mx-auto"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
