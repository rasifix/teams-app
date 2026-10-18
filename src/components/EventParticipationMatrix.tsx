import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { getActivityDate } from '../store/selectors/activitySelectors';
import { selectEventParticipationRows } from '../store/selectors/statisticsSelectors';
import { invitationStatusMeta, invitationStatusOrder } from '../utils/invitationStatus';
import { DateColumn, Panel } from './ui';
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
        return { icon: '✓', color: 'text-success', bg: 'bg-success-subtle' };
      case 'accepted':
        return { icon: invitationStatusMeta.accepted.icon, color: 'text-content-disabled', bg: invitationStatusMeta.accepted.iconBackgroundClassName };
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
        return { icon: '-', color: 'text-content-disabled', bg: 'bg-surface-subtle' };
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
      <section className="statistics-matrix-empty">
            <p>{t('statistics.eventParticipation.emptyState')}</p>
      </section>
    );
  }

  return (
    <Panel padding="none">
      <div className="statistics-controls">
        <LevelRangeSelector
          defaultRange={levelRange}
          onChange={setLevelRange}
        />

        <div className="participation-legend">
          <div className="participation-legend-item">
            <span className="participation-legend-icon text-success">✓</span>
            <span>{t('statistics.playerTable.selected')}</span>
          </div>
          {invitationStatusOrder.map((status) => (
            <div key={status} className="participation-legend-item">
              <span className={`participation-legend-icon ${status === 'accepted' ? 'text-content-disabled' : invitationStatusMeta[status].iconClassName}`}>
                {invitationStatusMeta[status].icon}
              </span>
              <span>{t(`invitationStatus.${status}`)}</span>
            </div>
          ))}
          <div className="participation-legend-item">
            <span className="participation-legend-icon text-content-disabled">-</span>
            <span>{t('invitationStatus.notInvited')}</span>
          </div>
        </div>
      </div>
        <div className="statistics-scroll" ref={scrollContainerRef}>
          <table className="statistics-matrix-table">
            <thead>
              <tr className="statistics-matrix-heading-row">
                <th className="statistics-matrix-player-heading">
                  {t('domain.player')}
                </th>
                {events.map(event => (
                  <th 
                    key={event.id} 
                    className="participation-event-heading"
                    title={`${event.name} - ${formatDate(getActivityDate(event))}`}
                  >
                    <div 
                      className="participation-event-link"
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
                  className="statistics-matrix-row participation-player-row"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <td className="statistics-matrix-player-cell participation-player-cell">
                    <div className="participation-player">
                      <span>{player.firstName} {player.lastName}</span>
                      <Level level={player.level} className="participation-player-level" />
                    </div>
                  </td>
                  {attendance.map(({ status, event }, index) => {
                    const statusInfo = getStatusIcon(status);
                    return (
                      <td 
                        key={index}
                        className="participation-status-cell"
                        title={`${event.name} - ${formatDate(getActivityDate(event))}\n${t('common.labels.status')}: ${status === 'not-invited' ? t('invitationStatus.notInvited') : t(`invitationStatus.${status}`)}`}
                      >
                        <div className={`participation-status ${statusInfo.bg}`}>
                          <span className={`participation-status-icon ${statusInfo.color}`}>
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
    </Panel>
  );
}
