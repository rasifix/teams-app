import { useEffect, useMemo, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers, useMatchPlanning, useAppInitialized, useAppLoading } from '../store';
import { Alert, Card, CardBody, CardTitle, Button, EmptyState, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, PanelTitle, Tab, TabList } from '../components/ui';
import UnsavedLineupDialog from '../components/UnsavedLineupDialog';
import {
  selectMatchFormatById,
  selectFormationById,
  selectBenchedPlayerIds,
  selectAssignablePlayersForSlot,
  selectPlannedPeriodCounts,
  selectMinimumPeriodViolations,
  selectLineupSummary,
  selectLineupShirtNumberRows,
  selectLineupWithCopiedPeriod,
  selectLineupRouteTab,
  selectHasLineupChanges,
  hasLineupRosterMismatch,
  getPositionLabelKey,
} from '../store/selectors/matchPlanningSelectors';
import type { Team, TeamLineupPeriod } from '../types';

export default function TeamLineupPage() {
  const { t } = useTranslation();
  const { eventId, teamId, lineupTab } = useParams<{ eventId: string; teamId: string; lineupTab?: string }>();
  const navigate = useNavigate();

  const { getActivityById, updateActivityTeams } = useActivities();
  const { players } = usePlayers();
  const { matchFormats, formations } = useMatchPlanning();
  const isInitialized = useAppInitialized();
  const isLoading = useAppLoading();

  const event = eventId ? getActivityById(eventId) : null;
  const team = event?.teams.find((t) => t.id === teamId);

  const matchFormat = selectMatchFormatById(matchFormats, event?.kind === 'match' ? event.matchFormatId : undefined);
  const formation = selectFormationById(formations, team?.formationId);
  const activeTab = selectLineupRouteTab(lineupTab, matchFormat?.numberOfPeriods);

  const [draftLineup, setDraftLineup] = useState<TeamLineupPeriod[]>(team?.lineup ?? []);
  const [savedLineup, setSavedLineup] = useState<TeamLineupPeriod[]>(team?.lineup ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hoveredSummaryPlayerId, setHoveredSummaryPlayerId] = useState<string | null>(null);
  const [selectingSlotId, setSelectingSlotId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  // Only reinitialize the draft when switching teams, not on every store refresh, to avoid clobbering in-progress edits.
  useEffect(() => {
    const persistedLineup = team?.lineup ?? [];
    setDraftLineup(persistedLineup);
    setSavedLineup(persistedLineup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id]);

  const hasChanges = selectHasLineupChanges(savedLineup, draftLineup);
  const lineupPath = `/events/${eventId}/teams/${teamId}/lineup`;
  const navigationBlocker = useBlocker(({ nextLocation }) => {
    const remainsInLineup = nextLocation.pathname === lineupPath ||
      nextLocation.pathname.startsWith(`${lineupPath}/`);
    return hasChanges && !remainsInLineup;
  });

  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const draftTeam: Team | null = team ? { ...team, lineup: draftLineup } : null;

  const selectedPlayers = useMemo(
    () => players.filter((p) => team?.selectedPlayers?.includes(p.id)),
    [players, team]
  );

  if (!isInitialized || isLoading) {
    return (
      <Page>
        <EmptyState>{t('teamLineup.loading')}</EmptyState>
      </Page>
    );
  }

  if (!event || event.kind !== 'match' || !team) {
    return (
      <Page>
        <EmptyState>{t('teamLineup.teamNotFound')}</EmptyState>
      </Page>
    );
  }

  if (!matchFormat || !formation || !draftTeam) {
    return (
      <Page>
        <EmptyState>{t('teamLineup.notConfigured')}</EmptyState>
      </Page>
    );
  }

  const activePeriod = typeof activeTab === 'number' ? activeTab : 1;
  const benchedPlayerIds = selectBenchedPlayerIds(draftTeam, activePeriod);
  const plannedPeriodCounts = selectPlannedPeriodCounts(draftTeam);
  const minimumPeriodViolations = selectMinimumPeriodViolations(
    draftTeam,
    players,
    matchFormat.minimumPeriodsPerPlayer
  );
  const hasMismatch = hasLineupRosterMismatch(draftTeam, activePeriod);
  const lineupSummary = selectLineupSummary(draftTeam, formation, players, matchFormat.numberOfPeriods);
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

  const handleSave = async (): Promise<boolean> => {
    if (!eventId || !hasChanges) return false;

    setIsSaving(true);
    setSaveError(null);
    const updatedTeams = event.teams.map((t) =>
      t.id === teamId ? { ...t, lineup: draftLineup } : t
    );

    const wasSaved = await updateActivityTeams(eventId, updatedTeams);
    setIsSaving(false);
    if (!wasSaved) {
      setSaveError(t('teamLineup.saveFailed'));
      return false;
    }

    setSavedLineup(draftLineup);
    return true;
  };

  const handleSaveAndLeave = async () => {
    const wasSaved = await handleSave();
    if (wasSaved && navigationBlocker.state === 'blocked') navigationBlocker.proceed();
  };

  return (
    <Page className="lineup-page pb-32 sm:pb-32">
      <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/events/${eventId}/teams/${teamId}`)}
          className="mb-5"
        >
          ← {t('common.actions.cancel')}
      </Button>
      <PageHeader>
          <PageHeaderContent>
            <p className="eyebrow">{event.name}</p>
            <PageTitle>{t('teamLineup.title', { team: team.name })}</PageTitle>
          </PageHeaderContent>
          <PageActions><p className="text-sm font-medium text-content-subtle sm:text-right">{matchFormat.name} · {formation.name}</p></PageActions>
      </PageHeader>

      <TabList label={t('teamLineup.title', { team: team.name })} className="mb-5">
        {Array.from({ length: matchFormat.numberOfPeriods }, (_, i) => i + 1).map((periodNumber) => (
          <Tab
            key={periodNumber}
            selected={activeTab === periodNumber}
            onClick={() => {
              navigate(`/events/${eventId}/teams/${teamId}/lineup/${periodNumber}`);
              setSelectingSlotId(null);
            }}
          >
            {t('teamLineup.periodLabel', { number: periodNumber })}
          </Tab>
        ))}
        <Tab
          selected={activeTab === 'summary'}
          onClick={() => {
            navigate(`/events/${eventId}/teams/${teamId}/lineup/summary`);
            setSelectingSlotId(null);
          }}
        >
          {t('teamLineup.summaryTab')}
        </Tab>
      </TabList>

      {activeTab !== 'summary' && activePeriod > 1 && (
        <div className="mb-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleCopyPreviousPeriod}>
            {t('teamLineup.copyPreviousPeriod')}
          </Button>
        </div>
      )}

      {activeTab !== 'summary' && hasMismatch && (
        <Alert tone="warning" className="mb-4">
          {t('teamLineup.rosterMismatchWarning')}
        </Alert>
      )}

      {activeTab === 'summary' ? (
        <div className="lineup-print-content">
          <div className="mb-4 flex items-center justify-between print:hidden">
            <PanelTitle>{t('teamLineup.summaryTitle')}</PanelTitle>
            <Button variant="secondary" onClick={() => window.print()}>
              {t('teamLineup.printSummary')}
            </Button>
          </div>
          {minimumPeriodViolations.length > 0 && (
            <Alert className="mb-4">
              <div className="font-semibold">{t('teamLineup.minimumPeriodsViolationTitle')}</div>
              <ul className="mt-1 list-disc pl-5">
                {minimumPeriodViolations.map((violation) => (
                  <li key={violation.playerId}>
                    {t('teamLineup.minimumPeriodsViolation', {
                      player: violation.playerName ?? t('teamLineup.unknownPlayer'),
                      count: violation.plannedPeriods,
                      minimum: violation.minimumPeriods,
                    })}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          <div className="hidden print:block mb-5">
            <h1 className="text-2xl font-bold">{t('teamLineup.title', { team: team.name })}</h1>
            <p>{matchFormat.name} · {formation.name}</p>
          </div>
          <div className="lineup-summary-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            {lineupSummary.map((period) => (
              <Card key={period.periodNumber} className="lineup-period-card break-inside-avoid !rounded-3xl !border-edge !shadow-md">
                <CardBody className="!p-4">
                  <CardTitle className="!mb-3 text-center text-sm uppercase tracking-label text-content-subtle">{t('teamLineup.periodLabel', { number: period.periodNumber })}</CardTitle>
                  <div className="lineup-pitch relative mx-auto aspect-[4/3] w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-inner">
                    {period.assignments.map((assignment) => (
                      <div
                        key={assignment.slotId}
                        className={`absolute z-10 w-[25%] -translate-x-1/2 -translate-y-1/2 rounded border px-1 py-0.5 text-center shadow-sm transition-all ${
                          assignment.playerId && hoveredSummaryPlayerId === assignment.playerId
                            ? 'scale-110 border-brand-border bg-brand-muted text-brand-text ring-2 ring-brand'
                            : assignment.playerId
                              ? 'border-inverse-overlay/70 bg-surface/95 text-content-strong'
                              : 'border-dashed border-inverse-overlay/70 bg-pitch/80 text-content-inverse'
                        }`}
                        style={{ left: `${assignment.pitchX}%`, top: `${assignment.pitchY}%` }}
                        onMouseEnter={() => assignment.playerId && setHoveredSummaryPlayerId(assignment.playerId)}
                        onMouseLeave={() => setHoveredSummaryPlayerId(null)}
                      >
                          <span className="block text-micro font-bold leading-none opacity-70">
                          {t(getPositionLabelKey(assignment.positionCode))}
                          {assignment.displayIndex ? ` ${assignment.displayIndex}` : ''}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-semibold leading-tight">
                          {assignment.playerLabel ?? t('teamLineup.emptySlot')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-edge pt-3">
                    <div className="mb-1 text-center text-eyebrow font-bold uppercase tracking-label text-content-subtle">{t('teamLineup.benchLabel')}</div>
                    {period.benchedPlayers.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1.5 text-center text-xs text-content-muted">
                        {period.benchedPlayers.map((player) => (
                          <span
                            key={player.playerId}
                            className={`rounded-lg px-2 py-1 transition-colors ${
                              hoveredSummaryPlayerId === player.playerId
                                ? 'bg-brand-muted text-brand-text'
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
                      <div className="text-center text-xs text-content-subtle">{t('teamLineup.noBenchedPlayers')}</div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <section className="lineup-shirt-page hidden print:block">
            <header className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-content-strong">{team.name}</h1>
              <h2 className="mt-1 text-2xl font-semibold text-content">{t('teamLineup.shirtNumbersTitle')}</h2>
            </header>
            <div className="lineup-shirt-grid grid grid-cols-2 gap-3">
              {shirtNumberRows.map((row) => (
                <div
                  key={row.playerId}
                  className="lineup-shirt-row flex items-center gap-4 rounded-lg border-2 border-edge-strong px-4 py-3"
                >
                  <span className="w-14 flex-none text-center text-4xl font-black text-content-strong">
                    {row.shirtNumber ?? t('teamLineup.noShirtNumber')}
                  </span>
                  <span className="min-w-0 text-xl font-semibold text-content-strong">
                    {row.playerName ?? t('teamLineup.unknownPlayer')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
      <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
      <Card className="!rounded-3xl !border-edge !shadow-md">
        <CardBody className="!p-4 sm:!p-6">
          <CardTitle className="!mb-4 text-lg tracking-tight">{t('teamLineup.slotsTitle', { formation: formation.name })}</CardTitle>
          {currentPeriodSummary && (
            <div className="lineup-pitch relative mx-auto mt-3 aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-inner">
              {currentPeriodSummary.assignments.map((assignment) => (
                <button
                  type="button"
                  data-ui-control="composite"
                  key={assignment.slotId}
                  onClick={() => setSelectingSlotId(assignment.slotId)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDragOverSlotId(assignment.slotId);
                  }}
                  onDragLeave={() => {
                    setDragOverSlotId((current) => current === assignment.slotId ? null : current);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const playerId = event.dataTransfer.getData('lineupPlayerId');
                    if (playerId) handleAssignSlot(assignment.slotId, playerId);
                    setDragOverSlotId(null);
                  }}
                  className={`absolute z-10 w-[25%] -translate-x-1/2 -translate-y-1/2 rounded border px-1 py-1 text-center shadow-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand ${
                    dragOverSlotId === assignment.slotId
                      ? 'scale-110 border-brand-border bg-brand-muted text-brand-text shadow-selected ring-2 ring-brand'
                      : selectingSlotId === assignment.slotId
                      ? 'border-brand-border bg-brand-muted text-brand-text ring-2 ring-brand'
                      : assignment.playerId
                        ? 'border-inverse-overlay/70 bg-surface/95 text-content-strong'
                        : 'border-dashed border-inverse-overlay/80 bg-pitch/80 text-content-inverse'
                  }`}
                  style={{ left: `${assignment.pitchX}%`, top: `${assignment.pitchY}%` }}
                >
                  <span className="block text-micro font-bold leading-none opacity-70">
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
            <div className="mt-4 rounded-2xl border border-brand-border bg-brand-subtle p-4">
              <div className="mb-3 text-sm font-semibold text-content">
                {t('teamLineup.selectPlayerForPosition', {
                  position: t(getPositionLabelKey(selectingAssignment.positionCode)),
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAssignSlot(selectingAssignment.slotId, '')}
                >
                  {t('teamLineup.emptySlot')}
                </Button>
                {assignablePlayers.map((player) => (
                  <Button
                    type="button"
                    key={player.id}
                    variant={selectingAssignment.playerId === player.id ? 'primary' : 'secondary'}
                    size="sm"
                    aria-pressed={selectingAssignment.playerId === player.id}
                    onClick={() => handleAssignSlot(selectingAssignment.slotId, player.id)}
                  >
                    {player.firstName} {player.lastName}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="!rounded-3xl !border-edge !shadow-md">
        <CardBody className="!p-4 sm:!p-6">
          <CardTitle className="!mb-4 text-lg tracking-tight">{t('teamLineup.benchTitle', { count: benchedPlayerIds.length })}</CardTitle>
          {benchedPlayerIds.length === 0 ? (
            <EmptyState>{t('teamLineup.noBenchedPlayers')}</EmptyState>
          ) : (
            <div className="mt-3 grid gap-2" role="list">
              {selectedPlayers
                .filter((player) => benchedPlayerIds.includes(player.id))
                .map((player) => (
                  <div
                    key={player.id}
                    role="listitem"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('lineupPlayerId', player.id);
                    }}
                    onDragEnd={() => setDragOverSlotId(null)}
                    className="group flex items-center gap-3 rounded-2xl border border-edge bg-surface px-3.5 py-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-lg lg:cursor-grab lg:active:cursor-grabbing"
                  >
                    <span className="flex shrink-0 flex-col gap-0.5 text-content-disabled" aria-hidden="true">
                      <span className="flex gap-0.5"><span className="dot" /><span className="dot" /></span>
                      <span className="flex gap-0.5"><span className="dot" /><span className="dot" /></span>
                      <span className="flex gap-0.5"><span className="dot" /><span className="dot" /></span>
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-content-strong">{player.firstName} {player.lastName}</span>
                    <span
                      className="rounded-lg bg-surface-muted px-2 py-1 text-xs font-bold tabular-nums text-content-muted"
                      aria-label={t('teamLineup.plannedPeriods', {
                        count: plannedPeriodCounts.get(player.id) ?? 0,
                        total: matchFormat.numberOfPeriods,
                      })}
                    >
                      {plannedPeriodCounts.get(player.id) ?? 0}/{matchFormat.numberOfPeriods}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardBody>
      </Card>
      </div>
      </>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-edge bg-surface/95 px-4 py-3 shadow-dock backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {saveError ? <p className="text-sm text-danger" role="alert">{saveError}</p> : <span className="text-sm font-medium text-content-subtle">{hasChanges ? t('teamLineup.unsavedChangesTitle') : t('teamLineup.plannedPlayersSummary', { count: plannedPeriodCounts.size, total: matchFormat.numberOfPeriods })}</span>}
          <Button variant="primary" onClick={handleSave} disabled={!hasChanges || isSaving}>
            {t('common.actions.save')}
          </Button>
        </div>
      </div>
      <UnsavedLineupDialog
        isOpen={navigationBlocker.state === 'blocked'}
        isSaving={isSaving}
        onSave={handleSaveAndLeave}
        onDiscard={() => navigationBlocker.state === 'blocked' && navigationBlocker.proceed()}
        onCancel={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()}
      />
      <style>{`@media print {
        @page { size: A4 portrait; margin: 8mm; }
        body * { visibility: hidden; }
        .lineup-print-content, .lineup-print-content * { visibility: visible; }
        #root > div > header { display: none !important; }
        .lineup-page { max-width: none !important; padding: 0 !important; }
        .lineup-page > *:not(.lineup-print-content):not(style) { display: none !important; }
        .lineup-print-content { position: static !important; width: 100%; padding: 0; }
        .lineup-summary-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 3mm !important; }
        .lineup-period-card .card-body { padding: 3mm !important; }
        .lineup-pitch {
          max-width: none !important;
          aspect-ratio: 4 / 3 !important;
          background: var(--color-print-paper) !important;
          border: 1.5px solid var(--color-print-border) !important;
          box-shadow: none !important;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .lineup-shirt-page { display: block !important; break-before: page !important; page-break-before: always !important; padding-top: 4mm; }
        .lineup-shirt-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 3mm !important; }
        .lineup-shirt-row { break-inside: avoid; min-height: 18mm; padding: 2.5mm 3mm !important; }
        body { background: var(--color-print-paper) !important; }
      }`}</style>
    </Page>
  );
}
