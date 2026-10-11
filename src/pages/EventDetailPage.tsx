import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { useSquad, useTrainers } from '../store/useStore';
import { canAccessRestrictedManagement } from '../utils/permissions';
import { usePlayers, useAppLoading, useAppHasErrors, useAppErrors } from '../store';
import type { ActivityAttendance, ActivityInvitation, ActivityPayload, InvitationDeclineReason, InvitationResponse, Team } from '../types';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import EditEventModal from '../components/EditEventModal';
import ActivityAttendanceCard from '../components/ActivityAttendanceCard';
import ActivityTasksCard from '../components/ActivityTasksCard';
import { canSignUpForTasks, selectCurrentMember } from '../store/selectors/taskSelectors';
import ConfirmDialog from '../components/ConfirmDialog';
import SpondBadge from '../components/SpondBadge';
import { formatDate } from '../utils/dateFormatter';
import { getActivityDate, getActivityStartTime, selectSelectedPlayerIds, sortActivities } from '../store/selectors/activitySelectors';
import { selectActivityPhase, selectActivityPhaseSections } from '../store/selectors/activityLifecycleSelectors';
import { selectMinimumActivityMaxPlayers } from '../store/selectors/activityViewSelectors';

export default function EventDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activities, getActivityById, updateActivity, updateActivityInvitation, updateActivityTeams, updateActivityAttendance, addActivityTask, updateActivityTask, deleteActivityTask, signUpForActivityTask, withdrawFromActivityTask, deleteActivity } = useActivities();
  const { players } = usePlayers();
  const { user } = useAuth();
  const squad = useSquad();
  const trainers = useTrainers();
  const currentMember = selectCurrentMember(user?.email, squad);
  const canManage = canAccessRestrictedManagement(user, { squad, trainers });
  const loading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  const activity = id ? getActivityById(id) : undefined;
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const sortedActivities = sortActivities(activities);
  const currentIndex = activity ? sortedActivities.findIndex((entry) => entry.id === activity.id) : -1;
  const previous = currentIndex > 0 ? sortedActivities[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 ? sortedActivities[currentIndex + 1] : undefined;
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

  const handleDeleteActivity = async () => {
    if (activity && await deleteActivity(activity.id)) navigate('/events');
  };

  if (loading) return <div className="page-container"><div className="empty-state"><p>{t('eventDetail.loading')}</p></div></div>;
  if (error) return <div className="page-container"><div className="empty-state"><p className="text-red-600">{error}</p></div></div>;
  if (!activity) return <div className="page-container"><div className="empty-state"><p>{t('eventDetail.notFound')}</p></div></div>;

  const phase = selectActivityPhase(activity);
  const sections = selectActivityPhaseSections(phase);
  const assignedPlayerIds = selectSelectedPlayerIds(activity);
  const assignedIds = Array.from(assignedPlayerIds);
  const renderTeam = (team: Team) => {
    return <article key={team.id} className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => navigate('/events/' + activity.id + '/teams/' + team.id)} className="font-semibold text-blue-700">{team.name}</button>
        <span className="text-sm text-gray-600">{team.startTime}</span>
      </div>
      <div className="space-y-2">
        {team.selectedPlayers.map((playerId) => {
          const player = players.find((entry) => entry.id === playerId);
          return <div key={playerId} className="flex items-center justify-between text-sm">
            <span>{player ? `${player.firstName} ${player.lastName}` : playerId}</span>
          </div>;
        })}
      </div>
    </article>;
  };

  return <div className="page-container lg:px-4 px-0">
    <header className="page-header mb-6 px-4 lg:px-0">
      <div className="mb-4 flex items-center justify-between text-sm">
        {previous ? <button type="button" onClick={() => navigate(`/events/${previous.id}`)} className="text-blue-600">← {previous.name}</button> : <span />}
        <span className="font-medium text-gray-900">{activity.name}</span>
        {next ? <button type="button" onClick={() => navigate(`/events/${next.id}`)} className="text-blue-600">{next.name} →</button> : <span />}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="page-subtitle">📅 {formatDate(getActivityDate(activity))} · 🕐 {getActivityStartTime(activity)}{activity.location && <span className="ml-3">📍 {activity.location}</span>}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700"><span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium">{t(`activity.kinds.${activity.kind}`)}</span>{activity.spondId && <SpondBadge />}{activity.kind === 'match' && activity.opponentName && <span>{t('activity.fields.opponent')}: {activity.opponentName}</span>}<span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800" data-testid="activity-phase">{t(`eventDetail.phases.${phase}`)}</span></div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => setIsEditOpen(true)} className="text-sm font-medium text-blue-600">{t('common.actions.edit')}</button>
          <button type="button" onClick={() => setIsDeleteOpen(true)} className="text-sm font-medium text-red-600">{t('common.actions.delete')}</button>
        </div>
      </div>
    </header>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-gray-200 bg-white p-4 lg:p-6">
        {activity.kind === 'tournament' ? <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{t('eventDetail.teamsTitle')}</h2><button type="button" onClick={handleAddTeam} className="btn-primary btn-sm">{t('common.actions.add')}</button></div> : null}
        {activity.teams.length === 0 ? <p className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{t('activity.noTeamsLegacy')}</p> : <div className="space-y-3">
          {activity.kind === 'match' ? renderTeam(activity.teams[0]) : activity.teams.map(renderTeam)}
        </div>}
      </section>
      {sections.invitations && <PlayerInvitationsCard
        invitations={activity.invitations}
        currentActivity={activity}
        players={players}
        onInviteClick={() => setIsInviteOpen(true)}
        onStatusChange={handleInvitationStatusChange}
        onRemoveInvitation={handleRemoveInvitation}
        assignedPlayerIds={assignedIds}
      />}
      {sections.tasks && <ActivityTasksCard
        tasks={activity.tasks}
        currentPersonId={currentMember?.id}
        canManage={canManage}
        canSignUp={canSignUpForTasks(currentMember)}
        onAdd={(task) => addActivityTask(activity.id, task)}
        onUpdate={(taskId, task) => updateActivityTask(activity.id, taskId, task)}
        onDelete={(taskId) => deleteActivityTask(activity.id, taskId)}
        onSignUp={(taskId) => signUpForActivityTask(activity.id, taskId)}
        onWithdraw={(taskId) => withdrawFromActivityTask(activity.id, taskId)}
      />}
      {canManage && sections.attendance && <ActivityAttendanceCard activity={activity} players={players} onSave={handleRecordAttendance} />}
    </div>

    <InvitePlayersModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onInvite={handleInvite} alreadyInvitedPlayerIds={activity.invitations.map((invitation) => invitation.playerId)} players={players} />
    <EditEventModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={(data: Partial<ActivityPayload>) => { void updateActivity(activity.id, data); }} currentActivity={activity} minMaxPlayers={selectMinimumActivityMaxPlayers(activity)} />
    <ConfirmDialog isOpen={isDeleteOpen} title={t('eventDetail.deleteEventTitle')} message={t('eventDetail.deleteEventMessage', { name: activity.name })} confirmText={t('common.actions.delete')} cancelText={t('common.actions.cancel')} onConfirm={handleDeleteActivity} onCancel={() => setIsDeleteOpen(false)} confirmButtonColor="red" />
  </div>;
}
