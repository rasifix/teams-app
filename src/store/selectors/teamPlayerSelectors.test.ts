import { describe, expect, it } from 'vitest';
import type { Activity, Player, Team } from '../../types';
import { selectAvailablePlayersForTeamSelection, selectTeamPlayersByName, selectTeamPlayersInRosterOrder, selectTeamPrintSummaries, selectTeamSelectionCapacity, selectTeamSelectionColumns } from './teamPlayerSelectors';

function player(id: string, firstName: string, lastName: string): Player {
  return { id, firstName, lastName, birthDate: '2015-06-15', level: 3, status: 'active' };
}

function team(selectedPlayers: string[] = []): Team {
  return { id: 'team-1', name: 'Team', strength: 2, startTime: '10:00', selectedPlayers };
}

describe('selectTeamPlayersByName', () => {
  it('sorts selected players by first name and then last name', () => {
    const result = selectTeamPlayersByName(team(['p3', 'p1', 'p2']), [
      player('p1', 'Ada', 'Zulu'),
      player('p2', 'Ada', 'Alpha'),
      player('p3', 'Ben', 'Alpha'),
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

describe('team selection view selectors', () => {
  it('resolves current players in roster order and ignores missing ids', () => {
    expect(selectTeamPlayersInRosterOrder(team(['p2', 'missing', 'p1']), [
      player('p1', 'Ada', 'One'),
      player('p2', 'Ben', 'Two'),
    ]).map((entry) => entry.id)).toEqual(['p2', 'p1']);
    expect(selectTeamPlayersInRosterOrder(team(), [])).toEqual([]);
  });

  it('calculates free capacity and lets pending removals offset additions', () => {
    expect(selectTeamSelectionCapacity(team(['p1', 'p2']), 3, ['p3'], [])).toEqual({
      currentPlayerCount: 2,
      remainingSlots: 1,
      availableAdditionSlots: 1,
      canAddMore: true,
    });
    expect(selectTeamSelectionCapacity(team(['p1', 'p2']), 2, ['p3'], [])).toMatchObject({ canAddMore: false });
    expect(selectTeamSelectionCapacity(team(['p1', 'p2']), 2, ['p3'], ['p1'])).toMatchObject({ canAddMore: true });
  });

  it('clamps remaining capacity when a roster already exceeds the configured maximum', () => {
    expect(selectTeamSelectionCapacity(team(['p1', 'p2']), 1, [], [])).toEqual({
      currentPlayerCount: 2,
      remainingSlots: 0,
      availableAdditionSlots: 0,
      canAddMore: true,
    });
  });

  it('builds selected and unselected columns from current, added, and removed players', () => {
    const current = [player('p1', 'Ada', 'One'), player('p2', 'Ben', 'Two')];
    const available = [player('p3', 'Cara', 'Three'), player('p4', 'Drew', 'Four')];
    expect(selectTeamSelectionColumns(current, available, ['p3'], ['p2'])).toEqual({
      selectedPlayers: [current[0], available[0]],
      unselectedPlayers: [current[1], available[1]],
    });
  });

  it('ignores duplicate current players in candidates and falls back to empty columns', () => {
    const current = [player('p1', 'Ada', 'One')];
    expect(selectTeamSelectionColumns(current, [current[0]], [], [])).toEqual({ selectedPlayers: current, unselectedPlayers: [] });
  });
});

describe('selectTeamPrintSummaries', () => {
  const activity: Activity = {
    id: 'a1', squadId: 's1', kind: 'tournament', status: 'active', name: 'Cup', startsAt: '2026-01-01T10:00:00Z',
    location: ' Main field ', teams: [], invitations: [],
  };

  it('resolves sorted players, shirts, responsible people, and team location overrides', () => {
    const printableTeam = {
      ...team(['p1', 'p2']), location: ' Field 2 ', responsiblePersonId: 'trainer-1',
      shirtAssignments: [{ playerId: 'p1', shirtNumber: 7 }],
    };
    const summaries = selectTeamPrintSummaries(activity, [printableTeam], [
      player('p1', 'Ada', 'Zulu'), player('p2', 'Ben', 'Alpha'),
    ], [{ id: 'trainer-1', firstName: 'Sam', lastName: 'Coach' }]);
    expect(summaries[0]).toMatchObject({
      location: 'Field 2',
      responsiblePeople: [{ id: 'trainer-1', firstName: 'Sam' }],
      players: [{ player: { id: 'p2' } }, { player: { id: 'p1' }, shirtNumber: 7 }],
    });
  });

  it('uses the event location for matches and omits missing players', () => {
    const printableTeam = { ...team(['missing']), location: 'Override' };
    expect(selectTeamPrintSummaries({ ...activity, kind: 'match' }, [printableTeam], [], [])[0]).toMatchObject({
      location: 'Main field', players: [], responsiblePeople: [],
    });
  });

  it('returns an empty fallback for no teams', () => {
    expect(selectTeamPrintSummaries(activity, [], [], [])).toEqual([]);
  });
});


describe('selectAvailablePlayersForTeamSelection', () => {
  const makePlayer = (id: string, firstName: string, level = 3): Player => ({
    id, firstName, lastName: 'Player', birthDate: '2015-01-01', level, status: 'active',
  });
  const activity: Activity = {
    id: 'a1', squadId: 's1', kind: 'match', status: 'active', name: 'Match', startsAt: '2026-06-01T10:00:00.000Z',
    invitations: [{ id: 'i1', playerId: 'p1', response: 'accepted' }, { id: 'i2', playerId: 'p2', response: 'open' }, { id: 'i3', playerId: 'p3', response: 'accepted' }],
    teams: [{ id: 't1', name: 'A', strength: 2, selectedPlayers: ['p3'] }, { id: 't2', name: 'B', strength: 2, selectedPlayers: ['p4'] }],
  };

  it('returns accepted, unassigned players within the level range', () => {
    const players = [makePlayer('p1', 'Zoe'), makePlayer('p2', 'Mia'), makePlayer('p3', 'Ana'), makePlayer('p4', 'Eli'), makePlayer('p5', 'Low', 1)];
    expect(selectAvailablePlayersForTeamSelection(activity, 't1', players, [2, 4]).map((player) => player.id)).toEqual(['p1']);
  });

  it('returns no candidates when no invitations qualify, and filters an unknown team by assignment', () => {
    const players = [makePlayer('p1', 'Zoe')];
    expect(selectAvailablePlayersForTeamSelection(activity, 'missing', players, [1, 5])).toEqual(players);
    expect(selectAvailablePlayersForTeamSelection({ ...activity, invitations: [] }, 't1', players, [1, 5])).toEqual([]);
  });
});
