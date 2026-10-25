import { describe, expect, it } from 'vitest';
import type { Player, Team, Trainer } from '../../types';
import { selectTeamCardView, selectTeamWhatsAppMessage } from './teamCardSelectors';

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

describe('selectTeamWhatsAppMessage', () => {
  const activity = {
    id: 'a1', squadId: 's1', kind: 'match' as const, status: 'active' as const,
    name: 'Saturday match', startsAt: '2026-10-31T09:00:00.000Z', location: 'Main pitch',
    opponentName: 'FC Example', teams: [], invitations: [],
  };
  const labels = {
    activityTitle: 'Saturday match vs FC Example',
    responsiblePerson: 'Responsible',
    meetingTime: 'Meeting time',
    meetingLocation: 'Meeting location',
    selectedPlayers: 'Selected players', unknownPlayer: 'Unknown player',
  };

  it('includes only the requested team and players in displayed roster order', () => {
    const ada = player('p1', 'Ada', 'Zulu', 4);
    const ben = player('p2', 'Ben', 'Alpha', 2);
    const selectedTeam = team({ selectedPlayers: [ada.id, ben.id], responsiblePersonId: 'tr1' });
    const view = selectTeamCardView(selectedTeam, [ada, ben], [{ id: 'tr1', firstName: 'Tina', lastName: 'Coach' }], new Set(), 5);

    const message = selectTeamWhatsAppMessage(activity, view, 'en', labels);

    expect(message).toContain('Saturday match vs FC Example');
    expect(message).toContain('📍 Main pitch');
    expect(message).toContain('Orange');
    expect(message).toContain('Responsible: Tina Coach');
    expect(message?.indexOf('• Ben Alpha')).toBeLessThan(message?.indexOf('• Ada Zulu') ?? 0);
    expect(message).not.toContain('Other team');
  });

  it('includes meeting details and omits blank meeting fields', () => {
    const selectedTeam = team({ selectedPlayers: ['p1'], meetingTime: '08:30', meetingLocation: 'Club entrance' });
    const view = selectTeamCardView(selectedTeam, [player('p1', 'Ada', 'Zulu', 4)], [], new Set(), 5);
    const message = selectTeamWhatsAppMessage(activity, view, 'en', labels);
    expect(message).toContain('Meeting time: 08:30');
    expect(message).toContain('Meeting location: Club entrance');

    const withoutMeetingDetails = selectTeamCardView(team({ selectedPlayers: ['p1'], meetingTime: ' ', meetingLocation: '' }), [player('p1', 'Ada', 'Zulu', 4)], [], new Set(), 5);
    const fallbackMessage = selectTeamWhatsAppMessage(activity, withoutMeetingDetails, 'en', labels);
    expect(fallbackMessage).not.toContain('Meeting time:');
    expect(fallbackMessage).not.toContain('Meeting location:');
  });

  it('omits optional details when unavailable and returns null for an empty team', () => {
    const emptyTeam = team({ name: 'Blue', selectedPlayers: [] });
    const emptyView = selectTeamCardView(emptyTeam, [], [], new Set(), 5);
    expect(selectTeamWhatsAppMessage({ ...activity, location: undefined, opponentName: undefined }, emptyView, 'en', labels)).toBeNull();

    const selectedTeam = team({ selectedPlayers: ['missing'] });
    const view = selectTeamCardView(selectedTeam, [], [], new Set(), 5);
    const message = selectTeamWhatsAppMessage({ ...activity, location: undefined, opponentName: undefined }, view, 'en', {
      ...labels,
      activityTitle: 'Saturday match',
    });
    expect(message).toContain('Unknown player');
    expect(message).not.toContain('📍');
    expect(message).not.toContain('vs');
  });
});
