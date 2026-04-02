import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { usePlayers } from '../hooks/usePlayers';
import type { Player } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, SummaryCard, SummaryCardContent } from '../components/ui';
import { clearStatisticsPeriod, getStatisticsPeriod, setStatisticsPeriod } from '../utils/localStorage';
import { filterEventsByStatisticsPeriod, getStatisticsPeriodLabel, isValidStatisticsPeriod } from '../utils/statisticsPeriod';

interface PlayerStats {
  player: Player;
  invitedCount: number;
  acceptedCount: number;
  selectedCount: number;
  acceptanceRate: number;
  selectionRate: number;
}

export default function StatisticsPage() {
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [statisticsPeriod, setStatisticsPeriodState] = useState(() => {
    const stored = getStatisticsPeriod();
    return isValidStatisticsPeriod(stored) ? stored : null;
  });
  const location = useLocation();
  const navigate = useNavigate();
  
  const { events } = useEvents();
  const { players } = usePlayers();
  const filteredEvents = useMemo(
    () => filterEventsByStatisticsPeriod(events, statisticsPeriod),
    [events, statisticsPeriod]
  );

  const playerStats = useMemo(() => {
    const stats: PlayerStats[] = players.map(player => {
      // Count invitations
      const invitedCount = filteredEvents.filter(event =>
        event.invitations.some(inv => inv.playerId === player.id)
      ).length;

      // Count accepted invitations
      const acceptedCount = filteredEvents.filter(event =>
        event.invitations.some(inv => inv.playerId === player.id && inv.status === 'accepted')
      ).length;

      // Count selections (player assigned to a team)
      const selectedCount = filteredEvents.filter(event =>
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

    return stats;
  }, [players, filteredEvents]);

  // Redirect to player-statistics if on base /statistics route
  useEffect(() => {
    if (location.pathname === '/statistics') {
      navigate('/statistics/player-statistics', { replace: true });
    }
  }, [location.pathname, navigate]);

  const totalPlayers = playerStats.length;
  const totalEvents = filteredEvents.length;
  const avgAcceptances = totalPlayers > 0
    ? playerStats.reduce((sum, stat) => sum + stat.acceptedCount, 0) / totalPlayers
    : 0;
  const avgSelections = totalPlayers > 0
    ? playerStats.reduce((sum, stat) => sum + stat.selectedCount, 0) / totalPlayers
    : 0;

  const periodLabel = getStatisticsPeriodLabel(statisticsPeriod);

  const openPeriodModal = () => {
    setStartDateInput(statisticsPeriod?.startDate || '');
    setEndDateInput(statisticsPeriod?.endDate || '');
    setPeriodError(null);
    setIsPeriodModalOpen(true);
  };

  const handleSavePeriod = () => {
    if (!startDateInput && !endDateInput) {
      clearStatisticsPeriod();
      setStatisticsPeriodState(null);
      setPeriodError(null);
      setIsPeriodModalOpen(false);
      return;
    }

    if (!startDateInput || !endDateInput) {
      setPeriodError('Please set both start and end date, or clear both.');
      return;
    }

    if (startDateInput > endDateInput) {
      setPeriodError('Start date must be before or equal to end date.');
      return;
    }

    const nextPeriod = { startDate: startDateInput, endDate: endDateInput };
    setStatisticsPeriod(nextPeriod);
    setStatisticsPeriodState(nextPeriod);
    setPeriodError(null);
    setIsPeriodModalOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="page-title">Statistics</h1>
          <button
            onClick={openPeriodModal}
            className="btn-secondary btn-sm"
          >
            Period: {periodLabel}
          </button>
        </div>
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
      <Outlet context={{ filteredEvents, statisticsPeriod }} />

      <Modal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Statistics Period</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">
            Only events in this period will be used for all statistics. Leave both dates empty to include all events.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="stats-period-start" className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                id="stats-period-start"
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="stats-period-end" className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                id="stats-period-end"
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            {periodError && (
              <p className="text-sm text-red-600">{periodError}</p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <button onClick={() => setIsPeriodModalOpen(false)} className="btn-secondary">Cancel</button>
          <button
            onClick={() => {
              setStartDateInput('');
              setEndDateInput('');
              setPeriodError(null);
            }}
            className="btn-secondary"
          >
            Clear
          </button>
          <button onClick={handleSavePeriod} className="btn-primary">Apply</button>
        </ModalFooter>
      </Modal>
    </div>
  );
}