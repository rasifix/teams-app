import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, ActivityInvitation, InvitationDeclineReason, InvitationResponse, Player } from '../types';
import { selectAvailableInvitations, selectInvitationCounts } from '../store/selectors/activitySelectors';
import { selectInvitationViewRows } from '../store/selectors/activityViewSelectors';
import Level from './Level';
import { Button, EmptyState, EntityActions, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle, IconButton, Panel, PanelActions, PanelHeader, PanelTitle, Select, Stack, Tab, TabList } from './ui';

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
  const visibleRows = selectInvitationViewRows(currentActivity, players, assignedPlayerIds, activeResponse, readOnly);
  const availableCount = selectAvailableInvitations(invitations, assignedPlayerIds).length;

  return <Panel>
    <PanelHeader>
      <PanelTitle>{t('domain.players')}</PanelTitle>
      {!readOnly && <PanelActions><Button type="button" size="sm" onClick={onInviteClick}>{t('playerInvitations.invite')}</Button></PanelActions>}
    </PanelHeader>
    <Stack gap="sm">
    <TabList label={t('domain.players')}>
      {(['available', 'open', 'declined'] as const).map((response) => {
        const isActive = activeResponse === response;
        const count = response === 'available' ? availableCount : counts[response];
        return <Tab
          key={response}
          selected={isActive}
          onClick={() => setActiveResponse(response)}
        >
          {t(`invitationStatus.${response}`)} ({count})
        </Tab>;
      })}
    </TabList>
    {visibleRows.length === 0 ? <EmptyState>{t('playerInvitations.empty.noneWithStatus', { status: t(`invitationStatus.${activeResponse}`) })}</EmptyState> : <EntityList variant="bare">
      {visibleRows.map(({ invitation, player, assigned, managed }) => {
        return <EntityRow key={invitation.id} density="compact" data-testid="invitation-row">
          <EntityContent>
            <EntityTitle>{player ? `${player.firstName} ${player.lastName}` : invitation.playerId}</EntityTitle>
            {invitation.response === 'declined' && readOnly && <EntityMeta><span>{t(`activity.declineReasons.${invitation.declineReason ?? 'unspecified'}`)}</span></EntityMeta>}
          </EntityContent>
          {player && <Level level={player.level} className="invitation-player-level" />}
          {invitation.response === 'declined' && !readOnly && <Select controlSize="sm" aria-label={t('activity.fields.declineReason')} value={declineReasons[invitation.id] ?? invitation.declineReason ?? ''} onChange={(event) => {
            const reason = event.target.value as InvitationDeclineReason | '';
            setDeclineReasons((current) => ({ ...current, [invitation.id]: reason }));
            onStatusChange(invitation.id, 'declined', reason || undefined);
          }}>
            <option value="">{t('activity.declineReasons.unspecified')}</option>
            {(['injured', 'sick', 'unavailable'] as const).map((reason) => <option key={reason} value={reason}>{t(`activity.declineReasons.${reason}`)}</option>)}
          </Select>}
          {!assigned && !managed && <EntityActions><IconButton
            label={t('playerInvitations.remove')}
            variant="danger"
            onClick={() => onRemoveInvitation(invitation.id)}
          >
            <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </IconButton></EntityActions>}
        </EntityRow>;
      })}
    </EntityList>}
    </Stack>
  </Panel>;
}
