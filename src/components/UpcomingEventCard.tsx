import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DateColumn from './DateColumn';
import { getActivityDate, getActivityStartTime } from '../store/selectors/activitySelectors';
import type { Activity } from '../types';

interface UpcomingEventCardProps {
  event: Activity;
}

export default function UpcomingEventCard({ event }: UpcomingEventCardProps) {
  const { t } = useTranslation();

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_-30px_rgba(15,29,38,.55)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg">
      <Link
        to={`/events/${event.id}`}
        className="flex items-start gap-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        <DateColumn date={getActivityDate(event)} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="truncate font-semibold tracking-tight text-slate-900 transition group-hover:text-orange-700">{event.name}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{t(`activity.kinds.${event.kind}`)} · {getActivityStartTime(event)}{event.location ? ` · ${event.location}` : ""}</p>
          {event.kind === "match" && event.opponentName && <p className="mt-1 text-sm text-slate-500">{t("activity.fields.opponent")}: {event.opponentName}</p>}
        </div>
        <span className="mt-2 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
