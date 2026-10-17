import type { Activity } from '../types';
import { useTranslation } from 'react-i18next';
import EventCard from './EventCard';
import { EmptyState } from './ui';

interface EventsListProps {
  activities: Activity[];
  onActivityClick?: (activityId: string) => void;
}

export default function EventsList({ activities, onActivityClick }: EventsListProps) {
  const { t } = useTranslation();

  if (activities.length === 0) {
    return <EmptyState><p>{t('events.list.emptyState')}</p></EmptyState>;
  }

  return <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
    {activities.map((activity) => <EventCard key={activity.id} activity={activity} onClick={onActivityClick} />)}
  </div>;
}
