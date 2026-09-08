import type { Player, Team } from '../../types';

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
