import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import i18n from '../i18n/config';
import { Button, PageState, PageStateContent, StateActions, StateDescription, StateIcon, StateTitle } from './ui';

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
        <PageState>
          <PageStateContent>
              <StateIcon tone="warning">
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
              </StateIcon>
              <StateTitle>
                {i18n.t('common.states.serverDisconnected')}
              </StateTitle>
              <StateDescription>
                {i18n.t('errorBoundary.message')}
              </StateDescription>
            <StateActions>
              <Button
                type="button"
                onClick={this.handleRetry}
                width="full"
              >
                {i18n.t('common.actions.retry')}
              </Button>
            </StateActions>
          </PageStateContent>
        </PageState>
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
