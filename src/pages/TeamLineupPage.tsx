import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEvents, usePlayers, useMatchPlanning, useAppInitialized, useAppLoading } from '../store';
import { Card, CardBody, CardTitle, Button } from '../components/ui';
import Level from '../components/Level';
import {
  selectPlayingModeById,
  selectFormationById,
  selectBenchedPlayerIds,
  selectAssignablePlayersForSlot,
  selectPlannedPeriodCounts,
  selectLineupSummary,
  selectLineupShirtNumberRows,
  selectLineupWithCopiedPeriod,
  hasLineupRosterMismatch,
  getPositionLabelKey,
} from '../store/selectors/matchPlanningSelectors';
import type { Team, TeamLineupPeriod } from '../types';

export default function TeamLineupPage() {
  const { t } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldPrint = searchParams.get('print') === 'true';
  const hasPrinted = useRef(false);

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
  const [activeTab, setActiveTab] = useState<number | 'summary'>(shouldPrint ? 'summary' : 1);
  const [hoveredSummaryPlayerId, setHoveredSummaryPlayerId] = useState<string | null>(null);
  const [selectingSlotId, setSelectingSlotId] = useState<string | null>(null);

  // Only reinitialize the draft when switching teams, not on every store refresh, to avoid clobbering in-progress edits.
  useEffect(() => {
    setDraftLineup(team?.lineup ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id]);

  useEffect(() => {
    if (
      !shouldPrint || hasPrinted.current || activeTab !== 'summary' ||
      !isInitialized || isLoading || !event || !team || !playingMode || !formation
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      hasPrinted.current = true;
      window.print();
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, event, formation, isInitialized, isLoading, playingMode, shouldPrint, team]);

  const draftTeam: Team | null = team ? { ...team, lineup: draftLineup } : null;

  const selectedPlayers = useMemo(
    () => players.filter((p) => team?.selectedPlayers?.includes(p.id)),
    [players, team]
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
  const benchedPlayerIds = selectBenchedPlayerIds(draftTeam, activePeriod);
  const plannedPeriodCounts = selectPlannedPeriodCounts(draftTeam);
  const hasMismatch = hasLineupRosterMismatch(draftTeam, activePeriod);
  const lineupSummary = selectLineupSummary(draftTeam, formation, players, playingMode.numberOfPeriods);
  const shirtNumberRows = selectLineupShirtNumberRows(draftTeam, players);
  const currentPeriodSummary = lineupSummary.find((period) => period.periodNumber === activePeriod);
  const selectingAssignment = currentPeriodSummary?.assignments.find((assignment) => assignment.slotId === selectingSlotId);
  const assignablePlayers = selectingSlotId
    ? selectAssignablePlayersForSlot(draftTeam, players, activePeriod, selectingSlotId)
    : [];

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
    setSelectingSlotId(null);
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
            onClick={() => {
              setActiveTab(periodNumber);
              setSelectingSlotId(null);
            }}
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
          onClick={() => {
            setActiveTab('summary');
            setSelectingSlotId(null);
          }}
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
          <div className="lineup-summary-grid grid grid-cols-1 md:grid-cols-2 gap-3">
            {lineupSummary.map((period) => (
              <Card key={period.periodNumber} className="lineup-period-card break-inside-avoid">
                <CardBody className="p-3">
                  <CardTitle className="text-center">{t('teamLineup.periodLabel', { number: period.periodNumber })}</CardTitle>
                  <div className="lineup-pitch relative mt-2 mx-auto w-full max-w-xs aspect-[4/3] overflow-hidden rounded-md bg-emerald-600 shadow-inner">
                    {period.assignments.map((assignment) => (
                      <div
                        key={assignment.slotId}
                        className={`absolute z-10 w-[25%] -translate-x-1/2 -translate-y-1/2 rounded border px-1 py-0.5 text-center shadow-sm transition-all ${
                          assignment.playerId && hoveredSummaryPlayerId === assignment.playerId
                            ? 'scale-110 border-orange-300 bg-orange-100 text-orange-950 ring-2 ring-orange-300'
                            : assignment.playerId
                              ? 'border-white/70 bg-white/95 text-gray-900'
                              : 'border-dashed border-white/70 bg-emerald-700/80 text-white'
                        }`}
                        style={{ left: `${assignment.pitchX}%`, top: `${assignment.pitchY}%` }}
                        onMouseEnter={() => assignment.playerId && setHoveredSummaryPlayerId(assignment.playerId)}
                        onMouseLeave={() => setHoveredSummaryPlayerId(null)}
                      >
                        <span className="block text-[10px] font-bold leading-none opacity-70">
                          {t(getPositionLabelKey(assignment.positionCode))}
                          {assignment.displayIndex ? ` ${assignment.displayIndex}` : ''}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-semibold leading-tight">
                          {assignment.playerLabel ?? t('teamLineup.emptySlot')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs font-semibold text-center text-gray-700 mb-1">{t('teamLineup.benchLabel')}</div>
                    {period.benchedPlayers.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1 text-center text-xs text-gray-600">
                        {period.benchedPlayers.map((player) => (
                          <span
                            key={player.playerId}
                            className={`px-1 rounded transition-colors ${
                              hoveredSummaryPlayerId === player.playerId
                                ? 'bg-orange-100 text-orange-900'
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
                      <div className="text-center text-xs text-gray-600">{t('teamLineup.noBenchedPlayers')}</div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <section className="lineup-shirt-page hidden print:block">
            <header className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <h2 className="mt-1 text-2xl font-semibold text-gray-700">{t('teamLineup.shirtNumbersTitle')}</h2>
            </header>
            <div className="lineup-shirt-grid grid grid-cols-2 gap-3">
              {shirtNumberRows.map((row) => (
                <div
                  key={row.playerId}
                  className="lineup-shirt-row flex items-center gap-4 rounded-lg border-2 border-gray-300 px-4 py-3"
                >
                  <span className="w-14 flex-none text-center text-4xl font-black text-gray-900">
                    {row.shirtNumber ?? t('teamLineup.noShirtNumber')}
                  </span>
                  <span className="min-w-0 text-xl font-semibold text-gray-900">
                    {row.playerName ?? t('teamLineup.unknownPlayer')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
      <>
      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t('teamLineup.slotsTitle', { formation: formation.name })}</CardTitle>
          {currentPeriodSummary && (
            <div className="lineup-pitch relative mt-3 mx-auto w-full max-w-md aspect-[4/3] overflow-hidden rounded-md bg-emerald-600 shadow-inner">
              {currentPeriodSummary.assignments.map((assignment) => (
                <button
                  type="button"
                  key={assignment.slotId}
                  onClick={() => setSelectingSlotId(assignment.slotId)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const playerId = event.dataTransfer.getData('lineupPlayerId');
                    if (playerId) handleAssignSlot(assignment.slotId, playerId);
                  }}
                  className={`absolute z-10 w-[25%] -translate-x-1/2 -translate-y-1/2 rounded border px-1 py-1 text-center shadow-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                    selectingSlotId === assignment.slotId
                      ? 'border-orange-300 bg-orange-100 text-orange-950 ring-2 ring-orange-300'
                      : assignment.playerId
                        ? 'border-white/70 bg-white/95 text-gray-900'
                        : 'border-dashed border-white/80 bg-emerald-700/80 text-white'
                  }`}
                  style={{ left: `${assignment.pitchX}%`, top: `${assignment.pitchY}%` }}
                >
                  <span className="block text-[10px] font-bold leading-none opacity-70">
                    {t(getPositionLabelKey(assignment.positionCode))}
                    {assignment.displayIndex ? ` ${assignment.displayIndex}` : ''}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-semibold leading-tight">
                    {assignment.playerLabel ?? t('teamLineup.emptySlot')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectingAssignment && (
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
              <div className="mb-2 text-sm font-semibold text-gray-800">
                {t('teamLineup.selectPlayerForPosition', {
                  position: t(getPositionLabelKey(selectingAssignment.positionCode)),
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAssignSlot(selectingAssignment.slotId, '')}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  {t('teamLineup.emptySlot')}
                </button>
                {assignablePlayers.map((player) => (
                  <button
                    type="button"
                    key={player.id}
                    onClick={() => handleAssignSlot(selectingAssignment.slotId, player.id)}
                    className={`rounded border px-3 py-1.5 text-sm ${
                      selectingAssignment.playerId === player.id
                        ? 'border-orange-500 bg-orange-100 text-orange-900'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {player.firstName} {player.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                  <div
                    key={player.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('lineupPlayerId', player.id);
                    }}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2 lg:cursor-grab lg:active:cursor-grabbing"
                  >
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
        @page { size: A4 portrait; margin: 8mm; }
        body * { visibility: hidden; }
        .lineup-print-content, .lineup-print-content * { visibility: visible; }
        #root > div > header { display: none !important; }
        .page-container { max-width: none !important; padding: 0 !important; }
        .page-container > *:not(.lineup-print-content):not(style) { display: none !important; }
        .lineup-print-content { position: static !important; width: 100%; padding: 0; }
        .lineup-summary-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 3mm !important; }
        .lineup-period-card .card-body { padding: 3mm !important; }
        .lineup-pitch { max-width: none !important; aspect-ratio: 4 / 3 !important; }
        .lineup-pitch { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .lineup-shirt-page { display: block !important; break-before: page !important; page-break-before: always !important; padding-top: 4mm; }
        .lineup-shirt-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 3mm !important; }
        .lineup-shirt-row { break-inside: avoid; min-height: 18mm; padding: 2.5mm 3mm !important; }
        body { background: white !important; }
      }`}</style>
    </div>
  );
}
