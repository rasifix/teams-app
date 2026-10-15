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
import { selectIsSpondLinked } from '../store/selectors/groupSettingsSelectors';
import { formatDate, formatInstantDateTime } from '../utils/dateFormatter';
import { getActivityDate, getActivityStartTime, selectSelectedPlayerIds, sortActivities } from '../store/selectors/activitySelectors';
import { selectActivityPhase, selectActivityPhaseSections } from '../store/selectors/activityLifecycleSelectors';
import { selectMinimumActivityMaxPlayers } from '../store/selectors/activityViewSelectors';
import { selectTeamResponsiblePeople } from '../store/selectors/teamTrainerSelectors';
import { selectTeamPlayersByName } from '../store/selectors/teamPlayerSelectors';
import { selectSelectionEditState } from '../store/selectors/selectionSelectors';
import Strength from '../components/Strength';
import Level from '../components/Level';
import { Button } from '../components/ui';

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

  const handleMarkSelectionSent = async () => {
    if (!activity) return;
    setIsSendingSelection(true);
    await markActivitySelectionSent(activity.id);
    setIsSendingSelection(false);
  };

  const handleDeleteActivity = async () => {
    if (activity && await deleteActivity(activity.id)) navigate('/events');
  };

  if (loading) return <div className="page-container"><div className="empty-state"><p>{t('eventDetail.loading')}</p></div></div>;
  if (error) return <div className="page-container"><div className="empty-state"><p className="text-red-600">{error}</p></div></div>;
  if (!activity) return <div className="page-container"><div className="empty-state"><p>{t('eventDetail.notFound')}</p></div></div>;

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

    return <article key={team.id} aria-label={t('events.teamCardLabel', { team: team.name })} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/events/${activity.id}/teams/${team.id}`)}
              aria-label={t('events.openTeamDetails', { team: team.name })}
              className="font-semibold text-slate-950 transition hover:text-orange-600"
            >
              {team.name}
            </button>
            <Strength level={team.strength || 2} className="text-xs" />
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">👥 {selectedPlayers.length}/{activity.maxPlayersPerTeam ?? players.length}</span>
            {selectedPlayers.length > 0 && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">⭐ {getTeamAverageLevel(team).toFixed(1)}</span>}
          </div>
          {(hasDifferentTime || hasDifferentLocation) && <p className="mt-2 text-sm text-slate-500">
            {hasDifferentTime && <>🕐 {teamTime}</>}
            {hasDifferentLocation && <span className={hasDifferentTime ? 'ml-3' : ''}>📍 {teamLocation}</span>}
          </p>}
          {responsiblePeople.length > 0 && <p className="mt-1 text-sm text-slate-600">
            👤 {responsiblePeople.map((person) => person.firstName + ' ' + person.lastName).join(', ')}
          </p>}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/events/${activity.id}/teams/${team.id}`)}
          aria-label={t('events.openTeamDetails', { team: team.name })}
          className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="border-t border-slate-200 bg-white px-4 py-2 sm:px-5">
        {selectedPlayers.length > 0 ? <ul className="divide-y divide-slate-100">
          {selectedPlayers.map((player) => {
            const shirtNumber = team.shirtAssignments?.find((assignment) => assignment.playerId === player.id)?.shirtNumber;
            return <li key={player.id} className="flex h-10 items-center gap-2 text-sm text-slate-700">
            {shirtNumber && shirtNumber > 0 && <span className="w-6 text-xs font-extrabold text-slate-800">{shirtNumber}</span>}
            <span className="min-w-0 flex-1 truncate">{player.firstName} {player.lastName}</span>
            <Level level={player.level} className="text-base" />
          </li>;
          })}
        </ul> : <p className="py-2 text-sm text-slate-500">{t('teamDetail.noPlayersSelected')}</p>}
      </div>
    </article>;
  };

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <header className="mb-6">
      <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-200 pb-4 text-sm">
        {previous ? <button type="button" onClick={() => navigate(`/events/${previous.id}`)} className="min-w-0 truncate text-left font-semibold text-slate-500 transition hover:text-slate-950">← {previous.name}</button> : <span />}
        <span className="hidden text-[11px] font-bold uppercase tracking-[0.075em] text-slate-400 sm:block">{t('eventDetail.navigationLabel')}</span>
        {next ? <button type="button" onClick={() => navigate(`/events/${next.id}`)} className="min-w-0 truncate text-right font-semibold text-slate-500 transition hover:text-slate-950">{next.name} →</button> : <span />}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{activity.name}</h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-700">{t(`activity.kinds.${activity.kind}`)}</span>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700" data-testid="activity-phase">{t(`eventDetail.phases.${phase}`)}</span>
          </div>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>📅 {formatDate(getActivityDate(activity))}</span>
            <span>🕐 {getActivityStartTime(activity)}</span>
            {activity.location && <span>📍 {activity.location}</span>}
          </p>
          {activity.kind === 'match' && activity.opponentName && <p className="mt-2 text-sm font-medium text-slate-700">{t('activity.fields.opponent')}: {activity.opponentName}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setIsEditOpen(true)} className="btn-secondary btn-sm">{t('common.actions.edit')}</button>
          {!spondLinked && <button type="button" onClick={() => setIsDeleteOpen(true)} className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">{t('common.actions.delete')}</button>}
        </div>
      </div>
    </header>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('eventDetail.teamsTitle')}</h2>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {activity.kind === 'tournament' && <button type="button" onClick={handleAddTeam} className="btn-secondary btn-sm">{t('common.actions.add')}</button>}
            {!selectionEditState.isSent && selectionEditState.canEdit && activity.teams.length > 0 && (
              <Button type="button" className="btn-sm" disabled={isSendingSelection} onClick={() => void handleMarkSelectionSent()}>
                {t('eventDetail.markSelectionSent')}
              </Button>
            )}
          </div>
        </div>
        {activity.selectionSentAt && <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t('eventDetail.selectionSentAt', { dateTime: formatInstantDateTime(activity.selectionSentAt, i18n.language) })}
        </p>}
        {activity.teams.length === 0 ? <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{t('activity.noTeamsLegacy')}</p> : <div className="space-y-3">
          {activity.kind === 'match' ? renderTeam(activity.teams[0]) : activity.teams.map(renderTeam)}
        </div>}
      </section>
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
    </div>

    {!spondLinked && <InvitePlayersModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onInvite={handleInvite} alreadyInvitedPlayerIds={activity.invitations.map((invitation) => invitation.playerId)} players={players} />}
    <EditEventModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={(data: Partial<ActivityPayload>) => { void updateActivity(activity.id, data); }} currentActivity={activity} minMaxPlayers={selectMinimumActivityMaxPlayers(activity)} />
    <ConfirmDialog isOpen={isDeleteOpen} title={t('eventDetail.deleteEventTitle')} message={t('eventDetail.deleteEventMessage', { name: activity.name })} confirmText={t('common.actions.delete')} cancelText={t('common.actions.cancel')} onConfirm={handleDeleteActivity} onCancel={() => setIsDeleteOpen(false)} confirmButtonColor="red" />
  </div>;
}
