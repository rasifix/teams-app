import type { Activity, Player, Team } from '../../types';

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
