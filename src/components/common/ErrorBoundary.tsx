import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'

type ErrorBoundaryProps = {
  children: ReactNode
  resetKey?: string
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin module crashed', error, info)
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section className="error-panel" role="alert">
        <h2>Something went wrong</h2>
        <p>This module could not be rendered. Try refreshing the page or open another module.</p>
        <Button variant="primary" onClick={() => this.setState({ hasError: false })}>
          Try Again
        </Button>
      </section>
    )
  }
}
