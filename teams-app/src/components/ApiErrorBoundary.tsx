import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  isApiError: boolean;
}

class ApiErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isApiError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's an API-related error
    const isApiError = error.message.includes('API Error') || 
                      error.message.includes('Failed to fetch') ||
                      error.message.includes('Network Error');
    
    return { hasError: true, isApiError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error boundary caught an error:', error, errorInfo);
    
    // Log API errors specifically
    if (this.state.isApiError) {
      console.error('API connectivity issue detected:', error.message);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, isApiError: false });
  };

  public render() {
    if (this.state.hasError && this.state.isApiError) {
      return (
        <div className="min-h-96 flex items-center justify-center bg-yellow-50 py-8 px-4 sm:px-6 lg:px-8 rounded-lg border border-yellow-200">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 text-yellow-500">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Server Connection Issue
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Unable to connect to the server. Please check your internet connection or try again later.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      // For non-API errors, fall back to the main error boundary
      throw new Error('Non-API error caught by API boundary');
    }

    return this.props.children;
  }
}

export default ApiErrorBoundary;