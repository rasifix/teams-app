import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { useSquad, useStore, useTrainers } from '../store/useStore';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { usePlayers, useAppLoading, useAppHasErrors, useAppErrors, useShirtSets } from '../store';
import type { ActivityAttendance, ActivityInvitation, ActivityPayload, InvitationDeclineReason, InvitationResponse, Team } from '../types';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import EditEventModal from '../components/EditEventModal';
import ActivityAttendanceCard from '../components/ActivityAttendanceCard';
import ConfirmDialog from '../components/ConfirmDialog';
import TeamPrintSummary from '../components/TeamPrintSummary';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import { formatDate, formatInstantDateTime } from '../utils/dateFormatter';
import { getActivityDate, getActivityStartTime, selectSelectedPlayerIds, shouldRemovePlayerFromSelection } from '../store/selectors/activitySelectors';
import { selectActivityPhase, selectActivityPhaseSections } from '../store/selectors/activityLifecycleSelectors';
import { selectAdjacentActivities, selectCanAddActivityTeam, selectMinimumActivityMaxPlayers } from '../store/selectors/activityViewSelectors';
import { selectTeamResponsiblePeople } from '../store/selectors/teamTrainerSelectors';
import { selectTeamPlayersByName } from '../store/selectors/teamPlayerSelectors';
import { removePlayerFromSelection, selectSelectionEditState, selectSelectionValidation } from '../store/selectors/selectionSelectors';
import Strength from '../components/Strength';
import Level from '../components/Level';
import { AddCardButton, AdjacentNavigation, AdjacentNavigationLabel, Alert, Badge, Button, Cluster, ContentGrid, EmptyState, EntityContent, EntityList, EntityRow, EntityTitle, IconButton, MetadataItem, MetadataList, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, Panel, PanelActions, PanelHeader, PanelTitle, Stack } from '../components/ui';

