import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, ActivityInvitation, InvitationDeclineReason, InvitationResponse, Player } from '../types';
import { isSpondManagedInvitation, selectAvailableInvitations, selectInvitationCounts, selectInvitationsByResponse } from '../store/selectors/activitySelectors';
import Level from './Level';

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
  const [activeResponse, setActiveResponse] = useState<'available' | InvitationResponse>('available');
  const counts = selectInvitationCounts(currentActivity);
  const visibleInvitations = useMemo(
    () => activeResponse === 'available'
      ? selectAvailableInvitations(invitations, assignedPlayerIds)
      : selectInvitationsByResponse(invitations, activeResponse),
    [invitations, activeResponse, assignedPlayerIds],
  );
  const availableCount = selectAvailableInvitations(invitations, assignedPlayerIds).length;

  return <section className="rounded-lg border border-gray-200 bg-white p-4 lg:p-6">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{t('domain.players')}</h2>
      {!readOnly && <button type="button" onClick={onInviteClick} className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">{t('playerInvitations.invite')}</button>}
    </div>
    <div className="flex border-b border-gray-200" role="tablist" aria-label={t('domain.players')}>
      {(['available', 'open', 'declined'] as const).map((response) => {
        const isActive = activeResponse === response;
        const count = response === 'available' ? availableCount : counts[response];
        return <button
          key={response}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => setActiveResponse(response)}
          className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${
            isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t(`invitationStatus.${response}`)} ({count})
        </button>;
      })}
    </div>
    {visibleInvitations.length === 0 ? <p className="mt-3 py-4 text-center text-sm text-gray-500">{t('playerInvitations.empty.noneWithStatus', { status: t(`invitationStatus.${activeResponse}`) })}</p> : <ul className="mt-3 divide-y divide-gray-200">
      {visibleInvitations.map((invitation) => {
        const player = players.find((entry) => entry.id === invitation.playerId);
        const assigned = assignedPlayerIds.includes(invitation.playerId);
        const isSpondManaged = readOnly || isSpondManagedInvitation(currentActivity, player);
        return <li key={invitation.id} className="flex h-10 items-center gap-2" data-testid="invitation-row">
          <p className="min-w-0 flex-1 basis-32 truncate text-sm text-gray-900">{player ? `${player.firstName} ${player.lastName}` : invitation.playerId}</p>
          {player && <Level level={player.level} className="text-base leading-none" />}
          {invitation.response === 'declined' && (readOnly ? <span className="text-xs text-gray-600">{t(`activity.declineReasons.${invitation.declineReason ?? 'unspecified'}`)}</span> : <select aria-label={t('activity.fields.declineReason')} value={declineReasons[invitation.id] ?? invitation.declineReason ?? ''} onChange={(event) => {
            const reason = event.target.value as InvitationDeclineReason | '';
            setDeclineReasons((current) => ({ ...current, [invitation.id]: reason }));
            onStatusChange(invitation.id, 'declined', reason || undefined);
          }} className="rounded border border-gray-300 px-2 py-1 text-xs">
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
        </li>;
      })}
    </ul>}
  </section>;
}
