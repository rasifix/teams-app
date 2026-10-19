import { describe, expect, it } from 'vitest';
import type { Activity, Player, ShirtSet, Team, Trainer } from '../../types';
import { selectTeamCardView } from './teamCardSelectors';

const player = (id: string, firstName: string, lastName: string, level: number): Player => ({
  id, firstName, lastName, level, birthDate: '2015-01-01', status: 'active',
});
const team = (overrides: Partial<Team> = {}): Team => ({
  id: 't1', name: 'Orange', strength: 2, selectedPlayers: [], ...overrides,
});
const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'a1', squadId: 's1', kind: 'match', name: 'Match', startsAt: '2026-05-03T10:30:00.000Z',
  location: 'Main field', invitations: [], teams: [], ...overrides,
});

describe('selectTeamCardView', () => {
  it('composes sorted roster rows, statistics, shirts, responsible people, and summary values', () => {
    const ada = player('p1', 'Ada', 'Zulu', 4);
    const ben = player('p2', 'Ben', 'Alpha', 2);
    const trainer: Trainer = { id: 'tr1', firstName: 'Tina', lastName: 'Coach' };
    const shirtSet: ShirtSet = { id: 'shirts', sponsor: 'Club', color: '#fff', shirts: [] };
    const selectedTeam = team({
      selectedPlayers: [ada.id, ben.id],
      responsiblePersonIds: [trainer.id],
      shirtSetId: shirtSet.id,
      shirtAssignments: [{ playerId: ada.id, shirtNumber: 7 }],
    });
    const event = activity({
      invitations: [{ id: 'i1', playerId: ada.id, response: 'accepted' }],
      teams: [selectedTeam],
    });

    const result = selectTeamCardView(selectedTeam, event, [ada, ben], [trainer], [shirtSet], [event], new Set([ben.id]), 3);

    expect(result.selectedPlayerCount).toBe(2);
    expect(result.hasCapacity).toBe(true);
    expect(result.averageLevel).toBe(3);
    expect(result.displayLocation).toBe('Main field');
    expect(result.displayTime).toBe('10:30');
    expect(result.responsiblePeople[0]).toMatchObject({ id: trainer.id, isLead: true });
    expect(result.shirtSet).toBe(shirtSet);
    expect(result.playerRows.map((row) => row.playerId)).toEqual([ben.id, ada.id]);
    expect(result.playerRows[0].hasInactiveFutureEvent).toBe(true);
    expect(result.playerRows[1]).toMatchObject({ shirtNumber: 7, statistics: { acceptedCount: 1, selectedCount: 1 } });
  });

  it('uses team overrides for non-match activities', () => {
    const training = activity({ kind: 'training', location: 'Squad field' });
    const trainingTeam = team({ startTime: '18:15', location: 'Side field' });
    const result = selectTeamCardView(trainingTeam, training, [], [], [], [], new Set(), 0);
    expect(result.displayTime).toBe('18:15');
    expect(result.displayLocation).toBe('Side field');
    expect(result.hasCapacity).toBe(false);
  });

  it('provides safe empty and missing-player fallbacks', () => {
    const selectedTeam = team({ selectedPlayers: ['missing'], shirtSetId: 'missing' });
    const result = selectTeamCardView(selectedTeam, activity(), [], [], [], [], new Set(), 2);
    expect(result.averageLevel).toBe(0);
    expect(result.shirtSet).toBeNull();
    expect(result.playerRows[0]).toMatchObject({ playerId: 'missing', player: null, shirtNumber: null, statistics: { acceptedCount: 0, selectedCount: 0 } });
  });
});
