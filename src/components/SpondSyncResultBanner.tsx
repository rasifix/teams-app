import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert } from './ui';

export interface SpondSyncResult {
  created: number;
  updated: number;
  linked: number;
}

interface SpondSyncNavigationState {
  spondSyncResult?: SpondSyncResult;
}

export default function SpondSyncResultBanner({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [result] = useState(
    () => (location.state as SpondSyncNavigationState | null)?.spondSyncResult,
  );

  useEffect(() => {
    if (result) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location.pathname, location.search, navigate, result]);

  if (!result) return null;

  return (
    <Alert tone="success" className={className}>
      {t('spondSync.result', {
        created: result.created,
        updated: result.updated,
        linked: result.linked,
      })}
    </Alert>
  );
}
