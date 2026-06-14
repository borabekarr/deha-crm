import { Suspense } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { getBySlug } from '@/lib/component-registry'
import { GalleryLayout } from '@/components/library/GalleryLayout'
import { PreviewFrame } from '@/components/library/PreviewFrame'
import { ComponentErrorBoundary } from '@/components/library/ComponentErrorBoundary'

export const Route = createFileRoute('/components/$slug')({
  component: ComponentPreviewPage,
})

function ComponentPreviewPage() {
  const { slug } = Route.useParams()
  const entry = getBySlug(slug)

  if (!entry) {
    return (
      <GalleryLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-foreground">Component not found</p>
          <p className="text-sm text-muted-foreground">
            No component with slug <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{slug}</code> exists in the registry.
          </p>
          <Link
            to="/"
            className="mt-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            &larr; Back to library
          </Link>
        </div>
      </GalleryLayout>
    )
  }

  const { Component } = entry

  return (
    <GalleryLayout activeSlug={slug}>
      <PreviewFrame entry={entry}>
        <ComponentErrorBoundary componentName={entry.name}>
          <Suspense
            fallback={
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Loading component...
              </div>
            }
          >
            <Component />
          </Suspense>
        </ComponentErrorBoundary>
      </PreviewFrame>
    </GalleryLayout>
  )
}
