import type { Activity, ActivityPayload, Squad } from '../types';
import { ApiError } from '../services/apiClient';
import { getActivityById as getActivityByIdService } from '../services/activityService';
import { writeActivityIntent, type ActivityDetailsPatch, type ActivityIntent } from '../services/activityIntentService';
import {
  createActivity,
  cancelActivity,
  deleteActivity,
  markActivitySelectionSent,
  updateActivity,
  updateActivityInvitation,
  restoreActivity,
  type InvitationUpdate,
} from '../services/activityService';
import { sortActivities } from './selectors/activitySelectors';
import { selectSelectionValidation } from './selectors/selectionSelectors';

const normalizeActivity = (activity: Activity): Activity => ({ ...activity, status: activity.status ?? 'active' });

interface ActivitiesSliceState {
  squad: Squad | null;
  activities: Activity[];
}

export interface ActivitiesSliceAccess {
  get: () => ActivitiesSliceState;
  set: (partial: { activities: Activity[] }) => void;
}

export interface ActivityActions {
  addActivity: (payload: ActivityPayload) => Promise<boolean>;
  updateActivity: (id: string, payload: ActivityDetailsPatch) => Promise<boolean>;
  executeActivityIntent: (id: string, intent: ActivityIntent) => Promise<boolean>;
  updateActivityInvitation: (activityId: string, playerId: string, update: InvitationUpdate) => Promise<boolean>;
  markActivitySelectionSent: (activityId: string) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;
  cancelActivity: (id: string) => Promise<boolean>;
  restoreActivity: (id: string) => Promise<boolean>;
}

/** Activity mutations; every successful call replaces the stored activity with the server response. */
export function createActivityActions({ get, set }: ActivitiesSliceAccess): ActivityActions {
  const requireSquad = (): Squad => {
    const squad = get().squad;
    if (!squad) throw new Error('No squad selected');
    return squad;
  };

  const replace = (updated: Activity) => {
    set({ activities: sortActivities(get().activities.map((entry) => (entry.id === updated.id ? updated : entry))) });
  };

  const requireActiveActivity = (activityId: string): Activity => {
    const activity = get().activities.find((entry) => entry.id === activityId);
    if (!activity) throw new Error('Activity not found');
    if (activity.status === 'cancelled') throw new Error('Cancelled activities are read-only');
    return activity;
  };

  const run = async (label: string, action: (squadId: string) => Promise<void>, refreshActivityId?: string): Promise<boolean> => {
    const squad = requireSquad();
    try {
      await action(squad.id);
      return true;
    } catch (error) {
      console.error(`Failed to ${label}:`, error);
      if (refreshActivityId && error instanceof ApiError && error.status === 409) {
        try {
          const latest = await getActivityByIdService(squad.id, refreshActivityId);
          if (latest) replace(normalizeActivity(latest));
        } catch (refreshError) {
          console.error('Failed to refresh conflicting activity:', refreshError);
        }
      }
      return false;
    }
  };

  return {
    addActivity: (payload) => run('add activity', async (squadId) => {
      const created = normalizeActivity(await createActivity(squadId, payload));
      set({ activities: sortActivities([...get().activities, created]) });
    }),

    updateActivity: (id, payload) => run('update activity', async (squadId) => {
      requireActiveActivity(id);
      replace(normalizeActivity(await updateActivity(squadId, id, payload)));
    }, id),

    executeActivityIntent: (id, intent) => run(`execute ${intent.type}`, async (squadId) => {
      requireActiveActivity(id);
      replace(normalizeActivity(await writeActivityIntent(squadId, id, intent)));
    }, id),

    updateActivityInvitation: (activityId, playerId, update) => run('update invitation', async (squadId) => {
      requireActiveActivity(activityId);
      replace(normalizeActivity(await updateActivityInvitation(squadId, activityId, playerId, update)));
    }, activityId),

    markActivitySelectionSent: (activityId) => run('mark selection sent', async (squadId) => {
      const current = get().activities.find((entry) => entry.id === activityId);
      requireActiveActivity(activityId);
      if (!current || !selectSelectionValidation(current).canSend) {
        throw new Error('Selection does not meet the send requirements');
      }
      replace(normalizeActivity(await markActivitySelectionSent(squadId, activityId)));
    }, activityId),

    deleteActivity: (id) => run('delete activity', async (squadId) => {
      await deleteActivity(squadId, id);
      set({ activities: get().activities.filter((entry) => entry.id !== id) });
    }),

    cancelActivity: (id) => run('cancel activity', async (squadId) => {
      const current = requireActiveActivity(id);
      if (current.spondId) throw new Error('Spond-linked activities cannot be cancelled locally');
      replace(normalizeActivity(await cancelActivity(squadId, id)));
    }, id),

    restoreActivity: (id) => run('restore activity', async (squadId) => {
      const current = get().activities.find((entry) => entry.id === id);
      if (!current) throw new Error('Activity not found');
      if (current.spondId) throw new Error('Spond-linked activities cannot be restored locally');
      replace(normalizeActivity(await restoreActivity(squadId, id)));
    }, id),
  };
}
