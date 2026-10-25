import { useEffect, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities, usePlayers, useMatchPlanning, useAppInitialized, useAppLoading } from '../store';
import { ActionDock, ActionDockContent, Alert, Button, ContentGrid, EmptyState, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, Tab, TabList } from '../components/ui';
import UnsavedLineupDialog from '../components/UnsavedLineupDialog';
import LineupSummaryView from '../components/teamLineup/LineupSummaryView';
import LineupEditorView from '../components/teamLineup/LineupEditorView';
import LineupBenchView from '../components/teamLineup/LineupBenchView';
import {
  selectMatchFormatById, selectFormationById, selectBenchedPlayers,
  selectAssignablePlayersForSlot, selectPlannedPeriodCounts,
  selectMinimumPeriodViolations, selectLineupSummary, selectLineupShirtNumberRows,
  selectLineupRouteTab,
  selectHasLineupChanges, hasLineupRosterMismatch,
} from '../store/selectors/matchPlanningSelectors';
import { assignLineupPlayer, copyLineupPeriod, dropLineupPlayer } from '../store/selectors/lineupTransitions';
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
  const team = event?.teams.find((item) => item.id === teamId);
  const matchFormat = selectMatchFormatById(matchFormats, event?.kind === 'match' ? event.matchFormatId : undefined);
  const formation = selectFormationById(formations, team?.formationId);
  const activeTab = selectLineupRouteTab(lineupTab, matchFormat?.numberOfPeriods);

  const [draftLineup, setDraftLineup] = useState<TeamLineupPeriod[]>(team?.lineup ?? []);
  const [savedLineup, setSavedLineup] = useState<TeamLineupPeriod[]>(team?.lineup ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectingSlotId, setSelectingSlotId] = useState<string | null>(null);

  // Reset the draft when changing teams, but preserve in-progress edits on store refresh.
  useEffect(() => {
    const persistedLineup = team?.lineup ?? [];
    setDraftLineup(persistedLineup);
    setSavedLineup(persistedLineup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id]);

  const hasChanges = selectHasLineupChanges(savedLineup, draftLineup);
  const lineupPath = `/activities/${eventId}/teams/${teamId}/lineup`;
  const navigationBlocker = useBlocker(({ nextLocation }) => {
    const remainsInLineup = nextLocation.pathname === lineupPath || nextLocation.pathname.startsWith(`${lineupPath}/`);
    return hasChanges && !remainsInLineup;
  });

  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  if (!isInitialized || isLoading) return <Page><EmptyState>{t('page.teamLineup.loading')}</EmptyState></Page>;
  if (!event || event.kind !== 'match' || !team) return <Page><EmptyState>{t('page.teamLineup.teamNotFound')}</EmptyState></Page>;
  if (!matchFormat || !formation) return <Page><EmptyState>{t('page.teamLineup.notConfigured')}</EmptyState></Page>;

  const isCancelled = event.status === 'cancelled';
  const activePeriod = typeof activeTab === 'number' ? activeTab : 1;
  const draftTeam: Team = { ...team, lineup: draftLineup };
  const benchedPlayers = selectBenchedPlayers(draftTeam, players, activePeriod);
  const plannedPeriodCounts = selectPlannedPeriodCounts(draftTeam);
  const minimumPeriodViolations = selectMinimumPeriodViolations(draftTeam, players, matchFormat.minimumPeriodsPerPlayer);
  const hasMismatch = hasLineupRosterMismatch(draftTeam, activePeriod);
  const lineupSummary = selectLineupSummary(draftTeam, formation, players, matchFormat.numberOfPeriods);
  const shirtNumberRows = selectLineupShirtNumberRows(draftTeam, players);
  const currentPeriodSummary = lineupSummary.find((period) => period.periodNumber === activePeriod);
  const assignablePlayers = selectingSlotId
    ? selectAssignablePlayersForSlot(draftTeam, players, activePeriod, selectingSlotId)
    : [];

  const handleAssignSlot = (slotId: string, playerId: string) => {
    if (isCancelled) return;
    setDraftLineup((current) => assignLineupPlayer(current, activePeriod, slotId, playerId));
    setSelectingSlotId(null);
  };

  const handleDropOnSlot = (slotId: string, playerId: string) => {
    if (isCancelled) return;
    setDraftLineup((current) => dropLineupPlayer(current, activePeriod, playerId, slotId));
  };

  const handleDropOnBench = (playerId: string) => {
    if (isCancelled) return;
    setDraftLineup((current) => dropLineupPlayer(current, activePeriod, playerId, null));
  };

  const handleCopyPreviousPeriod = () => {
    if (isCancelled || activePeriod <= 1) return;
    setDraftLineup((current) => copyLineupPeriod(current, activePeriod - 1, activePeriod));
  };

  const handleSave = async (): Promise<boolean> => {
    if (isCancelled || !eventId || !hasChanges) return false;
    setIsSaving(true);
    setSaveError(null);
    const updatedTeams = event.teams.map((item) => item.id === teamId ? { ...item, lineup: draftLineup } : item);
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

  return <Page actionDock className="lineup-page">
    <PageHeader>
      <PageHeaderContent>
        <p className="eyebrow">{event.name}</p>
        <PageTitle>{t('page.teamLineup.title', { team: team.name })}</PageTitle>
      </PageHeaderContent>
      <PageActions><p className="lineup-context">{matchFormat.name} · {formation.name}</p></PageActions>
    </PageHeader>
    {isCancelled && <Alert tone="warning">{t('page.eventDetail.cancelledReadOnly')}</Alert>}

    <TabList label={t('page.teamLineup.title', { team: team.name })} className="lineup-tabs">
      {Array.from({ length: matchFormat.numberOfPeriods }, (_, index) => index + 1).map((periodNumber) => <Tab key={periodNumber} selected={activeTab === periodNumber} onClick={() => { navigate(`/activities/${eventId}/teams/${teamId}/lineup/${periodNumber}`); setSelectingSlotId(null); }}>
        {t('page.teamLineup.periodLabel', { number: periodNumber })}
      </Tab>)}
      <Tab selected={activeTab === 'summary'} onClick={() => { navigate(`/activities/${eventId}/teams/${teamId}/lineup/summary`); setSelectingSlotId(null); }}>{t('page.teamLineup.summaryTab')}</Tab>
    </TabList>

    {activeTab === 'summary' ? <LineupSummaryView
      teamName={team.name}
      matchFormatName={matchFormat.name}
      formationName={formation.name}
      periods={lineupSummary}
      shirtNumberRows={shirtNumberRows}
      violations={minimumPeriodViolations}
    /> : <>
      {hasMismatch && <Alert tone="warning" className="lineup-alert">{t('page.teamLineup.rosterMismatchWarning')}</Alert>}
      <ContentGrid variant="editor">
        <LineupEditorView formationName={formation.name} period={currentPeriodSummary} selectingSlotId={selectingSlotId} assignablePlayers={assignablePlayers} readOnly={isCancelled} onSelectSlot={setSelectingSlotId} onAssign={handleAssignSlot} onDrop={handleDropOnSlot} onCopyPreviousPeriod={activePeriod > 1 ? handleCopyPreviousPeriod : undefined} />
        <LineupBenchView players={benchedPlayers} plannedPeriodCounts={plannedPeriodCounts} totalPeriods={matchFormat.numberOfPeriods} readOnly={isCancelled} onDrop={handleDropOnBench} />
      </ContentGrid>
    </>}

    <ActionDock><ActionDockContent>
      {saveError ? <p className="lineup-save-error" role="alert">{saveError}</p> : <span className="lineup-save-status">{hasChanges ? t('page.teamLineup.unsavedChangesTitle') : t('page.teamLineup.plannedPlayersSummary', { count: plannedPeriodCounts.size, total: matchFormat.numberOfPeriods })}</span>}
      <PageActions>
        <Button variant="secondary" onClick={() => navigate(`/activities/${eventId}/teams/${teamId}`)}>{t('common.actions.cancel')}</Button>
        <Button variant="primary" onClick={handleSave} disabled={isCancelled || !hasChanges || isSaving}>{t('common.actions.save')}</Button>
      </PageActions>
    </ActionDockContent></ActionDock>
    <UnsavedLineupDialog isOpen={navigationBlocker.state === 'blocked'} isSaving={isSaving} onSave={handleSaveAndLeave} onDiscard={() => navigationBlocker.state === 'blocked' && navigationBlocker.proceed()} onCancel={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()} />
  </Page>;
}
