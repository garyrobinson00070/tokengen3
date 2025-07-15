// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  WALLET = 'WALLET',
  CONTRACT = 'CONTRACT',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// Error class
export class AppError extends Error {
  type: ErrorType;
  details?: any;
  code?: string;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, details?: any, code?: string) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.code = code;
    
    // Log error to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${type}] ${message}`, details || '');
    }
  }
  
  // Get user-friendly message
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'Network connection error. Please check your internet connection and try again.';
      case ErrorType.WALLET:
        return 'Wallet connection error. Please make sure your wallet is unlocked and try again.';
      case ErrorType.CONTRACT:
        return 'Smart contract error. The transaction could not be completed.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication error. Please reconnect your wallet.';
      case ErrorType.VALIDATION:
        return this.message; // Use the original message for validation errors
      case ErrorType.DATABASE:
        return 'Database error. Please try again later.';
      case ErrorType.SERVER:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
  
  // Get error details for logging
  getLogDetails(): object {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      code: this.code,
      stack: this.stack
    };
  }
}

// Global error handler
export const handleError = (error: any): AppError => {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // Network errors
  if (
    error.message?.includes('network') || 
    error.message?.includes('connection') ||
    error.code === 'NETWORK_ERROR' ||
    error.name === 'FetchError'
  ) {
    return new AppError(error.message, ErrorType.NETWORK, error);
  }
  
  // Wallet errors
  if (
    error.message?.includes('wallet') || 
    error.message?.includes('MetaMask') ||
    error.code === 4001 || // User rejected request
    error.code === -32603 || // Internal JSON-RPC error
    error.message?.includes('user rejected')
  ) {
    return new AppError(error.message, ErrorType.WALLET, error);
  }
  
  // Contract errors
  if (
    error.message?.includes('contract') ||
    error.message?.includes('transaction') ||
    error.message?.includes('gas') ||
    error.message?.includes('execution reverted')
  ) {
    return new AppError(error.message, ErrorType.CONTRACT, error);
  }
  
  // Authentication errors
  if (
    error.message?.includes('auth') ||
    error.message?.includes('token') ||
    error.message?.includes('signature') ||
    error.status === 401 ||
    error.status === 403
  ) {
    return new AppError(error.message, ErrorType.AUTHENTICATION, error);
  }
  
  // Validation errors
  if (
    error.message?.includes('validation') ||
    error.message?.includes('invalid') ||
    error.message?.includes('required') ||
    error.status === 400
  ) {
    return new AppError(error.message, ErrorType.VALIDATION, error);
  }
  
  // Database errors
  if (
    error.message?.includes('database') ||
    error.message?.includes('sql') ||
    error.message?.includes('query') ||
    error.code?.startsWith('ER_')
  ) {
    return new AppError('Database operation failed', ErrorType.DATABASE, error);
  }
  
  // Server errors
  if (error.status >= 500 || error.message?.includes('server')) {
    return new AppError('Server error occurred', ErrorType.SERVER, error);
  }
  
  // Default to unknown error
  return new AppError(
    error.message || 'An unexpected error occurred',
    ErrorType.UNKNOWN,
    error
  );
};

// Error reporting service
export const reportError = (error: AppError | Error, context?: any) => {
  // In production, this would send to a logging service like Sentry
  const errorDetails = error instanceof AppError 
    ? error.getLogDetails() 
    : { message: error.message, stack: error.stack };
  
  console.error('Error report:', { error: errorDetails, context });
  
  // Here you would send to your error tracking service
  // Example: Sentry.captureException(error, { extra: { context } });
};

// React error boundary component
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Report to error service
    reportError(error, { errorInfo });
  }
  
  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      const appError = handleError(this.state.error);
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-300 mb-6">
              {appError.getUserMessage()}
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