import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { withTranslation } from 'react-i18next';
import type { WithTranslation } from 'react-i18next';
import { Button, PageState, PageStateContent, StateActions, StateDescription, StateDetails, StateDetailsContent, StateDetailsSummary, StateIcon, StateTitle } from './ui';

interface Props extends WithTranslation {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Here you could log the error to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    const { t } = this.props;

    if (this.state.hasError) {
      // Custom fallback UI or use the provided fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <PageState>
          <PageStateContent>
              <StateIcon>
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </StateIcon>
              <StateTitle>
                {t('errorBoundary.title')}
              </StateTitle>
              <StateDescription>
                {t('errorBoundary.message')}
              </StateDescription>
              {this.state.error && (
                <StateDetails>
                  <StateDetailsSummary>
                    {t('errorBoundary.showDetails')}
                  </StateDetailsSummary>
                  <StateDetailsContent>
                    {this.state.error.message}
                  </StateDetailsContent>
                </StateDetails>
              )}
            <StateActions>
              <Button
                onClick={this.handleRetry}
                width="full"
              >
                {t('common.actions.retry')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                width="full"
              >
                {t('errorBoundary.reloadPage')}
              </Button>
            </StateActions>
          </PageStateContent>
        </PageState>
      );
    }

    return this.props.children;
  }
}

const TranslatedErrorBoundary = withTranslation()(ErrorBoundary);

export default TranslatedErrorBoundary;
