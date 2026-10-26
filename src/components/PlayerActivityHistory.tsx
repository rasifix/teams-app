import { useTranslation } from 'react-i18next';
import { ActionCard, ActionCardTitle, Badge, Cluster, EmptyState, Panel, PanelHeader, PanelTitle, SectionEyebrow, Stack, type BadgeTone } from './ui';
import type { PlayerActivityHistoryItem } from '../types';
import { DateColumn } from './ui';

interface PlayerActivityHistoryGroup {
  id: string;
  title: string;
  eventHistory: PlayerActivityHistoryItem[];
}

interface PlayerActivityHistoryProps {
  eventHistory: PlayerActivityHistoryItem[];
  groupedEventHistory?: PlayerActivityHistoryGroup[];
  className?: string;
  onOpenEvent: (eventId: string) => void;
}

export default function PlayerActivityHistory({
  eventHistory,
  groupedEventHistory,
  className = '',
  onOpenEvent,
}: PlayerActivityHistoryProps) {
  const { t } = useTranslation();
  const invitationTone = (status: PlayerActivityHistoryItem['invitationStatus']): BadgeTone => {
    if (status === 'accepted') return 'success';
    if (status === 'open' || status === 'sick') return 'warning';
    if (status === 'declined' || status === 'injured') return 'danger';
    return 'neutral';
  };

  const renderEventCards = (items: PlayerActivityHistoryItem[]) => (
    <Stack gap="sm">
      {items.map((item) => (
        <ActionCard
          key={item.eventId}
          leading={<DateColumn date={item.eventDate} />}
          onClick={() => onOpenEvent(item.eventId)}
        >
                <ActionCardTitle title={item.eventName}>{item.eventName}</ActionCardTitle>
                <div>
                  {item.isSelected ? (
                    <Cluster gap="sm">
                      <Badge tone="success">
                        {t('page.statistics.playerTable.selected')}
                      </Badge>
                      <span className="text-caption">
                        {t('page.playerDetail.assignedTeam', {
                          teamName: item.teamName || t('domain.team.unknownLabel'),
                        })}
                      </span>
                    </Cluster>
                  ) : (
                    <Badge tone={invitationTone(item.invitationStatus)}>
                      {t(`domain.invitation.status.${item.invitationStatus}`)}
                    </Badge>
                  )}
                </div>
        </ActionCard>
      ))}
    </Stack>
  );

  return (
    <Panel className={className}>
        <PanelHeader><PanelTitle>{t('domain.activity.plural')}</PanelTitle></PanelHeader>
        {eventHistory.length === 0 ? (
          <EmptyState>
            <p>{t('page.players.eventHistory.empty')}</p>
          </EmptyState>
        ) : (
          <div>
            {groupedEventHistory && groupedEventHistory.length > 0 ? (
              <Stack gap="lg">
                {groupedEventHistory.map((group) => (
                  <Stack key={group.id} gap="sm">
                    <SectionEyebrow>{group.title}</SectionEyebrow>
                    {renderEventCards(group.eventHistory)}
                  </Stack>
                ))}
              </Stack>
            ) : renderEventCards(eventHistory)}
          </div>
        )}
    </Panel>
  );
}
