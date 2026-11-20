import {Component, type ErrorInfo, type ReactNode} from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, message: error.message};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CampusCart ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-6 text-[#141414]">
          <div className="max-w-md rounded-2xl border border-[#E6E1D8] bg-white p-8 text-center shadow-sm">
            <h2 className="font-display text-2xl font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-[#5A564E]">
              Please refresh the page or sign in again to continue using CampusCart.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-[#9E1B32] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7F1528]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
