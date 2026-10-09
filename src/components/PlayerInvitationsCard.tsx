import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, ActivityInvitation, InvitationDeclineReason, InvitationResponse, Player } from '../types';
import { getInvitationStatus, selectInvitationCounts } from '../store/selectors/activitySelectors';

interface PlayerInvitationsCardProps {
  invitations: ActivityInvitation[];
  currentActivity: Activity;
  players: Player[];
  onInviteClick: () => void;
  onStatusChange: (invitationId: string, response: InvitationResponse, declineReason?: InvitationDeclineReason) => void;
  onRemoveInvitation: (invitationId: string) => void;
  assignedPlayerIds?: string[];
}

export default function PlayerInvitationsCard({
  invitations,
  currentActivity,
  players,
  onInviteClick,
  onStatusChange,
  onRemoveInvitation,
  assignedPlayerIds = [],
}: PlayerInvitationsCardProps) {
  const { t } = useTranslation();
  const [declineReasons, setDeclineReasons] = useState<Record<string, InvitationDeclineReason | ''>>({});
  const counts = selectInvitationCounts(currentActivity);

  return <section className="rounded-lg border border-gray-200 bg-white p-4 lg:p-6">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{t('domain.players')}</h2>
      <button type="button" onClick={onInviteClick} className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">{t('playerInvitations.invite')}</button>
    </div>
    <div className="mb-4 flex flex-wrap gap-3 text-sm text-gray-600">
      <span>{t('invitationStatus.open')}: {counts.open}</span>
      <span>{t('invitationStatus.accepted')}: {counts.accepted}</span>
      <span>{t('invitationStatus.declined')}: {counts.declined}</span>
      {(['injured', 'sick', 'unavailable', 'unspecified'] as const).map((reason) => counts.declineReasons[reason] > 0 && <span key={reason}>{t(`activity.declineReasons.${reason}`)}: {counts.declineReasons[reason]}</span>)}
    </div>
    {invitations.length === 0 ? <p className="py-4 text-center text-gray-500">{t('playerInvitations.empty.noneSent')}</p> : <div className="space-y-2">
      {invitations.map((invitation) => {
        const player = players.find((entry) => entry.id === invitation.playerId);
        const status = getInvitationStatus(invitation);
        const assigned = assignedPlayerIds.includes(invitation.playerId);
        return <div key={invitation.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-gray-900">{player ? `${player.firstName} ${player.lastName}` : invitation.playerId}</p>
            <span className="text-xs text-gray-600">{t(`invitationStatus.${status}`)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label={t('common.labels.status')} value={invitation.response} onChange={(event) => {
              const response = event.target.value as InvitationResponse;
              onStatusChange(invitation.id, response, response === 'declined' ? declineReasons[invitation.id] || undefined : undefined);
            }} className="rounded border border-gray-300 px-2 py-1 text-sm">
              {(['open', 'accepted', 'declined'] as const).map((response) => <option key={response} value={response}>{t(`invitationStatus.${response}`)}</option>)}
            </select>
            {invitation.response === 'declined' && <select aria-label={t('activity.fields.declineReason')} value={declineReasons[invitation.id] ?? invitation.declineReason ?? ''} onChange={(event) => {
              const reason = event.target.value as InvitationDeclineReason | '';
              setDeclineReasons((current) => ({ ...current, [invitation.id]: reason }));
              onStatusChange(invitation.id, 'declined', reason || undefined);
            }} className="rounded border border-gray-300 px-2 py-1 text-sm">
              <option value="">{t('activity.declineReasons.unspecified')}</option>
              {(['injured', 'sick', 'unavailable'] as const).map((reason) => <option key={reason} value={reason}>{t(`activity.declineReasons.${reason}`)}</option>)}
            </select>}
            {!assigned && <button type="button" onClick={() => onRemoveInvitation(invitation.id)} className="text-sm text-red-600 hover:text-red-800">{t('playerInvitations.remove')}</button>}
          </div>
        </div>;
      })}
    </div>}
  </section>;
}
