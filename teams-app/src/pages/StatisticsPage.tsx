import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getPlayers, getEvents } from '../utils/localStorage';
import type { Player } from '../types';
import { SummaryCard, SummaryCardContent } from '../components/ui';

interface PlayerStats {
  player: Player;
  invitedCount: number;
  acceptedCount: number;
  selectedCount: number;
  acceptanceRate: number;
  selectionRate: number;
}

export default function StatisticsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const players = getPlayers();
    const events = getEvents();

    const stats: PlayerStats[] = players.map(player => {
      // Count invitations
      const invitedCount = events.filter(event =>
        event.invitations.some(inv => inv.playerId === player.id)
      ).length;

      // Count accepted invitations
      const acceptedCount = events.filter(event =>
        event.invitations.some(inv => inv.playerId === player.id && inv.status === 'accepted')
      ).length;

      // Count selections (player assigned to a team)
      const selectedCount = events.filter(event =>
        event.teams.some(team => (team.selectedPlayers || []).includes(player.id))
      ).length;

      const acceptanceRate = invitedCount > 0 ? (acceptedCount / invitedCount) * 100 : 0;
      const selectionRate = acceptedCount > 0 ? (selectedCount / acceptedCount) * 100 : 0;

      return {
        player,
        invitedCount,
        acceptedCount,
        selectedCount,
        acceptanceRate,
        selectionRate,
      };
    });

    // Sort by last name, then first name
    stats.sort((a, b) => {
      const lastNameCompare = a.player.lastName.toLowerCase().localeCompare(b.player.lastName.toLowerCase());
      if (lastNameCompare !== 0) {
        return lastNameCompare;
      }
      return a.player.firstName.toLowerCase().localeCompare(b.player.firstName.toLowerCase());
    });

    setPlayerStats(stats);
  }, []);

  // Redirect to player-statistics if on base /statistics route
  useEffect(() => {
    if (location.pathname === '/statistics') {
      navigate('/statistics/player-statistics', { replace: true });
    }
  }, [location.pathname, navigate]);

  const totalPlayers = playerStats.length;
  const totalEvents = getEvents().length;
  const avgAcceptances = totalPlayers > 0
    ? playerStats.reduce((sum, stat) => sum + stat.acceptedCount, 0) / totalPlayers
    : 0;
  const avgSelections = totalPlayers > 0
    ? playerStats.reduce((sum, stat) => sum + stat.selectedCount, 0) / totalPlayers
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Statistics</h1>
        <p className="page-subtitle">
          View player attendance and selection fairness metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard>
          <SummaryCardContent label="Total Players" value={totalPlayers} />
        </SummaryCard>
        
        <SummaryCard>
          <SummaryCardContent label="Total Events" value={totalEvents} />
        </SummaryCard>
        
        <SummaryCard>
          <SummaryCardContent label="Avg Acceptances per Player" value={avgAcceptances.toFixed(1)} />
        </SummaryCard>
        
        <SummaryCard>
          <SummaryCardContent label="Avg Selections per Player" value={avgSelections.toFixed(1)} />
        </SummaryCard>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8" aria-label="Tabs">
          <NavLink
            to="/statistics/player-statistics"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Player Statistics
          </NavLink>
          <NavLink
            to="/statistics/event-attendance"
            className={({ isActive }) => `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Event Attendance
          </NavLink>
        </nav>
      </div>

      {/* Nested Route Content */}
      <Outlet />
    </div>
  );
}