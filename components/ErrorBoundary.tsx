"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-3xl p-6">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
            <p className="mt-1 text-sm text-red-700">
              An unexpected error occurred. Please reload the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-3 rounded-md bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
