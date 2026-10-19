import { createBrowserRouter, Navigate, Route, RouterProvider, Routes } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ApiErrorBoundary from './components/ApiErrorBoundary';
import AppInitializer from './components/AppInitializer';
import { ApiStatus } from './components/ApiStatus';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import SelectedSquadRoute from './components/SelectedSquadRoute';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import MembersPage from './pages/MembersPage';
import MembersPlayersPage from './pages/MembersPlayersPage';
import MembersTrainersPage from './pages/MembersTrainersPage';
import MembersGuardiansPage from './pages/MembersGuardiansPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import TrainerDetailPage from './pages/TrainerDetailPage';
import EventsPage from './pages/EventsPage';
import SpondImportPage from './pages/SpondImportPage';
import EventDetailPage from './pages/EventDetailPage';
import TeamDetailPage from './pages/TeamDetailPage';
import TeamPlayerSelectionPage from './pages/TeamPlayerSelectionPage';
import TeamLineupPage from './pages/TeamLineupPage';
import StatisticsPage from './pages/StatisticsPage';
import PlayerStatisticsPage from './pages/PlayerStatisticsPage';
import EventParticipationPage from './pages/EventParticipationPage';
import TeamSelectionStatisticsPage from './pages/TeamSelectionStatisticsPage';
import ShirtSetsPage from './pages/ShirtSetsPage';
import SquadSettingsPage from './pages/SquadSettingsPage';
import SquadSelectionPage from './pages/SquadSelectionPage';

const UiKitPage = import.meta.env.DEV ? lazy(() => import('./pages/UiKitPage')) : null;

function AppRoutes() {
  return (
    <AppInitializer>
      <div className="app-shell">
        <Header />
        <ApiStatus />
        <ApiErrorBoundary>
          <main>
            <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/" element={<HomePage />} />
                    {UiKitPage && <Route path="/ui-kit" element={<Suspense fallback={null}><UiKitPage /></Suspense>} />}
                    
                    {/* Protected routes */}
                    <Route path="/squads" element={<ProtectedRoute><SquadSelectionPage /></ProtectedRoute>} />
                    <Route path="/groups" element={<Navigate to="/squads" replace />} />
                    <Route element={<ProtectedRoute><SelectedSquadRoute /></ProtectedRoute>}>
                      {/* Members routes */}
                      <Route path="/members" element={<MembersPage />}>
                        <Route index element={<Navigate to="players" replace />} />
                        <Route path="players" element={<MembersPlayersPage />} />
                        <Route path="trainers" element={<MembersTrainersPage />} />
                        <Route path="guardians" element={<MembersGuardiansPage />} />
                      </Route>
                      {/* Player detail still needs its own route */}
                      <Route path="/players/:id" element={<PlayerDetailPage />} />
                      {/* Trainer detail route */}
                      <Route path="/trainers/:id" element={<TrainerDetailPage />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route path="/spond-import" element={<SpondImportPage />} />
                      <Route path="/events/:id" element={<EventDetailPage />} />
                      <Route path="/events/:eventId/teams/:teamId" element={<TeamDetailPage />} />
                      <Route path="/events/:eventId/teams/:teamId/select-players" element={<TeamPlayerSelectionPage />} />
                      <Route path="/events/:eventId/teams/:teamId/lineup" element={<TeamLineupPage />} />
                      <Route path="/events/:eventId/teams/:teamId/lineup/:lineupTab" element={<TeamLineupPage />} />
                      <Route path="/shirts" element={<ShirtSetsPage />} />
                      <Route path="/squad-settings" element={<SquadSettingsPage />} />
                      <Route path="/match-planning" element={<Navigate to="/squad-settings" replace />} />
                      <Route path="/statistics" element={<StatisticsPage />}>
                        <Route path="player-statistics" element={<PlayerStatisticsPage />} />
                        <Route path="event-participation" element={<EventParticipationPage />} />
                        <Route path="team-selections" element={<TeamSelectionStatisticsPage />} />
                      </Route>
                    </Route>
            </Routes>
          </main>
        </ApiErrorBoundary>
      </div>
    </AppInitializer>
  );
}

const router = createBrowserRouter([
  { path: '*', element: <AppRoutes /> },
]);

function App() {
  // API health check on startup
  useEffect(() => {
    // Add API health check instead of migrations
    fetch('/health')
      .then(response => {
        if (!response.ok) {
          console.warn('API not available, some features may not work');
        }
      })
      .catch(error => {
        console.warn('API connection failed:', error);
      });
  }, []);

  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  );
}

export default App
