import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  componentName: string
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console for debugging HMR chunk desyncs and runtime throws
    console.error('[ComponentErrorBoundary] caught in', this.props.componentName, error, info)
  }

  reset(): void {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const message = this.state.error?.message ?? 'Unknown error'
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-semibold text-destructive">
            {this.props.componentName} failed to render
          </p>
          <p className="max-w-sm text-xs text-muted-foreground break-all">{message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-1 rounded-md border border-border bg-background px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
