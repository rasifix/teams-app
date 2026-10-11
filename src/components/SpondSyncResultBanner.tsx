import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
    <div className={`rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800 ${className}`} role="status">
      {t('spondSync.result', {
        created: result.created,
        updated: result.updated,
        linked: result.linked,
      })}
    </div>
  );
}
