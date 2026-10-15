import type { Activity } from '../types';
import { useTranslation } from 'react-i18next';
import EventCard from './EventCard';

interface EventsListProps {
  activities: Activity[];
  onActivityClick?: (activityId: string) => void;
}

export default function EventsList({ activities, onActivityClick }: EventsListProps) {
  const { t } = useTranslation();

  if (activities.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500"><p>{t('events.list.emptyState')}</p></div>;
  }

  return <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
    {activities.map((activity) => <EventCard key={activity.id} activity={activity} onClick={onActivityClick} />)}
  </div>;
}
