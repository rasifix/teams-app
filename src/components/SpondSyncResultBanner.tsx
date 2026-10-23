import { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const [result] = useState(
    () => (location.state as SpondSyncNavigationState | null)?.spondSyncResult,
  );

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
