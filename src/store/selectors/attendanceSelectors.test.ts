import { describe, expect, it } from 'vitest';
import type { Activity, Player } from '../../types';
import { hasActivityStarted, selectActivityAttendance } from './attendanceSelectors';

const player = (id: string, firstName: string): Player => ({ id, firstName, lastName: 'X', birthDate: '2012-01-01', level: 2, status: 'active' });
const players = [player('p1', 'Zoe'), player('p2', 'Ada'), player('p3', 'Ben'), player('p4', 'Cy')];
const activity: Activity = {
  id: 'a1', squadId: 'g1', kind: 'match', name: 'Match', startsAt: '2026-01-10T10:00:00.000Z',
  invitations: [
    { id: 'i1', playerId: 'p1', response: 'accepted' },
    { id: 'i2', playerId: 'p2', response: 'accepted' },
    { id: 'i3', playerId: 'p3', response: 'declined' },
  ],
  teams: [],
  attendance: [{ personId: 'p2', status: 'present' }, { personId: 'p4', status: 'excused' }],
} as unknown as Activity;
const after = new Date('2026-01-11T00:00:00.000Z');

describe('attendance selectors', () => {
  it('is only available after the activity starts', () => {
    expect(hasActivityStarted(activity, after)).toBe(true);
    expect(selectActivityAttendance(activity, players, new Date('2026-01-09T00:00:00.000Z')).isAvailable).toBe(false);
    expect(hasActivityStarted({ startsAt: 'invalid' }, after)).toBe(false);
  });

  it('lists accepted and recorded players by name with counts', () => {
    const view = selectActivityAttendance(activity, players, after);
    expect(view.rows.map((row) => [row.name, row.status])).toEqual([
      ['Ada X', 'present'], ['Cy X', 'excused'], ['Zoe X', undefined],
    ]);
    expect(view.counts).toEqual({ present: 1, absent: 0, excused: 1, unrecorded: 1 });
  });

  it('includes selected players and falls back to empty without data', () => {
    const withTeam = { ...activity, teams: [{ id: 't', name: 'T', selectedPlayers: ['p3'] }] } as unknown as Activity;
    expect(selectActivityAttendance(withTeam, players, after).rows.map((row) => row.playerId)).toContain('p3');
    const empty = { ...activity, invitations: [], teams: [], attendance: undefined } as unknown as Activity;
    expect(selectActivityAttendance(empty, players, after).rows).toEqual([]);
  });
});
