import { useTranslation } from 'react-i18next';
import { classNames } from './classNames';
import { EmptyState } from './Feedback';
import { Page } from './Page';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <svg
      className={classNames('ui-spinner', `ui-spinner--${size}`, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        opacity="0.25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        opacity="0.75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface LoadingStateProps {
  message?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({ message, description, size = 'md', className = '' }: LoadingStateProps) {
  const { t } = useTranslation();
  const resolvedMessage = message ?? t('common.states.loading');

  return (
    <div className={classNames('ui-loading-state', className)} role="status">
      <LoadingSpinner size={size} />
      <div className="ui-loading-state__copy">
        <p>{resolvedMessage}</p>
        {description && <p className="ui-loading-state__description">{description}</p>}
      </div>
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message }: PageLoadingProps) {
  return (
    <Page>
      <EmptyState>
        <LoadingState message={message} size="lg" />
      </EmptyState>
    </Page>
  );
}
