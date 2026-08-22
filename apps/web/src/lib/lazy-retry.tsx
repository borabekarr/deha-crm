import { Component, Suspense, type ReactNode, type ErrorInfo } from 'react'
import { lazyWithRetry, type LazyWithRetryComponent } from './lazy-retry-loader'

export type { LazyWithRetryComponent }

interface LazyLoadBoundaryProps {
  componentName: string
  component: LazyWithRetryComponent
  fallback: ReactNode
  children?: (Current: LazyWithRetryComponent) => ReactNode
}

interface LazyLoadBoundaryState {
  hasError: boolean
  current: LazyWithRetryComponent
}

/** Per-page boundary for lazy-load chunk failures, with a working retry. */
export class LazyLoadBoundary extends Component<LazyLoadBoundaryProps, LazyLoadBoundaryState> {
  constructor(props: LazyLoadBoundaryProps) {
    super(props)
    this.state = { hasError: false, current: props.component }
  }

  static getDerivedStateFromError(): Pick<LazyLoadBoundaryState, 'hasError'> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[LazyLoadBoundary] chunk load failed for', this.props.componentName, error, info)
  }

  retry = (): void => {
    // Fresh lazy() instance re-attempts the import instead of replaying
    // React.lazy's cached rejection.
    this.setState({ hasError: false, current: lazyWithRetry(this.props.component.__importer) })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            {this.props.componentName} failed to load
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="mt-1 rounded-md border border-border bg-background px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Retry
          </button>
        </div>
      )
    }
    const Current = this.state.current
    return (
      <Suspense fallback={this.props.fallback}>
        {this.props.children ? this.props.children(Current) : <Current />}
      </Suspense>
    )
  }
}
