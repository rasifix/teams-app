import { describe, expect, it } from 'vitest';
import type { Player, Team, Trainer } from '../../types';
import { selectTeamCardView } from './teamCardSelectors';

const player = (id: string, firstName: string, lastName: string, level: number): Player => ({
  id, firstName, lastName, level, birthDate: '2015-01-01', status: 'active',
});
const team = (overrides: Partial<Team> = {}): Team => ({
  id: 't1', name: 'Orange', strength: 2, selectedPlayers: [], ...overrides,
});
describe('selectTeamCardView', () => {
  it('composes sorted roster rows and summary values from the card view inputs', () => {
    const ada = player('p1', 'Ada', 'Zulu', 4);
    const ben = player('p2', 'Ben', 'Alpha', 2);
    const trainer: Trainer = { id: 'tr1', firstName: 'Tina', lastName: 'Coach' };
    const selectedTeam = team({
      selectedPlayers: [ada.id, ben.id],
      responsiblePersonId: trainer.id,
      shirtAssignments: [{ playerId: ada.id, shirtNumber: 7 }],
    });

    const result = selectTeamCardView(selectedTeam, [ada, ben], [trainer], new Set([ben.id]), 3);

    expect(result.teamId).toBe(selectedTeam.id);
    expect(result.teamName).toBe('Orange');
    expect(result.teamStrength).toBe(2);
    expect(result.selectedPlayerCount).toBe(2);
    expect(result.hasCapacity).toBe(true);
    expect(result.averageLevel).toBe(3);
    expect(result.responsiblePeople[0]).toMatchObject({ id: trainer.id });
    expect(result.playerRows.map((row) => row.playerId)).toEqual([ben.id, ada.id]);
    expect(result.playerRows[0].hasInactiveFutureEvent).toBe(true);
    expect(result.playerRows[1]).toMatchObject({ shirtNumber: 7 });
  });

  it('reports no capacity when the selected player count reaches the maximum', () => {
    const fullTeam = team({ selectedPlayers: ['p1', 'p2'] });
    const result = selectTeamCardView(fullTeam, [], [], new Set(), 2);
    expect(result.hasCapacity).toBe(false);
  });

  it('provides safe empty and missing-player fallbacks', () => {
    const selectedTeam = team({ selectedPlayers: ['missing'], shirtSetId: 'missing' });
    const result = selectTeamCardView(selectedTeam, [], [], new Set(), 2);
    expect(result.averageLevel).toBe(0);
    expect(result.playerRows[0]).toMatchObject({ playerId: 'missing', player: null, shirtNumber: null });
  });
});
