import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActionCard, ActionCardTitle, Badge, Cluster, EmptyState, Panel, PanelHeader, PanelTitle, SectionEyebrow, Stack, type BadgeTone } from './ui';
import type { PlayerEventHistoryItem } from '../types';
import { DateColumn } from './ui';

interface PlayerEventHistoryGroup {
  id: string;
  title: string;
  eventHistory: PlayerEventHistoryItem[];
}

interface PlayerEventHistoryProps {
  eventHistory: PlayerEventHistoryItem[];
  groupedEventHistory?: PlayerEventHistoryGroup[];
  className?: string;
}

export default function PlayerEventHistory({
  eventHistory,
  groupedEventHistory,
  className = '',
}: PlayerEventHistoryProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const invitationTone = (status: PlayerEventHistoryItem['invitationStatus']): BadgeTone => {
    if (status === 'accepted') return 'success';
    if (status === 'open' || status === 'sick') return 'warning';
    if (status === 'declined' || status === 'injured') return 'danger';
    return 'neutral';
  };

  const renderEventCards = (items: PlayerEventHistoryItem[]) => (
    <Stack gap="sm">
      {items.map((item) => (
        <ActionCard
          key={item.eventId}
          leading={<DateColumn date={item.eventDate} />}
          onClick={() => navigate(`/events/${item.eventId}`)}
        >
                <ActionCardTitle title={item.eventName}>{item.eventName}</ActionCardTitle>
                <div className="member-event-status">
                  {item.isSelected ? (
                    <Cluster gap="sm">
                      <Badge tone="success">
                        {t('statistics.playerTable.selected')}
                      </Badge>
                      <span className="member-meta-text">
                        {t('playerDetail.assignedTeam', {
                          teamName: item.teamName || t('team.unknownTeam'),
                        })}
                      </span>
                    </Cluster>
                  ) : (
                    <Badge tone={invitationTone(item.invitationStatus)}>
                      {t(`invitationStatus.${item.invitationStatus}`)}
                    </Badge>
                  )}
                </div>
        </ActionCard>
      ))}
    </Stack>
  );

  return (
    <Panel className={className}>
        <PanelHeader><PanelTitle>{t('domain.events')}</PanelTitle></PanelHeader>
        {eventHistory.length === 0 ? (
          <EmptyState>
            <p>{t('players.eventHistory.empty')}</p>
          </EmptyState>
        ) : (
          <div className="member-event-history-content">
            {groupedEventHistory && groupedEventHistory.length > 0 ? (
              <Stack gap="lg">
                {groupedEventHistory.map((group) => (
                  <section key={group.id}>
                    <SectionEyebrow className="member-event-group-title">{group.title}</SectionEyebrow>
                    {renderEventCards(group.eventHistory)}
                  </section>
                ))}
              </Stack>
            ) : renderEventCards(eventHistory)}
          </div>
        )}
    </Panel>
  );
}
