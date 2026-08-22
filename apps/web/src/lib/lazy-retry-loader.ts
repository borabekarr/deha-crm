import { lazy, type ComponentType } from 'react'

// Retry delay before re-attempting a failed dynamic import chunk.
const RETRY_DELAY_MS = 750

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LazyWithRetryComponent<T extends ComponentType<any> = ComponentType<any>> = ReturnType<
  typeof lazy<T>
> & { readonly __importer: () => Promise<{ default: T }> }

/**
 * Wraps `lazy()`'s importer: on rejection (e.g. a stale/failed chunk),
 * retries once after a short delay. If the retry also fails, throws the
 * original error so the nearest boundary can render a local fallback
 * instead of the whole library blanking. The raw importer is stashed on
 * the returned component so `LazyLoadBoundary` can rebuild a fresh lazy()
 * instance on manual retry, discarding React.lazy's cached rejection.
 *
 * Split out of lazy-retry.tsx (only-export-components): a component module
 * may only export components, and this factory function is not one.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): LazyWithRetryComponent<T> {
  const LazyComponent = lazy(() =>
    importer().catch(
      (error) =>
        new Promise<{ default: T }>((resolve, reject) => {
          setTimeout(() => {
            importer().then(resolve).catch(() => reject(error))
          }, RETRY_DELAY_MS)
        })
    )
  ) as LazyWithRetryComponent<T>
  Object.defineProperty(LazyComponent, '__importer', { value: importer, enumerable: false })
  return LazyComponent
}
