import type { Activity } from '../types';
import type { ActivityCardSummary } from '../store/selectors/activityViewSelectors';
import { useTranslation } from 'react-i18next';
import ActivityCard from './ActivityCard';
import { ContentGrid, EmptyState } from './ui';

interface EventsListProps {
  activities: Activity[];
  summaries: Map<string, ActivityCardSummary>;
  onOpenActivity: (activityId: string) => void;
  onOpenTeam: (activityId: string, teamId: string) => void;
}

export default function EventsList({ activities, summaries, onOpenActivity, onOpenTeam }: EventsListProps) {
  const { t } = useTranslation();

  if (activities.length === 0) {
    return <EmptyState><p>{t('page.events.list.emptyState')}</p></EmptyState>;
  }

  return <ContentGrid variant="equal">
    {activities.map((activity) => <ActivityCard key={activity.id} activity={activity} summary={summaries.get(activity.id)!} onOpenActivity={onOpenActivity} onOpenTeam={onOpenTeam} />)}
  </ContentGrid>;
}
