import type { Activity } from '../../types';
import { isSelectionSent } from './activitySelectors';

export type ActivityPhase = 'planning' | 'selectionSent' | 'started' | 'recorded';

export interface ActivityPhaseSections {
  invitations: boolean;
  attendance: boolean;
}

function getStartTimestamp(activity: Pick<Activity, 'startsAt'>): number {
  return Date.parse(activity.startsAt);
}

/** Lifecycle: planning (invite) -> selection sent -> started -> attendance recorded. */
export function selectActivityPhase(
  activity: Pick<Activity, 'startsAt' | 'selectionSentAt' | 'attendance'>,
  now: Date = new Date()
): ActivityPhase {
  if ((activity.attendance ?? []).length > 0) return 'recorded';
  if (now.getTime() >= getStartTimestamp(activity)) return 'started';
  return isSelectionSent(activity) ? 'selectionSent' : 'planning';
}

export function selectActivityPhaseSections(phase: ActivityPhase): ActivityPhaseSections {
  return {
    invitations: true,
    attendance: phase === 'started' || phase === 'recorded',
  };
}
