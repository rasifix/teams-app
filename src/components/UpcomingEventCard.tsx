import { useTranslation } from 'react-i18next';
import { getActivityDate, getActivityStartTime } from '../store/selectors/activitySelectors';
import type { Activity } from '../types';
import { ActionCardLink, ActionCardTitle, DateColumn, EntityMeta } from './ui';

interface UpcomingEventCardProps {
  event: Activity;
}

export default function UpcomingEventCard({ event }: UpcomingEventCardProps) {
  const { t } = useTranslation();

  return (
    <ActionCardLink to={`/activities/${event.id}`} leading={<DateColumn date={getActivityDate(event)} />}>
      <ActionCardTitle>{event.name}</ActionCardTitle>
      <EntityMeta>
        <span>{t(`domain.activity.kinds.${event.kind}`)}</span>
        <span>{getActivityStartTime(event)}</span>
        {event.location && <span>{event.location}</span>}
      </EntityMeta>
      {event.kind === 'match' && event.opponentName && <EntityMeta><span>{t('domain.activity.fields.opponent')}: {event.opponentName}</span></EntityMeta>}
    </ActionCardLink>
  );
}
