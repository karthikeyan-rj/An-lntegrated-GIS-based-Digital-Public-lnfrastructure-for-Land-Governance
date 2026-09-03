import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Global error boundary. A safety net so an unexpected component failure never
 * produces a blank page — it renders a useful recovery UI instead.
 *
 * This does NOT replace fixing the underlying bugs; it only prevents a total
 * white screen when something unhandled slips through.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    // Log the actual error during development (and production) so it isn't hidden.
    console.error('[LandStack] Unhandled render error:', error, info)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 mb-2">LandStack encountered an unexpected error.</h1>
            <p className="text-sm text-slate-500 mb-6">
              Something went wrong while rendering this page. Try again, or head back to the dashboard.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={this.reset}>Try again</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  this.reset()
                  if (typeof window !== 'undefined') window.location.href = '/dashboard'
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
