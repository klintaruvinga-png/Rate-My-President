import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional label shown in the fallback (e.g. which panel crashed). */
  label?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

// Top-level + per-panel error boundary. Prevents a single component crash
// (null card, failed fetch) from white-screening the entire app. Renders a
// user-facing fallback with a retry button instead of a blank page.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // Surface in console for now; replace with an error tracker when added.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <h2 className="text-lg font-bold text-[oklch(0.95_0.02_250)] font-['Space_Grotesk']">
            {this.props.label ? `${this.props.label} failed to load` : 'Something went wrong'}
          </h2>
          <p className="max-w-sm text-sm text-[oklch(0.75_0.02_250)]">
            This section hit an unexpected error. Your other activity is unaffected.
          </p>
          <button
            onClick={this.handleRetry}
            className="rounded-full bg-[oklch(0.28_0.02_250)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[oklch(0.34_0.02_250)]"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
