import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Activity, Player } from '../types';
import { getActivityDate } from '../store/selectors/activitySelectors';
import { selectEventParticipationRows } from '../store/selectors/statisticsSelectors';
import { invitationStatusMeta, invitationStatusOrder } from '../utils/invitationStatus';
import { DateColumn } from './ui';
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
      <section className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)]">
            <p>{t('statistics.eventParticipation.emptyState')}</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)]">
      <div className="p-4 sm:p-5">
        <LevelRangeSelector
          defaultRange={levelRange}
          onChange={setLevelRange}
        />

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="font-bold text-emerald-600">✓</span>
            <span>{t('statistics.playerTable.selected')}</span>
          </div>
          {invitationStatusOrder.map((status) => (
            <div key={status} className="flex items-center gap-1">
              <span className={`${status === 'accepted' ? 'text-slate-400' : invitationStatusMeta[status].iconClassName} font-bold`}>
                {invitationStatusMeta[status].icon}
              </span>
              <span>{t(`invitationStatus.${status}`)}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400">-</span>
            <span>{t('invitationStatus.notInvited')}</span>
          </div>
        </div>
      </div>
        <div className="overflow-x-auto border-t border-slate-100" ref={scrollContainerRef}>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="sticky left-0 z-10 min-w-[220px] border-r border-slate-200 bg-slate-50 px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  {t('domain.player')}
                </th>
                {events.map(event => (
                  <th 
                    key={event.id} 
                    className="min-w-[58px] px-2 py-2.5 text-center text-sm font-medium text-slate-900"
                    title={`${event.name} - ${formatDate(getActivityDate(event))}`}
                  >
                    <div 
                      className="flex cursor-pointer justify-center transition-opacity hover:opacity-70"
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
                  className="max-h-[40px] cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/80"
                  onClick={() => handlePlayerClick(player.id)}
                >
                  <td className="sticky left-0 z-10 max-h-[40px] min-w-[220px] border-r border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-900">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <span>{player.firstName} {player.lastName}</span>
                      <Level level={player.level} className="text-xs" />
                    </div>
                  </td>
                  {attendance.map(({ status, event }, index) => {
                    const statusInfo = getStatusIcon(status);
                    return (
                      <td 
                        key={index}
                        className="max-h-[40px] px-3 py-2 text-center"
                        title={`${event.name} - ${formatDate(getActivityDate(event))}\n${t('common.labels.status')}: ${status === 'not-invited' ? t('invitationStatus.notInvited') : t(`invitationStatus.${status}`)}`}
                      >
                        <div className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${statusInfo.bg}`}>
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
    </section>
  );
}
