import type { Activity, ActivityAttendance, ActivityTask, ActivityPayload, Squad, Team } from '../types';
import {
  createActivity,
  createActivityTask,
  deleteActivityTask,
  signUpForActivityTask,
  updateActivityTask,
  withdrawFromActivityTask,
  deleteActivity,
  markActivitySelectionSent,
  updateActivity,
  updateActivityInvitation,
  updateActivitySelection,
  updateActivityAttendance,
  updateActivityTeams,
  type ActivityTaskInput,
  type InvitationUpdate,
} from '../services/activityService';
import { sortActivities } from './selectors/activitySelectors';

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
  updateActivity: (id: string, payload: Partial<ActivityPayload>) => Promise<boolean>;
  updateActivityInvitation: (activityId: string, playerId: string, update: InvitationUpdate) => Promise<boolean>;
  updateActivityTeams: (activityId: string, teams: Team[]) => Promise<boolean>;
  updateActivitySelection: (activityId: string, teams: Team[]) => Promise<boolean>;
  markActivitySelectionSent: (activityId: string) => Promise<boolean>;
  updateActivityAttendance: (activityId: string, attendance: ActivityAttendance[]) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;
  addActivityTask: (activityId: string, task: ActivityTaskInput) => Promise<boolean>;
  updateActivityTask: (activityId: string, taskId: string, task: Partial<ActivityTaskInput>) => Promise<boolean>;
  deleteActivityTask: (activityId: string, taskId: string) => Promise<boolean>;
  signUpForActivityTask: (activityId: string, taskId: string) => Promise<boolean>;
  withdrawFromActivityTask: (activityId: string, taskId: string) => Promise<boolean>;
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

  const replaceTasks = (activityId: string, tasks: ActivityTask[]) => {
    const current = get().activities.find((entry) => entry.id === activityId);
    if (current) replace({ ...current, tasks });
  };

  const run = async (label: string, action: (squadId: string) => Promise<void>): Promise<boolean> => {
    const squad = requireSquad();
    try {
      await action(squad.id);
      return true;
    } catch (error) {
      console.error(`Failed to ${label}:`, error);
      return false;
    }
  };

  return {
    addActivity: (payload) => run('add activity', async (squadId) => {
      const created = await createActivity(squadId, payload);
      set({ activities: sortActivities([...get().activities, created]) });
    }),

    updateActivity: (id, payload) => run('update activity', async (squadId) => {
      replace(await updateActivity(squadId, id, payload));
    }),

    updateActivityInvitation: (activityId, playerId, update) => run('update invitation', async (squadId) => {
      replace(await updateActivityInvitation(squadId, activityId, playerId, update));
    }),

    updateActivityTeams: (activityId, teams) => run('update teams', async (squadId) => {
      const savedTeams = await updateActivityTeams(squadId, activityId, teams);
      const current = get().activities.find((entry) => entry.id === activityId);
      if (current) replace({ ...current, teams: savedTeams });
    }),

    updateActivityAttendance: (activityId, attendance) => run('update attendance', async (squadId) => {
      const saved = await updateActivityAttendance(squadId, activityId, attendance);
      const current = get().activities.find((entry) => entry.id === activityId);
      if (current) replace({ ...current, attendance: saved });
    }),

    addActivityTask: (activityId, task) => run('add task', async (squadId) => {
      replaceTasks(activityId, await createActivityTask(squadId, activityId, task));
    }),

    updateActivityTask: (activityId, taskId, task) => run('update task', async (squadId) => {
      replaceTasks(activityId, await updateActivityTask(squadId, activityId, taskId, task));
    }),

    deleteActivityTask: (activityId, taskId) => run('delete task', async (squadId) => {
      replaceTasks(activityId, await deleteActivityTask(squadId, activityId, taskId));
    }),

    signUpForActivityTask: (activityId, taskId) => run('sign up for task', async (squadId) => {
      replaceTasks(activityId, await signUpForActivityTask(squadId, activityId, taskId));
    }),

    withdrawFromActivityTask: (activityId, taskId) => run('withdraw from task', async (squadId) => {
      replaceTasks(activityId, await withdrawFromActivityTask(squadId, activityId, taskId));
    }),

    updateActivitySelection: (activityId, teams) => run('update selection', async (squadId) => {
      replace(await updateActivitySelection(squadId, activityId, teams));
    }),

    markActivitySelectionSent: (activityId) => run('send selection', async (squadId) => {
      replace(await markActivitySelectionSent(squadId, activityId));
    }),

    deleteActivity: (id) => run('delete activity', async (squadId) => {
      await deleteActivity(squadId, id);
      set({ activities: get().activities.filter((entry) => entry.id !== id) });
    }),
  };
}
