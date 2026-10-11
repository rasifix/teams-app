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
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:border-orange-300 transition-colors">
      <Link
        to={`/events/${event.id}`}
        className="flex items-start gap-4 rounded-md -m-1 p-1 hover:bg-orange-50"
      >
        <DateColumn date={getActivityDate(event)} />
        <div className="pt-1">
          <p className="font-medium text-gray-900">{event.name}</p>
          <p className="mt-1 text-sm text-gray-600">{t(`activity.kinds.${event.kind}`)} · {getActivityStartTime(event)}{event.location ? ` · ${event.location}` : ""}</p>
          {event.kind === "match" && event.opponentName && <p className="mt-1 text-sm text-gray-600">{t("activity.fields.opponent")}: {event.opponentName}</p>}
        </div>
      </Link>
    </div>
  );
}