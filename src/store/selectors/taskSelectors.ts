import type { Activity, ActivityTask, Squad } from '../../types';

export interface ActivityTaskView {
  id: string;
  name: string;
  description?: string;
  requiredPeople: number;
  signedUpCount: number;
  openSlots: number;
  isFulfilled: boolean;
  /** More people signed up than required. */
  isOverSubscribed: boolean;
  isSignedUp: boolean;
  signupPersonIds: string[];
}

export interface ActivityTasksSummary {
  tasks: ActivityTaskView[];
  fulfilledCount: number;
  totalCount: number;
}

/** The squad member that belongs to the logged-in user, matched by email (the user's identity). */
export function selectCurrentMember(email: string | undefined, squad: Pick<Squad, 'members'> | null | undefined) {
  const normalized = (email ?? '').trim().toLowerCase();
  if (!normalized) return undefined;
  return (squad?.members ?? []).find((member) => (member.email ?? '').trim().toLowerCase() === normalized);
}

/** Only admins, trainers and guardians (adults) may sign up; the backend enforces the same rule. */
export function canSignUpForTasks(member: { roles?: string[] } | undefined): boolean {
  return Boolean(member?.roles?.some((role) => role === 'admin' || role === 'trainer' || role === 'guardian'));
}

const toView = (task: ActivityTask, personId: string | undefined): ActivityTaskView => {
  const signups = task.signups ?? [];
  const signedUpCount = signups.length;
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    requiredPeople: task.requiredPeople,
    signedUpCount,
    openSlots: Math.max(0, task.requiredPeople - signedUpCount),
    isFulfilled: task.isFulfilled,
    isOverSubscribed: signedUpCount > task.requiredPeople,
    isSignedUp: personId !== undefined && signups.some((signup) => signup.personId === personId),
    signupPersonIds: signups.map((signup) => signup.personId),
  };
};

/** Tasks in creation order. Guardians receive only their own signups, so only `isFulfilled` (computed by the backend) is reliable for them. */
export function selectActivityTasks(activity: Pick<Activity, 'tasks'>, currentPersonId?: string): ActivityTasksSummary {
  const tasks = (activity.tasks ?? []).map((task) => toView(task, currentPersonId));
  return { tasks, fulfilledCount: tasks.filter((task) => task.isFulfilled).length, totalCount: tasks.length };
}
