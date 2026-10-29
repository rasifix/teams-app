import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getSelectedSquadId } from '../utils/localStorage';
import { 
  useStore, 
  useAppInitialized, 
  useAppLoading, 
  useAppHasErrors, 
  useAppErrors,
  useSquad,
} from '../store/useStore';
import type { Squad } from '../types';
import { Alert, Button, LoadingState, PageState, PageStateContent, Stack } from './ui';
import { selectInitializationErrors, selectNewestSquad } from '../store/selectors/squadSelectors';

interface AppInitializerProps {
  children: ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isInitialized = useAppInitialized();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  const squad = useSquad();
  const { selectSquad, initializeApp, loadSquads, loadSfvCatalog } = useStore();
  const [hasResolvedInitialSquad, setHasResolvedInitialSquad] = useState(false);
  
  // Use ref to prevent duplicate initialization
  const initTriggered = useRef(false);
  
  // Reset ref when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      initTriggered.current = false;
      setHasResolvedInitialSquad(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Load squads, resolve selection, and initialize app when authenticated
    if (isAuthenticated && !isInitialized && !isLoading && !initTriggered.current) {
      initTriggered.current = true;

      const initializeWithSquadSelection = async () => {
        try {
          await Promise.all([loadSquads(), loadSfvCatalog()]);

          const squads = useStore.getState().squads;
          if (squads.length === 0) {
            return;
          }

          const savedSquadId = getSelectedSquadId();
          const savedSquadExists = !!savedSquadId && squads.some((squad) => squad.id === savedSquadId);

          let squadToSelect: Squad;
          if (squads.length === 1) {
            squadToSelect = squads[0];
          } else if (savedSquadExists) {
            squadToSelect = squads.find((squad) => squad.id === savedSquadId)!;
          } else {
            squadToSelect = selectNewestSquad(squads) ?? squads[0];
          }

          await selectSquad(squadToSelect.id);
          await initializeApp();
        } finally {
          setHasResolvedInitialSquad(true);
        }
      };

      initializeWithSquadSelection().catch((error) => {
        console.error('Failed to initialize app with squad selection:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitialized, isLoading]);

  // Wait for auth to initialize before doing anything
  if (authLoading) {
    return (
      <div className="auth-shell">
        <LoadingState message={t('common.states.loading')} size="lg" />
      </div>
    );
  }

  // If not authenticated, just show the children (which will redirect to login via ProtectedRoute)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Do not let squad-scoped route guards redirect while restoring a saved squad.
  if (!squad && !hasResolvedInitialSquad) {
    return (
      <div className="auth-shell">
        <LoadingState message={t('page.squads.loading')} size="lg" />
      </div>
    );
  }

  if (isLoading && !isInitialized) {
    return (
      <div className="auth-shell">
        <LoadingState
          message={t('appInitializer.loadingApplication')}
          description={t('appInitializer.fetchingData')}
          size="lg"
        />
      </div>
    );
  }

  if (hasErrors) {
    const initializationErrors = selectInitializationErrors(errors);
    return (
      <PageState>
        <PageStateContent>
          <Stack>
          <Alert>
            <strong>{t('appInitializer.failedToLoadApplication')}</strong>
            <div className="initialization-error-list">
              {initializationErrors.map(({ domain, message }) => (
                <p key={domain}>• {t(`domain.${domain === 'activities' ? 'events' : domain}`)}: {message}</p>
              ))}
            </div>
          </Alert>
          <Button onClick={() => initializeApp()}>
            {t('common.actions.retry')}
          </Button>
          </Stack>
        </PageStateContent>
      </PageState>
    );
  }

  return <>{children}</>;
}
