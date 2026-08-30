import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEvents, usePlayers, useMatchPlanning, useAppInitialized, useAppLoading } from '../store';
import { Card, CardBody, CardTitle, Button } from '../components/ui';
import Level from '../components/Level';
import {
  selectPlayingModeById,
  selectFormationById,
  selectAssignmentsForPeriod,
  selectBenchedPlayerIds,
  selectPlannedPeriodCounts,
  selectLineupSummary,
  selectLineupWithCopiedPeriod,
  hasLineupRosterMismatch,
  selectSlotDisplayIndexes,
  getPositionLabelKey,
} from '../store/selectors/matchPlanningSelectors';
import type { Team, TeamLineupPeriod } from '../types';

export default function TeamLineupPage() {
  const { t } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();

  const { getEventById, updateEvent } = useEvents();
  const { players } = usePlayers();
  const { playingModes, formations } = useMatchPlanning();
  const isInitialized = useAppInitialized();
  const isLoading = useAppLoading();

  const event = eventId ? getEventById(eventId) : null;
  const team = event?.teams.find((t) => t.id === teamId);

  const playingMode = selectPlayingModeById(playingModes, event?.playingModeId);
  const formation = selectFormationById(formations, team?.formationId);

  const [draftLineup, setDraftLineup] = useState<TeamLineupPeriod[]>(team?.lineup ?? []);
  const [activeTab, setActiveTab] = useState<number | 'summary'>(1);
  const [hoveredSummaryPlayerId, setHoveredSummaryPlayerId] = useState<string | null>(null);

  // Only reinitialize the draft when switching teams, not on every store refresh, to avoid clobbering in-progress edits.
  useEffect(() => {
    setDraftLineup(team?.lineup ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id]);

  const draftTeam: Team | null = team ? { ...team, lineup: draftLineup } : null;

  const selectedPlayers = useMemo(
    () => players.filter((p) => team?.selectedPlayers?.includes(p.id)),
    [players, team]
  );

  const slotDisplayIndexes = useMemo(
    () => (formation ? selectSlotDisplayIndexes(formation.slots) : new Map()),
    [formation]
  );

  if (!isInitialized || isLoading) {
    return (
      <div className="page-container">
        <div className="empty-state">{t('teamLineup.loading')}</div>
      </div>
    );
  }

  if (!event || !team) {
    return (
      <div className="page-container">
        <div className="empty-state">{t('teamLineup.teamNotFound')}</div>
      </div>
    );
  }

  if (!playingMode || !formation || !draftTeam) {
    return (
      <div className="page-container">
        <div className="empty-state">{t('teamLineup.notConfigured')}</div>
      </div>
    );
  }

  const activePeriod = typeof activeTab === 'number' ? activeTab : 1;
  const currentAssignments = selectAssignmentsForPeriod(draftTeam, activePeriod);
  const benchedPlayerIds = selectBenchedPlayerIds(draftTeam, activePeriod);
  const plannedPeriodCounts = selectPlannedPeriodCounts(draftTeam);
  const hasMismatch = hasLineupRosterMismatch(draftTeam, activePeriod);
  const lineupSummary = selectLineupSummary(draftTeam, formation, players, playingMode.numberOfPeriods);

  const handleAssignSlot = (slotId: string, playerId: string) => {
    setDraftLineup((current) => {
      const otherPeriods = current.filter((p) => p.periodNumber !== activePeriod);
      const period = current.find((p) => p.periodNumber === activePeriod);
      const existingAssignments = period?.assignments ?? [];

      // A player can only occupy one slot per period; remove them from any other slot first.
      const withoutPlayer = existingAssignments.filter((a) => a.playerId !== playerId);
      const withoutSlot = withoutPlayer.filter((a) => a.slotId !== slotId);
      const nextAssignments = playerId
        ? [...withoutSlot, { slotId, playerId }]
        : withoutSlot;

      return [...otherPeriods, { periodNumber: activePeriod, assignments: nextAssignments }].sort(
        (a, b) => a.periodNumber - b.periodNumber
      );
    });
  };

  const handleCopyPreviousPeriod = () => {
    if (activePeriod <= 1) return;
    setDraftLineup((current) => selectLineupWithCopiedPeriod(current, activePeriod - 1, activePeriod));
  };

  const handleSave = async () => {
    if (!eventId) return;

    const updatedTeams = event.teams.map((t) =>
      t.id === teamId ? { ...t, lineup: draftLineup } : t
    );

    await updateEvent(eventId, { teams: updatedTeams });
    navigate(`/events/${eventId}/teams/${teamId}`);
  };

  return (
    <div className="page-container pb-24">
      <div className="page-header">
        <button
          onClick={() => navigate(`/events/${eventId}/teams/${teamId}`)}
          className="text-blue-600 hover:text-blue-700 mb-2 text-sm font-medium"
        >
          ← {t('common.actions.cancel')}
        </button>
        <h1 className="page-title">{t('teamLineup.title', { team: team.name })}</h1>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {Array.from({ length: playingMode.numberOfPeriods }, (_, i) => i + 1).map((periodNumber) => (
          <button
            key={periodNumber}
            onClick={() => setActiveTab(periodNumber)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
              activeTab === periodNumber
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('teamLineup.periodLabel', { number: periodNumber })}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
            activeTab === 'summary'
              ? 'bg-orange-600 text-white border-orange-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {t('teamLineup.summaryTab')}
        </button>
      </div>

      {activeTab !== 'summary' && activePeriod > 1 && (
        <div className="flex justify-end mb-4">
          <Button variant="secondary" size="sm" onClick={handleCopyPreviousPeriod}>
            {t('teamLineup.copyPreviousPeriod')}
          </Button>
        </div>
      )}

      {activeTab !== 'summary' && hasMismatch && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
          {t('teamLineup.rosterMismatchWarning')}
        </div>
      )}

      {activeTab === 'summary' ? (
        <div className="lineup-print-content">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="text-xl font-semibold text-gray-900">{t('teamLineup.summaryTitle')}</h2>
            <Button variant="secondary" onClick={() => window.print()}>
              {t('teamLineup.printSummary')}
            </Button>
          </div>
          <div className="hidden print:block mb-5">
            <h1 className="text-2xl font-bold">{t('teamLineup.title', { team: team.name })}</h1>
            <p>{playingMode.name} · {formation.name}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lineupSummary.map((period) => (
              <Card key={period.periodNumber} className="break-inside-avoid">
                <CardBody>
                  <CardTitle>{t('teamLineup.periodLabel', { number: period.periodNumber })}</CardTitle>
                  <div className="mt-3 divide-y divide-gray-100">
                    {period.assignments.map((assignment) => (
                      <div
                        key={assignment.slotId}
                        className={`flex justify-between gap-3 py-1.5 px-1 text-sm rounded transition-colors ${
                          assignment.playerId && hoveredSummaryPlayerId === assignment.playerId
                            ? 'bg-orange-100 ring-1 ring-orange-300'
                            : ''
                        }`}
                        onMouseEnter={() => assignment.playerId && setHoveredSummaryPlayerId(assignment.playerId)}
                        onMouseLeave={() => setHoveredSummaryPlayerId(null)}
                      >
                        <span className="font-medium text-gray-600">
                          {t(getPositionLabelKey(assignment.positionCode))}
                          {assignment.displayIndex ? ` ${assignment.displayIndex}` : ''}
                        </span>
                        <span>{assignment.playerName ?? t('teamLineup.emptySlot')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-1">{t('teamLineup.benchLabel')}</div>
                    {period.benchedPlayers.length > 0 ? (
                      <div className="flex flex-wrap gap-1 text-sm text-gray-600">
                        {period.benchedPlayers.map((player) => (
                          <span
                            key={player.playerId}
                            className={`px-1 rounded transition-colors ${
                              hoveredSummaryPlayerId === player.playerId
                                ? 'bg-orange-100 text-orange-900 ring-1 ring-orange-300'
                                : ''
                            }`}
                            onMouseEnter={() => setHoveredSummaryPlayerId(player.playerId)}
                            onMouseLeave={() => setHoveredSummaryPlayerId(null)}
                          >
                            {player.playerName ?? t('teamLineup.unknownPlayer')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">{t('teamLineup.noBenchedPlayers')}</div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      ) : (
      <>
      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t('teamLineup.slotsTitle', { formation: formation.name })}</CardTitle>
          <div className="space-y-2 mt-3">
            {formation.slots.map((slot) => {
              const assignment = currentAssignments.find((a) => a.slotId === slot.id);
              const displayIndex = slotDisplayIndexes.get(slot.id);
              const label = `${t(getPositionLabelKey(slot.positionCode))}${
                displayIndex !== null && displayIndex !== undefined ? ` ${displayIndex}` : ''
              }`;

              const assignablePlayerIds = new Set([
                ...benchedPlayerIds,
                ...(assignment ? [assignment.playerId] : []),
              ]);

              return (
                <div key={slot.id} className="flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium w-20">{label}</span>
                  <select
                    value={assignment?.playerId ?? ''}
                    onChange={(e) => handleAssignSlot(slot.id, e.target.value)}
                    className="form-input flex-1"
                  >
                    <option value="">{t('teamLineup.emptySlot')}</option>
                    {selectedPlayers
                      .filter((player) => assignablePlayerIds.has(player.id))
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.firstName} {player.lastName}
                        </option>
                      ))}
                  </select>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle>{t('teamLineup.benchTitle', { count: benchedPlayerIds.length })}</CardTitle>
          {benchedPlayerIds.length === 0 ? (
            <div className="empty-state text-sm">{t('teamLineup.noBenchedPlayers')}</div>
          ) : (
            <div className="space-y-2 mt-3">
              {selectedPlayers
                .filter((player) => benchedPlayerIds.includes(player.id))
                .map((player) => (
                  <div key={player.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span>{player.firstName} {player.lastName}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {t('teamLineup.plannedPeriods', {
                          count: plannedPeriodCounts.get(player.id) ?? 0,
                          total: playingMode.numberOfPeriods,
                        })}
                      </span>
                      <Level level={player.level} />
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardBody>
      </Card>
      </>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button variant="primary" onClick={handleSave} className="w-full">
          {t('common.actions.save')}
        </Button>
      </div>
      <style>{`@media print {
        body * { visibility: hidden; }
        .lineup-print-content, .lineup-print-content * { visibility: visible; }
        .lineup-print-content { position: absolute; inset: 0; width: 100%; padding: 12mm; }
        body { background: white !important; }
      }`}</style>
    </div>
  );
}
