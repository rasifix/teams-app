import type { Activity, Player, Team, Trainer } from '../../types';
import { selectTeamResponsiblePeople } from './teamTrainerSelectors';

function comparableName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function selectTeamPlayersByName(team: Team, players: Player[]): Player[] {
  const selectedPlayerIds = new Set(team.selectedPlayers ?? []);

  return players
    .filter((player) => selectedPlayerIds.has(player.id))
    .sort((left, right) => {
      const firstNameComparison = comparableName(left.firstName).localeCompare(comparableName(right.firstName));
      if (firstNameComparison !== 0) return firstNameComparison;

      const lastNameComparison = comparableName(left.lastName).localeCompare(comparableName(right.lastName));
      if (lastNameComparison !== 0) return lastNameComparison;

      return left.id.localeCompare(right.id);
    });
}

export function selectTeamPlayersInRosterOrder(team: Team, players: Player[]): Player[] {
  const playersById = new Map(players.map((player) => [player.id, player]));
  return (team.selectedPlayers ?? [])
    .map((playerId) => playersById.get(playerId))
    .filter((player): player is Player => Boolean(player));
}

export interface TeamSelectionCapacity {
  currentPlayerCount: number;
  remainingSlots: number;
  availableAdditionSlots: number;
  canAddMore: boolean;
}

export function selectTeamSelectionCapacity(
  team: Team,
  maximumPlayers: number,
  selectedPlayerIds: string[],
  removedPlayerIds: string[],
): TeamSelectionCapacity {
  const currentPlayerCount = team.selectedPlayers?.length ?? 0;
  const remainingSlots = Math.max(0, maximumPlayers - currentPlayerCount);
  const availableAdditionSlots = remainingSlots + removedPlayerIds.length;
  return {
    currentPlayerCount,
    remainingSlots,
    availableAdditionSlots,
    canAddMore: selectedPlayerIds.length <= availableAdditionSlots,
  };
}

export interface TeamPrintSummary {
  team: Team;
  location?: string;
  responsiblePeople: ReturnType<typeof selectTeamResponsiblePeople>;
  players: Array<{ player: Player; shirtNumber?: number }>;
}

export function selectTeamPrintSummaries(
  activity: Activity,
  teams: Team[],
  players: Player[],
  trainers: Trainer[],
): TeamPrintSummary[] {
  const playersById = new Map(players.map((player) => [player.id, player]));
  return teams.map((team) => {
    const shirtNumbersByPlayerId = new Map(
      (team.shirtAssignments ?? []).map((assignment) => [assignment.playerId, assignment.shirtNumber]),
    );
    const selectedPlayers = (team.selectedPlayers ?? [])
      .flatMap((playerId) => {
        const player = playersById.get(playerId);
        return player ? [{ player, shirtNumber: shirtNumbersByPlayerId.get(playerId) }] : [];
      })
      .sort((left, right) => (
        comparableName(left.player.lastName).localeCompare(comparableName(right.player.lastName))
        || comparableName(left.player.firstName).localeCompare(comparableName(right.player.firstName))
        || left.player.id.localeCompare(right.player.id)
      ));
    return {
      team,
      location: activity.kind === 'match'
        ? activity.location?.trim() || undefined
        : team.location?.trim() || activity.location?.trim() || undefined,
      responsiblePeople: selectTeamResponsiblePeople(team.responsiblePersonIds, trainers, players),
      players: selectedPlayers,
    };
  });
}


export function selectAvailablePlayersForTeamSelection(
  activity: Activity,
  teamId: string,
  players: Player[],
  levelRange: [number, number]
): Player[] {
  const invitedAccepted = new Set((activity.invitations ?? [])
    .filter((invitation) => invitation.response === 'accepted')
    .map((invitation) => invitation.playerId));
  const assignedElsewhere = new Set((activity.teams ?? [])
    .filter((team) => team.id !== teamId)
    .flatMap((team) => team.selectedPlayers ?? []));
  const assignedToCurrent = new Set(activity.teams.find((team) => team.id === teamId)?.selectedPlayers ?? []);

  return players
    .filter((player) => invitedAccepted.has(player.id)
      && !assignedElsewhere.has(player.id)
      && !assignedToCurrent.has(player.id)
      && player.level >= levelRange[0]
      && player.level <= levelRange[1])
    .sort((left, right) => {
      const firstName = left.firstName.localeCompare(right.firstName);
      return firstName || left.lastName.localeCompare(right.lastName) || left.id.localeCompare(right.id);
    });
}
