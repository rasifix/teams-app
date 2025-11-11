import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ApiErrorBoundary from './components/ApiErrorBoundary';
import AppInitializer from './components/AppInitializer';
import { ApiStatus } from './components/ApiStatus';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import TrainersPage from './pages/TrainersPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
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
      <AppInitializer>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <ApiStatus />
            <ApiErrorBoundary>
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/players" element={<PlayersPage />} />
                  <Route path="/players/:id" element={<PlayerDetailPage />} />
                  <Route path="/trainers" element={<TrainersPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route path="/shirts" element={<ShirtSetsPage />} />
                  <Route path="/statistics" element={<StatisticsPage />}>
                    <Route path="player-statistics" element={<PlayerStatisticsPage />} />
                    <Route path="event-attendance" element={<EventAttendancePage />} />
                  </Route>
                </Routes>
              </main>
            </ApiErrorBoundary>
          </div>
        </Router>
      </AppInitializer>
    </ErrorBoundary>
  );
}

export default App
