import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlayerEventHistoryItem } from '../types';
import { invitationStatusMeta } from '../utils/invitationStatus';
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

  const renderEventCards = (items: PlayerEventHistoryItem[]) => (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <div
          key={item.eventId}
          className="min-w-0 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
          onClick={() => navigate(`/events/${item.eventId}`)}
        >
          <div className="flex items-start gap-4">
            <DateColumn date={item.eventDate} />

            <div className="flex justify-between items-start flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <h5 className="truncate font-semibold text-slate-900" title={item.eventName}>{item.eventName}</h5>
                <div className="mt-2">
                  {item.isSelected ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {t('statistics.playerTable.selected')}
                      </span>
                      <p className="text-xs text-slate-600">
                        {t('playerDetail.assignedTeam', {
                          teamName: item.teamName || t('team.unknownTeam'),
                        })}
                      </p>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${invitationStatusMeta[item.invitationStatus].badgeClassName}`}>
                      {t(`invitationStatus.${item.invitationStatus}`)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 ml-2">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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
    <section className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6 ${className}`}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('domain.events')}</h2>
        {eventHistory.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            <p>{t('players.eventHistory.empty')}</p>
          </div>
        ) : (
          <div className="mt-4">
            {groupedEventHistory && groupedEventHistory.length > 0 ? (
              <div className="space-y-6">
                {groupedEventHistory.map((group) => (
                  <section key={group.id}>
                    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.075em] text-slate-500">{group.title}</h3>
                    {renderEventCards(group.eventHistory)}
                  </section>
                ))}
              </div>
            ) : renderEventCards(eventHistory)}
          </div>
        )}
    </section>
  );
}
