import type { Guardian, Player } from '../../types';

export interface MemberGuardianRow {
  playerId: string;
  playerFirstName: string;
  playerLastName: string;
  guardian: Guardian;
}

function toComparableName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function selectMemberGuardians(players: Player[]): MemberGuardianRow[] {
  return players
    .flatMap((player) => (
      (player.guardians || []).map((guardian) => ({
        playerId: player.id,
        playerFirstName: player.firstName,
        playerLastName: player.lastName,
        guardian,
      }))
    ))
    .sort((left, right) => {
      const guardianLastNameCompare = toComparableName(left.guardian.lastName)
        .localeCompare(toComparableName(right.guardian.lastName));
      if (guardianLastNameCompare !== 0) {
        return guardianLastNameCompare;
      }

      const guardianFirstNameCompare = toComparableName(left.guardian.firstName)
        .localeCompare(toComparableName(right.guardian.firstName));
      if (guardianFirstNameCompare !== 0) {
        return guardianFirstNameCompare;
      }

      const playerLastNameCompare = toComparableName(left.playerLastName)
        .localeCompare(toComparableName(right.playerLastName));
      if (playerLastNameCompare !== 0) {
        return playerLastNameCompare;
      }

      return toComparableName(left.playerFirstName)
        .localeCompare(toComparableName(right.playerFirstName));
    });
}
