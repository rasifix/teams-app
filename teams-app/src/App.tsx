import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import StatisticsPage from './pages/StatisticsPage';
import PlayerStatisticsPage from './pages/PlayerStatisticsPage';
import EventAttendancePage from './pages/EventAttendancePage';
import ShirtSetsPage from './pages/ShirtSetsPage';
import { migrateScoreToLevel, migrateMaxPlayersToEvent } from './utils/migrations';

function App() {
  useEffect(() => {
    // Run migrations on app startup
    migrateScoreToLevel();
    migrateMaxPlayersToEvent();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/players/:id" element={<PlayerDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/shirt-sets" element={<ShirtSetsPage />} />
            <Route path="/statistics" element={<StatisticsPage />}>
              <Route path="player-statistics" element={<PlayerStatisticsPage />} />
              <Route path="event-attendance" element={<EventAttendancePage />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App
