import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlayerEventHistoryItem } from '../types';
import { invitationStatusMeta } from '../utils/invitationStatus';
import { Card, CardBody, CardTitle, DateColumn } from './ui';

interface PlayerEventHistoryGroup {
  id: string;
  title: string;
  eventHistory: PlayerEventHistoryItem[];
}

interface PlayerEventHistoryProps {
  eventHistory: PlayerEventHistoryItem[];
  groupedEventHistory?: PlayerEventHistoryGroup[];
}

export default function PlayerEventHistory({
  eventHistory,
  groupedEventHistory,
}: PlayerEventHistoryProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const renderEventCards = (items: PlayerEventHistoryItem[]) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3 overflow-hidden">
      {items.map((item) => (
        <div
          key={item.eventId}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer min-w-0"
          onClick={() => navigate(`/events/${item.eventId}`)}
        >
          <div className="flex items-start gap-4">
            <DateColumn date={item.eventDate} />

            <div className="flex justify-between items-start flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-gray-900 truncate" title={item.eventName}>{item.eventName}</h5>
                <div className="mt-2">
                  {item.isSelected ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('statistics.playerTable.selected')}
                      </span>
                      <p className="text-xs text-gray-600">
                        {t('playerDetail.assignedTeam', {
                          teamName: item.teamName || t('team.unknownTeam'),
                        })}
                      </p>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invitationStatusMeta[item.invitationStatus].badgeClassName}`}>
                      {t(`invitationStatus.${item.invitationStatus}`)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 ml-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
      <CardBody className="lg:p-6 p-4">
        <CardTitle>{t('domain.events')}</CardTitle>
        {eventHistory.length === 0 ? (
          <div className="empty-state">
            <p>{t('players.eventHistory.empty')}</p>
          </div>
        ) : (
          <div className="mt-4">
            {groupedEventHistory && groupedEventHistory.length > 0 ? (
              <div className="space-y-6">
                {groupedEventHistory.map((group) => (
                  <section key={group.id}>
                    <h4 className="mb-3 text-sm font-semibold text-gray-800">{group.title}</h4>
                    {renderEventCards(group.eventHistory)}
                  </section>
                ))}
              </div>
            ) : renderEventCards(eventHistory)}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
