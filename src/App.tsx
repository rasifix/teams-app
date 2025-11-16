import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ApiErrorBoundary from './components/ApiErrorBoundary';
import AppInitializer from './components/AppInitializer';
import { ApiStatus } from './components/ApiStatus';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import MembersPage from './pages/MembersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import TrainerDetailPage from './pages/TrainerDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import TeamDetailPage from './pages/TeamDetailPage';
import TeamPlayerSelectionPage from './pages/TeamPlayerSelectionPage';
import StatisticsPage from './pages/StatisticsPage';
import PlayerStatisticsPage from './pages/PlayerStatisticsPage';
import EventAttendancePage from './pages/EventAttendancePage';
import ShirtSetsPage from './pages/ShirtSetsPage';

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
      <AuthProvider>
        <Router>
          <AppInitializer>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <ApiStatus />
              <ApiErrorBoundary>
                <main>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/" element={<HomePage />} />
                    
                    {/* Protected routes */}
                    {/* Members routes */}
                    <Route path="/members" element={<Navigate to="/members/players" replace />} />
                    <Route path="/members/players" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
                    <Route path="/members/trainers" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
                    {/* Player detail still needs its own route */}
                    <Route path="/players/:id" element={<ProtectedRoute><PlayerDetailPage /></ProtectedRoute>} />
                    {/* Trainer detail route */}
                    <Route path="/trainers/:id" element={<ProtectedRoute><TrainerDetailPage /></ProtectedRoute>} />
                    <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
                    <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
                    <Route path="/events/:eventId/teams/:teamId" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
                    <Route path="/events/:eventId/teams/:teamId/select-players" element={<ProtectedRoute><TeamPlayerSelectionPage /></ProtectedRoute>} />
                    <Route path="/shirts" element={<ProtectedRoute><ShirtSetsPage /></ProtectedRoute>} />
                    <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>}>
                      <Route path="player-statistics" element={<PlayerStatisticsPage />} />
                      <Route path="event-attendance" element={<EventAttendancePage />} />
                    </Route>
                  </Routes>
                </main>
              </ApiErrorBoundary>
            </div>
          </AppInitializer>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App
