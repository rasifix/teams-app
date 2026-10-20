import { beforeEach, describe, expect, it } from 'vitest';
import type { Activity, Team, Trainer } from '../types';
import { useStore } from './useStore';
import { mergeMembersFromCollections } from './selectors/memberSelectors';
import { getActivityTime } from './selectors/activitySelectors';

const baseState = useStore.getState();

function createTeam(overrides: Partial<Team>): Team {
  return {
    id: 'team-default',
    name: 'Default Team',
    strength: 2,
    startTime: '10:00',
    selectedPlayers: [],
    ...overrides,
  };
}

function createActivity(overrides: Partial<Activity>): Activity {
  return {
    id: 'event-default',
    squadId: 'squad-1',
    kind: 'match',
    name: 'Default Activity',
    startsAt: '2026-01-01T10:00:00.000Z',
    maxPlayersPerTeam: 12,
    minPlayersPerTeam: 8,
    teams: [],
    invitations: [],
    ...overrides,
  };
}

function createTrainer(overrides: Partial<Trainer>): Trainer {
  return {
    id: 'trainer-default',
    firstName: 'Alex',
    lastName: 'Coach',
    email: 'alex@example.com',
    roles: ['trainer'],
    ...overrides,
  };
}

describe('useStore selectors', () => {
  beforeEach(() => {
    useStore.setState(baseState, true);
  });

  it('returns trainer event history sorted newest first', () => {
    useStore.setState({
      members: mergeMembersFromCollections([], [createTrainer({ id: 'tr-1' }), createTrainer({ id: 'tr-2' })]),
      activities: [
        createActivity({
          id: 'e1',
          name: 'Older Activity',
          startsAt: '2026-03-01T10:00:00.000Z',
          teams: [createTeam({ id: 't1', responsiblePersonIds: ['tr-1'], name: 'Blue', strength: 3 })],
        }),
        createActivity({
          id: 'e2',
          name: 'Newest Activity',
          startsAt: '2026-04-01T10:00:00.000Z',
          teams: [createTeam({ id: 't2', responsiblePersonIds: ['tr-1'], name: 'Red', strength: 1 })],
        }),
        createActivity({
          id: 'e3',
          name: 'No Assignment',
          startsAt: '2026-05-01T10:00:00.000Z',
          teams: [createTeam({ id: 't3', responsiblePersonIds: ['tr-2'], name: 'Green', strength: 2 })],
        }),
      ],
    });

    const history = useStore.getState().getTrainerEventHistory('tr-1');

    expect(history).toHaveLength(2);
    expect(history.map((entry) => entry.eventId)).toEqual(['e2', 'e1']);
    expect(history[0].teamName).toBe('Red');
    expect(history[0].teamStrength).toBe(1);
  });

  it('uses team time and location when present for tournaments', () => {
    useStore.setState({
      members: mergeMembersFromCollections([], [createTrainer({ id: 'tr-1' })]),
      activities: [
        createActivity({
          id: 'e1',
          kind: 'tournament',
          startsAt: '2026-04-01T10:00:00.000Z',
          location: 'Activity Hall',
          teams: [
            createTeam({
              id: 't1',
              responsiblePersonIds: ['tr-1'],
              startTime: '13:15',
              location: 'Team Field',
            }),
          ],
        }),
      ],
    });

    const [entry] = useStore.getState().getTrainerEventHistory('tr-1');

    expect(entry.startTime).toBe('13:15');
    expect(entry.location).toBe('Team Field');
  });

  it('falls back to earliest team time and event location for tournaments when team values are missing', () => {
    useStore.setState({
      members: mergeMembersFromCollections([], [createTrainer({ id: 'tr-1' }), createTrainer({ id: 'tr-2' }), createTrainer({ id: 'tr-3' })]),
      activities: [
        createActivity({
          id: 'e1',
          kind: 'tournament',
          startsAt: '2026-04-01T10:00:00.000Z',
          location: 'Main Stadium',
          teams: [
            createTeam({ id: 't1', responsiblePersonIds: ['tr-1'], startTime: '', location: '   ' }),
            createTeam({ id: 't2', responsiblePersonIds: ['tr-2'], startTime: '12:30' }),
            createTeam({ id: 't3', responsiblePersonIds: ['tr-3'], startTime: '09:00' }),
          ],
        }),
      ],
    });

    const [entry] = useStore.getState().getTrainerEventHistory('tr-1');

    expect(entry.startTime).toBe('09:00');
    expect(entry.location).toBe('Main Stadium');
  });

  it('uses match activity time and location instead of team overrides', () => {
    useStore.setState({
      members: mergeMembersFromCollections([], [createTrainer({ id: 'tr-1' })]),
      activities: [createActivity({
        id: 'match',
        kind: 'match',
        startsAt: '2026-04-01T10:00:00.000Z',
        location: 'Match Stadium',
        teams: [createTeam({ id: 't1', responsiblePersonIds: ['tr-1'], startTime: '13:15', location: 'Team Field' })],
      })],
    });
    const [entry] = useStore.getState().getTrainerEventHistory('tr-1');
    expect(entry.startTime).toBe(getActivityTime({ startsAt: '2026-04-01T10:00:00.000Z' }));
    expect(entry.location).toBe('Match Stadium');
  });

  it('returns history for any assigned member id including guardian assignees', () => {
    useStore.setState({
      members: mergeMembersFromCollections([], [createTrainer({ id: 'g-42' })]),
      activities: [
        createActivity({
          id: 'e-guardian',
          name: 'Guardian Led Activity',
          startsAt: '2026-06-01T10:00:00.000Z',
          teams: [createTeam({ id: 'tg-1', responsiblePersonIds: ['g-42'], name: 'Guardians', strength: 2 })],
        }),
      ],
    });

    const history = useStore.getState().getTrainerEventHistory('g-42');

    expect(history).toHaveLength(1);
    expect(history[0].eventId).toBe('e-guardian');
    expect(history[0].teamName).toBe('Guardians');
  });
});
