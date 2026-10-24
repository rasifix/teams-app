import { TrashIcon } from './ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, ActivityInvitation, InvitationDeclineReason, InvitationResponse, Player } from '../types';
import { selectAvailableInvitations, selectInvitationCounts } from '../store/selectors/activitySelectors';
import { selectInvitationViewRows } from '../store/selectors/activityViewSelectors';
import PlayerRow from './PlayerRow';
import { Button, EmptyState, EntityList, EntityMeta, IconButton, Panel, PanelActions, PanelHeader, PanelTitle, Select, Stack, Tab, TabList } from './ui';

interface PlayerInvitationsCardProps {
  invitations: ActivityInvitation[];
  currentActivity: Activity;
  players: Player[];
  onInviteClick: () => void;
  onStatusChange: (invitationId: string, response: InvitationResponse, declineReason?: InvitationDeclineReason) => void;
  onRemoveInvitation: (invitationId: string) => void;
  assignedPlayerIds?: string[];
  readOnly?: boolean;
  allowDeclineReasonEdit?: boolean;
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
  allowDeclineReasonEdit = false,
}: PlayerInvitationsCardProps) {
  const { t } = useTranslation();
  const [declineReasons, setDeclineReasons] = useState<Record<string, InvitationDeclineReason | ''>>({});
  const [activeResponse, setActiveResponse] = useState<'available' | InvitationResponse>('available');
  const counts = selectInvitationCounts(currentActivity);
  const visibleRows = selectInvitationViewRows(currentActivity, players, assignedPlayerIds, activeResponse, readOnly);
  const availableCount = selectAvailableInvitations(invitations, assignedPlayerIds).length;

  return <Panel>
    <PanelHeader>
      <PanelTitle>{t('domain.player.plural')}</PanelTitle>
      {!readOnly && <PanelActions><Button type="button" size="sm" onClick={onInviteClick}>{t('page.playerInvitations.invite')}</Button></PanelActions>}
    </PanelHeader>
    <Stack gap="sm">
      <TabList label={t('domain.player.plural')} mobileFit>
      {(['available', 'open', 'declined'] as const).map((response) => {
        const isActive = activeResponse === response;
        const count = response === 'available' ? availableCount : counts[response];
        return <Tab
          key={response}
          selected={isActive}
          onClick={() => setActiveResponse(response)}
        >
          {t(`domain.invitation.status.${response}`)} <span className={'ui-tab-count'}>({count})</span>
        </Tab>;
      })}
    </TabList>
    {visibleRows.length === 0 ? <EmptyState>{t('page.playerInvitations.empty.noneWithStatus', { status: t(`domain.invitation.status.${activeResponse}`) })}</EmptyState> : <EntityList variant="bare">
      {visibleRows.map(({ invitation, player, assigned, managed }) => {
        return <PlayerRow
          key={invitation.id}
          player={player ?? null}
          fallbackName={invitation.playerId}
          density="compact"
          data-testid="invitation-row"
          levelClassName="invitation-player-level"
          content={invitation.response === 'declined' && readOnly && !allowDeclineReasonEdit
            ? <EntityMeta><span>{t('domain.activity.declineReasons.' + (invitation.declineReason ?? 'unspecified'))}</span></EntityMeta>
            : undefined}
          trailing={<>
            {!managed && !readOnly && <Select controlSize="sm" aria-label={t('domain.activity.fields.invitationResponse')} value={invitation.response} onChange={(event) => {
            const response = event.target.value as InvitationResponse;
            onStatusChange(invitation.id, response, response === 'declined' ? invitation.declineReason : undefined);
          }}>
            {(['open', 'accepted', 'declined'] as const).map((response) => <option key={response} value={response}>{t(`domain.invitation.status.${response}`)}</option>)}
            </Select>}
            {invitation.response === 'declined' && (!readOnly || allowDeclineReasonEdit) && <Select controlSize="sm" aria-label={t('domain.activity.fields.declineReason')} value={declineReasons[invitation.id] ?? invitation.declineReason ?? ''} onChange={(event) => {
            const reason = event.target.value as InvitationDeclineReason | '';
            setDeclineReasons((current) => ({ ...current, [invitation.id]: reason }));
            onStatusChange(invitation.id, 'declined', reason || undefined);
          }}>
            <option value="">{t('domain.activity.declineReasons.unspecified')}</option>
            {(['injured', 'sick', 'unavailable'] as const).map((reason) => <option key={reason} value={reason}>{t(`domain.activity.declineReasons.${reason}`)}</option>)}
            </Select>}
          </>}
          actions={!assigned && !managed ? <IconButton
            label={t('page.playerInvitations.remove')}
            variant="danger"
            onClick={() => onRemoveInvitation(invitation.id)}
          >
            <TrashIcon />
          </IconButton> : undefined}
        />;
      })}
    </EntityList>}
    </Stack>
  </Panel>;
}
