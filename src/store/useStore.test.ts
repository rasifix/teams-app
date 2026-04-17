import { beforeEach, describe, expect, it } from 'vitest';
import type { Event, Team } from '../types';
import { useStore } from './useStore';

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

function createEvent(overrides: Partial<Event>): Event {
  return {
    id: 'event-default',
    name: 'Default Event',
    date: '2026-01-01',
    maxPlayersPerTeam: 12,
    minPlayersPerTeam: 8,
    teams: [],
    invitations: [],
    ...overrides,
  };
}

describe('useStore selectors', () => {
  beforeEach(() => {
    useStore.setState(baseState, true);
  });

  it('returns trainer event history sorted newest first', () => {
    useStore.setState({
      events: [
        createEvent({
          id: 'e1',
          name: 'Older Event',
          date: '2026-03-01',
          teams: [createTeam({ id: 't1', trainerId: 'tr-1', name: 'Blue', strength: 3 })],
        }),
        createEvent({
          id: 'e2',
          name: 'Newest Event',
          date: '2026-04-01',
          teams: [createTeam({ id: 't2', trainerId: 'tr-1', name: 'Red', strength: 1 })],
        }),
        createEvent({
          id: 'e3',
          name: 'No Assignment',
          date: '2026-05-01',
          teams: [createTeam({ id: 't3', trainerId: 'tr-2', name: 'Green', strength: 2 })],
        }),
      ],
    });

    const history = useStore.getState().getTrainerEventHistory('tr-1');

    expect(history).toHaveLength(2);
    expect(history.map((entry) => entry.eventId)).toEqual(['e2', 'e1']);
    expect(history[0].teamName).toBe('Red');
    expect(history[0].teamStrength).toBe(1);
  });

  it('uses team time and location when present', () => {
    useStore.setState({
      events: [
        createEvent({
          id: 'e1',
          date: '2026-04-01',
          location: 'Event Hall',
          teams: [
            createTeam({
              id: 't1',
              trainerId: 'tr-1',
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

  it('falls back to earliest event time and event location when team values are missing', () => {
    useStore.setState({
      events: [
        createEvent({
          id: 'e1',
          date: '2026-04-01',
          location: 'Main Stadium',
          teams: [
            createTeam({ id: 't1', trainerId: 'tr-1', startTime: '', location: '   ' }),
            createTeam({ id: 't2', trainerId: 'tr-2', startTime: '12:30' }),
            createTeam({ id: 't3', trainerId: 'tr-3', startTime: '09:00' }),
          ],
        }),
      ],
    });

    const [entry] = useStore.getState().getTrainerEventHistory('tr-1');

    expect(entry.startTime).toBe('09:00');
    expect(entry.location).toBe('Main Stadium');
  });

  it('returns history for any assigned member id including guardian assignees', () => {
    useStore.setState({
      events: [
        createEvent({
          id: 'e-guardian',
          name: 'Guardian Led Event',
          date: '2026-06-01',
          teams: [createTeam({ id: 'tg-1', trainerId: 'g-42', name: 'Guardians', strength: 2 })],
        }),
      ],
    });

    const history = useStore.getState().getTrainerEventHistory('g-42');

    expect(history).toHaveLength(1);
    expect(history[0].eventId).toBe('e-guardian');
    expect(history[0].teamName).toBe('Guardians');
  });
});
