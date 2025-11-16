import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  useStore, 
  useAppInitialized, 
  useAppLoading, 
  useAppHasErrors, 
  useAppErrors
} from '../store/useStore';

interface AppInitializerProps {
  children: ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isInitialized = useAppInitialized();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  const { selectGroup, initializeApp } = useStore();
  
  // Use ref to prevent duplicate initialization
  const initTriggered = useRef(false);
  
  // Reset ref when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      initTriggered.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Auto-select group "1" and initialize app when authenticated
    if (isAuthenticated && !isInitialized && !isLoading && !initTriggered.current) {
      initTriggered.current = true;
      // Select the default group "1"
      selectGroup("1").then(() => {
        initializeApp();
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