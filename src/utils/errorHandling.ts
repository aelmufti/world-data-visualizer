/**
 * Error handling utilities for the stock market feature
 * Provides user-friendly error messages, logging, and error boundaries
 */

import React from 'react';

/**
 * Error types for categorizing different error scenarios
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  UNKNOWN = 'UNKNOWN'
}

/**
 * User-friendly error messages for common scenarios
 */
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Unable to connect to market data service. Please check your internet connection.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Service will resume shortly.',
  [ErrorType.NOT_FOUND]: 'Stock symbol not found. Please try a different search.',
  [ErrorType.INVALID_DATA]: 'Invalid data received. Please try again.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Error context for logging
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  symbol?: string;
  metadata?: Record<string, any>;
}

/**
 * Log error with context and timestamp
 */
export function logError(
  error: Error | string,
  context: ErrorContext = {}
): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;
  
  // Only log in development mode, and reduce noise for connection errors
  if (import.meta.env.DEV) {
    // Don't spam console with WebSocket connection errors
    if (errorMessage.includes('WebSocket') || errorMessage.includes('Unable to connect')) {
      // Only log once per minute for connection errors
      const key = `${context.component}-${errorMessage}`;
      const lastLog = (window as any).__lastErrorLog?.[key];
      const now = Date.now();
      
      if (!lastLog || now - lastLog > 60000) {
        console.warn('[Connection Error]', {
          message: errorMessage,
          component: context.component,
          timestamp: new Date().toISOString()
        });
        
        if (!(window as any).__lastErrorLog) {
          (window as any).__lastErrorLog = {};
        }
        (window as any).__lastErrorLog[key] = now;
      }
      return;
    }
    
    console.error('[StockMarketTab Error]', {
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }
  
  // In production, this could send to an error tracking service
  if (import.meta.env.PROD) {
    // Example: sendToErrorTracking(error, context)
  }
}

/**
 * Convert an error to a user-friendly message
 */
export function getErrorMessage(
  error: Error | string,
  defaultType: ErrorType = ErrorType.UNKNOWN
): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();
  
  // Check for specific error patterns
  if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('network')) {
    return ERROR_MESSAGES[ErrorType.NETWORK];
  }
  
  if (lowerMessage.includes('429') || lowerMessage.includes('rate limit')) {
    return ERROR_MESSAGES[ErrorType.RATE_LIMIT];
  }
  
  if (lowerMessage.includes('404') || lowerMessage.includes('not found')) {
    return ERROR_MESSAGES[ErrorType.NOT_FOUND];
  }
  
  if (lowerMessage.includes('invalid') || lowerMessage.includes('malformed')) {
    return ERROR_MESSAGES[ErrorType.INVALID_DATA];
  }
  
  return ERROR_MESSAGES[defaultType];
}

/**
 * Extract retry-after time from rate limit error
 */
export function getRetryAfterTime(error: Error | Response): number | null {
  if (error instanceof Response) {
    const retryAfter = error.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return isNaN(seconds) ? null : seconds;
    }
  }
  
  return null;
}

/**
 * Format retry-after time as human-readable string
 */
export function formatRetryAfterTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Error boundary component props
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for catching React component errors
 * Isolates errors to prevent cascading failures
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error
    logError(error, {
      component: this.props.componentName || 'Unknown',
      action: 'componentDidCatch',
      metadata: {
        componentStack: errorInfo.componentStack
      }
    });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return React.createElement('div', {
        style: {
          padding: '20px',
          backgroundColor: '#1a1a1a',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          color: '#ff4444',
          textAlign: 'center' as const
        }
      }, [
        React.createElement('h3', { key: 'title' }, 'Something went wrong'),
        React.createElement('p', { key: 'message', style: { color: '#999' } }, 
          getErrorMessage(this.state.error || 'Unknown error')
        ),
        React.createElement('button', {
          key: 'retry',
          onClick: () => this.setState({ hasError: false, error: null }),
          style: {
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: 'pointer'
          }
        }, 'Try Again')
      ]);
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  return (props: P) => {
    return React.createElement(
      ErrorBoundary,
      { 
        componentName: componentName || Component.displayName || Component.name,
        children: React.createElement(Component, props)
      }
    );
  };
}
