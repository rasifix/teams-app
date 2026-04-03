import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { usePlayers } from '../hooks/usePlayers';
import type { Period, Player } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, SummaryCard, SummaryCardContent } from '../components/ui';
import ConfirmDialog from '../components/ConfirmDialog';
import { useGroup, useGroupPeriods, useSelectedStatisticsPeriod, useStore } from '../store';
import { filterEventsByStatisticsPeriod, getStatisticsPeriodLabel } from '../utils/statisticsPeriod';

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
  const [periodNameInput, setPeriodNameInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<Period | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { events } = useEvents();
  const { players } = usePlayers();
  const group = useGroup();
  const periods = useGroupPeriods();
  const statisticsPeriod = useSelectedStatisticsPeriod();
  const { selectStatisticsPeriod, addGroupPeriod, updateGroupPeriod, deleteGroupPeriod } = useStore();
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

  const resetPeriodForm = () => {
    setEditingPeriodId(null);
    setPeriodNameInput('');
    setStartDateInput('');
    setEndDateInput('');
    setPeriodError(null);
  };

  const openPeriodModal = () => {
    resetPeriodForm();
    setIsPeriodModalOpen(true);
  };

  const handleEditPeriod = (period: Period) => {
    setEditingPeriodId(period.id);
    setPeriodNameInput(period.name);
    setStartDateInput(period.startDate);
    setEndDateInput(period.endDate);
    setPeriodError(null);
  };

  const handleSavePeriod = async () => {
    if (!periodNameInput.trim()) {
      setPeriodError('Please provide a name for the period.');
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

    setIsSavingPeriod(true);

    const nextPeriod = {
      name: periodNameInput.trim(),
      startDate: startDateInput,
      endDate: endDateInput,
    };

    const wasSaved = editingPeriodId
      ? await updateGroupPeriod(editingPeriodId, nextPeriod)
      : await addGroupPeriod(nextPeriod);

    setIsSavingPeriod(false);

    if (!wasSaved) {
      setPeriodError('Failed to save period. Please try again.');
      return;
    }

    resetPeriodForm();
  };

  const handleDeletePeriod = async () => {
    if (!deletingPeriod) return;

    const wasDeleted = await deleteGroupPeriod(deletingPeriod.id);
    if (!wasDeleted) {
      setPeriodError('Failed to delete period. Please try again.');
      return;
    }

    if (editingPeriodId === deletingPeriod.id) {
      resetPeriodForm();
    }

    setDeletingPeriod(null);
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
          <ModalTitle>Statistics Periods</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">
            Select the active period for this group, or manage the list of group periods below.
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Active period</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => selectStatisticsPeriod(null)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    statisticsPeriod === null
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">All events</div>
                  <div className="text-xs text-gray-500">Use every event in the group.</div>
                </button>

                {periods.map((period) => (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => selectStatisticsPeriod(period.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      statisticsPeriod?.id === period.id
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{period.name}</div>
                    <div className="text-xs text-gray-500">{period.startDate} to {period.endDate}</div>
                  </button>
                ))}

                {periods.length === 0 && (
                  <p className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500">
                    No group periods yet.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-gray-900">Manage periods for {group?.name ?? 'this group'}</h3>
                <button
                  type="button"
                  onClick={resetPeriodForm}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  New period
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {periods.map((period) => (
                  <div
                    key={period.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-gray-200 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{period.name}</p>
                      <p className="text-xs text-gray-500">{period.startDate} to {period.endDate}</p>
                    </div>
                    <div className="flex shrink-0 gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleEditPeriod(period)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPeriod(period)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div>
                  <label htmlFor="stats-period-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    id="stats-period-name"
                    type="text"
                    value={periodNameInput}
                    onChange={(e) => setPeriodNameInput(e.target.value)}
                    placeholder="Spring 2026"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

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
              </div>

            </div>
            {periodError && (
              <p className="text-sm text-red-600">{periodError}</p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <button onClick={() => setIsPeriodModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={resetPeriodForm} className="btn-secondary">Reset form</button>
          <button onClick={handleSavePeriod} className="btn-primary" disabled={isSavingPeriod}>
            {editingPeriodId ? 'Update period' : 'Add period'}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        isOpen={deletingPeriod !== null}
        title="Delete Period"
        message={deletingPeriod ? `Delete period \"${deletingPeriod.name}\"?` : ''}
        confirmText="Delete"
        onConfirm={handleDeletePeriod}
        onCancel={() => setDeletingPeriod(null)}
        confirmButtonColor="red"
      />
    </div>
  );
}