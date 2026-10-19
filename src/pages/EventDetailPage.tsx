import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { useSquad, useStore, useTrainers } from '../store/useStore';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { usePlayers, useAppLoading, useAppHasErrors, useAppErrors } from '../store';
import type { ActivityAttendance, ActivityInvitation, ActivityPayload, InvitationDeclineReason, InvitationResponse, Team } from '../types';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import EditEventModal from '../components/EditEventModal';
import ActivityAttendanceCard from '../components/ActivityAttendanceCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import { formatDate, formatInstantDateTime } from '../utils/dateFormatter';
import { getActivityDate, getActivityStartTime, selectSelectedPlayerIds } from '../store/selectors/activitySelectors';
import { selectActivityPhase, selectActivityPhaseSections } from '../store/selectors/activityLifecycleSelectors';
import { selectAdjacentActivities, selectMinimumActivityMaxPlayers } from '../store/selectors/activityViewSelectors';
import { selectTeamResponsiblePeople } from '../store/selectors/teamTrainerSelectors';
import { selectTeamPlayersByName } from '../store/selectors/teamPlayerSelectors';
import { selectSelectionEditState } from '../store/selectors/selectionSelectors';
import Strength from '../components/Strength';
import Level from '../components/Level';
import { AdjacentNavigation, AdjacentNavigationLabel, Alert, Badge, Button, Cluster, ContentGrid, EmptyState, EntityContent, EntityList, EntityRow, EntityTitle, IconButton, MetadataItem, MetadataList, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, Panel, PanelActions, PanelHeader, PanelTitle, Stack } from '../components/ui';

