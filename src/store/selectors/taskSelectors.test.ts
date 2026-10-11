import { describe, expect, it } from 'vitest';
import type { ActivityTask } from '../../types';
import { canSignUpForTasks, selectActivityTasks, selectCurrentMember } from './taskSelectors';

const tasks: ActivityTask[] = [
  { id: 't1', name: 'Kiosk', requiredPeople: 2, isFulfilled: false, signups: [{ personId: 'm1' }] },
  { id: 't2', name: 'Cake', requiredPeople: 1, isFulfilled: true, signups: [{ personId: 'm2' }, { personId: 'm3' }] },
];

describe('task selectors', () => {
  it('computes open slots, signup state and over-subscription', () => {
    const summary = selectActivityTasks({ tasks }, 'm1');
    expect(summary.tasks.map((task) => [task.id, task.openSlots, task.isFulfilled, task.isOverSubscribed, task.isSignedUp])).toEqual([
      ['t1', 1, false, false, true],
      ['t2', 0, true, true, false],
    ]);
    expect(summary.fulfilledCount).toBe(1);
    expect(summary.totalCount).toBe(2);
  });

  it('falls back to an empty list and no signup without a person', () => {
    expect(selectActivityTasks({}, undefined)).toEqual({ tasks: [], fulfilledCount: 0, totalCount: 0 });
    expect(selectActivityTasks({ tasks }).tasks.every((task) => !task.isSignedUp)).toBe(true);
  });

  it('finds the current member by email, ignoring case', () => {
    const squad = { members: [{ id: 'm1', email: 'Anna@Example.com', roles: ['guardian'] }, { id: 'm2' }] };
    expect(selectCurrentMember(' anna@example.com ', squad)?.id).toBe('m1');
    expect(selectCurrentMember(undefined, squad)).toBeUndefined();
    expect(selectCurrentMember('x@y.z', null)).toBeUndefined();
  });

  it('allows adults only to sign up', () => {
    expect(canSignUpForTasks({ roles: ['guardian'] })).toBe(true);
    expect(canSignUpForTasks({ roles: ['player'] })).toBe(false);
    expect(canSignUpForTasks(undefined)).toBe(false);
  });
});
