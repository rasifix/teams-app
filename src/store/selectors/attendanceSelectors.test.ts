import { describe, expect, it } from 'vitest';
import type { Activity, Player } from '../../types';
import { hasActivityStarted, selectActivityAttendance, selectAttendanceDialogRows, selectAttendanceSummary, toAttendanceRecords } from './attendanceSelectors';

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

describe('attendance dialog selectors', () => {
  const withTeam = {
    ...activity,
    teams: [{ id: 't', name: 'T', selectedPlayers: ['p1', 'p2', 'p4'] }],
    attendance: [{ personId: 'p4', status: 'excused', reason: 'sick' }, { personId: 'p2', status: 'present' }, { personId: 'p3', status: 'present' }],
  } as unknown as Activity;

  it('lists only selected players, present by default, keeping recorded excused with reason', () => {
    expect(selectAttendanceDialogRows(withTeam, players)).toEqual([
      { playerId: 'p2', name: 'Ada X', status: 'present', reason: '' },
      { playerId: 'p4', name: 'Cy X', status: 'excused', reason: 'sick' },
      { playerId: 'p1', name: 'Zoe X', status: 'present', reason: '' },
    ]);
  });

  it('returns no rows without selected players', () => {
    expect(selectAttendanceDialogRows(activity, players)).toEqual([]);
  });

  it('builds records and only keeps the reason for excused players', () => {
    expect(toAttendanceRecords([
      { playerId: 'a', name: 'A', status: 'present', reason: 'sick' },
      { playerId: 'b', name: 'B', status: 'excused', reason: 'noShow' },
      { playerId: 'c', name: 'C', status: 'excused', reason: '' },
    ])).toEqual([
      { personId: 'a', status: 'present' },
      { personId: 'b', status: 'excused', reason: 'noShow' },
      { personId: 'c', status: 'excused' },
    ]);
  });

  it('summarizes recorded attendance of selected players only', () => {
    expect(selectAttendanceSummary(withTeam, players)).toEqual({
      isRecorded: true,
      present: 1,
      excused: 1,
      excusedWithReason: [{ playerId: 'p4', name: 'Cy X', reason: 'sick' }],
    });
    expect(selectAttendanceSummary(activity, players)).toMatchObject({ isRecorded: false, present: 0, excused: 0 });
  });
});