export default function EventDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activities, getActivityById, updateActivity, updateActivityInvitation, updateActivityTeams, markActivitySelectionSent, updateActivityAttendance, deleteActivity } = useActivities();
  const { players } = usePlayers();
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
  const [isSendingSelection, setIsSendingSelection] = useState(false);
  const { previous, next } = selectAdjacentActivities(activities, activity?.id ?? '');
  const error = !id ? t('eventDetail.errors.noEventId') : errors.activities || (hasErrors ? t('eventDetail.errors.failedToLoadData') : null);

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
    await updateActivityInvitation(activity.id, invitation.playerId, { response, declineReason: response === 'declined' ? declineReason : undefined });
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    if (!activity) return;
    await updateActivity(activity.id, { invitations: activity.invitations.filter((entry) => entry.id !== invitationId) });
  };

  const handleAddTeam = async () => {
    if (!activity || activity.kind !== 'tournament') return;
    await persistTeams([...activity.teams, {
      id: crypto.randomUUID(),
      name: `${t('domain.team')} ${activity.teams.length + 1}`,
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
    setIsSendingSelection(true);
    await markActivitySelectionSent(activity.id);
    setIsSendingSelection(false);
  };

  const handleDeleteActivity = async () => {
    if (activity && await deleteActivity(activity.id)) navigate('/events');
  };

  if (loading) return <Page><EmptyState><p>{t('eventDetail.loading')}</p></EmptyState></Page>;
  if (error) return <Page><EmptyState><Alert>{error}</Alert></EmptyState></Page>;
  if (!activity) return <Page><EmptyState><p>{t('eventDetail.notFound')}</p></EmptyState></Page>;

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
    const responsiblePeople = selectTeamResponsiblePeople(team.responsiblePersonIds, trainers, players);

    return <article key={team.id} aria-label={t('events.teamCardLabel', { team: team.name })} className="event-detail-team-card">
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
          label={t('events.openTeamDetails', { team: team.name })}
          onClick={() => navigate(`/events/${activity.id}/teams/${team.id}`)}
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
        </EntityList> : <p className="event-detail-empty-roster">{t('teamDetail.noPlayersSelected')}</p>}
      </div>
    </article>;
  };

  return <Page>
    <AdjacentNavigation aria-label={t('eventDetail.navigationLabel')}>
        {previous ? <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${previous.id}`)} className="event-detail-navigation-button">← {previous.name}</Button> : <span />}
        <AdjacentNavigationLabel>{t('eventDetail.navigationLabel')}</AdjacentNavigationLabel>
        {next ? <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${next.id}`)} className="event-detail-navigation-button">{next.name} →</Button> : <span />}
    </AdjacentNavigation>
    <PageHeader align="start">
        <PageHeaderContent>
          <Cluster gap="sm">
            <PageTitle>{activity.name}</PageTitle>
            <Badge tone="brand" size="sm">{t(`activity.kinds.${activity.kind}`)}</Badge>
            <Badge tone="info" size="sm" data-testid="activity-phase">{t(`eventDetail.phases.${phase}`)}</Badge>
          </Cluster>
          <MetadataList>
            <MetadataItem>📅 {formatDate(getActivityDate(activity))}</MetadataItem>
            <MetadataItem>🕐 {getActivityStartTime(activity)}</MetadataItem>
            {activity.location && <MetadataItem>📍 {activity.location}</MetadataItem>}
          </MetadataList>
          {activity.kind === 'match' && activity.opponentName && <p className="event-detail-opponent">{t('activity.fields.opponent')}: {activity.opponentName}</p>}
        </PageHeaderContent>
        <PageActions>
          <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>{t('common.actions.edit')}</Button>
          {!spondLinked && <Button type="button" variant="ghost" size="sm" onClick={() => setIsDeleteOpen(true)}>{t('common.actions.delete')}</Button>}
        </PageActions>
    </PageHeader>

    <ContentGrid variant="equal">
      <Panel>
        <PanelHeader>
          <PanelTitle>{t('eventDetail.teamsTitle')}</PanelTitle>
          <PanelActions className="event-detail-panel-actions">
            {activity.kind === 'tournament' && <Button type="button" variant="secondary" size="sm" onClick={handleAddTeam}>{t('common.actions.add')}</Button>}
            {!selectionEditState.isSent && selectionEditState.canEdit && activity.teams.length > 0 && (
              <Button type="button" size="sm" disabled={isSendingSelection} onClick={() => void handleMarkSelectionSent()}>
                {t('eventDetail.markSelectionSent')}
              </Button>
            )}
          </PanelActions>
        </PanelHeader>
        {activity.selectionSentAt && <Alert tone="success" className="event-detail-selection-alert">
          {t('eventDetail.selectionSentAt', { dateTime: formatInstantDateTime(activity.selectionSentAt, i18n.language) })}
        </Alert>}
        {activity.teams.length === 0 ? <Alert tone="warning">{t('activity.noTeamsLegacy')}</Alert> : <Stack gap="sm">
          {activity.kind === 'match' ? renderTeam(activity.teams[0]) : activity.teams.map(renderTeam)}
        </Stack>}
      </Panel>
      {sections.invitations && <PlayerInvitationsCard
        invitations={activity.invitations}
        currentActivity={activity}
        players={players}
        readOnly={spondLinked || phase !== 'planning'}
        onInviteClick={() => setIsInviteOpen(true)}
        onStatusChange={handleInvitationStatusChange}
        onRemoveInvitation={handleRemoveInvitation}
        assignedPlayerIds={assignedIds}
      />}
      {canManage && sections.attendance && <ActivityAttendanceCard activity={activity} players={players} onSave={handleRecordAttendance} />}
    </ContentGrid>

    {!spondLinked && <InvitePlayersModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onInvite={handleInvite} alreadyInvitedPlayerIds={activity.invitations.map((invitation) => invitation.playerId)} players={players} />}
    <EditEventModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={(data: Partial<ActivityPayload>) => { void updateActivity(activity.id, data); }} currentActivity={activity} minMaxPlayers={selectMinimumActivityMaxPlayers(activity)} />
    <ConfirmDialog isOpen={isDeleteOpen} title={t('eventDetail.deleteEventTitle')} message={t('eventDetail.deleteEventMessage', { name: activity.name })} confirmText={t('common.actions.delete')} cancelText={t('common.actions.cancel')} onConfirm={handleDeleteActivity} onCancel={() => setIsDeleteOpen(false)} confirmButtonColor="red" />
  </Page>;
}
