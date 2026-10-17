import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActionCard, ActionCardTitle, Badge, EmptyState, Panel, PanelHeader, PanelTitle, type BadgeTone } from './ui';
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
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <ActionCard
          key={item.eventId}
          leading={<DateColumn date={item.eventDate} />}
          onClick={() => navigate(`/events/${item.eventId}`)}
        >
                <ActionCardTitle title={item.eventName}>{item.eventName}</ActionCardTitle>
                <div className="mt-2">
                  {item.isSelected ? (
                    <div className="space-y-1">
                      <Badge tone="success">
                        {t('statistics.playerTable.selected')}
                      </Badge>
                      <p className="text-xs text-content-muted">
                        {t('playerDetail.assignedTeam', {
                          teamName: item.teamName || t('team.unknownTeam'),
                        })}
                      </p>
                    </div>
                  ) : (
                    <Badge tone={invitationTone(item.invitationStatus)}>
                      {t(`invitationStatus.${item.invitationStatus}`)}
                    </Badge>
                  )}
                </div>
        </ActionCard>
      ))}
    </div>
  );

  return (
    <Panel className={className}>
        <PanelHeader><PanelTitle>{t('domain.events')}</PanelTitle></PanelHeader>
        {eventHistory.length === 0 ? (
          <EmptyState>
            <p>{t('players.eventHistory.empty')}</p>
          </EmptyState>
        ) : (
          <div className="mt-4">
            {groupedEventHistory && groupedEventHistory.length > 0 ? (
              <div className="layout-stack layout-stack--lg">
                {groupedEventHistory.map((group) => (
                  <section key={group.id}>
                    <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-label text-content-subtle">{group.title}</h3>
                    {renderEventCards(group.eventHistory)}
                  </section>
                ))}
              </div>
            ) : renderEventCards(eventHistory)}
          </div>
        )}
    </Panel>
  );
}
