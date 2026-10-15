import type { Activity } from '../../types';
import { isSelectionSent } from './activitySelectors';

export type ActivityPhase = 'planning' | 'selectionSent' | 'started' | 'recorded';

export interface ActivityPhaseSections {
  invitations: boolean;
  attendance: boolean;
}

// `startsAt` carries the local wall-clock time in its UTC components.
function getStartTimestamp(activity: Pick<Activity, 'startsAt'>): number {
  const start = new Date(activity.startsAt);
  return new Date(
    start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()
  ).getTime();
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
