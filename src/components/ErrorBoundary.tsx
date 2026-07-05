import { Component } from 'react';
import type { ReactNode } from 'react';
import { logger } from '@/utilities/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    logger.error('ErrorBoundary caught', error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="w-full h-screen flex flex-col justify-center items-center">
            <p className="text-3xl font-content font-bold">Something went wrong</p>
            <p className="text-2xl font-content mt-3">Please try refreshing the page.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
