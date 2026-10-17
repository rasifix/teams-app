import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DateColumn from './DateColumn';
import { getActivityDate, getActivityStartTime } from '../store/selectors/activitySelectors';
import type { Activity } from '../types';
import { ChevronRightIcon } from './ui';

interface UpcomingEventCardProps {
  event: Activity;
}

export default function UpcomingEventCard({ event }: UpcomingEventCardProps) {
  const { t } = useTranslation();

  return (
    <div className="group rounded-3xl border border-edge bg-surface p-4 shadow-md transition duration-300 hover:-translate-y-0.5 hover:border-brand-border hover:shadow-lg">
      <Link
        to={`/events/${event.id}`}
        className="flex items-start gap-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <DateColumn date={getActivityDate(event)} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="truncate font-semibold tracking-tight text-content-strong transition group-hover:text-brand-text">{event.name}</p>
          <p className="field-help">{t(`activity.kinds.${event.kind}`)} · {getActivityStartTime(event)}{event.location ? ` · ${event.location}` : ""}</p>
          {event.kind === "match" && event.opponentName && <p className="field-help">{t("activity.fields.opponent")}: {event.opponentName}</p>}
        </div>
        <ChevronRightIcon className="card-chevron" />
      </Link>
    </div>
  );
}
