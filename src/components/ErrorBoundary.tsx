import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  onReset?: () => void;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-neutral-900 text-white p-8">
          <AlertTriangle size={64} className="text-red-500 mb-6" />
          <h1 className="text-2xl font-bold mb-4">حدث خطأ غير متوقع</h1>
          <p className="text-neutral-400 mb-8 max-w-md text-center">
            {this.state.error?.message || 'عذراً، حدث خطأ أثناء تحميل هذا المكون. يرجى المحاولة مرة أخرى.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) {
                this.props.onReset();
              } else {
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full transition-colors"
          >
            <RefreshCw size={20} />
            إعادة التحميل
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
