import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, ActivityInvitation, InvitationDeclineReason, InvitationResponse, Player } from '../types';
import { isSpondManagedInvitation, selectInvitationCounts } from '../store/selectors/activitySelectors';

interface PlayerInvitationsCardProps {
  invitations: ActivityInvitation[];
  currentActivity: Activity;
  players: Player[];
  onInviteClick: () => void;
  onStatusChange: (invitationId: string, response: InvitationResponse, declineReason?: InvitationDeclineReason) => void;
  onRemoveInvitation: (invitationId: string) => void;
  assignedPlayerIds?: string[];
  readOnly?: boolean;
}

export default function PlayerInvitationsCard({
  invitations,
  currentActivity,
  players,
  onInviteClick,
  onStatusChange,
  onRemoveInvitation,
  assignedPlayerIds = [],
  readOnly = false,
}: PlayerInvitationsCardProps) {
  const { t } = useTranslation();
  const [declineReasons, setDeclineReasons] = useState<Record<string, InvitationDeclineReason | ''>>({});
  const counts = selectInvitationCounts(currentActivity);

  return <section className="rounded-lg border border-gray-200 bg-white p-4 lg:p-6">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{t('domain.players')}</h2>
      {!readOnly && <button type="button" onClick={onInviteClick} className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">{t('playerInvitations.invite')}</button>}
    </div>
    <div className="mb-4 flex flex-wrap gap-3 text-sm text-gray-600">
      <span>{t('invitationStatus.open')}: {counts.open}</span>
      <span>{t('invitationStatus.accepted')}: {counts.accepted}</span>
      <span>{t('invitationStatus.declined')}: {counts.declined}</span>
      {(['injured', 'sick', 'unavailable', 'unspecified'] as const).map((reason) => counts.declineReasons[reason] > 0 && <span key={reason}>{t(`activity.declineReasons.${reason}`)}: {counts.declineReasons[reason]}</span>)}
    </div>
    {invitations.length === 0 ? <p className="py-4 text-center text-gray-500">{readOnly ? t('playerInvitations.empty.noneSynced') : t('playerInvitations.empty.noneSent')}</p> : <div className="space-y-2">
      {invitations.map((invitation) => {
        const player = players.find((entry) => entry.id === invitation.playerId);
        const assigned = assignedPlayerIds.includes(invitation.playerId);
        const isSpondManaged = readOnly || isSpondManagedInvitation(currentActivity, player);
        return <div key={invitation.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3" data-testid="invitation-row">
          <p className="min-w-0 flex-1 basis-40 truncate font-medium text-gray-900">{player ? `${player.firstName} ${player.lastName}` : invitation.playerId}</p>
          <select aria-label={t('common.labels.status')} value={invitation.response} onChange={(event) => {
            const response = event.target.value as InvitationResponse;
            onStatusChange(invitation.id, response, response === 'declined' ? declineReasons[invitation.id] || undefined : undefined);
          }} className="rounded border border-gray-300 px-2 py-1 text-sm" disabled={isSpondManaged} title={isSpondManaged ? t('spondSync.managedResponse') : undefined}>
            {(['open', 'accepted', 'declined'] as const).map((response) => <option key={response} value={response}>{t(`invitationStatus.${response}`)}</option>)}
          </select>
          {invitation.response === 'declined' && (readOnly ? <span className="text-sm text-gray-600">{t(`activity.declineReasons.${invitation.declineReason ?? 'unspecified'}`)}</span> : <select aria-label={t('activity.fields.declineReason')} value={declineReasons[invitation.id] ?? invitation.declineReason ?? ''} onChange={(event) => {
            const reason = event.target.value as InvitationDeclineReason | '';
            setDeclineReasons((current) => ({ ...current, [invitation.id]: reason }));
            onStatusChange(invitation.id, 'declined', reason || undefined);
          }} className="rounded border border-gray-300 px-2 py-1 text-sm">
            <option value="">{t('activity.declineReasons.unspecified')}</option>
            {(['injured', 'sick', 'unavailable'] as const).map((reason) => <option key={reason} value={reason}>{t(`activity.declineReasons.${reason}`)}</option>)}
          </select>)}
          {!assigned && !isSpondManaged && <button
            type="button"
            onClick={() => onRemoveInvitation(invitation.id)}
            className="p-1 text-red-500 transition-colors hover:text-red-700"
            title={t('playerInvitations.remove')}
            aria-label={t('playerInvitations.remove')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>}
        </div>;
      })}
    </div>}
  </section>;
}
