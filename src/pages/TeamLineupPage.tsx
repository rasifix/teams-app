import { useEffect, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers, useMatchPlanning, useAppInitialized, useAppLoading } from '../store';
import { ActionDock, ActionDockContent, Alert, Card, CardBody, CardTitle, Button, ContentGrid, EmptyState, IconButton, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, PanelTitle, Tab, TabList } from '../components/ui';
import UnsavedLineupDialog from '../components/UnsavedLineupDialog';
import {
  selectMatchFormatById,
  selectFormationById,
  selectBenchedPlayers,
  selectAssignablePlayersForSlot,
  selectPlannedPeriodCounts,
  selectMinimumPeriodViolations,
  selectLineupSummary,
  selectLineupShirtNumberRows,
  selectLineupWithCopiedPeriod,
  applyLineupPlayerDrop,
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
  const [isDragOverBench, setIsDragOverBench] = useState(false);

  // Only reinitialize the draft when switching teams, not on every store refresh, to avoid clobbering in-progress edits.
  useEffect(() => {
    const persistedLineup = team?.lineup ?? [];
    setDraftLineup(persistedLineup);
    setSavedLineup(persistedLineup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id]);

  const hasChanges = selectHasLineupChanges(savedLineup, draftLineup);
  const lineupPath = `/activities/${eventId}/teams/${teamId}/lineup`;
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

  if (!isInitialized || isLoading) {
    return (
      <Page>
        <EmptyState>{t('page.teamLineup.loading')}</EmptyState>
      </Page>
    );
  }

  if (!event || event.kind !== 'match' || !team) {
    return (
      <Page>
        <EmptyState>{t('page.teamLineup.teamNotFound')}</EmptyState>
      </Page>
    );
  }

  if (!matchFormat || !formation || !draftTeam) {
    return (
      <Page>
        <EmptyState>{t('page.teamLineup.notConfigured')}</EmptyState>
      </Page>
    );
  }

  const isCancelled = event.status === 'cancelled';

  const activePeriod = typeof activeTab === 'number' ? activeTab : 1;
  const benchedPlayers = selectBenchedPlayers(draftTeam, players, activePeriod);
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
    if (isCancelled) return;
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

  const handleDropOnSlot = (slotId: string, playerId: string) => {
    if (isCancelled) return;
    setDraftLineup((current) => {
      const otherPeriods = current.filter((p) => p.periodNumber !== activePeriod);
      const period = current.find((p) => p.periodNumber === activePeriod);
      const assignments = applyLineupPlayerDrop(period?.assignments ?? [], playerId, slotId);

      return [...otherPeriods, { periodNumber: activePeriod, assignments }].sort(
        (a, b) => a.periodNumber - b.periodNumber
      );
    });
  };

  const handleDropOnBench = (playerId: string) => {
    if (isCancelled) return;
    setDraftLineup((current) => {
      const otherPeriods = current.filter((p) => p.periodNumber !== activePeriod);
      const period = current.find((p) => p.periodNumber === activePeriod);
      const assignments = applyLineupPlayerDrop(period?.assignments ?? [], playerId, null);

      return [...otherPeriods, { periodNumber: activePeriod, assignments }].sort(
        (a, b) => a.periodNumber - b.periodNumber
      );
    });
  };

  const handleCopyPreviousPeriod = () => {
    if (isCancelled || activePeriod <= 1) return;
    setDraftLineup((current) => selectLineupWithCopiedPeriod(current, activePeriod - 1, activePeriod));
  };

  const handleSave = async (): Promise<boolean> => {
    if (isCancelled || !eventId || !hasChanges) return false;

    setIsSaving(true);
    setSaveError(null);
    const updatedTeams = event.teams.map((t) =>
      t.id === teamId ? { ...t, lineup: draftLineup } : t
    );

    const wasSaved = await updateActivityTeams(eventId, updatedTeams);
    setIsSaving(false);
    if (!wasSaved) {
      setSaveError(t('page.teamLineup.saveFailed'));
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
    <Page actionDock className="lineup-page">
      <PageHeader>
          <PageHeaderContent>
            <p className="eyebrow">{event.name}</p>
            <PageTitle>{t('page.teamLineup.title', { team: team.name })}</PageTitle>
          </PageHeaderContent>
          <PageActions><p className="lineup-context">{matchFormat.name} · {formation.name}</p></PageActions>
      </PageHeader>
      {isCancelled && <Alert tone="warning">{t('page.eventDetail.cancelledReadOnly')}</Alert>}

      <TabList label={t('page.teamLineup.title', { team: team.name })} className="lineup-tabs">
        {Array.from({ length: matchFormat.numberOfPeriods }, (_, i) => i + 1).map((periodNumber) => (
          <Tab
            key={periodNumber}
            selected={activeTab === periodNumber}
            onClick={() => {
              navigate(`/activities/${eventId}/teams/${teamId}/lineup/${periodNumber}`);
              setSelectingSlotId(null);
            }}
          >
            {t('page.teamLineup.periodLabel', { number: periodNumber })}
          </Tab>
        ))}
        <Tab
          selected={activeTab === 'summary'}
          onClick={() => {
              navigate(`/activities/${eventId}/teams/${teamId}/lineup/summary`);
            setSelectingSlotId(null);
          }}
        >
          {t('page.teamLineup.summaryTab')}
        </Tab>
      </TabList>

      {activeTab !== 'summary' && activePeriod > 1 && (
        <div className="lineup-toolbar">
          <Button variant="secondary" size="sm" disabled={isCancelled} onClick={handleCopyPreviousPeriod}>
            {t('page.teamLineup.copyPreviousPeriod')}
          </Button>
        </div>
      )}

      {activeTab !== 'summary' && hasMismatch && (
        <Alert tone="warning" className="lineup-alert">
          {t('page.teamLineup.rosterMismatchWarning')}
        </Alert>
      )}

      {activeTab === 'summary' ? (
        <div className="lineup-print-content">
          <div className="lineup-print-actions">
            <PanelTitle>{t('page.teamLineup.summaryTitle')}</PanelTitle>
            <IconButton label={t('page.teamLineup.printSummary')} onClick={() => window.print()}>
              <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v6H6z" />
              </svg>
            </IconButton>
          </div>
          {minimumPeriodViolations.length > 0 && (
            <Alert className="lineup-alert">
              <div className="lineup-violation-title">{t('page.teamLineup.minimumPeriodsViolationTitle')}</div>
              <ul className="lineup-violation-list">
                {minimumPeriodViolations.map((violation) => (
                  <li key={violation.playerId}>
                    {t('page.teamLineup.minimumPeriodsViolation', {
                      player: violation.playerName ?? t('page.teamLineup.unknownPlayer'),
                      count: violation.plannedPeriods,
                      minimum: violation.minimumPeriods,
                    })}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          <div className="lineup-print-heading">
            <h1 className="lineup-print-title">{t('page.teamLineup.title', { team: team.name })}</h1>
            <p>{matchFormat.name} · {formation.name}</p>
          </div>
          <div className="lineup-summary-grid">
            {lineupSummary.map((period) => (
              <Card key={period.periodNumber} className="lineup-period-card">
                <CardBody className="lineup-period-body">
                  <CardTitle className="lineup-period-title">{t('page.teamLineup.periodLabel', { number: period.periodNumber })}</CardTitle>
                  <div className="lineup-pitch--summary">
                    {period.assignments.map((assignment) => (
                      <div
                        key={assignment.slotId}
                        className={`lineup-slot lineup-slot--summary ${
                          assignment.playerId && hoveredSummaryPlayerId === assignment.playerId
                            ? 'lineup-slot--highlighted'
                            : assignment.playerId
                              ? 'lineup-slot--assigned'
                              : 'lineup-slot--empty'
                        }`}
                        style={{ left: `${assignment.pitchX}%`, top: `${assignment.pitchY}%` }}
                        onMouseEnter={() => assignment.playerId && setHoveredSummaryPlayerId(assignment.playerId)}
                        onMouseLeave={() => setHoveredSummaryPlayerId(null)}
                      >
                          <span className="lineup-slot-position">
                          {t(getPositionLabelKey(assignment.positionCode))}
                          {assignment.displayIndex ? ` ${assignment.displayIndex}` : ''}
                        </span>
                        <span className="lineup-slot-player">
                          {assignment.playerLabel ?? t('page.teamLineup.emptySlot')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="lineup-summary-bench">
                    <div className="lineup-summary-bench-title">{t('page.teamLineup.benchLabel')}</div>
                    {period.benchedPlayers.length > 0 ? (
                      <div className="lineup-summary-players">
                        {period.benchedPlayers.map((player) => (
                          <span
                            key={player.playerId}
                            className={`lineup-summary-player${hoveredSummaryPlayerId === player.playerId ? ' lineup-summary-player--highlighted' : ''}`}
                            onMouseEnter={() => setHoveredSummaryPlayerId(player.playerId)}
                            onMouseLeave={() => setHoveredSummaryPlayerId(null)}
                          >
                            {player.playerName ?? t('page.teamLineup.unknownPlayer')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="lineup-empty-bench">{t('page.teamLineup.noBenchedPlayers')}</div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <section className="lineup-shirt-page">
            <header className="lineup-shirt-header">
              <h1 className="lineup-shirt-title">{team.name}</h1>
              <h2 className="lineup-shirt-subtitle">{t('page.teamLineup.shirtNumbersTitle')}</h2>
            </header>
            <div className="lineup-shirt-grid">
              {shirtNumberRows.map((row) => (
                <div
                  key={row.playerId}
                  className="lineup-shirt-row"
                >
                  <span className="lineup-shirt-number">
                    {row.shirtNumber ?? t('page.teamLineup.noShirtNumber')}
                  </span>
                  <span className="lineup-shirt-name">
                    {row.playerName ?? t('page.teamLineup.unknownPlayer')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
      <>
      <ContentGrid variant="editor">
      <Card className="lineup-editor-card">
        <CardBody className="lineup-editor-body">
          <CardTitle className="lineup-editor-title">{t('page.teamLineup.slotsTitle', { formation: formation.name })}</CardTitle>
          {currentPeriodSummary && (
            <div className="lineup-pitch--editor">
              {currentPeriodSummary.assignments.map((assignment) => (
                <button
                  type="button"
                  data-ui-control="composite"
                  key={assignment.slotId}
                  draggable={Boolean(assignment.playerId) && !isCancelled}
                  onDragStart={(event) => {
                    if (!assignment.playerId) return;
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('lineupPlayerId', assignment.playerId);
                  }}
                  onDragEnd={() => {
                    setDragOverSlotId(null);
                    setIsDragOverBench(false);
                  }}
                  onClick={() => !isCancelled && setSelectingSlotId(assignment.slotId)}
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
                    if (playerId) handleDropOnSlot(assignment.slotId, playerId);
                    setDragOverSlotId(null);
                  }}
                  className={`lineup-slot lineup-slot--editor ${
                    dragOverSlotId === assignment.slotId
                      ? 'lineup-slot--drag-over'
                      : selectingSlotId === assignment.slotId
                      ? 'lineup-slot--selecting'
                      : assignment.playerId
                        ? 'lineup-slot--assigned'
                        : 'lineup-slot--empty'
                  }`}
                  style={{ left: `${assignment.pitchX}%`, top: `${assignment.pitchY}%` }}
                >
                  <span className="lineup-slot-position">
                    {t(getPositionLabelKey(assignment.positionCode))}
                    {assignment.displayIndex ? ` ${assignment.displayIndex}` : ''}
                  </span>
                  <span className="lineup-slot-player">
                    {assignment.playerLabel ?? t('page.teamLineup.emptySlot')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectingAssignment && (
            <div className="lineup-player-picker">
              <div className="lineup-player-picker-title">
                {t('page.teamLineup.selectPlayerForPosition', {
                  position: t(getPositionLabelKey(selectingAssignment.positionCode)),
                })}
              </div>
              <div className="lineup-player-picker-options">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isCancelled}
                  onClick={() => handleAssignSlot(selectingAssignment.slotId, '')}
                >
                  {t('page.teamLineup.emptySlot')}
                </Button>
                {assignablePlayers.map((player) => (
                  <Button
                    type="button"
                    key={player.id}
                    variant={selectingAssignment.playerId === player.id ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={isCancelled}
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

      <Card className="lineup-editor-card">
        <CardBody className="lineup-editor-body">
          <CardTitle className="lineup-editor-title">{t('page.teamLineup.benchTitle', { count: benchedPlayers.length })}</CardTitle>
          <div
            className={`lineup-bench-drop${isDragOverBench ? ' lineup-bench-drop--drag-over' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setIsDragOverBench(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragOverBench(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const playerId = event.dataTransfer.getData('lineupPlayerId');
              if (playerId) handleDropOnBench(playerId);
              setIsDragOverBench(false);
            }}
          >
            {benchedPlayers.length === 0 ? (
              <EmptyState>{t('page.teamLineup.noBenchedPlayers')}</EmptyState>
            ) : (
              <div className="lineup-bench-list" role="list">
                {benchedPlayers.map((player) => (
                  <div
                    key={player.id}
                    role="listitem"
                    draggable={!isCancelled}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('lineupPlayerId', player.id);
                    }}
                    onDragEnd={() => setDragOverSlotId(null)}
                    className="lineup-bench-player"
                  >
                    <span className="lineup-drag-handle" aria-hidden="true">
                      <span className="lineup-drag-dot-row"><span className="dot" /><span className="dot" /></span>
                      <span className="lineup-drag-dot-row"><span className="dot" /><span className="dot" /></span>
                      <span className="lineup-drag-dot-row"><span className="dot" /><span className="dot" /></span>
                    </span>
                    <span className="lineup-bench-name">{player.firstName} {player.lastName}</span>
                    <span
                      className="lineup-period-count"
                      aria-label={t('page.teamLineup.plannedPeriods', {
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
          </div>
        </CardBody>
      </Card>
      </ContentGrid>
      </>
      )}

      <ActionDock>
        <ActionDockContent>
          {saveError ? <p className="lineup-save-error" role="alert">{saveError}</p> : <span className="lineup-save-status">{hasChanges ? t('page.teamLineup.unsavedChangesTitle') : t('page.teamLineup.plannedPlayersSummary', { count: plannedPeriodCounts.size, total: matchFormat.numberOfPeriods })}</span>}
          <PageActions>
            <Button variant="secondary" onClick={() => navigate(`/activities/${eventId}/teams/${teamId}`)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isCancelled || !hasChanges || isSaving}>
              {t('common.actions.save')}
            </Button>
          </PageActions>
        </ActionDockContent>
      </ActionDock>
      <UnsavedLineupDialog
        isOpen={navigationBlocker.state === 'blocked'}
        isSaving={isSaving}
        onSave={handleSaveAndLeave}
        onDiscard={() => navigationBlocker.state === 'blocked' && navigationBlocker.proceed()}
        onCancel={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()}
      />
    </Page>
  );
}
