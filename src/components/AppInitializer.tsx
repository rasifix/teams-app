import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSelectedGroupId } from '../utils/localStorage';
import { 
  useStore, 
  useAppInitialized, 
  useAppLoading, 
  useAppHasErrors, 
  useAppErrors
} from '../store/useStore';
import type { Group } from '../types';

interface AppInitializerProps {
  children: ReactNode;
}

function getNewestGroup(groups: Group[]): Group | null {
  if (groups.length === 0) {
    return null;
  }

  const withTimestamp = groups
    .map((group) => ({
      group,
      timestamp: Date.parse(group.createdAt ?? group.updatedAt ?? ''),
    }))
    .filter((item) => !Number.isNaN(item.timestamp));

  if (withTimestamp.length === 0) {
    return groups[groups.length - 1];
  }

  return withTimestamp.reduce((latest, current) => (
    current.timestamp > latest.timestamp ? current : latest
  )).group;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isInitialized = useAppInitialized();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  const { selectGroup, initializeApp, loadGroups } = useStore();
  
  // Use ref to prevent duplicate initialization
  const initTriggered = useRef(false);
  
  // Reset ref when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      initTriggered.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Load groups, resolve selection, and initialize app when authenticated
    if (isAuthenticated && !isInitialized && !isLoading && !initTriggered.current) {
      initTriggered.current = true;

      const initializeWithGroupSelection = async () => {
        await loadGroups();

        const groups = useStore.getState().groups;
        if (groups.length === 0) {
          return;
        }

        const savedGroupId = getSelectedGroupId();
        const savedGroupExists = !!savedGroupId && groups.some((group) => group.id === savedGroupId);

        let groupToSelect: Group;
        if (groups.length === 1) {
          groupToSelect = groups[0];
        } else if (savedGroupExists) {
          groupToSelect = groups.find((group) => group.id === savedGroupId)!;
        } else {
          groupToSelect = getNewestGroup(groups) ?? groups[0];
        }

        await selectGroup(groupToSelect.id);
        await initializeApp();
      };

      initializeWithGroupSelection().catch((error) => {
        console.error('Failed to initialize app with group selection:', error);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Application</h2>
          <p className="text-gray-600">Fetching players, events, trainers, and equipment...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Application</h2>
          <div className="text-left text-sm text-gray-600 mb-4">
            {errors.players && <p>• Players: {errors.players}</p>}
            {errors.events && <p>• Events: {errors.events}</p>}
            {errors.trainers && <p>• Trainers: {errors.trainers}</p>}
            {errors.shirtSets && <p>• Shirt Sets: {errors.shirtSets}</p>}
          </div>
          <button
            onClick={() => initializeApp()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}