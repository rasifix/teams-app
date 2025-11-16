import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  useStore, 
  useAppInitialized, 
  useAppLoading, 
  useAppHasErrors, 
  useAppErrors,
  useGroup,
  useGroups,
  useGroupsLoading,
  useGroupsError
} from '../store/useStore';
import { getSelectedGroupId } from '../utils/localStorage';

interface AppInitializerProps {
  children: ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isInitialized = useAppInitialized();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  const currentGroup = useGroup();
  const groups = useGroups();
  const groupsLoading = useGroupsLoading();
  const groupsError = useGroupsError();
  const { loadGroups, selectGroup, initializeApp } = useStore();
  
  // Use refs to prevent duplicate calls
  const groupsLoadTriggered = useRef(false);
  const groupSelectTriggered = useRef(false);
  const appInitTriggered = useRef(false);
  
  // Reset refs when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      groupsLoadTriggered.current = false;
      groupSelectTriggered.current = false;
      appInitTriggered.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Only load groups when user is authenticated
    if (isAuthenticated && !groupsLoading && groups.length === 0 && !groupsError && !groupsLoadTriggered.current) {
      groupsLoadTriggered.current = true;
      loadGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, groupsLoading, groups.length, groupsError]);

  useEffect(() => {
    // Handle group selection logic after groups are loaded
    if (isAuthenticated && !groupsLoading && groups.length > 0) {
      if (!currentGroup && !groupSelectTriggered.current) {
        // Check if there's a previously selected group in localStorage
        const savedGroupId = getSelectedGroupId();
        const savedGroup = savedGroupId ? groups.find(g => g.id === savedGroupId) : null;
        
        if (savedGroup) {
          // Restore the previously selected group
          groupSelectTriggered.current = true;
          selectGroup(savedGroup.id);
        } else if (groups.length === 1) {
          // Auto-select the single group
          groupSelectTriggered.current = true;
          selectGroup(groups[0].id);
        } else if (groups.length > 1 && location.pathname !== '/groups') {
          // Navigate to group selection if multiple groups and not already there
          navigate('/groups');
          return;
        }
      } else if (currentGroup && !isInitialized && !isLoading && !appInitTriggered.current) {
        // Group is selected, load the data
        appInitTriggered.current = true;
        initializeApp();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, groupsLoading, groups.length, currentGroup, isInitialized, isLoading, location.pathname]);

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

  // Show groups loading
  if (groupsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Groups...</h2>
        </div>
      </div>
    );
  }

  // Show groups error
  if (groupsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Groups</h2>
          <p className="text-gray-600 mb-4">{groupsError}</p>
          <button
            onClick={() => loadGroups()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If on group selection page, show it
  if (location.pathname === '/groups') {
    return <>{children}</>;
  }

  // If no group selected yet, don't show app content
  if (!currentGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing...</h2>
        </div>
      </div>
    );
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