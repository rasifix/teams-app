import { useTranslation } from 'react-i18next';
import type { Activity, PlayerEventHistoryItem } from '../../types';
import type { GroupedPlayerEventHistory } from '../../store/selectors/playerDetailSelectors';
import { getActivityDate } from '../../store/selectors/activitySelectors';
import { ActionCard, ActionCardTitle, Badge, DateColumn, Panel, PanelHeader, PanelTitle, Stack } from '../ui';
import PlayerEventHistory from '../PlayerEventHistory';

interface Props {
  eventHistory: PlayerEventHistoryItem[];
  groupedEventHistory?: GroupedPlayerEventHistory[];
  futureEventsWithoutInvitation: Activity[];
  onOpenEvent: (eventId: string) => void;
}

export default function PlayerDetailHistorySections({ eventHistory, groupedEventHistory, futureEventsWithoutInvitation, onOpenEvent }: Props) {
  const { t } = useTranslation();

  return <>
    <PlayerEventHistory eventHistory={eventHistory} groupedEventHistory={groupedEventHistory} onOpenEvent={onOpenEvent} />
    {futureEventsWithoutInvitation.length > 0 && <Panel className="member-detail-section">
      <PanelHeader><PanelTitle>{t('page.playerDetail.eventsWithoutInvitation')}</PanelTitle></PanelHeader>
      <Stack gap="sm" className="member-event-list">
        {futureEventsWithoutInvitation.map((event) => <ActionCard key={event.id} leading={<DateColumn date={getActivityDate(event)} />} onClick={() => onOpenEvent(event.id)}>
          <ActionCardTitle title={event.name}>{event.name}</ActionCardTitle>
          <div className="member-event-status"><Badge>{t('domain.invitation.status.notInvited')}</Badge></div>
        </ActionCard>)}
      </Stack>
    </Panel>}
  </>;
}
