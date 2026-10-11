import { describe, expect, it } from 'vitest';
import type { MatchFormat } from '../../types';
import { selectActivityFormConfiguration } from './activityFormSelectors';

const formats: MatchFormat[] = [
  { id: 'small', name: '4x20', numberOfPeriods: 4, periodLengthMinutes: 20, minPlayersPerTeam: 7, maxPlayersPerTeam: 12 },
  { id: 'legacy', name: 'Legacy', numberOfPeriods: 2, periodLengthMinutes: 15 },
];

describe('selectActivityFormConfiguration', () => {
  it('selects match fields and defaults from the selected format', () => {
    expect(selectActivityFormConfiguration('match', formats, 'small')).toEqual({
      showOpponent: true,
      showMatchFormat: true,
      showTeamCount: false,
      fixedTeamCount: 1,
      selectedMatchFormat: formats[0],
      defaultLimits: { minPlayersPerTeam: 7, maxPlayersPerTeam: 12 },
    });
  });

  it('omits defaults for a match without a selected format', () => {
    expect(selectActivityFormConfiguration('match', formats, '')).toMatchObject({
      showOpponent: true,
      showMatchFormat: true,
      showTeamCount: false,
      fixedTeamCount: 1,
      selectedMatchFormat: null,
      defaultLimits: null,
    });
  });

  it('exposes only team count for tournaments and ignores a selected match format', () => {
    expect(selectActivityFormConfiguration('tournament', formats, 'small')).toEqual({
      showOpponent: false,
      showMatchFormat: false,
      showTeamCount: true,
      fixedTeamCount: null,
      selectedMatchFormat: null,
      defaultLimits: null,
    });
  });
});
