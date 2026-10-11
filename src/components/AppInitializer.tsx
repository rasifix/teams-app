import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getSelectedSquadId } from '../utils/localStorage';
import { 
  useStore, 
  useAppInitialized, 
  useAppLoading, 
  useAppHasErrors, 
  useAppErrors
} from '../store/useStore';
import type { Squad } from '../types';

interface AppInitializerProps {
  children: ReactNode;
}

function getNewestSquad(squads: Squad[]): Squad | null {
  if (squads.length === 0) {
    return null;
  }

  const withTimestamp = squads
    .map((squad) => ({
      squad,
      timestamp: Date.parse(squad.createdAt ?? squad.updatedAt ?? ''),
    }))
    .filter((item) => !Number.isNaN(item.timestamp));

  if (withTimestamp.length === 0) {
    return squads[squads.length - 1];
  }

  return withTimestamp.reduce((latest, current) => (
    current.timestamp > latest.timestamp ? current : latest
  )).squad;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isInitialized = useAppInitialized();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  const { selectSquad, initializeApp, loadSquads, loadSfvCatalog } = useStore();
  
  // Use ref to prevent duplicate initialization
  const initTriggered = useRef(false);
  
  // Reset ref when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      initTriggered.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Load squads, resolve selection, and initialize app when authenticated
    if (isAuthenticated && !isInitialized && !isLoading && !initTriggered.current) {
      initTriggered.current = true;

      const initializeWithSquadSelection = async () => {
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
          squadToSelect = getNewestSquad(squads) ?? squads[0];
        }

        await selectSquad(squadToSelect.id);
        await initializeApp();
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.states.loading')}</h2>
        </div>
      </div>
    );
  }

  // If not authenticated, just show the children (which will redirect to login via ProtectedRoute)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('appInitializer.loadingApplication')}</h2>
          <p className="text-gray-600">{t('appInitializer.fetchingData')}</p>
        </div>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('appInitializer.failedToLoadApplication')}</h2>
          <div className="text-left text-sm text-gray-600 mb-4">
            {errors.players && <p>• {t('domain.players')}: {errors.players}</p>}
            {errors.activities && <p>• {t('domain.events')}: {errors.activities}</p>}
            {errors.trainers && <p>• {t('domain.trainers')}: {errors.trainers}</p>}
            {errors.shirtSets && <p>• {t('domain.shirtSets')}: {errors.shirtSets}</p>}
          </div>
          <button
            onClick={() => initializeApp()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {t('common.actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}