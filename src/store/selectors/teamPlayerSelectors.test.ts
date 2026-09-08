import { describe, expect, it } from 'vitest';
import type { Player, Team } from '../../types';
import { selectTeamPlayersByName } from './teamPlayerSelectors';

function player(id: string, firstName: string, lastName: string): Player {
  return { id, firstName, lastName, birthYear: 2015, level: 3, status: 'active' };
}

function team(selectedPlayers: string[] = []): Team {
  return { id: 'team-1', name: 'Team', strength: 2, startTime: '10:00', selectedPlayers };
}

describe('selectTeamPlayersByName', () => {
  it('sorts selected players by last name and then first name', () => {
    const result = selectTeamPlayersByName(team(['p3', 'p1', 'p2']), [
      player('p1', 'Zoe', 'Alpha'),
      player('p2', 'Ada', 'Alpha'),
      player('p3', 'Ben', 'Zulu'),
    ]);

    expect(result.map((entry) => entry.id)).toEqual(['p2', 'p1', 'p3']);
  });

  it('compares names case-insensitively and uses the id as a stable fallback', () => {
    const result = selectTeamPlayersByName(team(['p2', 'p1', 'p3']), [
      player('p2', 'ada', 'smith'),
      player('p1', 'Ada', 'Smith'),
      player('p3', 'Ben', 'smith'),
    ]);

    expect(result.map((entry) => entry.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('ignores missing and unselected players and falls back to an empty list', () => {
    expect(selectTeamPlayersByName(team(['missing', 'p1']), [
      player('p1', 'Ada', 'Smith'),
      player('outside', 'Ben', 'Zulu'),
    ]).map((entry) => entry.id)).toEqual(['p1']);
    expect(selectTeamPlayersByName(team(), [])).toEqual([]);
  });
});
