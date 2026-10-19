import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Cluster, FloatingStatus, LoadingSpinner } from './ui';

interface ApiStatusProps {
  className?: string;
}

export function ApiStatus({ className = '' }: ApiStatusProps) {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkApiHealth = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/health', {
        method: 'GET',
        timeout: 5000, // 5 second timeout
      } as RequestInit);
      setIsOnline(response.ok);
    } catch (error) {
      console.warn('API health check failed:', error);
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
    
    // Check API health every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isOnline && !isChecking) {
    return null; // Don't show anything when API is working
  }

  return (
    <FloatingStatus className={className}>
      {isChecking ? (
        <Alert tone="warning">
          <Cluster gap="sm" wrap={false}>
            <LoadingSpinner size="sm" />
            <span>{t('common.states.checkingConnection')}</span>
          </Cluster>
        </Alert>
      ) : (
        <Alert>
          <Cluster gap="sm" wrap={false}>
            <span className="dot" aria-hidden="true" />
            <span>{t('common.states.serverDisconnected')}</span>
            <Button
              type="button"
              variant="dangerGhost"
              size="sm"
              onClick={checkApiHealth}
            >
              {t('common.actions.retry')}
            </Button>
          </Cluster>
        </Alert>
      )}
    </FloatingStatus>
  );
}
