import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { getActivityDate } from '../store/selectors/activitySelectors';
import { selectEventParticipationRows } from '../store/selectors/statisticsSelectors';
import { invitationStatusMeta, invitationStatusOrder } from '../utils/invitationStatus';
import { Card, CardBody, DateColumn } from './ui';
import { formatDate } from '../utils/dateFormatter';
import LevelRangeSelector from './LevelRangeSelector';
import Level from './Level';

interface EventParticipationMatrixProps {
  players: Player[];
  events: Activity[];
}

export default function EventParticipationMatrix({ players, events }: EventParticipationMatrixProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 5]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePlayerClick = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  const handleEventClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/events/${eventId}`);
  };

  const sortedData = useMemo(
    () => selectEventParticipationRows(players, events, levelRange),
    [players, events, levelRange]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected':
        return { icon: '✓', color: 'text-green-600', bg: 'bg-green-50' };
      case 'accepted':
        return { icon: invitationStatusMeta.accepted.icon, color: 'text-gray-400', bg: invitationStatusMeta.accepted.iconBackgroundClassName };
      case 'declined':
        return { icon: invitationStatusMeta.declined.icon, color: invitationStatusMeta.declined.iconClassName, bg: invitationStatusMeta.declined.iconBackgroundClassName };
      case 'injured':
        return { icon: invitationStatusMeta.injured.icon, color: invitationStatusMeta.injured.iconClassName, bg: invitationStatusMeta.injured.iconBackgroundClassName };
      case 'sick':
        return { icon: invitationStatusMeta.sick.icon, color: invitationStatusMeta.sick.iconClassName, bg: invitationStatusMeta.sick.iconBackgroundClassName };
      case 'unavailable':
        return { icon: invitationStatusMeta.unavailable.icon, color: invitationStatusMeta.unavailable.iconClassName, bg: invitationStatusMeta.unavailable.iconBackgroundClassName };
      case 'open':
        return { icon: invitationStatusMeta.open.icon, color: invitationStatusMeta.open.iconClassName, bg: invitationStatusMeta.open.iconBackgroundClassName };
      default:
        return { icon: '-', color: 'text-gray-400', bg: 'bg-gray-50' };
    }
  };

  // Scroll to next upcoming event on mount
  useEffect(() => {
    if (events.length === 0 || players.length === 0) return;
    if (!scrollContainerRef.current) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the index of the next upcoming event
    const nextEventIndex = events.findIndex(event => {
      const eventDate = new Date(getActivityDate(event));
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    // If we found an upcoming event, scroll to it
    if (nextEventIndex > 0) {
      // Use setTimeout to ensure DOM is rendered
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Find the header cell for this event
        const headers = container.querySelectorAll('th');
        // +1 because first header is the "Player" column
        const targetHeader = headers[nextEventIndex + 1];
        
        if (targetHeader) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = targetHeader.getBoundingClientRect();
          const scrollLeft = targetRect.left - containerRect.left + container.scrollLeft - 220; // 220px is the player column width
          
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [events, players]);

  if (events.length === 0 || players.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="empty-state">
            <p>{t('statistics.eventParticipation.emptyState')}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>        
        {/* Level Filter */}
        <LevelRangeSelector
          defaultRange={levelRange}
          onChange={setLevelRange}
        />

        <div className="mt-4 text-xs text-gray-600 mb-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('statistics.playerTable.selected')}</span>
          </div>
          {invitationStatusOrder.map((status) => (
            <div key={status} className="flex items-center gap-1">
              <span className={`${status === 'accepted' ? 'text-gray-400' : invitationStatusMeta[status].iconClassName} font-bold`}>
                {invitationStatusMeta[status].icon}
              </span>
              <span>{t(`invitationStatus.${status}`)}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span className="text-gray-400 font-bold">-</span>
            <span>{t('invitationStatus.notInvited')}</span>
          </div>
        </div>
        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r-2 border-gray-300 min-w-[220px]">
                  {t('domain.player')}
                </th>
                {events.map(event => (
                  <th 
                    key={event.id} 
                    className="px-2 py-2 text-center text-sm font-medium text-gray-900 min-w-[50px]"
                    title={`${event.name} - ${formatDate(getActivityDate(event))}`}
                  >
                    <div 
                      className="flex justify-center cursor-pointer hover:opacity-70 transition-opacity"
                      onClick={(e) => handleEventClick(event.id, e)}
                    >
                      <DateColumn date={getActivityDate(event)} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map(({ player, attendance }) => (
                <tr 
                  key={player.id} 
                  className="border-b border-gray-200 hover:bg-gray-50 max-h-[40px] cursor-pointer"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <td className="sticky left-0 bg-white z-10 px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 max-h-[40px] min-w-[220px]">
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <span>{player.firstName} {player.lastName}</span>
                      <Level level={player.level} className="text-xs" />
                    </div>
                  </td>
                  {attendance.map(({ status, event }, index) => {
                    const statusInfo = getStatusIcon(status);
                    return (
                      <td 
                        key={index}
                        className="px-3 py-2 text-center max-h-[40px]"
                        title={`${event.name} - ${formatDate(getActivityDate(event))}\n${t('common.labels.status')}: ${status === 'not-invited' ? t('invitationStatus.notInvited') : t(`invitationStatus.${status}`)}`}
                      >
                        <div className={`inline-flex items-center justify-center w-7 h-7 rounded ${statusInfo.bg}`}>
                          <span className={`text-base font-bold ${statusInfo.color}`}>
                            {statusInfo.icon}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
