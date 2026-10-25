import { useTranslation } from 'react-i18next';
import { getActivityDate, getActivityStartTime } from '../store/selectors/activitySelectors';
import type { Activity } from '../types';
import { ActionCardLink, ActionCardTitle, Badge, DateColumn, EntityMeta } from './ui';

interface UpcomingActivityCardProps {
  event: Activity;
}

export default function UpcomingActivityCard({ event }: UpcomingActivityCardProps) {
  const { t } = useTranslation();

  return (
    <ActionCardLink to={`/activities/${event.id}`} leading={<DateColumn date={getActivityDate(event)} />}>
      <EntityMeta>
        <ActionCardTitle>{event.name}</ActionCardTitle>
        <Badge tone="brand" size="sm">{t(`domain.activity.kinds.${event.kind}`)}</Badge>
      </EntityMeta>
      <EntityMeta>
        <span>{getActivityStartTime(event)}</span>
        {event.location && <span>{event.location}</span>}
      </EntityMeta>
      {event.kind === 'match' && event.opponentName && <EntityMeta><span>{t('domain.activity.fields.opponent')}: {event.opponentName}</span></EntityMeta>}
    </ActionCardLink>
  );
}
