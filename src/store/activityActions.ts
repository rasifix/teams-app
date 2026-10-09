import type { Activity, ActivityAttendance, ActivityPayload, Group, Team } from '../types';
import {
  createActivity,
  deleteActivity,
  markActivitySelectionSent,
  updateActivity,
  updateActivityInvitation,
  updateActivitySelection,
  updateActivityAttendance,
  updateActivityTeams,
  type InvitationUpdate,
} from '../services/activityService';
import { sortActivities } from './selectors/activitySelectors';

interface ActivitiesSliceState {
  group: Group | null;
  activities: Activity[];
}

export interface ActivitiesSliceAccess {
  get: () => ActivitiesSliceState;
  set: (partial: { activities: Activity[] }) => void;
}

export interface ActivityActions {
  addActivity: (payload: ActivityPayload) => Promise<boolean>;
  updateActivity: (id: string, payload: Partial<ActivityPayload>) => Promise<boolean>;
  updateActivityInvitation: (activityId: string, playerId: string, update: InvitationUpdate) => Promise<boolean>;
  updateActivityTeams: (activityId: string, teams: Team[]) => Promise<boolean>;
  updateActivitySelection: (activityId: string, teams: Team[]) => Promise<boolean>;
  markActivitySelectionSent: (activityId: string) => Promise<boolean>;
  updateActivityAttendance: (activityId: string, attendance: ActivityAttendance[]) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;
}

/** Activity mutations; every successful call replaces the stored activity with the server response. */
export function createActivityActions({ get, set }: ActivitiesSliceAccess): ActivityActions {
  const requireGroup = (): Group => {
    const group = get().group;
    if (!group) throw new Error('No group selected');
    return group;
  };

  const replace = (updated: Activity) => {
    set({ activities: sortActivities(get().activities.map((entry) => (entry.id === updated.id ? updated : entry))) });
  };

  const run = async (label: string, action: (groupId: string) => Promise<void>): Promise<boolean> => {
    const group = requireGroup();
    try {
      await action(group.id);
      return true;
    } catch (error) {
      console.error(`Failed to ${label}:`, error);
      return false;
    }
  };

  return {
    addActivity: (payload) => run('add activity', async (groupId) => {
      const created = await createActivity(groupId, payload);
      set({ activities: sortActivities([...get().activities, created]) });
    }),

    updateActivity: (id, payload) => run('update activity', async (groupId) => {
      replace(await updateActivity(groupId, id, payload));
    }),

    updateActivityInvitation: (activityId, playerId, update) => run('update invitation', async (groupId) => {
      replace(await updateActivityInvitation(groupId, activityId, playerId, update));
    }),

    updateActivityTeams: (activityId, teams) => run('update teams', async (groupId) => {
      const savedTeams = await updateActivityTeams(groupId, activityId, teams);
      const current = get().activities.find((entry) => entry.id === activityId);
      if (current) replace({ ...current, teams: savedTeams });
    }),

    updateActivityAttendance: (activityId, attendance) => run('update attendance', async (groupId) => {
      const saved = await updateActivityAttendance(groupId, activityId, attendance);
      const current = get().activities.find((entry) => entry.id === activityId);
      if (current) replace({ ...current, attendance: saved });
    }),

    updateActivitySelection: (activityId, teams) => run('update selection', async (groupId) => {
      replace(await updateActivitySelection(groupId, activityId, teams));
    }),

    markActivitySelectionSent: (activityId) => run('send selection', async (groupId) => {
      replace(await markActivitySelectionSent(groupId, activityId));
    }),

    deleteActivity: (id) => run('delete activity', async (groupId) => {
      await deleteActivity(groupId, id);
      set({ activities: get().activities.filter((entry) => entry.id !== id) });
    }),
  };
}
