import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { AppError, handleError } from '../services/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Report to error service
    try {
      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // This would be replaced with actual error reporting service
        console.log('Would send to error tracking service in production');
        // Example: Sentry.captureException(error, { extra: { errorInfo } });
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const appError = handleError(this.state.error);
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-300 mb-6">
              {appError.getUserMessage()}
              {process.env.NODE_ENV === 'development' && 
                <span className="block mt-2 text-xs text-gray-400">
                  Error ID: {Date.now().toString(36)}
                </span>
              }
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 w-full"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 w-full"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home Page</span>
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
              >
                Try to recover without reloading
              </button>
            </div>
            
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-6 p-4 bg-red-500/10 rounded-lg text-left">
                <p className="text-red-300 text-xs font-mono overflow-auto max-h-40">
                  {this.state.error?.stack}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}