export default function EventDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activities, getActivityById, updateActivity, updateActivityInvitation, updateActivityTeams, updateActivitySelection, markActivitySelectionSent, updateActivityAttendance, deleteActivity, cancelActivity, restoreActivity } = useActivities();
  const { players } = usePlayers();
  const { shirtSets } = useShirtSets();
  const { user } = useAuth();
  const squad = useSquad();
  const trainers = useTrainers();
  const getTeamAverageLevel = useStore((state) => state.getTeamAverageLevel);
  const spondLinked = selectIsSpondLinked(squad);
  const canManage = canAccessRestrictedManagement(user, { squad, trainers });
  const loading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  const activity = id ? getActivityById(id) : undefined;
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);
  const [isSendingSelection, setIsSendingSelection] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const { previous, next } = selectAdjacentActivities(activities, activity?.id ?? '');
  const error = !id ? t('page.eventDetail.errors.noEventId') : errors.activities || (hasErrors ? t('common.errors.failedToLoadData') : null);

  const persistTeams = async (teams: Team[]) => {
    if (activity) await updateActivityTeams(activity.id, teams);
  };

  const handleInvite = async (playerIds: string[], response: InvitationResponse) => {
    if (!activity) return;
    const invitations: ActivityInvitation[] = [
      ...activity.invitations,
      ...playerIds.map((playerId) => ({ id: crypto.randomUUID(), playerId, response })),
    ];
    await updateActivity(activity.id, { invitations });
  };

  const handleInvitationStatusChange = async (invitationId: string, response: InvitationResponse, declineReason?: InvitationDeclineReason) => {
    const invitation = activity?.invitations.find((entry) => entry.id === invitationId);
    if (!activity || !invitation) return;
    const saved = await updateActivityInvitation(activity.id, invitation.playerId, { response, declineReason: response === 'declined' ? declineReason : undefined });
    if (saved && shouldRemovePlayerFromSelection(invitation.response, response)) {
      await updateActivitySelection(activity.id, removePlayerFromSelection(activity.teams, invitation.playerId));
    }
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    if (!activity) return;
    await updateActivity(activity.id, { invitations: activity.invitations.filter((entry) => entry.id !== invitationId) });
  };

  const handleAddTeam = async () => {
    if (!activity || !selectCanAddActivityTeam(activity)) return;
    await persistTeams([...activity.teams, {
      id: crypto.randomUUID(),
      name: `${t('domain.team.label')} ${activity.teams.length + 1}`,
      strength: 2,
      startTime: getActivityStartTime(activity),
      selectedPlayers: [],
    }]);
  };

  const handleRecordAttendance = async (attendance: ActivityAttendance[]) => {
    if (activity) await updateActivityAttendance(activity.id, attendance);
  };

  const handleMarkSelectionSent = async () => {
    if (!activity) return;
    const validation = selectSelectionValidation(activity);
    if (!validation.canSend) {
      setSelectionError(t('page.eventDetail.errors.selectionMinimumRequired', {
        count: activity.minPlayersPerTeam ?? 0,
      }));
      return;
    }
    setSelectionError(null);
    setIsSendingSelection(true);
    await markActivitySelectionSent(activity.id);
    setIsSendingSelection(false);
  };

  const handleDeleteActivity = async () => {
    if (activity && await deleteActivity(activity.id)) navigate('/activities');
  };

  const handleCancelActivity = async () => {
    if (activity) await cancelActivity(activity.id);
    setIsCancelOpen(false);
  };

  const handleRestoreActivity = async () => {
    if (activity) await restoreActivity(activity.id);
    setIsRestoreOpen(false);
  };

  if (loading) return <Page><EmptyState><p>{t('page.eventDetail.loading')}</p></EmptyState></Page>;
  if (error) return <Page><EmptyState><Alert>{error}</Alert></EmptyState></Page>;
  if (!activity) return <Page><EmptyState><p>{t('page.eventDetail.notFound')}</p></EmptyState></Page>;

  const phase = selectActivityPhase(activity);
  const sections = selectActivityPhaseSections(phase);
  const selectionEditState = selectSelectionEditState(activity);
  const assignedPlayerIds = selectSelectedPlayerIds(activity);
  const assignedIds = Array.from(assignedPlayerIds);
  const renderTeam = (team: Team) => {
    const teamTime = activity.kind === 'match' ? getActivityStartTime(activity) : team.startTime || getActivityStartTime(activity);
    const teamLocation = activity.kind === 'match' ? activity.location : team.location || activity.location;
    const hasDifferentTime = teamTime !== getActivityStartTime(activity);
    const hasDifferentLocation = teamLocation !== activity.location;
    const selectedPlayers = selectTeamPlayersByName(team, players);
    const responsiblePeople = selectTeamResponsiblePeople(team.responsiblePersonId, trainers, players);

    return <article key={team.id} aria-label={t('page.events.teamCardLabel', { team: team.name })} className="event-detail-team-card">
      <div className="event-detail-team-header">
        <div className="event-detail-team-main">
          <Cluster gap="sm">
            {team.name}
            <Strength level={team.strength || 2} className="event-detail-team-strength" />
            <Badge>👥 {selectedPlayers.length}/{activity.maxPlayersPerTeam ?? players.length}</Badge>
            {selectedPlayers.length > 0 && <Badge>⭐ {getTeamAverageLevel(team).toFixed(1)}</Badge>}
          </Cluster>
          {(hasDifferentTime || hasDifferentLocation) && <p className="event-detail-team-overrides">
            {hasDifferentTime && <>🕐 {teamTime}</>}
            {hasDifferentLocation && <span className={hasDifferentTime ? 'event-detail-location-offset' : ''}>📍 {teamLocation}</span>}
          </p>}
          {responsiblePeople.length > 0 && <p className="event-detail-responsible">
            👤 {responsiblePeople.map((person) => person.firstName + ' ' + person.lastName).join(', ')}
          </p>}
        </div>
        <IconButton
          label={t('page.events.openTeamDetails', { team: team.name })}
          onClick={() => navigate(`/activities/${activity.id}/teams/${team.id}`)}
        >
          <svg className="icon-sm" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </IconButton>
      </div>
      <div className="event-detail-roster">
        {selectedPlayers.length > 0 ? <EntityList variant="bare">
          {selectedPlayers.map((player) => {
            const shirtNumber = team.shirtAssignments?.find((assignment) => assignment.playerId === player.id)?.shirtNumber;
            return <EntityRow key={player.id} density="compact">
            {shirtNumber && shirtNumber > 0 && <span className="event-detail-shirt-number">{shirtNumber}</span>}
            <EntityContent><EntityTitle>{player.firstName} {player.lastName}</EntityTitle></EntityContent>
            <Level level={player.level} className="event-detail-player-level" />
          </EntityRow>;
          })}
        </EntityList> : <p className="event-detail-empty-roster">{t('page.teamDetail.noPlayersSelected')}</p>}
      </div>
    </article>;
  };

  return <Page>
    <AdjacentNavigation aria-label={t('page.eventDetail.navigationLabel')}>
        {previous ? <Button variant="ghost" size="sm" onClick={() => navigate(`/activities/${previous.id}`)} className="event-detail-navigation-button">← {previous.name}</Button> : <span />}
        <AdjacentNavigationLabel>{t('page.eventDetail.navigationLabel')}</AdjacentNavigationLabel>
        {next ? <Button variant="ghost" size="sm" onClick={() => navigate(`/activities/${next.id}`)} className="event-detail-navigation-button">{next.name} →</Button> : <span />}
    </AdjacentNavigation>
    <PageHeader align="start">
        <PageHeaderContent>
          <Cluster gap="sm">
            <PageTitle>{activity.name}</PageTitle>
            <Badge tone="brand" size="sm">{t(`domain.activity.kinds.${activity.kind}`)}</Badge>
            {activity.status === 'cancelled' && <Badge tone="danger" size="sm">{t('page.eventDetail.cancelled')}</Badge>}
            <Badge tone="info" size="sm" data-testid="activity-phase">{t(`page.eventDetail.phases.${phase}`)}</Badge>
          </Cluster>
          <MetadataList>
            <MetadataItem>📅 {formatDate(getActivityDate(activity))}</MetadataItem>
            <MetadataItem>🕐 {getActivityStartTime(activity)}</MetadataItem>
            {activity.location && <MetadataItem>📍 {activity.location}</MetadataItem>}
          </MetadataList>
          {activity.kind === 'match' && activity.opponentName && <p className="event-detail-opponent">{t('domain.activity.fields.opponent')}: {activity.opponentName}</p>}
        </PageHeaderContent>
        <PageActions>
          {activity.status === 'active' && <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>{t('common.actions.edit')}</Button>}
          {canManage && !spondLinked && activity.status === 'active' && <Button type="button" variant="ghost" size="sm" onClick={() => setIsCancelOpen(true)}>{t('page.eventDetail.cancelActivity')}</Button>}
          {canManage && !spondLinked && activity.status === 'cancelled' && <Button type="button" variant="secondary" size="sm" onClick={() => setIsRestoreOpen(true)}>{t('page.eventDetail.restoreActivity')}</Button>}
          {canManage && !spondLinked && <Button type="button" variant="ghost" size="sm" onClick={() => setIsDeleteOpen(true)}>{t('common.actions.delete')}</Button>}
        </PageActions>
    </PageHeader>

    {activity.status === 'cancelled' && <Alert tone="warning">{t('page.eventDetail.cancelledReadOnly')}</Alert>}

    <ContentGrid variant="equal" className="event-detail-content-grid">
      <Panel>
        <PanelHeader className="ui-responsive-action-row">
          <PanelTitle>{t('page.eventDetail.teamsTitle')}</PanelTitle>
          <PanelActions>
            {activity.teams.length > 0 && <Button type="button" variant="secondary" size="sm" onClick={() => setIsPrintSummaryOpen(true)}>{t('page.eventDetail.printTeams')}</Button>}
            {!selectionEditState.isSent && selectionEditState.canEdit && activity.teams.length > 0 && (
              <Button type="button" size="sm" disabled={isSendingSelection} onClick={() => void handleMarkSelectionSent()}>
                {t('page.eventDetail.markSelectionSent')}
              </Button>
            )}
          </PanelActions>
        </PanelHeader>
        {selectionError && <Alert tone="warning">{selectionError}</Alert>}
        {activity.selectionSentAt && <Alert tone="success" className="event-detail-selection-alert">
          {t('page.eventDetail.selectionSentAt', { dateTime: formatInstantDateTime(activity.selectionSentAt, i18n.language) })}
        </Alert>}
        {activity.teams.length === 0 && !selectCanAddActivityTeam(activity) && <Alert tone="warning">{t('domain.activity.noTeamsLegacy')}</Alert>}
        <Stack gap="sm">
          {activity.kind === 'match' ? activity.teams[0] && renderTeam(activity.teams[0]) : activity.teams.map(renderTeam)}
          {selectCanAddActivityTeam(activity) && <AddCardButton cardSize="sm" onClick={() => void handleAddTeam()} label={t('page.eventDetail.addTeam')} />}
        </Stack>
      </Panel>
      {sections.invitations && <PlayerInvitationsCard
        invitations={activity.invitations}
        currentActivity={activity}
        players={players}
        readOnly={spondLinked || activity.status === 'cancelled' || phase !== 'planning'}
        allowDeclineReasonEdit={spondLinked && activity.status === 'active'}
        onInviteClick={() => setIsInviteOpen(true)}
        onStatusChange={handleInvitationStatusChange}
        onRemoveInvitation={handleRemoveInvitation}
        assignedPlayerIds={assignedIds}
      />}
      {canManage && sections.attendance && <ActivityAttendanceCard activity={activity} players={players} readOnly={activity.status === 'cancelled'} onSave={handleRecordAttendance} />}
    </ContentGrid>

    {!spondLinked && activity.status === 'active' && <InvitePlayersModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onInvite={handleInvite} alreadyInvitedPlayerIds={activity.invitations.map((invitation) => invitation.playerId)} players={players} />}
    {activity.status === 'active' && <EditEventModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={(data: Partial<ActivityPayload>) => { void updateActivity(activity.id, data); }} currentActivity={activity} minMaxPlayers={selectMinimumActivityMaxPlayers(activity)} />}
    <ConfirmDialog isOpen={isCancelOpen} title={t('page.eventDetail.cancelActivityTitle')} message={t('page.eventDetail.cancelActivityMessage', { name: activity.name })} confirmText={t('page.eventDetail.cancelActivity')} cancelText={t('common.actions.cancel')} onConfirm={handleCancelActivity} onCancel={() => setIsCancelOpen(false)} confirmButtonColor="blue" />
    <ConfirmDialog isOpen={isRestoreOpen} title={t('page.eventDetail.restoreActivityTitle')} message={t('page.eventDetail.restoreActivityMessage', { name: activity.name })} confirmText={t('page.eventDetail.restoreActivity')} cancelText={t('common.actions.cancel')} onConfirm={handleRestoreActivity} onCancel={() => setIsRestoreOpen(false)} confirmButtonColor="green" />
    <ConfirmDialog isOpen={isDeleteOpen} title={t('page.eventDetail.deleteEventTitle')} message={t('page.eventDetail.deleteEventMessage', { name: activity.name })} confirmText={t('common.actions.delete')} cancelText={t('common.actions.cancel')} onConfirm={handleDeleteActivity} onCancel={() => setIsDeleteOpen(false)} confirmButtonColor="red" />
    <TeamPrintSummary event={activity} teams={activity.teams} players={players} trainers={trainers} shirtSets={shirtSets} club={squad?.club} isOpen={isPrintSummaryOpen} onClose={() => setIsPrintSummaryOpen(false)} />
  </Page>;
}
