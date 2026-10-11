import type { Activity } from '../../types';
import { getActivityDate } from './activitySelectors';

export const selectUpcomingEvents = (
  activities: Activity[],
  now: Date = new Date(),
  limit?: number,
): Activity[] => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const upcoming = activities
    .filter((activity) => {
      const date = new Date(getActivityDate(activity));
      date.setHours(0, 0, 0, 0);
      return date >= today;
    })
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

  return typeof limit === 'number' && limit >= 0 ? upcoming.slice(0, limit) : upcoming;
};
