import type { Activity } from '../types';
import { useTranslation } from 'react-i18next';
import EventCard from './EventCard';
import { ContentGrid, EmptyState } from './ui';

interface EventsListProps {
  activities: Activity[];
  onActivityClick?: (activityId: string) => void;
}

export default function EventsList({ activities, onActivityClick }: EventsListProps) {
  const { t } = useTranslation();

  if (activities.length === 0) {
    return <EmptyState><p>{t('page.events.list.emptyState')}</p></EmptyState>;
  }

  return <ContentGrid variant="equal">
    {activities.map((activity) => <EventCard key={activity.id} activity={activity} onClick={onActivityClick} />)}
  </ContentGrid>;
}
